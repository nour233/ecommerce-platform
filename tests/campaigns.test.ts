import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { campaignService } from "@/lib/services/campaign-service";
import { campaignRepository } from "@/lib/repositories/campaigns";
import { store } from "@/lib/db/mock";
import { campaignBriefSchema, campaignContentSchema } from "@/lib/campaign-schema";

const brief = { theme: "Summer essentials", audience: "Everyday shoppers", tone: "inspiring", language: "English" };
const product = store.products.find(p => p.stock > 0)!;
const content = { title: "Summer Essentials", description: "Discover thoughtfully selected everyday essentials.", bannerText: "Explore the collection", socialCaption: "A fresh selection for your summer. #SummerEssentials", palette: "sunset", productIds: [product.id] };
function ai(value: unknown = content) {
  return vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ steps: [{ type: "model_output", content: [{ type: "text", text: JSON.stringify(value) }] }] })));
}
beforeEach(() => vi.stubEnv("GEMINI_API_KEY", "test-key"));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("campaign generation and publication", () => {
  it("generates a saved draft using a hosted structured-output request", async () => {
    ai();
    const result = await campaignService.generate(brief, "admin");
    expect(result.status).toBe("draft");
    expect(result.createdBy).toBe("admin");
    expect(await campaignRepository.get(result.id)).toEqual(result);
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/interactions");
    expect(JSON.parse(request!.body as string).store).toBe(false);
  });
  it("requires approval, publishes, and requires unpublishing before editing", async () => {
    ai();
    const draft = await campaignService.generate(brief, "admin");
    await expect(campaignService.mutate(draft.id, { action: "publish", version: 1 })).rejects.toMatchObject({ code: "CAMPAIGN_NOT_APPROVED" });
    const approved = await campaignService.mutate(draft.id, { action: "approve", version: 1 });
    const published = await campaignService.mutate(draft.id, { action: "publish", version: approved.version });
    expect(published.status).toBe("published");
    await expect(campaignService.mutate(draft.id, { action: "edit", version: published.version, content: campaignContentSchema.parse(content) })).rejects.toMatchObject({ code: "CAMPAIGN_PUBLISHED" });
    const unpublished = await campaignService.mutate(draft.id, { action: "unpublish", version: published.version });
    expect(unpublished.status).toBe("draft");
  });
  it("invalidates approval after editing and rejects stale updates", async () => {
    ai();
    const draft = await campaignService.generate(brief, "admin");
    const approved = await campaignService.mutate(draft.id, { action: "approve", version: 1 });
    const edited = await campaignService.mutate(draft.id, { action: "edit", version: approved.version, content: campaignContentSchema.parse({ ...content, title: "A new title" }) });
    expect(edited.status).toBe("draft");
    await expect(campaignService.mutate(draft.id, { action: "approve", version: 1 })).rejects.toMatchObject({ code: "CAMPAIGN_CONFLICT" });
  });
  it("allows only one concurrent update at the same version", async () => {
    ai();
    const draft = await campaignService.generate(brief, "admin");
    const results = await Promise.allSettled([campaignService.mutate(draft.id, { action: "approve", version: 1 }), campaignService.mutate(draft.id, { action: "approve", version: 1 })]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(r => r.status === "rejected")).toHaveLength(1);
  });
  it("rechecks stock before publishing", async () => {
    ai();
    const draft = await campaignService.generate(brief, "admin");
    await campaignService.mutate(draft.id, { action: "approve", version: 1 });
    const stock = product.stock;
    try {
      product.stock = 0;
      await expect(campaignService.mutate(draft.id, { action: "publish", version: 2 })).rejects.toMatchObject({ code: "CAMPAIGN_PRODUCTS_UNAVAILABLE" });
    } finally { product.stock = stock; }
  });
  it("rejects invented products and completes malformed model responses with a catalog draft", async () => {
    ai({ ...content, productIds: ["invented-id"] });
    await expect(campaignService.generate(brief, "admin")).rejects.toMatchObject({ code: "CAMPAIGN_AI_UNSAFE" });
    ai({ title: "Incomplete" });
    await expect(campaignService.generate(brief, "admin")).resolves.toMatchObject({ generationSource: "catalog-fallback" });
  });
  it("rejects unavailable categories before calling the model", async () => {
    ai();
    await expect(campaignService.generate({ ...brief, categoryId: "missing" }, "admin")).rejects.toMatchObject({ code: "NO_CAMPAIGN_PRODUCTS" });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("creates an editable catalog draft when the hosted AI is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const result = await campaignService.generate(brief, "admin");
    expect(result.generationSource).toBe("catalog-fallback");
    expect(result.status).toBe("draft");
    expect(result.productIds.length).toBeGreaterThan(0);
  });
  it("rejects duplicate products and invalid briefs", () => {
    expect(campaignContentSchema.safeParse({ ...content, productIds: [product.id, product.id] }).success).toBe(false);
    expect(campaignBriefSchema.safeParse({ ...brief, theme: "" }).success).toBe(false);
  });
});
