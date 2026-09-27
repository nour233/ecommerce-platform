import { notFound } from "next/navigation";
import { campaignRepository } from "@/lib/repositories/campaigns";
import { catalogRepository } from "@/lib/repositories/catalog";
import { CampaignBanner } from "@/components/campaign-banner";
import { ProductGrid } from "@/components/product-grid";

export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await campaignRepository.get(id);
  if (!campaign || campaign.status !== "published") notFound();
  const catalog = await catalogRepository.listProducts();
  const products = campaign.productIds.flatMap(id => { const p = catalog.find(p => p.id === id && p.stock > 0); return p ? [p] : []; });
  return <main className="mx-auto max-w-[1500px] space-y-10 px-4 py-10 sm:px-6 lg:px-8"><a href="#collection"><CampaignBanner campaign={campaign} products={products} /></a><section id="collection" className="scroll-mt-24"><h1 className="mb-6 text-2xl font-bold">{campaign.title}</h1>{products.length ? <ProductGrid products={products} /> : <p>This collection is currently out of stock. Please check back soon.</p>}</section></main>;
}
