"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, LockKeyhole, Minus, PackageCheck, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import type { CartSummary } from "@/types";
import { useCart } from "@/components/cart-provider";

async function readCartResponse(response: Response) {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "Unable to update the cart");
  return payload.data as CartSummary;
}

export function CartClient() {
  const { cart, setCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState("");

  const loadCart = useCallback(async () => {
    setError("");
    try { setCart(await readCartResponse(await fetch("/api/cart", { cache: "no-store" }))); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load the cart"); }
    finally { setLoading(false); }
  }, [setCart]);

  async function update(productId: string, quantity: number) {
    if (quantity < 1) return;
    setPending(productId); setError("");
    try { setCart(await readCartResponse(await fetch(`/api/cart/${productId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity }) }))); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to update the cart"); }
    finally { setPending(null); }
  }

  async function remove(productId: string) {
    setPending(productId); setError("");
    try { setCart(await readCartResponse(await fetch(`/api/cart/${productId}`, { method: "DELETE" }))); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to update the cart"); }
    finally { setPending(null); }
  }

  useEffect(() => { void loadCart(); }, [loadCart]);

  if (loading) return <div className="grid gap-6 lg:grid-cols-[1fr_390px]"><div className="h-96 animate-pulse rounded-md bg-white" /><div className="h-80 animate-pulse rounded-md bg-white" /></div>;
  if (error && !cart) return <ErrorState error={error} retry={() => void loadCart()} />;

  if (!cart || cart.items.length === 0) {
    return <section className="relative overflow-hidden rounded-md bg-[#172033] px-6 py-20 text-center text-white"><div className="absolute inset-x-0 top-0 h-1 bg-[#ef8354]" /><span className="mx-auto grid size-16 place-items-center rounded-full bg-white/10"><ShoppingBag size={28} /></span><h1 className="mt-6 text-3xl font-bold">Your cart is ready for something good.</h1><p className="mx-auto mt-3 max-w-md text-slate-300">Explore the collection and bring your favorite pieces together here.</p><Link href="/products" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-md bg-[#ef8354] px-6 text-sm font-bold">Discover products</Link></section>;
  }

  const freeShippingThreshold = 100;
  const remaining = Math.max(0, freeShippingThreshold - cart.subtotal);
  const progress = Math.min(100, cart.subtotal / freeShippingThreshold * 100);

  return (
    <div>
      {error ? <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-[#172033]">Your selection</h2><span className="text-sm text-slate-500">{cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}</span></div>
          <div className="divide-y divide-slate-100">
            {cart.items.map((item) => (
              <article key={item.productId} className="grid gap-5 p-5 sm:grid-cols-[145px_minmax(0,1fr)_auto]">
                <Link href={`/products/${item.product.slug}`} className="overflow-hidden rounded-md bg-slate-100"><Image src={item.product.imageUrl} alt={item.product.name} width={300} height={360} className="aspect-[4/4.3] h-full w-full object-cover transition hover:scale-105" /></Link>
                <div className="flex flex-col justify-center"><p className="text-xs font-semibold uppercase text-emerald-700">{item.product.categoryName}</p><Link href={`/products/${item.product.slug}`}><h3 className="mt-1 text-xl font-bold text-[#172033] hover:text-[#d65f3f]">{item.product.name}</h3></Link><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.product.description}</p><p className="mt-3 text-sm text-slate-500">${item.product.price.toFixed(2)} each</p></div>
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end"><p className="text-lg font-bold text-[#172033]">${(item.product.price * item.quantity).toFixed(2)}</p><div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50"><button disabled={pending === item.productId || item.quantity <= 1} className="grid size-10 place-items-center text-slate-600 disabled:opacity-30" onClick={() => update(item.productId, item.quantity - 1)} aria-label="Decrease quantity"><Minus size={15} /></button><span className="w-8 text-center text-sm font-bold">{item.quantity}</span><button disabled={pending === item.productId || item.quantity >= 20} className="grid size-10 place-items-center text-slate-600 disabled:opacity-30" onClick={() => update(item.productId, item.quantity + 1)} aria-label="Increase quantity"><Plus size={15} /></button></div><button disabled={pending === item.productId} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-600 disabled:opacity-40" onClick={() => remove(item.productId)}><Trash2 size={14} />Remove</button></div>
              </article>
            ))}
          </div>
        </section>

        <aside className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg shadow-slate-900/5 lg:sticky lg:top-32">
          <div className="bg-[#172033] p-5 text-white"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-md bg-white/10"><Truck size={19} /></span><div><p className="text-sm font-semibold">{remaining > 0 ? `$${remaining.toFixed(2)} away from free shipping` : "You unlocked free shipping"}</p><p className="mt-0.5 text-xs text-slate-400">Available on orders over $100</p></div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-[#ef8354] transition-all" style={{ width: `${progress}%` }} /></div></div>
          <div className="p-6"><h2 className="text-xl font-bold text-[#172033]">Order summary</h2><dl className="mt-6 space-y-4 text-sm"><div className="flex justify-between text-slate-600"><dt>Subtotal</dt><dd className="font-semibold text-slate-900">${cart.subtotal.toFixed(2)}</dd></div><div className="flex justify-between text-slate-600"><dt>Shipping</dt><dd className="font-semibold text-emerald-700">{remaining === 0 ? "Free" : "Calculated next"}</dd></div><div className="flex justify-between text-slate-600"><dt>Taxes</dt><dd>Calculated next</dd></div><div className="flex justify-between border-t border-slate-200 pt-4 text-lg"><dt className="font-bold">Total</dt><dd className="font-bold">${cart.subtotal.toFixed(2)}</dd></div></dl><button type="button" onClick={() => setCheckoutNotice("Your cart is ready. Connect a payment provider before production checkout.")} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#ef8354] px-5 text-sm font-bold text-white transition hover:bg-[#e76f51]"><LockKeyhole size={17} />Continue to checkout</button>{checkoutNotice ? <p role="status" className="mt-3 text-center text-xs leading-5 text-slate-500">{checkoutNotice}</p> : null}<div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400"><PackageCheck size={15} />Secure checkout and protected data</div></div>
        </aside>
      </div>
      <Link href="/products" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft size={16} />Continue shopping</Link>
    </div>
  );
}

function ErrorState({ error, retry }: { error: string; retry: () => void }) {
  return <section className="rounded-md border border-red-200 bg-red-50 p-8 text-center"><p role="alert" className="text-sm text-red-700">{error}</p><button type="button" onClick={retry} className="mt-4 rounded-md bg-[#172033] px-4 py-2 text-sm font-semibold text-white">Try again</button></section>;
}
