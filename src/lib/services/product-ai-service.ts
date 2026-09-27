import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import type { Category } from "@/types";
import { z } from "zod";

const productSuggestionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1000),
  categoryName: z.string().trim().min(2).max(80),
  suggestedPrice: z.number().min(0).max(1_000_000),
  tags: z.array(z.string().trim().min(1).max(40)).min(1).max(8)
});

type OpenAIResponse = {
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

const toSlug = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 100);

function responseText(response: OpenAIResponse) {
  return response.output
    ?.flatMap((item) => item.type === "message" ? item.content ?? [] : [])
    .filter((item) => item.type === "output_text")
    .map((item) => item.text ?? "")
    .join("") ?? "";
}

export const productAiService = {
  async suggestFromImage(imageUrl: string, categories: Category[]) {
    if (!env.openAiApiKey) {
      throw new AppError("AI Product Copilot is not configured. Add OPENAI_API_KEY to local and Vercel environment variables.", 503, "AI_UNAVAILABLE");
    }
    if (!categories.length) throw new AppError("Create a category before using the AI Product Copilot", 409, "NO_CATEGORIES");

    const categoryNames = categories.map((category) => category.name);
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openAiApiKey}`
      },
      body: JSON.stringify({
        model: env.openAiProductAssistantModel,
        store: false,
        instructions: "You are an e-commerce catalog specialist. Analyze the product image and create accurate, concise storefront copy. Never invent brand names, technical specifications, certifications, or discounts that are not visible. Choose exactly one category from the allowed list. Return the requested JSON only.",
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: `Analyze this product image. Allowed categories: ${categoryNames.join(", ")}. Generate a professional English product name, a two-sentence description, 3 to 8 concise tags, one allowed category name, and a realistic suggested USD price. Return JSON.` },
            { type: "input_image", image_url: imageUrl, detail: "low" }
          ]
        }],
        max_output_tokens: 500,
        text: {
          format: {
            type: "json_schema",
            name: "product_catalog_suggestion",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                categoryName: { type: "string", enum: categoryNames },
                suggestedPrice: { type: "number" },
                tags: { type: "array", items: { type: "string" } }
              },
              required: ["name", "description", "categoryName", "suggestedPrice", "tags"]
            }
          }
        }
      })
    });
    const payload = await response.json() as OpenAIResponse;
    if (!response.ok) {
      throw new AppError(payload.error?.message ?? "AI Product Copilot could not analyze this image", 502, "AI_REQUEST_FAILED");
    }

    let suggestion: z.infer<typeof productSuggestionSchema>;
    try {
      suggestion = productSuggestionSchema.parse(JSON.parse(responseText(payload)));
    } catch {
      throw new AppError("AI Product Copilot returned an invalid suggestion. Please try again.", 502, "AI_INVALID_RESPONSE");
    }
    const category = categories.find((item) => item.name === suggestion.categoryName);
    if (!category) throw new AppError("AI selected an unavailable category. Please try again.", 502, "AI_INVALID_CATEGORY");

    return {
      name: suggestion.name,
      slug: toSlug(suggestion.name),
      description: suggestion.description,
      categoryId: category.id,
      price: Number(suggestion.suggestedPrice.toFixed(2)),
      tags: [...new Set(suggestion.tags.map((tag) => tag.toLowerCase()))]
    };
  }
};
