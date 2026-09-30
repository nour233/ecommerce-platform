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

type GeminiResponse = {
  steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  error?: { message?: string };
};

type GroqResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

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

function responseText(response: GeminiResponse) {
  return response.steps
    ?.flatMap((step) => step.type === "model_output" ? step.content ?? [] : [])
    .filter((item) => item.type === "text")
    .map((item) => item.text ?? "")
    .join("") ?? "";
}

function parseJsonResponse(text: string) {
  return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, ""));
}

export const productAiService = {
  async suggestFromImage(imageUrl: string, categories: Category[]) {
    if (!env.geminiApiKey && !env.groqApiKey && !env.anthropicApiKey) {
      throw new AppError("AI Product Copilot is not configured. Add ANTHROPIC_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY to local and Vercel environment variables.", 503, "AI_UNAVAILABLE");
    }
    if (!categories.length) throw new AppError("Create a category before using the AI Product Copilot", 409, "NO_CATEGORIES");

    const categoryNames = categories.map((category) => category.name);
    const mimeType = imageUrl.toLowerCase().includes(".png") ? "image/png" : imageUrl.toLowerCase().includes(".webp") ? "image/webp" : "image/jpeg";
    const useAnthropic = Boolean(env.anthropicApiKey);
    const useGroq = !useAnthropic && Boolean(env.groqApiKey);
    let response: Response;
    let responseBody: GeminiResponse | GroqResponse | AnthropicResponse;
    const instructions = `You are an e-commerce catalog specialist. Analyze the product image and create accurate, concise storefront copy. Never invent brand names, technical specifications, certifications, or discounts that are not visible. Choose exactly one category from: ${categoryNames.join(", ")}. Return only a JSON object with exactly these fields: name (string), description (string), categoryName (one of the listed category names), suggestedPrice (number, without a currency symbol), and tags (array of 3 to 8 strings).`;
    try {
      response = await fetch(useAnthropic ? "https://api.anthropic.com/v1/messages" : useGroq ? "https://api.groq.com/openai/v1/chat/completions" : "https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: useAnthropic ? {
          "Content-Type": "application/json",
          "x-api-key": env.anthropicApiKey ?? "",
          "anthropic-version": "2023-06-01"
        } : useGroq ? {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.groqApiKey}`
        } : {
          "Content-Type": "application/json",
          "x-goog-api-key": env.geminiApiKey ?? "",
          "Api-Revision": "2026-05-20"
        },
        body: JSON.stringify(useAnthropic ? {
          model: env.anthropicVisionModel,
          max_tokens: 600,
          system: "You return only valid JSON.",
          messages: [{ role: "user", content: [
            { type: "image", source: { type: "url", url: imageUrl } },
            { type: "text", text: instructions }
          ] }]
        } : useGroq ? {
          model: env.groqVisionModel,
          messages: [
            { role: "system", content: "You return only valid JSON." },
            { role: "user", content: [{ type: "text", text: instructions }, { type: "image_url", image_url: { url: imageUrl } }] }
          ],
          response_format: { type: "json_object" }
        } : {
        model: env.geminiProductAssistantModel,
        store: false,
        input: [
          { type: "text", text: instructions },
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
    responseBody = await response.json() as GeminiResponse | GroqResponse;
    if (!response.ok) {
      const message = responseBody.error?.message ?? "";
      if (response.status === 429 || /rate limit|quota/i.test(message)) {
        throw new AppError("The AI provider is busy. Your image is kept: complete the fields manually or try again shortly.", 429, "AI_QUOTA_EXCEEDED");
      }
      throw new AppError("The AI provider could not analyze this image. You can complete the product details manually.", 502, "AI_REQUEST_FAILED");
    }

    let suggestion: z.infer<typeof productSuggestionSchema>;
    try {
      const text = useAnthropic
        ? (responseBody as AnthropicResponse).content?.filter((item) => item.type === "text").map((item) => item.text ?? "").join("") ?? ""
        : useGroq ? (responseBody as GroqResponse).choices?.[0]?.message?.content ?? ""
        : responseText(responseBody as GeminiResponse);
      suggestion = productSuggestionSchema.parse(parseJsonResponse(text));
    } catch {
      throw new AppError("AI Product Copilot returned an invalid suggestion. Please try again.", 502, "AI_INVALID_RESPONSE");
    }
    const category = categories.find((item) => item.name.localeCompare(suggestion.categoryName, undefined, { sensitivity: "accent" }) === 0);
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
