"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { CampaignContent } from "@/lib/campaign-schema";
import type { Product } from "@/types";

type HeroCampaign = CampaignContent & { id: string; products: Product[] };

export function CampaignHeroCard({ campaigns }: { campaigns: HeroCampaign[] }) {
  const [current, setCurrent] = useState(0);
  const count = campaigns.length;
  useEffect(() => {
    if (count < 2) return;
    const timer = window.setInterval(() => setCurrent((value) => (value + 1) % count), 8000);
    return () => window.clearInterval(timer);
  }, [count]);
  if (!count) return null;
  const campaign = campaigns[current] ?? campaigns[0];
  const feature = campaign.products[0];
  const move = (change: number) => setCurrent((value) => (value + change + count) % count);

  return <aside aria-label="Featured collection" className="relative mx-auto w-full max-w-[410px] overflow-hidden rounded-2xl border border-white/25 bg-[#172033]/90 p-3 shadow-2xl backdrop-blur-md lg:mx-0">
    <div className="relative h-44 overflow-hidden rounded-xl bg-slate-800">
      {feature ? <Image src={feature.imageUrl} alt={feature.name} fill sizes="410px" className="object-cover" /> : null}
      <div className="absolute inset-0 bg-gradient-to-t from-[#172033] via-transparent to-transparent" />
      <p className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-[#172033]/80 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[.14em] text-[#ffb38f]"><Sparkles size={11} /> Featured campaign</p>
      {feature ? <p className="absolute bottom-3 left-3 rounded-md bg-white/95 px-2.5 py-1.5 text-xs font-bold text-slate-900">{feature.name}</p> : null}
    </div>
    <div className="px-2 pb-1 pt-3 text-white"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#ffb38f]">Collection {String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</p><h2 className="mt-1 line-clamp-2 text-xl font-bold leading-tight">{campaign.title}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 text-white/70">{campaign.description}</p><div className="mt-3 flex items-center gap-2"><Link href={`/campaigns/${campaign.id}`} className="inline-flex flex-1 items-center justify-between rounded-lg bg-[#ef8354] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#ff9b70]">Explore collection <ArrowRight size={15} /></Link>{count > 1 ? <><button type="button" onClick={() => move(-1)} aria-label="Previous campaign" className="grid size-9 place-items-center rounded-lg border border-white/20 text-white hover:bg-white/10"><ArrowLeft size={15} /></button><button type="button" onClick={() => move(1)} aria-label="Next campaign" className="grid size-9 place-items-center rounded-lg border border-white/20 text-white hover:bg-white/10"><ArrowRight size={15} /></button></> : null}</div></div>
  </aside>;
}
