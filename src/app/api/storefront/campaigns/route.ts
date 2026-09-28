import { campaignRepository } from "@/lib/repositories/campaigns";

export const dynamic = "force-dynamic";

/** Minimal live signal used by the storefront to discard a hero that was open before an admin update. */
export async function GET() {
  const campaigns = await campaignRepository.list();
  const published = campaigns
    .filter((campaign) => campaign.status === "published")
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((campaign) => ({ id: campaign.id, updatedAt: campaign.updatedAt }));
  return Response.json({ data: published }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
