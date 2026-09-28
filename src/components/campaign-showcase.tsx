"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import type { CampaignContent } from "@/lib/campaign-schema";
import type { Product } from "@/types";

type Collection = CampaignContent & { id: string; products: Product[] };
const colors = {
  sunset: "from-[#391d28] via-[#722c40] to-[#c46642]",
  ocean: "from-[#122433] via-[#204860] to-[#377b85]",
  forest: "from-[#142e28] via-[#285246] to-[#668566]"
};
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function CampaignShowcase({ collections }: { collections: Collection[] }) {
  const [selected, setSelected] = useState(0);
  const collection = collections[selected] ?? collections[0];
  if (!collection) return null;
  const [hero, ...others] = collection.products;
  return <section aria-label="The collection edit" className="bg-[#f6f3ee] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"><span className="flex items-center gap-2"><Sparkles size={15} /> The collection edit</span><span>Considered pieces. Fresh perspectives.</span></div>
      <div className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${colors[collection.palette]} text-white`}>
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-48 size-[600px] rounded-full border-[70px] border-white/[0.03]" />
        <div className="relative grid lg:grid-cols-[1fr_0.95fr]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
            <p className="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70"><span className="h-px w-8 bg-white/50" /> Curated collection / {String(selected + 1).padStart(2, "0")}</p>
            <h1 className="max-w-xl break-words text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">{collection.title}</h1>
            <p className="mt-5 line-clamp-3 max-w-lg text-sm leading-7 text-white/75 sm:text-base">{collection.description}</p>
            <Link href={`/campaigns/${collection.id}`} className="mt-7 inline-flex min-h-12 max-w-lg items-center justify-between gap-5 self-start rounded-full bg-[#fffaf1] px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><span>{collection.bannerText}</span><ArrowRight size={18} className="shrink-0" /></Link>
            <div className="mt-8 flex items-center gap-3 text-xs text-white/70"><span className="h-px w-10 bg-white/30" />{collection.products.length} pieces, one inspired edit</div>
          </div>
          {hero && <div className="relative m-4 mt-0 min-h-[350px] overflow-hidden rounded-[20px] bg-white/10 sm:min-h-[420px] lg:m-5 lg:ml-0 lg:min-h-[500px]">
            <Image key={hero.imageUrl} src={hero.imageUrl} alt={hero.name} fill priority sizes="(max-width: 1024px) 95vw, 650px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
            <span className="absolute left-5 top-5 rounded-full border border-white/40 bg-black/25 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-md">In the spotlight</span>
            <Link href={`/products/${hero.slug}`} className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-4 rounded-2xl bg-white/95 p-5 text-slate-900 shadow-lg transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><div><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{hero.categoryName}</p><h2 className="mt-1 text-lg font-semibold">{hero.name}</h2><p className="mt-1 text-sm">{money.format(hero.price)}</p></div><span className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-900 text-white"><ArrowUpRight size={21} /></span></Link>
          </div>}
        </div>
        {others.length > 0 && <div className="relative border-t border-white/15 bg-black/10 p-4 sm:px-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">Complete<br className="hidden sm:block" /> the collection</p><div className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-1">{others.map(product => <Link key={product.id} href={`/products/${product.slug}`} className="flex min-w-[210px] flex-1 items-center gap-3 rounded-xl border border-white/15 bg-white/5 p-2 transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-white/10"><Image src={product.imageUrl} alt="" fill sizes="56px" className="object-cover" /></div><div className="min-w-0"><p className="line-clamp-2 text-xs font-semibold">{product.name}</p><p className="mt-1 text-xs text-white/65">{money.format(product.price)}</p></div></Link>)}</div></div></div>}
      </div>
      {collections.length > 1 && <div className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Choose a collection">{collections.map((item, index) => <button key={item.id} type="button" aria-pressed={index === selected} onClick={() => setSelected(index)} className={`flex min-w-0 shrink-0 items-center gap-3 rounded-full border px-4 py-3 text-left text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${index === selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-transparent text-slate-600 hover:bg-white"}`}><span className="opacity-50">{String(index + 1).padStart(2, "0")}</span><span className="max-w-[240px] truncate">{item.title}</span></button>)}</div>}
    </div>
  </section>;
}
