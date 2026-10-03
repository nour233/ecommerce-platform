"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Loader2, Plus, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/types";
import { useCart } from "@/components/cart-provider";

export function CompleteYourSetup({ product, recommendations }: { product: Product; recommendations: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const pieces = [product, ...recommendations];
  const total = pieces.reduce((sum, item) => sum + item.price, 0);

  async function addCompleteSet() {
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

  if (!recommendations.length) return null;
  return <section className="mt-9 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-[#fff7f2] shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-emerald-100 px-5 py-4"><div><p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-emerald-700"><Sparkles size={13} /> Curated for this product</p><h2 className="mt-1 text-lg font-bold text-slate-950">Complete your setup</h2><p className="mt-1 text-xs text-slate-500">A ready-to-go set of pieces that work well together.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">{pieces.length} pieces</span></div><div className="space-y-2 p-4"><SetupItem product={product} primary />{recommendations.map((item) => <SetupItem key={item.id} product={item} />)}</div><div className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-100 bg-white/70 px-5 py-4"><div><p className="text-xs font-medium text-slate-500">Complete set</p><p className="text-xl font-bold text-slate-950">${total.toFixed(2)}</p></div><button type="button" disabled={adding || product.stock < 1} onClick={() => void addCompleteSet()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-50">{adding ? <Loader2 size={17} className="animate-spin" /> : <Plus size={18} />}{adding ? "Adding set…" : "Add complete set"}</button>{message ? <p role="status" className="w-full text-xs font-semibold text-emerald-800">{message}</p> : null}</div></section>;
}

function SetupItem({ product, primary = false }: { product: Product; primary?: boolean }) {
  return <Link href={`/products/${product.slug}`} className="group flex items-center gap-3 rounded-xl bg-white/80 p-2.5 ring-1 ring-slate-100 transition hover:bg-white hover:shadow-sm"><span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-slate-100"><Image src={product.imageUrl} alt="" fill sizes="48px" className="object-cover transition duration-300 group-hover:scale-110" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-800">{product.name}</span><span className="mt-0.5 block text-xs text-slate-500">{primary ? "Your selected piece" : product.categoryName}</span></span><span className="flex items-center gap-1 text-sm font-bold text-slate-900">{primary ? <Check size={15} className="text-emerald-600" /> : null}${product.price.toFixed(2)}</span></Link>;
}
