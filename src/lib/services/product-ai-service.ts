import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import type { Category } from "@/types";
import { z } from "zod";

const productSuggestionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1000),
  categoryName: z.string().trim().min(2).max(80),
  suggestedPrice: z.coerce.number().min(0).max(1_000_000),
  tags: z.array(z.string().trim().min(1).max(40)).min(1).max(8)
});

type AnthropicResponse = {
  content?: Array<{ type?: string; text?: string }>;
  error?: { message?: string };
};

const toSlug = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 100);

function parseJsonResponse(text: string) {
  return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, ""));
}

export const productAiService = {
  async suggestFromImage(imageUrl: string, categories: Category[]) {
    if (!env.anthropicApiKey) {
      throw new AppError("AI Product Copilot is not configured. Add ANTHROPIC_API_KEY to local and Vercel environment variables.", 503, "AI_UNAVAILABLE");
    }
    if (!categories.length) throw new AppError("Create a category before using the AI Product Copilot", 409, "NO_CATEGORIES");

    const categoryNames = categories.map((category) => category.name);
    const instructions = `You are an e-commerce catalog specialist. Analyze the product image and create accurate, concise storefront copy. Never invent brand names, technical specifications, certifications, or discounts that are not visible. Choose exactly one category from: ${categoryNames.join(", ")}. Return only a JSON object with exactly these fields: name (string), description (string), categoryName (one of the listed category names), suggestedPrice (number, without a currency symbol), and tags (array of 3 to 8 strings).`;
    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.anthropicApiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: env.anthropicVisionModel,
          max_tokens: 600,
          system: "You return only valid JSON.",
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "url", url: imageUrl } },
            { type: "text", text: instructions }
          ] }]
        }),
        signal: AbortSignal.timeout(35_000)
      });
    } catch {
      throw new AppError("Claude is temporarily unavailable. You can complete the product details manually.", 503, "AI_UNAVAILABLE");
    }

    const responseBody = await response.json() as AnthropicResponse;
    if (!response.ok) {
      const message = responseBody.error?.message ?? "";
      if (response.status === 429 || /rate limit|quota/i.test(message)) {
        throw new AppError("Claude is busy. Your image is kept: complete the fields manually or try again shortly.", 429, "AI_QUOTA_EXCEEDED");
      }
      throw new AppError("Claude could not analyze this image. You can complete the product details manually.", 502, "AI_REQUEST_FAILED");
    }

    let suggestion: z.infer<typeof productSuggestionSchema>;
    try {
      const text = responseBody.content?.filter((item) => item.type === "text").map((item) => item.text ?? "").join("") ?? "";
      suggestion = productSuggestionSchema.parse(parseJsonResponse(text));
    } catch {
      throw new AppError("Claude returned an invalid suggestion. Please try again.", 502, "AI_INVALID_RESPONSE");
    }
    const category = categories.find((item) => item.name.localeCompare(suggestion.categoryName, undefined, { sensitivity: "accent" }) === 0);
    if (!category) throw new AppError("Claude selected an unavailable category. Please try again.", 502, "AI_INVALID_CATEGORY");

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
