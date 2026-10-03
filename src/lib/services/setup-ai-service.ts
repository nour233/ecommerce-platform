import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { catalogRepository } from "@/lib/repositories/catalog";

const parseJson = (value: string) => JSON.parse(value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, ""));

export const setupAiService = {
  async build(productId: string) {
    const catalog = await catalogRepository.listProducts();
    const product = catalog.find((item) => item.id === productId);
    if (!product) throw new AppError("Product not found.", 404, "PRODUCT_NOT_FOUND");

    const candidates = catalog.filter((item) => item.id !== product.id && item.stock > 0).slice(0, 60);
    if (!candidates.length) throw new AppError("There are no available products to complete this set.", 409, "NO_SETUP_PRODUCTS");

    const apiKey = env.anthropicApiKey ?? env.groqApiKey;
    if (!apiKey) throw new AppError("AI set builder is not configured.", 503, "SETUP_AI_UNAVAILABLE");
    const useAnthropic = Boolean(env.anthropicApiKey);
    const format = {
      type: "object", additionalProperties: false,
      properties: {
        productIds: { type: "array", minItems: 1, maxItems: 3, uniqueItems: true, items: { type: "string", enum: candidates.map((item) => item.id) } },
        rationale: { type: "string", minLength: 15, maxLength: 320 }
      },
      required: ["productIds", "rationale"]
    } as const;
    const system = "You are a precise ecommerce stylist. Create a practical, coherent product set around one anchor product. Select one to three complementary products only from the supplied candidate catalog. Use the product names, categories, descriptions and tags to decide what truly works together. Never choose unrelated items only because they are popular, never invent features or discounts, and never include the anchor product in productIds. Write one concise, useful rationale in English that explains the customer use scenario.";
    const input = JSON.stringify({
      anchorProduct: { id: product.id, name: product.name, category: product.categoryName, description: product.description, tags: product.tags },
      candidates: candidates.map(({ id, name, categoryName, description, tags, price }) => ({ id, name, category: categoryName, description: description.slice(0, 380), tags, price }))
    });

    let response: Response;
    try {
      response = await fetch(useAnthropic ? "https://api.anthropic.com/v1/messages" : "https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: useAnthropic
          ? { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }
          : { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(35_000),
        body: JSON.stringify(useAnthropic ? {
          model: env.anthropicTextModel, max_tokens: 500, system,
          messages: [{ role: "user", content: input }],
          tools: [{ name: "build_product_set", description: "Choose a coherent complementary product set from the supplied catalog.", input_schema: format }],
          tool_choice: { type: "tool", name: "build_product_set" }
        } : {
          model: env.groqTextModel, max_tokens: 360,
          messages: [{ role: "system", content: system }, { role: "user", content: input }],
          response_format: { type: "json_schema", json_schema: { name: "product_set", strict: true, schema: format } }
        })
      });
    } catch {
      throw new AppError("The AI service is unavailable. Please try again.", 503, "SETUP_AI_UNAVAILABLE");
    }
    if (!response.ok) {
      if (response.status === 429) throw new AppError("The AI provider is busy. Please try again in a moment.", 429, "SETUP_AI_BUSY");
      throw new AppError("The AI could not build this set. Check the configured AI provider.", 502, "SETUP_AI_FAILED");
    }

    try {
      const payload = await response.json() as { content?: Array<{ type?: string; input?: unknown }>; choices?: Array<{ message?: { content?: string } }> };
      const raw = useAnthropic
        ? payload.content?.find((item) => item.type === "tool_use")?.input
        : parseJson(payload.choices?.[0]?.message?.content ?? "");
      if (!raw || typeof raw !== "object") throw new Error("Missing AI output");
      const answer = raw as Record<string, unknown>;
      const selected = Array.isArray(answer.productIds) ? answer.productIds
        : Array.isArray(answer.product_ids) ? answer.product_ids
        : Array.isArray(answer.selectedProductIds) ? answer.selectedProductIds
        : Array.isArray(answer.products) ? answer.products : [];
      const ids = [...new Set(selected.map((selection) => {
        const value = typeof selection === "string" ? selection : selection && typeof selection === "object"
          ? String((selection as Record<string, unknown>).id ?? (selection as Record<string, unknown>).productId ?? (selection as Record<string, unknown>).name ?? "") : "";
        const normalized = value.trim().toLocaleLowerCase();
        return candidates.find((item) => item.id === value || item.name.toLocaleLowerCase() === normalized)?.id ?? "";
      }).filter(Boolean))].slice(0, 3);
      if (!ids.length) throw new Error("No valid catalog product IDs");
      const suppliedRationale = typeof answer.rationale === "string" ? answer.rationale.trim() : typeof answer.reason === "string" ? answer.reason.trim() : "";
      const rationale = suppliedRationale.length >= 15 ? suppliedRationale.slice(0, 320) : "AI selected these available products because they complement this item in one practical customer use scenario.";
      return { products: ids.map((id) => candidates.find((item) => item.id === id)!), rationale };
    } catch {
      throw new AppError("The AI returned an unusable set. Please try again.", 502, "SETUP_AI_INVALID");
    }
  }
};
