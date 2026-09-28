import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { campaignRepository } from "@/lib/repositories/campaigns";
import { catalogRepository } from "@/lib/repositories/catalog";
import { CampaignBanner } from "@/components/campaign-banner";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const [campaigns, products] = await Promise.all([campaignRepository.list(), catalogRepository.listProducts()]);
  const published = campaigns.filter((campaign) => campaign.status === "published").sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  return <main className="min-h-screen bg-[#f4f0e9] px-4 py-10 sm:px-6 lg:px-8 lg:py-16"><div className="mx-auto max-w-[1500px]"><section className="max-w-3xl"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[#c65f3d]"><Sparkles size={15} /> Curated by CommerceCraft</p><h1 className="mt-4 text-4xl font-bold tracking-tight text-[#172033] sm:text-6xl">Stories made from the products you love.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">Discover our published collections, each built around a theme and a considered selection of products.</p></section><div className="mt-10 space-y-10">{published.length ? published.map((campaign) => { const selection = campaign.productIds.flatMap((id) => { const product = products.find((item) => item.id === id && item.stock > 0); return product ? [product] : []; }); return <article key={campaign.id} className="space-y-4"><CampaignBanner campaign={campaign} products={selection} /><Link href={`/campaigns/${campaign.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#172033] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#293a5a]">Explore this collection <ArrowRight size={17} /></Link></article>; }) : <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center"><h2 className="text-xl font-bold text-slate-900">New collections are coming soon.</h2><p className="mt-3 text-sm text-slate-500">Our team is preparing the next edit.</p></div>}</div></div></main>;
}
