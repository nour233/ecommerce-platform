"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Loader2, Plus, Sparkles, WandSparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/types";
import { useCart } from "@/components/cart-provider";

type AiSetup = { products: Product[]; rationale: string };

export function CompleteYourSetup({ product }: { product: Product }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setCart } = useCart();
  const [setup, setSetup] = useState<AiSetup | null>(null);
  const [building, setBuilding] = useState(false);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const pieces = setup ? [product, ...setup.products] : [];
  const total = pieces.reduce((sum, item) => sum + item.price, 0);

  async function buildWithAi() {
    setBuilding(true); setMessage("");
    try {
      const response = await fetch("/api/storefront/ai-setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id }) });
      if (response.status === 401) { router.push(`/login?next=${encodeURIComponent(pathname)}`); return; }
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "AI could not build this set");
      setSetup(payload.data as AiSetup);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI could not build this set");
    } finally { setBuilding(false); }
  }

  async function addCompleteSet() {
    if (!setup) return;
    setAdding(true); setMessage("");
    try {
      let latestCart: unknown = null;
      for (const item of pieces) {
        const response = await fetch("/api/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: item.id, quantity: 1 }) });
        if (response.status === 401) { router.push(`/login?next=${encodeURIComponent(pathname)}`); return; }
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Could not add this set");
        latestCart = payload.data;
      }
      if (latestCart) setCart(latestCart as Parameters<typeof setCart>[0]);
      setMessage("Complete set added to cart");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not add this set"); }
    finally { setAdding(false); }
  }

  return <section className="mt-9 overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-[#fff7f2] shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-violet-100 px-5 py-4">
      <div><p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-violet-700"><Sparkles size={13} /> AI shopping stylist</p><h2 className="mt-1 text-lg font-bold text-slate-950">Build a set around this product</h2><p className="mt-1 text-xs text-slate-500">Claude studies the catalog and selects pieces that fit a real use together.</p></div>
      <button type="button" disabled={building || product.stock < 1} onClick={() => void buildWithAi()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-700 px-3.5 text-xs font-bold text-white shadow-lg shadow-violet-900/15 transition hover:bg-violet-800 disabled:cursor-wait disabled:opacity-50">{building ? <Loader2 size={16} className="animate-spin" /> : <WandSparkles size={16} />}{building ? "AI is choosing…" : setup ? "Build another AI set" : "Ask AI to build my set"}</button>
    </div>
    {!setup ? <div className="px-5 py-6"><div className="rounded-xl border border-dashed border-violet-200 bg-white/70 p-4 text-sm text-slate-600"><strong className="text-slate-900">One click, a considered set.</strong><p className="mt-1 leading-6">AI uses this product and your live catalog to create a matching selection. It only runs when you ask it to.</p></div></div> : <>
      <div className="space-y-2 p-4"><SetupItem product={product} primary />{setup.products.map((item) => <SetupItem key={item.id} product={item} />)}</div>
      <div className="mx-4 mb-4 rounded-xl bg-violet-100/70 px-3.5 py-3 text-xs leading-5 text-violet-950"><span className="font-bold">Why AI chose this: </span>{setup.rationale}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-violet-100 bg-white/70 px-5 py-4"><div><p className="text-xs font-medium text-slate-500">AI-built set · {pieces.length} pieces</p><p className="text-xl font-bold text-slate-950">${total.toFixed(2)}</p></div><button type="button" disabled={adding || product.stock < 1} onClick={() => void addCompleteSet()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-50">{adding ? <Loader2 size={17} className="animate-spin" /> : <Plus size={18} />}{adding ? "Adding set…" : "Add AI set to cart"}</button></div>
    </>}
    {message ? <p role="status" className="border-t border-violet-100 px-5 py-3 text-xs font-semibold text-violet-800">{message}</p> : null}
  </section>;
}

function SetupItem({ product, primary = false }: { product: Product; primary?: boolean }) {
  return <Link href={`/products/${product.slug}`} className="group flex items-center gap-3 rounded-xl bg-white/80 p-2.5 ring-1 ring-slate-100 transition hover:bg-white hover:shadow-sm"><span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-slate-100"><Image src={product.imageUrl} alt="" fill sizes="48px" className="object-cover transition duration-300 group-hover:scale-110" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{product.name}</span><span className="mt-0.5 block text-xs text-slate-500">{primary ? "Your selected piece" : product.categoryName}</span></span><span className="flex items-center gap-1 text-sm font-bold text-slate-900">{primary ? <Check size={15} className="text-emerald-600" /> : null}${product.price.toFixed(2)}</span></Link>;
}
