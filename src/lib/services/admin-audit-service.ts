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

export type AdminAuditReport = z.infer<typeof reportSchema> & { source: "anthropic" | "groq" };

type Activity = { cart: Array<{ productId: string; quantity: number }>; wishlist: Array<{ productId: string }> };

function parseJson(text: string) {
  return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, ""));
}

export const adminAuditService = {
  async analyze(products: Product[], categories: Category[], activity: Activity): Promise<AdminAuditReport> {
    const useAnthropic = Boolean(env.anthropicApiKey);
    const useGroq = !useAnthropic && Boolean(env.groqApiKey);
    if (!useAnthropic && !useGroq) throw new AppError("Configurez ANTHROPIC_API_KEY ou GROQ_API_KEY dans Vercel pour utiliser AI Store Auditor.", 503, "AUDIT_UNAVAILABLE");

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
      const payload = await response.json() as { content?: Array<{ type?: string; text?: string }>; choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
      if (!response.ok) {
        const isBusy = response.status === 429 || /rate limit|quota/i.test(payload.error?.message ?? "");
        throw new AppError(isBusy ? "Claude est occupé pour le moment. Réessayez dans quelques instants." : "Claude n’a pas pu terminer l’audit. Réessayez dans un instant.", isBusy ? 429 : 502, "AUDIT_REQUEST_FAILED");
      }
      const text = useAnthropic ? payload.content?.filter((item) => item.type === "text").map((item) => item.text ?? "").join("") ?? "" : payload.choices?.[0]?.message?.content ?? "";
      try {
        return { ...reportSchema.parse(parseJson(text)), source: useAnthropic ? "anthropic" : "groq" };
      } catch {
        throw new AppError("Claude a répondu dans un format incomplet. Relancez l’audit.", 502, "AUDIT_INVALID_RESPONSE");
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("L’audit IA est temporairement indisponible. Réessayez dans un instant.", 503, "AUDIT_UNAVAILABLE");
    }
  }
};
