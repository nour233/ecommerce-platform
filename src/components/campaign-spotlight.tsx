"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { CampaignContent } from "@/lib/campaign-schema";
import type { Product } from "@/types";

type SpotlightCampaign = CampaignContent & { id: string; products: Product[] };

/** A deliberately compact home-page preview. Full campaign detail lives at /campaigns/[id]. */
export function CampaignSpotlight({ campaigns }: { campaigns: SpotlightCampaign[] }) {
  const [current, setCurrent] = useState(0);
  const count = campaigns.length;

  useEffect(() => {
    if (count < 2) return;
    const timer = window.setInterval(() => setCurrent((index) => (index + 1) % count), 8000);
    return () => window.clearInterval(timer);
  }, [count]);

  if (!count) return null;
  const campaign = campaigns[current] ?? campaigns[0];
  const hero = campaign.products[0];
  const move = (change: number) => setCurrent((index) => (index + change + count) % count);

  return (
    <section aria-label="Featured campaigns" className="bg-[#f5f0e8] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.2em] text-[#c75b3b]"><Sparkles size={14} /> Featured campaign</p>
          <Link href="/campaigns" className="text-xs font-bold text-slate-700 underline underline-offset-4">View all campaigns</Link>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-[#172033] text-white shadow-[0_16px_35px_rgba(23,32,51,.16)]">
          <div className="grid min-h-[310px] md:grid-cols-[1.05fr_.95fr]">
            <div className="relative z-10 flex flex-col justify-center px-7 py-8 sm:px-10">
              <div aria-hidden="true" className="absolute -left-16 top-1/2 size-72 -translate-y-1/2 rounded-full border-[38px] border-white/5" />
              <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#ffb38f]">CommerceCraft edit · {String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</p>
                <h2 className="mt-3 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">{campaign.title}</h2>
                <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-6 text-white/75">{campaign.description}</p>
                <Link href={`/campaigns/${campaign.id}`} className="mt-5 inline-flex items-center gap-3 rounded-full bg-[#ef8354] px-5 py-3 text-sm font-bold transition hover:bg-[#ff9b70]">{campaign.bannerText}<ArrowRight size={16} /></Link>
              </div>
            </div>
            <div className="grid min-h-[250px] grid-rows-[1.65fr_1fr] gap-2 bg-[#e9e4da] p-2 sm:p-3">
              <div className="relative min-h-[155px] overflow-hidden rounded-xl bg-slate-800">
                {hero ? <Image src={hero.imageUrl} alt={hero.name} fill sizes="(max-width: 768px) 100vw, 650px" className="object-cover" /> : null}
                <div className="absolute inset-0 bg-gradient-to-r from-[#172033]/50 via-transparent to-transparent" />
                {hero ? <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-2 text-slate-900"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-slate-500">Featured piece</p><p className="mt-0.5 text-xs font-bold">{hero.name}</p></div> : null}
                <span className="absolute right-3 top-3 rounded-full bg-[#172033]/85 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-white">{campaign.products.length} pieces</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {campaign.products.slice(1, 4).map((product) => <Link key={product.id} href={`/products/${product.slug}`} className="group relative min-w-0 overflow-hidden rounded-lg bg-white"><Image src={product.imageUrl} alt={product.name} fill sizes="180px" className="object-cover transition duration-500 group-hover:scale-110" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-7"><p className="truncate text-[10px] font-bold text-white">{product.name}</p></div></Link>)}
                {campaign.products.length < 2 ? <div className="col-span-3 grid place-items-center rounded-lg bg-white px-3 text-center text-xs font-semibold text-slate-500">More products will be added to this collection soon.</div> : null}
              </div>
            </div>
          </div>
          {count > 1 ? <>
            <button type="button" onClick={() => move(-1)} aria-label="Previous campaign" className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-slate-950/70 text-white backdrop-blur hover:bg-slate-950"><ArrowLeft size={17} /></button>
            <button type="button" onClick={() => move(1)} aria-label="Next campaign" className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-slate-950/70 text-white backdrop-blur hover:bg-slate-950"><ArrowRight size={17} /></button>
            <div className="absolute bottom-3 left-7 flex gap-1.5">{campaigns.map((item, index) => <button key={item.id} type="button" onClick={() => setCurrent(index)} aria-label={`Show campaign ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === current ? "w-6 bg-white" : "w-1.5 bg-white/45"}`} />)}</div>
          </> : null}
        </div>
      </div>
    </section>
  );
}
