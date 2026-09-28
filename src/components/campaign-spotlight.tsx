"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { CampaignContent } from "@/lib/campaign-schema";
import type { Product } from "@/types";

type SpotlightCampaign = CampaignContent & { id: string; products: Product[] };

/** A small advertising ribbon: campaigns are promoted without competing with the home hero. */
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
  const move = (change: number) => setCurrent((index) => (index + change + count) % count);

  return <section aria-label="Featured campaigns" className="border-y border-[#eadfd1] bg-[#f8f4ed] px-4 py-3 sm:px-6 lg:px-8">
    <div className="mx-auto flex max-w-[1500px] items-center gap-3 sm:gap-5">
      {count > 1 ? <button type="button" onClick={() => move(-1)} aria-label="Previous campaign" className="grid size-9 shrink-0 place-items-center rounded-full border border-slate-300 bg-white text-slate-800 transition hover:border-[#ef8354] hover:text-[#d65f3f]"><ArrowLeft size={17} /></button> : null}
      <div className="min-w-0 flex-1 rounded-xl bg-[#172033] px-4 py-3 text-white shadow-sm sm:px-5">
        <div className="flex items-center gap-4">
          <div className="min-w-0 shrink-0 sm:w-[31%]"><p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.17em] text-[#ffb38f]"><Sparkles size={12} /> Featured edit</p><h2 className="mt-1 truncate text-base font-bold sm:text-lg">{campaign.title}</h2></div>
          <p className="hidden min-w-0 flex-1 line-clamp-2 text-xs leading-5 text-white/70 lg:block">{campaign.description}</p>
          <div className="hidden min-w-[240px] flex-1 grid-cols-3 gap-2 sm:grid">
            {campaign.products.slice(0, 3).map((product) => <Link key={product.id} href={`/products/${product.slug}`} className="group flex min-w-0 items-center gap-2 rounded-lg bg-white/10 p-1.5 transition hover:bg-white/20"><span className="relative size-9 shrink-0 overflow-hidden rounded-md"><Image src={product.imageUrl} alt={product.name} fill sizes="36px" className="object-cover" /></span><span className="truncate text-[10px] font-semibold text-white">{product.name}</span></Link>)}
          </div>
          <Link href={`/campaigns/${campaign.id}`} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#ef8354] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#ff9b70]"><span className="hidden sm:inline">Discover</span><ArrowRight size={15} /></Link>
        </div>
      </div>
      {count > 1 ? <button type="button" onClick={() => move(1)} aria-label="Next campaign" className="grid size-9 shrink-0 place-items-center rounded-full border border-slate-300 bg-white text-slate-800 transition hover:border-[#ef8354] hover:text-[#d65f3f]"><ArrowRight size={17} /></button> : null}
      <Link href="/campaigns" className="hidden shrink-0 text-xs font-bold text-slate-700 underline underline-offset-4 xl:block">All campaigns</Link>
    </div>
  </section>;
}
