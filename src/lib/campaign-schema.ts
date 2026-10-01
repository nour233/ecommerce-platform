import { z } from "zod";

export const campaignContentSchema = z.object({
  title: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(1200),
  insight: z.string().trim().max(420).default(""),
  // Older saved campaigns did not include a scenario; preserve their edit flow.
  scenario: z.string().trim().max(650).default(""),
  bannerText: z.string().trim().min(2).max(140),
  socialCaption: z.string().trim().min(10).max(1500),
  productIds: z.array(z.string().min(1).max(100)).min(1).max(6).refine(ids => new Set(ids).size === ids.length, "Select unique products"),
  palette: z.enum(["sunset", "ocean", "forest"])
});

export const campaignBriefSchema = z.object({
  theme: z.string().trim().min(3).max(300),
  audience: z.string().trim().min(2).max(200),
  tone: z.enum(["inspiring", "playful", "premium"]),
  language: z.enum(["English", "French"]),
  /** Kept while existing saved briefs migrate to categoryIds. */
  categoryId: z.string().max(100).optional(),
  categoryIds: z.array(z.string().min(1).max(100)).max(8).default([]),
  productIds: z.array(z.string().min(1).max(100)).max(6).default([])
});

export type CampaignContent = z.infer<typeof campaignContentSchema>;
export type CampaignBrief = z.infer<typeof campaignBriefSchema>;
export type Campaign = CampaignContent & {
  id: string;
  brief: CampaignBrief;
  status: "draft" | "approved" | "published";
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  generationSource?: "gemini" | "anthropic" | "groq" | "catalog-fallback";
};

export const campaignMutationSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("edit"), version: z.number().int().positive(), content: campaignContentSchema }),
  z.object({ action: z.literal("approve"), version: z.number().int().positive() }),
  z.object({ action: z.literal("publish"), version: z.number().int().positive() }),
  z.object({ action: z.literal("unpublish"), version: z.number().int().positive() })
]);
