"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { CampaignContent } from "@/lib/campaign-schema";
import type { Product } from "@/types";

type HeroCampaign = CampaignContent & { id: string; updatedAt: string; products: Product[] };

/** Campaign copy layered directly on the home image, so the storefront has one clear hero. */
export function CampaignHeroCard({ campaigns }: { campaigns: HeroCampaign[] }) {
  const [current, setCurrent] = useState(0);
  const count = campaigns.length;
  const campaignFingerprint = campaigns.map((campaign) => `${campaign.id}:${campaign.updatedAt}`).join("|");
  useEffect(() => {
    if (count < 2) return;
    const timer = window.setInterval(() => setCurrent((value) => (value + 1) % count), 8000);
    return () => window.clearInterval(timer);
  }, [count]);
  useEffect(() => {
    const sync = async () => {
      try {
        const response = await fetch("/api/storefront/campaigns", { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json() as { data?: Array<{ id: string; updatedAt: string }> };
        const liveFingerprint = (payload.data ?? []).map((campaign) => `${campaign.id}:${campaign.updatedAt}`).join("|");
        if (liveFingerprint !== campaignFingerprint) window.location.reload();
      } catch { /* Keep the visible campaign if a temporary network error occurs. */ }
    };
    const timer = window.setInterval(() => void sync(), 8000);
    return () => window.clearInterval(timer);
  }, [campaignFingerprint]);
  if (!count) return null;
  const campaign = campaigns[current] ?? campaigns[0];
  const move = (change: number) => setCurrent((value) => (value + change + count) % count);

  return <aside aria-label="Featured campaign" className="flex h-full min-h-[590px] flex-col overflow-hidden bg-[#172033] text-white">
    <div className="relative h-[37%] min-h-48 shrink-0 bg-slate-800">{campaign.products[0] ? <Image src={campaign.products[0].imageUrl} alt={campaign.products[0].name} fill sizes="50vw" className="object-cover" /> : null}<div className="absolute inset-0 bg-gradient-to-t from-[#172033]/75 via-transparent to-transparent" /><p className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-[#172033] px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#ffb38f]"><Sparkles size={13} /> Featured campaign · {String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</p></div>
    <div className="flex flex-1 flex-col justify-between bg-[#172033] px-8 pb-20 pt-6 sm:px-12 sm:pb-20 sm:pt-8 lg:px-16"><div><h1 className="text-3xl font-bold leading-[1.05] sm:text-4xl lg:text-5xl">{campaign.title}</h1><p className="mt-3 line-clamp-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">{campaign.description}</p></div><div className="mt-4 flex flex-wrap items-center gap-3"><Link href={`/campaigns/${campaign.id}`} className="inline-flex min-h-11 items-center gap-3 rounded-md bg-[#ef8354] px-5 text-sm font-bold text-white transition hover:bg-[#e76f51]">{campaign.bannerText}<ArrowRight size={17} /></Link>{count > 1 ? <><button type="button" onClick={() => move(-1)} aria-label="Previous campaign" className="grid size-11 place-items-center rounded-md border border-white/35 transition hover:bg-white hover:text-slate-950"><ArrowLeft size={17} /></button><button type="button" onClick={() => move(1)} aria-label="Next campaign" className="grid size-11 place-items-center rounded-md border border-white/35 transition hover:bg-white hover:text-slate-950"><ArrowRight size={17} /></button></> : null}</div>{count > 1 ? <div className="mt-3 flex gap-2">{campaigns.map((item, index) => <button key={item.id} type="button" onClick={() => setCurrent(index)} aria-label={`Show campaign ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === current ? "w-9 bg-[#ffb38f]" : "w-2 bg-white/50"}`} />)}</div> : null}</div>
  </aside>;
}
