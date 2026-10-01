import { catalogRepository } from "@/lib/repositories/catalog";
import { env } from "@/lib/env";
import type { z } from "zod";
import type { storefrontChatSchema } from "@/lib/validators";

type ChatRequest = z.infer<typeof storefrontChatSchema>;

const fallbackReply = "Je peux vous aider à choisir un produit, comparer des catégories ou trouver une idée cadeau. Dites-moi ce que vous cherchez.";

export const storeChatService = {
  async reply({ messages }: ChatRequest) {
    const products = await catalogRepository.listProducts();
    const catalog = products.filter((product) => product.stock > 0).map(({ name, description, categoryName, price, rating, tags }) => ({ name, description: description.slice(0, 260), categoryName, price, rating, tags })).slice(0, 50);
    const apiKey = env.anthropicApiKey ?? env.groqApiKey;
    if (!apiKey) return fallbackReply;
    const useAnthropic = Boolean(env.anthropicApiKey);
    const system = "You are CommerceCraft's friendly shopping assistant. Answer only with facts supported by the catalog below. Help customers discover products, compare options, find a gift, or navigate the store. Never invent products, discounts, stock quantities, delivery times, or policies. Reply in the language used by the customer, in 2 to 5 short sentences. Catalog data: " + JSON.stringify(catalog);
    try {
      const response = await fetch(useAnthropic ? "https://api.anthropic.com/v1/messages" : "https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: useAnthropic ? { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" } : { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(useAnthropic ? { model: env.anthropicTextModel, max_tokens: 420, system, messages } : { model: env.groqTextModel, max_tokens: 420, messages: [{ role: "system", content: system }, ...messages] }),
        signal: AbortSignal.timeout(25_000)
      });
      if (!response.ok) return fallbackReply;
      const payload = await response.json() as { content?: Array<{ type?: string; text?: string }>; choices?: Array<{ message?: { content?: string } }> };
      const text = useAnthropic ? (payload.content ?? []).filter((item) => item.type === "text").map((item) => item.text ?? "").join("") : payload.choices?.[0]?.message?.content ?? "";
      return text.trim().slice(0, 1_200) || fallbackReply;
    } catch {
      return fallbackReply;
    }
  }
};
