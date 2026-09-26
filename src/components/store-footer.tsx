"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Instagram, Store } from "lucide-react";

export function StoreFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return (
    <footer className="bg-[#111827] text-white">
      <div className="mx-auto grid max-w-[1500px] gap-12 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_.7fr_.7fr_1.3fr] lg:px-8">
        <div><Link href="/" className="inline-flex items-center gap-3 text-xl font-bold"><span className="grid size-10 place-items-center rounded-md bg-[#ef8354]"><Store size={20} /></span>CommerceCraft</Link><p className="mt-5 max-w-sm text-sm leading-7 text-slate-400">Well-designed essentials for thoughtful homes, focused work and everyday movement.</p></div>
        <div><h2 className="text-sm font-semibold">Shop</h2><div className="mt-5 space-y-3 text-sm text-slate-400"><Link className="block hover:text-white" href="/products">All products</Link><Link className="block hover:text-white" href="/categories/home-living">Home & Living</Link><Link className="block hover:text-white" href="/categories/smart-tech">Smart Tech</Link><Link className="block hover:text-white" href="/categories/daily-style">Daily Style</Link></div></div>
        <div><h2 className="text-sm font-semibold">Help</h2><div className="mt-5 space-y-3 text-sm text-slate-400"><Link className="block hover:text-white" href="/cart">Your cart</Link><Link className="block hover:text-white" href="/wishlist">Wishlist</Link><Link className="block hover:text-white" href="/profile">Account</Link></div></div>
        <div><h2 className="text-sm font-semibold">Stay in the loop</h2><p className="mt-4 text-sm leading-6 text-slate-400">New collections, useful objects and limited releases.</p><div className="mt-5 flex border-b border-white/25 pb-2"><input type="email" aria-label="Email address" placeholder="Email address" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500" /><button type="button" className="grid size-9 place-items-center rounded-md bg-white text-slate-950" aria-label="Subscribe"><ArrowRight size={17} /></button></div></div>
      </div>
      <div className="border-t border-white/10"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-5 text-xs text-slate-500 sm:px-6 lg:px-8"><p>© 2026 CommerceCraft</p><Instagram size={17} /></div></div>
    </footer>
  );
}
