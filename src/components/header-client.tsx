"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Heart, Menu, Search, ShoppingBag, Store, UserRound, X } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { CartCount } from "@/components/cart-provider";
import { WishlistCount } from "@/components/wishlist-provider";
import type { Category, User } from "@/types";

export function HeaderClient({ user, categories }: { user: User | null; categories: Category[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur-xl">
      <div className="bg-[#172033] px-4 py-2 text-center text-[11px] font-semibold uppercase text-white sm:text-xs">
        Free shipping over $100 <span className="mx-2 text-[#ef8354]">•</span> Easy returns within 30 days
      </div>
      <div className="mx-auto flex h-[76px] max-w-[1500px] items-center gap-2 px-3 sm:gap-6 sm:px-6 lg:px-8">
        <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} className="grid size-10 place-items-center lg:hidden" aria-label="Open menu"><Menu size={21} /></button>
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-xl font-bold tracking-normal">
          <span className="grid size-10 place-items-center rounded-md bg-[#172033] text-white"><Store size={20} aria-hidden="true" /></span>
          <span className="hidden sm:inline">Commerce<span className="text-[#e76f51]">Craft</span></span>
        </Link>
        <nav className="ml-8 hidden items-center gap-7 lg:flex" aria-label="Store navigation">
          <Link href="/" className={`text-sm font-semibold transition hover:text-[#e76f51] ${pathname === "/" ? "text-[#e76f51]" : "text-slate-700"}`}>Home</Link>
          <Link href="/products" className={`text-sm font-semibold transition hover:text-[#e76f51] ${pathname.startsWith("/products") ? "text-[#e76f51]" : "text-slate-700"}`}>Shop all</Link>
          <details className="group relative">
            <summary className={`flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold transition hover:text-[#e76f51] ${pathname.startsWith("/categories/") ? "text-[#e76f51]" : "text-slate-700"}`}>Collections <ChevronDown size={15} className="transition group-open:rotate-180" /></summary>
            <div className="absolute left-0 top-full z-50 mt-4 w-72 overflow-hidden rounded-md border border-slate-200 bg-white p-2 shadow-2xl">
              <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase text-slate-400">Shop by collection</p>
              <div className="max-h-80 overflow-y-auto">
                {categories.map((category) => <Link key={category.id} href={`/categories/${category.slug}`} className="block rounded-md px-3 py-3 transition hover:bg-slate-50"><span className="block text-sm font-semibold text-slate-900">{category.name}</span><span className="mt-0.5 line-clamp-1 block text-xs text-slate-500">{category.description}</span></Link>)}
              </div>
            </div>
          </details>
        </nav>
        <nav className="ml-auto flex items-center gap-1 sm:gap-2" aria-label="Account navigation">
          <button type="button" onClick={() => setSearchOpen((open) => !open)} aria-expanded={searchOpen} className="hidden size-10 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:grid" aria-label="Search products" title="Search products">{searchOpen ? <X size={19} /> : <Search size={19} />}</button>
          <Link href="/wishlist" className="relative grid size-10 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" aria-label="Wishlist" title="Wishlist"><Heart size={19} /><span className="absolute -right-0.5 -top-0.5"><WishlistCount /></span></Link>
          <Link href="/cart" className="relative grid size-10 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" aria-label="Cart" title="Cart"><ShoppingBag size={19} /><span className="absolute -right-0.5 -top-0.5"><CartCount /></span></Link>
          {user ? <div className="ml-2 flex items-center border-l border-slate-200 pl-2"><span className="hidden max-w-28 truncate px-2 text-sm font-semibold xl:inline" title={user.name}>{user.name}</span><LogoutButton /></div> : <Link href="/login" className="ml-2 inline-flex min-h-10 items-center gap-2 rounded-md bg-[#172033] px-4 text-sm font-semibold text-white transition hover:bg-[#25324a]"><UserRound size={17} /><span className="hidden sm:inline">Log in</span></Link>}
        </nav>
      </div>
      {searchOpen ? <div className="absolute left-0 right-0 top-full border-y border-slate-200 bg-white shadow-2xl"><form onSubmit={(event) => { event.preventDefault(); const query = searchQuery.trim(); setSearchOpen(false); router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products"); }} className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-5"><Search size={22} className="shrink-0 text-emerald-700" /><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} type="search" placeholder="What are you looking for?" aria-label="Search the catalog" className="h-12 min-w-0 flex-1 border-0 bg-transparent text-lg outline-none placeholder:text-slate-400" /><button className="min-h-11 rounded-md bg-[#172033] px-5 text-sm font-semibold text-white">Search</button></form></div> : null}
      {menuOpen ? <nav className="grid max-h-[calc(100vh-108px)] overflow-y-auto border-t border-slate-200 bg-white px-4 py-3 shadow-lg lg:hidden" aria-label="Mobile store navigation"><Link onClick={() => setMenuOpen(false)} href="/" className="rounded-md px-3 py-3 text-sm font-semibold hover:bg-slate-50">Home</Link><Link onClick={() => setMenuOpen(false)} href="/products" className="rounded-md px-3 py-3 text-sm font-semibold hover:bg-slate-50">Shop all</Link><p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase text-slate-400">Collections</p>{categories.map((category) => <Link key={category.id} onClick={() => setMenuOpen(false)} href={`/categories/${category.slug}`} className="rounded-md px-3 py-3 text-sm font-semibold hover:bg-slate-50">{category.name}</Link>)}</nav> : null}
    </header>
  );
}
