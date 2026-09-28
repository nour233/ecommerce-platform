"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, Sparkles } from "lucide-react";
import type { CampaignContent } from "@/lib/campaign-schema";
import type { Product } from "@/types";

type Collection = CampaignContent & { id: string; products: Product[]; updatedAt: string };
const colors = {
  sunset: "from-[#311523] via-[#74253d] to-[#d5683f]",
  ocean: "from-[#071e2c] via-[#1e4d67] to-[#438c96]",
  forest: "from-[#102c26] via-[#315b4d] to-[#829969]"
};
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function CampaignShowcase({ collections }: { collections: Collection[] }) {
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [turn, setTurn] = useState<"next" | "previous">("next");
  const count = collections.length;
  const move = useCallback((direction: "next" | "previous") => {
    setTurn(direction);
    setSelected(current => (current + (direction === "next" ? 1 : -1) + count) % count);
  }, [count]);

  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setInterval(() => move("next"), 7000);
    return () => window.clearInterval(timer);
  }, [count, move, paused]);

  if (!count) return null;
  const collection = collections[selected] ?? collections[0];
  const [hero, ...others] = collection.products;
  const setPage = (index: number) => { setTurn(index > selected ? "next" : "previous"); setSelected(index); };

  return <section aria-label="Campaign lookbook" className="relative overflow-hidden bg-[#eee9e0] px-0 py-5 sm:px-3 lg:px-5 lg:py-9">
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(ellipse_at_top,rgba(213,104,63,.12),transparent_65%)]" />
    <div className="relative mx-auto w-full max-w-none">
      <div className="mb-4 flex items-center justify-between gap-4"><p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-600"><Sparkles size={15} className="text-[#d5683f]" /> Campaign lookbook</p><p className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:block">Turn the page. Find your next favorite.</p></div>
      <div className="relative rounded-[28px] bg-[#d8d0c3] p-2 shadow-[0_28px_90px_rgba(31,25,20,0.2)] sm:p-3 lg:p-4">
        <div className="relative overflow-hidden rounded-[22px] bg-[#fdfaf4]" role="region" aria-roledescription="carousel" aria-label={`Campaign ${selected + 1} of ${count}`}>
          <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-20 hidden w-px bg-black/15 shadow-[-10px_0_24px_rgba(0,0,0,.16),10px_0_24px_rgba(0,0,0,.12)] lg:block" />
          <div key={collection.id} className={`grid lg:h-[620px] lg:grid-cols-2 ${turn === "next" ? "animate-[lookbook-next_.55s_ease-out]" : "animate-[lookbook-previous_.55s_ease-out]"}`}>
            <article className={`relative overflow-hidden bg-gradient-to-br ${colors[collection.palette]} px-7 py-9 text-white sm:px-12 lg:h-full lg:px-16 lg:py-12`}>
              <div aria-hidden="true" className="absolute -left-24 -top-32 size-[440px] rounded-full border-[55px] border-white/[0.045]" />
              <div className="relative flex h-full flex-col"><p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white/65"><span className="h-px w-9 bg-white/45" /> Issue {String(selected + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</p><div className="my-auto py-8 lg:py-5"><p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ffe2cc]">CommerceCraft presents</p><h1 className="line-clamp-4 max-w-xl text-4xl font-semibold leading-[1.04] tracking-tight sm:text-5xl xl:text-[3.7rem]">{collection.title}</h1><p className="mt-5 line-clamp-3 max-w-xl text-sm leading-7 text-white/78 sm:text-base">{collection.description}</p><Link href={`/campaigns/${collection.id}`} className="mt-7 inline-flex min-h-12 max-w-xl items-center justify-between gap-5 rounded-full bg-[#fffaf0] px-6 text-sm font-bold text-slate-950 transition hover:bg-white"><span className="line-clamp-1">{collection.bannerText}</span><ArrowRight size={18} className="shrink-0" /></Link></div><div className="flex items-center justify-between border-t border-white/15 pt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60"><span>{collection.products.length} considered pieces</span><span>Vol. {new Date(collection.updatedAt).getFullYear()}</span></div></div>
            </article>
            <article className="relative min-h-[460px] overflow-hidden bg-[#f8f4ec] p-4 sm:p-6 lg:h-full lg:min-h-0">
              {hero ? <><div className="relative h-[265px] overflow-hidden rounded-[15px] bg-slate-200 sm:h-[360px] lg:h-[320px]"><Image src={hero.imageUrl} alt={hero.name} fill priority sizes="(max-width: 1024px) 90vw, 650px" className="object-cover transition duration-700 hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" /><span className="absolute left-4 top-4 rounded-full border border-white/40 bg-black/20 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur">Cover story</span><Link href={`/products/${hero.slug}`} className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-4 rounded-xl bg-white/95 p-4 text-slate-900 shadow-xl transition hover:bg-white"><div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">{hero.categoryName}</p><h2 className="mt-1 line-clamp-1 text-base font-semibold">{hero.name}</h2><p className="mt-1 text-sm">{money.format(hero.price)}</p></div><span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-900 text-white"><ArrowUpRight size={19} /></span></Link></div><div className="mt-4 grid grid-cols-3 gap-3">{others.slice(0, 3).map(product => <Link key={product.id} href={`/products/${product.slug}`} className="group min-w-0"><div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200"><Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 640px) 28vw, 180px" className="object-cover transition duration-500 group-hover:scale-110" /></div><p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-800">{product.name}</p><p className="mt-1 text-xs text-slate-500">{money.format(product.price)}</p></Link>)}</div></> : <div className="grid h-full place-items-center text-center text-slate-500">No available products in this campaign.</div>}
              <span className="absolute bottom-5 right-6 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Lookbook / {String(selected + 1).padStart(2, "0")}</span>
            </article>
          </div>
          {count > 1 && <><button type="button" onClick={() => move("previous")} aria-label="Previous campaign" className="absolute left-3 top-1/2 z-30 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-slate-950/75 text-white shadow-xl backdrop-blur transition hover:scale-105 hover:bg-slate-950"><ArrowLeft size={20} /></button><button type="button" onClick={() => move("next")} aria-label="Next campaign" className="absolute right-3 top-1/2 z-30 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-slate-950/75 text-white shadow-xl backdrop-blur transition hover:scale-105 hover:bg-slate-950"><ArrowRight size={20} /></button></>}
        </div>
        {count > 1 && <div className="flex items-center justify-between gap-4 px-2 pb-1 pt-4 sm:px-4"><div className="flex gap-2" aria-label="Choose a campaign">{collections.map((item, index) => <button key={item.id} type="button" onClick={() => setPage(index)} aria-label={`Open campaign ${index + 1}: ${item.title}`} aria-current={index === selected ? "true" : undefined} className={`h-1.5 rounded-full transition-all ${index === selected ? "w-10 bg-slate-900" : "w-3 bg-slate-400 hover:bg-slate-600"}`} />)}</div><button type="button" onClick={() => setPaused(value => !value)} className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 hover:text-slate-950" aria-pressed={paused}>{paused ? <Play size={13} fill="currentColor" /> : <Pause size={13} fill="currentColor" />}{paused ? "Resume motion" : "Pause motion"}</button></div>}
      </div>
    </div>
  </section>;
}
