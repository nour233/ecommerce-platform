import Image from "next/image";
import type { CampaignContent } from "@/lib/campaign-schema";
import type { Product } from "@/types";

const palettes = {
  sunset: "from-orange-950 via-rose-900 to-orange-700",
  ocean: "from-slate-950 via-blue-900 to-cyan-700",
  forest: "from-emerald-950 via-emerald-900 to-teal-700"
};

export function CampaignBanner({ campaign, products }: { campaign: CampaignContent; products: Product[] }) {
  return <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${palettes[campaign.palette]} p-6 text-white sm:p-10`}>
    <div className="absolute -right-16 -top-20 size-72 rounded-full border-[40px] border-white/5" />
    <div className="relative grid items-center gap-8 md:grid-cols-2">
      <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">CommerceCraft / Curated collection</p><h2 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">{campaign.title}</h2><p className="mt-4 whitespace-pre-line text-sm leading-7 text-white/80">{campaign.description}</p><span className="mt-6 inline-block rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">{campaign.bannerText} &rarr;</span></div>
      <div className="grid grid-cols-2 gap-3">{products.slice(0, 4).map((product, index) => <div key={product.id} className={`relative aspect-square overflow-hidden rounded-2xl bg-white/10 ${index % 2 ? "translate-y-3" : ""}`}><Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 768px) 40vw, 250px" className="object-cover" /><p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8 text-xs font-semibold">{product.name}</p></div>)}</div>
    </div>
  </div>;
}
