"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { CampaignContent } from "@/lib/campaign-schema";
import type { Product } from "@/types";

type HeroCampaign = CampaignContent & { id: string; products: Product[] };

/** Campaign copy layered directly on the home image, so the storefront has one clear hero. */
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
  const move = (change: number) => setCurrent((value) => (value + change + count) % count);

  return <aside aria-label="Featured campaign" className="relative flex h-full min-h-[590px] flex-col justify-end overflow-hidden bg-[#172033] p-8 text-white sm:p-12 lg:p-16">
    {campaign.products[0] ? <><Image src={campaign.products[0].imageUrl} alt="" fill sizes="50vw" className="object-cover opacity-25" /><div className="absolute inset-0 bg-[#172033]/70" /></> : null}
    <div className="relative"><p className="flex items-center gap-2 text-sm font-semibold uppercase text-[#ffb38f]"><Sparkles size={16} /> Featured campaign · {String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</p><h1 className="mt-5 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">{campaign.title}</h1><p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg">{campaign.description}</p><div className="mt-8 flex flex-wrap items-center gap-3"><Link href={`/campaigns/${campaign.id}`} className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#ef8354] px-6 text-sm font-bold text-white transition hover:bg-[#e76f51]">{campaign.bannerText}<ArrowRight size={18} /></Link>{count > 1 ? <><button type="button" onClick={() => move(-1)} aria-label="Previous campaign" className="grid size-12 place-items-center rounded-md border border-white/35 bg-black/15 transition hover:bg-white hover:text-slate-950"><ArrowLeft size={18} /></button><button type="button" onClick={() => move(1)} aria-label="Next campaign" className="grid size-12 place-items-center rounded-md border border-white/35 bg-black/15 transition hover:bg-white hover:text-slate-950"><ArrowRight size={18} /></button></> : null}</div>{count > 1 ? <div className="mt-6 flex gap-2">{campaigns.map((item, index) => <button key={item.id} type="button" onClick={() => setCurrent(index)} aria-label={`Show campaign ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === current ? "w-9 bg-[#ffb38f]" : "w-2 bg-white/50"}`} />)}</div> : null}</div>
  </aside>;
}
