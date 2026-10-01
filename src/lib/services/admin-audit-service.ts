import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import type { Category, Product } from "@/types";

export type AdminAuditReport = { narrative: string; source: "anthropic" | "groq" };
type Activity = { cart: Array<{ productId: string; quantity: number }>; wishlist: Array<{ productId: string }> };

export const adminAuditService = {
  async analyze(products: Product[], categories: Category[], activity: Activity): Promise<AdminAuditReport> {
    const useAnthropic = Boolean(env.anthropicApiKey);
    const apiKey = env.anthropicApiKey ?? env.groqApiKey;
    if (!apiKey) throw new AppError("Configurez ANTHROPIC_API_KEY ou GROQ_API_KEY dans Vercel pour utiliser AI Store Auditor.", 503, "AUDIT_UNAVAILABLE");
    const cartCounts = new Map<string, number>();
    const wishlistCounts = new Map<string, number>();
    for (const item of activity.cart) cartCounts.set(item.productId, (cartCounts.get(item.productId) ?? 0) + item.quantity);
    for (const item of activity.wishlist) wishlistCounts.set(item.productId, (wishlistCounts.get(item.productId) ?? 0) + 1);
    const catalog = products.map(({ id, name, categoryName, stock, rating, tags, description }) => ({ id, name, categoryName, stock, rating, tags, descriptionLength: description.length }));
    const prompt = `Analyse cette boutique e-commerce pour son administrateur. Rédige un audit court et concret en français, avec exactement trois parties : « Priorité à traiter », « Opportunité de croissance » et « Qualité du catalogue ». Dans chaque partie, donne une recommandation basée uniquement sur les données ci-dessous. Ne mentionne jamais les identités de clients, le chiffre d’affaires, les conversions, ni des informations absentes des données. Aucun JSON : texte clair en 6 à 10 phrases.\n\nCatalogue : ${JSON.stringify(catalog)}\nCatégories : ${JSON.stringify(categories.map(({ id, name }) => ({ id, name })))}\nQuantités dans les paniers par produit : ${JSON.stringify(Object.fromEntries(cartCounts))}\nAjouts en favoris par produit : ${JSON.stringify(Object.fromEntries(wishlistCounts))}`;
    try {
      const response = await fetch(useAnthropic ? "https://api.anthropic.com/v1/messages" : "https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: useAnthropic ? { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" } : { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(useAnthropic ? { model: env.anthropicTextModel, max_tokens: 700, system: "You are a precise e-commerce operations analyst. Answer in French.", messages: [{ role: "user", content: prompt }] } : { model: env.groqTextModel, max_tokens: 700, messages: [{ role: "system", content: "You are a precise e-commerce operations analyst. Answer in French." }, { role: "user", content: prompt }] }),
        signal: AbortSignal.timeout(35_000)
      });
      const payload = await response.json() as { content?: Array<{ type?: string; text?: string }>; choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
      if (!response.ok) {
        const busy = response.status === 429 || /rate limit|quota/i.test(payload.error?.message ?? "");
        throw new AppError(busy ? "Claude est occupé pour le moment. Réessayez dans quelques instants." : "Claude n’a pas pu terminer l’audit. Réessayez dans un instant.", busy ? 429 : 502, "AUDIT_REQUEST_FAILED");
      }
      const rawNarrative = useAnthropic
        ? payload.content?.filter((item) => item.type === "text").map((item) => item.text ?? "").join("")
        : payload.choices?.[0]?.message?.content;
      const narrative = (rawNarrative ?? "").trim();
      if (!narrative) throw new AppError("Claude n’a pas renvoyé de rapport. Relancez l’audit.", 502, "AUDIT_EMPTY_RESPONSE");
      return { narrative: narrative.slice(0, 1_800), source: useAnthropic ? "anthropic" : "groq" };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("L’audit IA est temporairement indisponible. Réessayez dans un instant.", 503, "AUDIT_UNAVAILABLE");
    }
  }
};
