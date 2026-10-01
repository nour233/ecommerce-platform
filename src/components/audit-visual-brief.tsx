"use client";

import Image from "next/image";
import { ArrowUpRight, ChevronDown, Heart, Package, ShoppingCart, Sparkles, TrendingUp } from "lucide-react";
import type { Product, UserCommerceData } from "@/types";

export function AuditVisualBrief({ narrative, products, userCommerce, onProducts, onCampaign }: {
  narrative: string; products: Product[]; userCommerce: UserCommerceData[]; onProducts: () => void; onCampaign: () => void;
}) {
  const signals = products.map((product) => {
    const carts = userCommerce.reduce((sum, user) => sum + user.cart.filter((item) => item.productId === product.id).reduce((total, item) => total + item.quantity, 0), 0);
    const saves = userCommerce.reduce((sum, user) => sum + user.wishlist.filter((item) => item.productId === product.id).length, 0);
    return { product, carts, saves, interest: carts + saves };
  });
  const urgent = signals.filter(({ product }) => product.stock < 10).sort((a, b) => a.product.stock - b.product.stock || b.interest - a.interest);
  const opportunities = signals.filter(({ product, interest }) => product.stock > 0 && interest > 0).sort((a, b) => b.interest - a.interest);
  const described = products.filter((product) => product.description.trim().length >= 100).length;
  const available = products.filter((product) => product.stock > 0).length;
  const tagged = products.filter((product) => product.tags.length > 0).length;
  const healthyStock = products.length ? Math.round((products.length - urgent.length) / products.length * 100) : 0;
  const maxInterest = Math.max(1, ...opportunities.slice(0, 5).map((item) => item.interest));
  const blocks = narrative.replace(/\r/g, "").split(/(?:^|\n)##\s+/).map((block) => block.trim()).filter(Boolean);
  const notes = blocks.map((block) => block.replace(/^.*\n/, "").replace(/\*\*/g, "").trim());

  function detail(index: number) {
    const note = blocks.length >= 3 ? notes[index] : index === 0 ? narrative : undefined;
    return note ? <details className="group mt-5 border-t border-slate-200/70 pt-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900">Lire l’analyse IA<ChevronDown size={14} className="transition group-open:rotate-180" /></summary><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{note}</p></details> : null;
  }

  function productRows(items: typeof signals, mode: "stock" | "interest") {
    return <div className="space-y-3">{items.slice(0, 3).map(({ product, carts, saves }, index) => <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-white bg-white/80 p-3 shadow-sm">
      <div className="relative shrink-0"><Image src={product.imageUrl} alt="" width={48} height={48} className="size-12 rounded-xl object-cover" />{mode === "interest" ? <span className="absolute -left-1 -top-1 grid size-5 place-items-center rounded-full bg-violet-600 text-[10px] font-bold text-white">{index + 1}</span> : null}</div>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900" title={product.name}>{product.name}</p><div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500"><span className="inline-flex items-center gap-1"><ShoppingCart size={12} />{carts}</span><span className="inline-flex items-center gap-1"><Heart size={12} />{saves}</span>{mode === "interest" ? <span>{product.stock} en stock</span> : null}</div></div>
      {mode === "stock" ? <span className={`shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-bold ${product.stock === 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"}`}>{product.stock === 0 ? "Rupture" : `${product.stock} restant${product.stock > 1 ? "s" : ""}`}</span> : null}
    </div>)}</div>;
  }

  return <div>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><div><p className="text-lg font-bold tracking-tight text-slate-900">Votre boutique, en un coup d’œil</p><p className="mt-1 text-xs text-slate-500">Les signaux du catalogue pour choisir votre prochaine action.</p></div><span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700"><span className="size-1.5 rounded-full bg-emerald-500" />Audit terminé</span></div>
    <div className="mb-5 grid overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white lg:grid-cols-[1fr_1.2fr]">
      <div className="flex flex-wrap items-center gap-5 p-6 sm:p-8">
        <div className="relative size-28 shrink-0"><svg viewBox="0 0 120 120" className="size-full -rotate-90" role="img" aria-label={`${healthyStock}% des produits ont au moins 10 unités en stock`}><circle cx="60" cy="60" r="50" fill="none" stroke="#263244" strokeWidth="9" /><circle cx="60" cy="60" r="50" fill="none" stroke={urgent.length ? "#fbbf24" : "#34d399"} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${healthyStock / 100 * 314.16} 314.16`} /></svg><div className="absolute inset-0 grid content-center text-center"><span className="text-3xl font-bold">{healthyStock}%</span><span className="mt-1 text-[10px] text-slate-400">stock sain</span></div></div>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">État du stock</p><h3 className="mt-2 text-2xl font-bold tracking-tight">{!products.length ? "Votre vitrine attend ses produits" : urgent.some(({ product }) => product.stock === 0) ? "Du potentiel, mais des ruptures" : urgent.length ? "Quelques stocks à renforcer" : "Prête à accueillir la demande"}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{products.length ? `${available} produits disponibles sur ${products.length}. ${urgent.length ? `${urgent.length} références passent sous le seuil de 10 unités.` : "Toutes les références disposent d’au moins 10 unités."}` : "Ajoutez vos premières références pour suivre leur état."}</p></div>
      </div>
      <div className="border-t border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:border-l lg:border-t-0"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-bold">Où se concentre l’intérêt ?</h3><div className="flex gap-3 text-[10px] text-slate-400"><span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-violet-400" />Panier</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-fuchsia-300" />Favoris</span></div></div>
        <div className="mt-5 space-y-3" role="img" aria-label="Graphique des quantités en panier et favoris des cinq produits disponibles les plus demandés">{opportunities.slice(0, 5).map(({ product, carts, saves, interest }) => <div key={product.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_24px] items-center gap-3"><span title={product.name} className="truncate text-xs text-slate-300">{product.name}</span><div className="flex h-3 overflow-hidden rounded-full bg-white/5"><span className="h-full bg-violet-400" style={{ width: `${carts / maxInterest * 100}%` }} /><span className="h-full bg-fuchsia-300" style={{ width: `${saves / maxInterest * 100}%` }} /></div><span className="text-right text-xs font-bold">{interest}</span></div>)}{!opportunities.length ? <p className="py-4 text-sm text-slate-400">En attente des premiers signaux d’intérêt.</p> : null}</div>
        <p className="mt-4 text-[10px] text-slate-500">Quantités en panier et ajouts en favoris · produits en stock</p>
      </div>
    </div>
    <div className="grid items-start gap-4 xl:grid-cols-3">
      <article className="rounded-3xl border border-orange-100 bg-gradient-to-b from-orange-50 to-white p-5">
        <div className="flex items-center justify-between"><span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-800">01 · Priorité</span><Package size={20} className="text-orange-500" /></div>
        <div className="my-5 flex items-end gap-3"><span className="text-5xl font-bold tracking-tighter text-slate-950">{urgent.length}</span><div className="pb-1"><h3 className="text-sm font-bold text-slate-900">Produits à surveiller</h3><p className="mt-1 text-xs text-slate-500">Stock inférieur à 10 unités</p></div></div>
        {urgent.length ? productRows(urgent, "stock") : <p className="rounded-2xl bg-white p-4 text-sm text-emerald-700">Tous vos produits ont au moins 10 unités en stock.</p>}
        {urgent.length > 3 ? <p className="mt-3 text-xs text-slate-500">+ {urgent.length - 3} autres produits à vérifier</p> : null}
        <button onClick={onProducts} type="button" className="mt-5 flex min-h-11 w-full items-center justify-between rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-700">Gérer les stocks<ArrowUpRight size={16} /></button>{detail(0)}
      </article>
      <article className="rounded-3xl border border-violet-100 bg-gradient-to-b from-violet-50 to-white p-5">
        <div className="flex items-center justify-between"><span className="rounded-full bg-violet-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-800">02 · Potentiel</span><TrendingUp size={20} className="text-violet-500" /></div>
        <div className="my-5"><h3 className="text-xl font-bold tracking-tight text-slate-900">Vos produits convoités</h3><p className="mt-2 text-xs text-slate-500">Classés par quantités en panier + favoris</p></div>
        {opportunities.length ? productRows(opportunities, "interest") : <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">Les produits disponibles apparaîtront ici dès les premiers paniers ou favoris.</p>}
        <button onClick={onCampaign} type="button" className="mt-5 flex min-h-11 w-full items-center justify-between rounded-xl bg-violet-600 px-4 text-xs font-bold text-white transition hover:bg-violet-700">Créer une campagne<Sparkles size={16} /></button>{detail(1)}
      </article>
      <article className="rounded-3xl border border-sky-100 bg-gradient-to-b from-sky-50 to-white p-5">
        <div className="flex items-center justify-between"><span className="rounded-full bg-sky-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-800">03 · Catalogue</span><Sparkles size={20} className="text-sky-500" /></div>
        <div className="my-5"><h3 className="text-xl font-bold tracking-tight text-slate-900">Les bases d’une belle vitrine</h3><p className="mt-2 text-xs text-slate-500">Trois repères pour améliorer vos fiches</p></div>
        <div className="space-y-5 rounded-2xl border border-white bg-white/80 p-4">{[{ label: "Produits disponibles", count: available, color: "bg-emerald-500" }, { label: "Descriptions ≥ 100 caractères", count: described, color: "bg-sky-500" }, { label: "Produits avec des tags", count: tagged, color: "bg-violet-500" }].map(({ label, count, color }) => <div key={label}><div className="mb-2 flex items-center justify-between gap-2 text-xs"><span className="font-medium text-slate-600">{label}</span><span className="shrink-0 font-bold text-slate-900">{count}/{products.length}</span></div><div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={products.length || 1} aria-valuenow={count} className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${products.length ? count / products.length * 100 : 0}%` }} /></div></div>)}</div>
        <button onClick={onProducts} type="button" className="mt-5 flex min-h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-sky-50">Améliorer les fiches<ArrowUpRight size={16} /></button>{detail(2)}
      </article>
    </div>
  </div>;
}
