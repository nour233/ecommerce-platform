import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import type { Category, Product } from "@/types";
import { z } from "zod";

const findingSchema = z.object({
  level: z.enum(["priority", "opportunity", "quality"]),
  title: z.string().trim().min(4).max(110),
  detail: z.string().trim().min(12).max(300),
  action: z.enum(["products", "categories", "campaigns"])
});

const reportSchema = z.object({
  summary: z.string().trim().min(12).max(240),
  findings: z.array(findingSchema).min(2).max(5)
});

export type AdminAuditReport = z.infer<typeof reportSchema> & { source: "anthropic" | "groq" | "smart-audit" };

type Activity = { cart: Array<{ productId: string; quantity: number }>; wishlist: Array<{ productId: string }> };

function parseJson(text: string) {
  return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, ""));
}

function fallback(products: Product[], categories: Category[], activity: Activity): AdminAuditReport {
  const lowStock = products.filter((product) => product.stock < 10);
  const interest = new Map<string, number>();
  for (const item of activity.cart) interest.set(item.productId, (interest.get(item.productId) ?? 0) + item.quantity * 2);
  for (const item of activity.wishlist) interest.set(item.productId, (interest.get(item.productId) ?? 0) + 1);
  const inDemand = [...interest.entries()].sort((a, b) => b[1] - a[1])[0];
  const demandProduct = products.find((product) => product.id === inDemand?.[0]);
  const categoryCounts = categories.map((category) => ({ category, count: products.filter((product) => product.categoryId === category.id).length })).sort((a, b) => a.count - b.count);
  const smallest = categoryCounts[0];
  const findings: z.infer<typeof findingSchema>[] = [];
  if (lowStock.length) findings.push({ level: "priority", title: `${lowStock.length} produit${lowStock.length > 1 ? "s" : ""} à surveiller`, detail: `${lowStock.slice(0, 2).map((product) => product.name).join(" et ")} ${lowStock.length > 1 ? "ont" : "a"} un stock faible. Vérifiez la disponibilité avant de les mettre en avant.`, action: "products" });
  if (demandProduct) findings.push({ level: "opportunity", title: `${demandProduct.name} attire le plus d’intérêt`, detail: "Les paniers et favoris montrent une intention d’achat. Transformez cet intérêt en campagne ou en produit vedette.", action: "campaigns" });
  if (smallest) findings.push({ level: "quality", title: `${smallest.category.name} peut être enrichie`, detail: `Cette catégorie contient ${smallest.count} produit${smallest.count > 1 ? "s" : ""}. Ajoutez des produits complémentaires pour faciliter la découverte.`, action: "categories" });
  if (findings.length < 2) findings.push({ level: "quality", title: "Catalogue prêt à être enrichi", detail: "Ajoutez des descriptions détaillées et des produits complémentaires pour donner plus de choix aux visiteurs.", action: "products" });
  return { summary: "Audit intelligent terminé : voici les actions qui auront le plus d’impact sur votre catalogue.", findings: findings.slice(0, 3), source: "smart-audit" };
}

export const adminAuditService = {
  async analyze(products: Product[], categories: Category[], activity: Activity): Promise<AdminAuditReport> {
    const fallbackReport = fallback(products, categories, activity);
    const useAnthropic = Boolean(env.anthropicApiKey);
    const useGroq = !useAnthropic && Boolean(env.groqApiKey);
    if (!useAnthropic && !useGroq) return fallbackReport;

    const productContext = products.map(({ id, name, categoryName, stock, rating, tags, description }) => ({ id, name, categoryName, stock, rating, tags, descriptionLength: description.length }));
    const cartCounts = new Map<string, number>();
    const wishlistCounts = new Map<string, number>();
    for (const item of activity.cart) cartCounts.set(item.productId, (cartCounts.get(item.productId) ?? 0) + item.quantity);
    for (const item of activity.wishlist) wishlistCounts.set(item.productId, (wishlistCounts.get(item.productId) ?? 0) + 1);
    const prompt = `You are an e-commerce admin auditor. Analyze this catalog and aggregated anonymous shopper activity. Give only useful operational findings for the administrator. Do not claim revenue, conversion rates, customer identities, or facts that are not in the data. Write in French. Return ONLY JSON with exactly: summary (string) and findings (array of 2 to 5 objects with level: priority|opportunity|quality, title, detail, action: products|categories|campaigns).\n\nCatalog: ${JSON.stringify(productContext)}\nCategories: ${JSON.stringify(categories.map(({ id, name }) => ({ id, name })))}\nCart counts by product id: ${JSON.stringify(Object.fromEntries(cartCounts))}\nWishlist counts by product id: ${JSON.stringify(Object.fromEntries(wishlistCounts))}`;
    try {
      const response = await fetch(useAnthropic ? "https://api.anthropic.com/v1/messages" : "https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: useAnthropic ? { "Content-Type": "application/json", "x-api-key": env.anthropicApiKey ?? "", "anthropic-version": "2023-06-01" } : { "Content-Type": "application/json", Authorization: `Bearer ${env.groqApiKey}` },
        body: JSON.stringify(useAnthropic ? { model: env.anthropicTextModel, max_tokens: 850, system: "Return only valid JSON.", messages: [{ role: "user", content: prompt }] } : { model: env.groqTextModel, max_tokens: 850, response_format: { type: "json_object" }, messages: [{ role: "system", content: "Return only valid JSON." }, { role: "user", content: prompt }] }),
        signal: AbortSignal.timeout(35_000)
      });
      const payload = await response.json() as { content?: Array<{ type?: string; text?: string }>; choices?: Array<{ message?: { content?: string } }> };
      if (!response.ok) return fallbackReport;
      const text = useAnthropic ? payload.content?.filter((item) => item.type === "text").map((item) => item.text ?? "").join("") ?? "" : payload.choices?.[0]?.message?.content ?? "";
      return { ...reportSchema.parse(parseJson(text)), source: useAnthropic ? "anthropic" : "groq" };
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof SyntaxError) return fallbackReport;
      throw new AppError("L’audit IA est temporairement indisponible. Réessayez dans un instant.", 503, "AUDIT_UNAVAILABLE");
    }
  }
};
