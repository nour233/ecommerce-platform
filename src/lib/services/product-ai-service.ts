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

type GeminiResponse = {
  steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

const toSlug = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 100);

function responseText(response: GeminiResponse) {
  return response.steps
    ?.flatMap((step) => step.type === "model_output" ? step.content ?? [] : [])
    .filter((item) => item.type === "text")
    .map((item) => item.text ?? "")
    .join("") ?? "";
}

export const productAiService = {
  async suggestFromImage(imageUrl: string, categories: Category[]) {
    if (!env.geminiApiKey) {
      throw new AppError("AI Product Copilot is not configured. Add GEMINI_API_KEY to local and Vercel environment variables.", 503, "AI_UNAVAILABLE");
    }
    if (!categories.length) throw new AppError("Create a category before using the AI Product Copilot", 409, "NO_CATEGORIES");

    const categoryNames = categories.map((category) => category.name);
    const mimeType = imageUrl.toLowerCase().includes(".png") ? "image/png" : imageUrl.toLowerCase().includes(".webp") ? "image/webp" : "image/jpeg";
    let response: Response;
    try {
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.geminiApiKey,
          "Api-Revision": "2026-05-20"
        },
        body: JSON.stringify({
        model: env.geminiProductAssistantModel,
        store: false,
        input: [
          { type: "text", text: `You are an e-commerce catalog specialist. Analyze the product image and create accurate, concise storefront copy. Never invent brand names, technical specifications, certifications, or discounts that are not visible. Choose exactly one category from: ${categoryNames.join(", ")}. Generate a professional English product name, a two-sentence description, 3 to 8 concise tags, one allowed category name, and a realistic suggested USD price.` },
          { type: "image", uri: imageUrl, mime_type: mimeType }
        ],
        response_format: {
          type: "text",
          mime_type: "application/json",
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
        })
      });
    } catch {
      throw new AppError("AI product suggestions are temporarily unavailable. You can complete the product details manually.", 503, "AI_UNAVAILABLE");
    }
    const payload = await response.json() as GeminiResponse;
    if (!response.ok) {
      const message = payload.error?.message ?? "";
      if (response.status === 429 || /rate limit|quota/i.test(message)) {
        throw new AppError("Gemini’s free quota is busy. Your image is kept: complete the fields manually or try again shortly.", 429, "AI_QUOTA_EXCEEDED");
      }
      throw new AppError("Gemini could not analyze this image. You can complete the product details manually.", 502, "AI_REQUEST_FAILED");
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
