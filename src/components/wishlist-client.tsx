"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, Sparkles, Trash2 } from "lucide-react";
import type { WishlistItem } from "@/types";
import { ProductActions } from "@/components/product-actions";
import { useWishlist } from "@/components/wishlist-provider";

async function readWishlistResponse(response: Response) {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Unable to update the wishlist");
  return payload.data as WishlistItem[];
}

export function WishlistClient() {
  const { items, setItems } = useWishlist();
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const loadWishlist = useCallback(async () => {
    setError("");
    try { setItems(await readWishlistResponse(await fetch("/api/wishlist", { cache: "no-store" }))); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load the wishlist"); }
  }, [setItems]);

  async function remove(productId: string) {
    setPending(productId); setError("");
    try { setItems(await readWishlistResponse(await fetch(`/api/wishlist/${productId}`, { method: "DELETE" }))); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to update the wishlist"); }
    finally { setPending(null); }
  }

  useEffect(() => { void loadWishlist(); }, [loadWishlist]);

  if (!items && !error) return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><div className="h-96 animate-pulse rounded-md bg-white" /><div className="h-96 animate-pulse rounded-md bg-white" /><div className="h-96 animate-pulse rounded-md bg-white" /></div>;
  if (!items) return <section className="rounded-md border border-red-200 bg-red-50 p-8 text-center"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" onClick={() => void loadWishlist()} className="mt-4 rounded-md bg-[#172033] px-4 py-2 text-sm font-semibold text-white">Try again</button></section>;

  if (items.length === 0) {
    return <section className="grid overflow-hidden rounded-md bg-white shadow-sm lg:grid-cols-2"><div className="relative min-h-[360px]"><Image src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85" alt="Curated store collection" fill className="object-cover" /></div><div className="flex items-center p-8 sm:p-12"><div><span className="grid size-12 place-items-center rounded-md bg-[#fff0e9] text-[#d65f3f]"><Heart size={22} /></span><h1 className="mt-6 text-3xl font-bold text-[#172033]">Make this space yours.</h1><p className="mt-3 max-w-md leading-7 text-slate-500">Save the pieces that catch your eye and return whenever you are ready. Your wishlist stays personal and duplicate-free.</p><Link href="/products" className="mt-7 inline-flex min-h-12 items-center gap-3 rounded-md bg-[#172033] px-6 text-sm font-bold text-white">Explore the collection <ArrowRight size={17} /></Link></div></div></section>;
  }

  return (
    <div>
      {error ? <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="mb-6 flex items-center justify-between"><p className="text-sm text-slate-500"><span className="font-bold text-slate-900">{items.length}</span> saved {items.length === 1 ? "piece" : "pieces"}</p><span className="hidden items-center gap-2 text-xs font-semibold uppercase text-emerald-700 sm:flex"><Sparkles size={15} />Your personal edit</span></div>
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.productId} className="group overflow-hidden rounded-md bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="relative overflow-hidden bg-slate-100"><Link href={`/products/${item.product.slug}`} className="block"><Image src={item.product.imageUrl} alt={item.product.name} width={800} height={900} className="aspect-[4/4.6] w-full object-cover transition duration-700 group-hover:scale-105" /></Link><span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase text-[#d65f3f] backdrop-blur"><Heart size={12} fill="currentColor" />Saved</span><button type="button" disabled={pending === item.productId} onClick={() => void remove(item.productId)} className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40" aria-label={`Remove ${item.product.name} from wishlist`} title="Remove"><Trash2 size={16} /></button></div>
            <div className="p-5"><p className="text-[11px] font-semibold uppercase text-emerald-700">{item.product.categoryName}</p><Link href={`/products/${item.product.slug}`}><h2 className="mt-2 text-lg font-bold text-[#172033] transition group-hover:text-[#d65f3f]">{item.product.name}</h2></Link><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{item.product.description}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><p className="text-lg font-bold text-[#172033]">${item.product.price.toFixed(2)}</p><ProductActions productId={item.productId} compact /></div></div>
          </article>
        ))}
      </section>
    </div>
  );
}
