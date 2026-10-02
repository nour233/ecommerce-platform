"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import type { CampaignContent } from "@/lib/campaign-schema";
import type { Product } from "@/types";

type HeroCampaign = CampaignContent & { id: string; updatedAt: string; products: Product[] };

/** Campaign copy layered directly on the home image, so the storefront has one clear hero. */
export function CampaignHeroCard({ campaigns }: { campaigns: HeroCampaign[] }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const count = campaigns.length;
  const campaignFingerprint = campaigns.map((campaign) => `${campaign.id}:${campaign.updatedAt}`).join("|");
  useEffect(() => {
    if (count < 2) return;
    const timer = window.setInterval(() => setCurrent((value) => (value + 1) % count), 6000);
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
  const onTouchEnd = (clientX: number) => {
    if (touchStartX.current === null) return;
    const distance = clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 45 || count < 2) return;
    move(distance < 0 ? 1 : -1);
  };

  return <aside aria-label="Featured campaign" onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => onTouchEnd(event.changedTouches[0]?.clientX ?? 0)} className="relative flex h-full min-h-[590px] touch-pan-y flex-col overflow-hidden bg-[#172033] text-white">
    <div key={campaign.id} className="relative h-44 shrink-0 sm:h-48 lg:h-52 animate-[lookbook-next_.65s_ease-out] bg-slate-800">{campaign.products[0] ? <Image src={campaign.products[0].imageUrl} alt={campaign.products[0].name} fill sizes="50vw" className="object-cover" /> : null}<div className="absolute inset-0 bg-gradient-to-t from-[#172033]/75 via-transparent to-transparent" /><p className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-[#172033] px-3 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#ffb38f]"><Sparkles size={13} /> Featured campaign · {String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</p></div>
    <div className="flex flex-1 flex-col justify-between bg-[#172033] px-14 pb-6 pt-5 sm:px-16 sm:pt-6"><div><h1 title={campaign.title} className="line-clamp-3 h-[3.15em] text-3xl font-bold leading-[1.05] sm:line-clamp-2 sm:h-[2.1em] sm:text-4xl lg:text-5xl">{campaign.title}</h1><p className="mt-2 line-clamp-2 h-12 max-w-xl text-sm leading-6 text-white/80 sm:text-base">{campaign.description}</p><div className="mt-3 grid h-[clamp(3rem,8vw,8rem)] grid-cols-6 gap-2">{campaign.products.map((product) => <Link key={product.id} href={`/products/${product.slug}`} title={product.name} className="group relative h-full min-w-0 overflow-hidden rounded-md border border-white/15 bg-white/10"><Image src={product.imageUrl} alt={product.name} fill sizes="90px" className="object-cover transition duration-300 group-hover:scale-110" /></Link>)}</div></div><div className="mt-3 min-h-11"><Link href={`/campaigns/${campaign.id}`} className="inline-flex min-h-11 max-w-full items-center gap-3 truncate rounded-md bg-[#ef8354] px-5 text-sm font-bold text-white transition hover:bg-[#e76f51]"><span className="truncate">{campaign.bannerText}</span><ArrowRight size={17} className="shrink-0" /></Link></div></div>
    {count > 1 ? <>
      <button type="button" onClick={() => move(-1)} aria-label="Previous campaign" className="absolute left-2 top-1/2 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/35 bg-[#172033]/90 text-white shadow-lg backdrop-blur transition hover:bg-[#ef8354] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:left-3 sm:size-11"><ArrowLeft size={18} /></button>
      <button type="button" onClick={() => move(1)} aria-label="Next campaign" className="absolute right-2 top-1/2 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/35 bg-[#172033]/90 text-white shadow-lg backdrop-blur transition hover:bg-[#ef8354] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white sm:right-3 sm:size-11"><ArrowRight size={18} /></button>
      <div className="flex shrink-0 flex-col items-center gap-2 px-14 pb-5">
        <div className="flex max-w-full flex-wrap justify-center gap-1">{campaigns.map((item, index) => <button key={item.id} type="button" onClick={() => setCurrent(index)} aria-label={`Show campaign ${index + 1}`} aria-current={index === current ? "true" : undefined} className="grid min-h-6 min-w-6 place-items-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><span className={`h-1.5 rounded-full transition-all ${index === current ? "w-6 bg-[#ffb38f]" : "w-2 bg-white/50"}`} /></button>)}</div>
        <p className="text-[10px] font-semibold text-white/60">Balayez ou utilisez les flèches</p>
      </div>
    </> : null}
  </aside>;
}
