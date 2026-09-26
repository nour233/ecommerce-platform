"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Heart,
  Gem,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
  X
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { CartCount } from "@/components/cart-provider";
import { WishlistCount } from "@/components/wishlist-provider";
import type { Category, Product, User } from "@/types";

type HeaderClientProps = {
  user: User | null;
  categories: Category[];
  products: Product[];
};

export function HeaderClient({ user, categories, products }: HeaderClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchSuggestions = useMemo(() => {
    if (normalizedQuery.length < 2) return [];
    return products.filter((product) => [product.name, product.categoryName, ...product.tags].some((value) => value.toLowerCase().includes(normalizedQuery))).slice(0, 5);
  }, [normalizedQuery, products]);
  const accountInitials = user?.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() ?? "";

  if (pathname.startsWith("/admin")) return null;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    const query = searchQuery.trim();
    if (query) params.set("q", query);
    setMenuOpen(false);
    setSearchFocused(false);
    router.push(`/products${params.size ? `?${params}` : ""}`);
  }

  const searchForm = (compact = false) => (
    <div className="relative min-w-0 flex-1">
      <form onSubmit={submitSearch} role="search" className={`flex min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] ring-2 ring-transparent transition focus-within:border-[#ffad87] focus-within:ring-[#ef8354]/35 ${compact ? "h-11" : "h-12"}`}>
        <Search size={compact ? 18 : 20} className="ml-4 shrink-0 self-center text-[#d75e36]" strokeWidth={2.3} aria-hidden="true" />
        <label className="sr-only" htmlFor={compact ? "mobile-store-search" : "desktop-store-search"}>Search products</label>
        <input id={compact ? "mobile-store-search" : "desktop-store-search"} value={searchQuery} onFocus={() => setSearchFocused(true)} onBlur={() => window.setTimeout(() => setSearchFocused(false), 160)} onChange={(event) => setSearchQuery(event.target.value)} type="search" placeholder="Search the store" className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm font-medium text-[#172033] outline-none placeholder:font-normal placeholder:text-slate-400 sm:px-4" />
        <button type="submit" className="m-1 grid w-10 shrink-0 place-items-center rounded-lg bg-[#ef8354] text-[#172033] transition hover:bg-[#ffad87] hover:shadow-md sm:w-11" aria-label="Search catalog" title="Search catalog"><ArrowUpRight size={19} strokeWidth={2.5} aria-hidden="true" /></button>
      </form>
      {searchFocused && normalizedQuery.length >= 2 ? <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.24)]">
        <div className="flex items-center justify-between px-3 pb-2 pt-1"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Suggested for you</span><span className="text-[11px] font-medium text-slate-400">{searchSuggestions.length} found</span></div>
        {searchSuggestions.length ? searchSuggestions.map((product) => <Link key={product.id} onMouseDown={(event) => event.preventDefault()} onClick={() => setSearchFocused(false)} href={`/products/${product.slug}`} className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-[#fff2ec]">
          <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-[#172033]"><Image src={product.imageUrl} alt="" fill sizes="44px" className="object-cover transition duration-300 group-hover:scale-110" /><span className="absolute inset-0 ring-1 ring-inset ring-black/10" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-[#172033]">{product.name}</span><span className="block truncate text-xs text-slate-500">{product.categoryName} · ${product.price.toFixed(2)}</span></span><ArrowUpRight size={16} className="text-slate-300 transition group-hover:text-[#d75e36]" />
        </Link>) : <div className="px-3 py-5 text-center"><p className="text-sm font-bold text-[#172033]">No product found</p><p className="mt-1 text-xs text-slate-500">Try a material, collection or product name.</p></div>}
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setSearchFocused(false); router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`); }} className="mt-1 flex w-full items-center justify-between rounded-lg border-t border-slate-100 px-3 py-2.5 text-left text-xs font-bold text-[#d75e36] hover:bg-slate-50">View all results for “{searchQuery.trim()}” <ArrowUpRight size={15} /></button>
      </div> : null}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 shadow-[0_3px_18px_rgba(15,23,42,0.18)]">
      <div className="bg-[#ef8354] px-4 py-1.5 text-center text-[10px] font-bold uppercase text-[#172033] sm:text-[11px]">
        Free shipping over $100
        <span className="mx-2 text-white/80">•</span>
        Easy returns within 30 days
        <span className="mx-2 hidden text-white/80 sm:inline">•</span>
        <span className="hidden sm:inline">Secure checkout</span>
      </div>

      <div className="bg-[#172033] text-white">
        <div className="mx-auto flex min-h-[72px] max-w-[1600px] items-center gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} className="grid size-10 shrink-0 place-items-center rounded-md transition hover:bg-white/10 lg:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="CommerceCraft home">
            <span className="grid size-11 place-items-center rounded-md bg-white text-[#172033]"><Store size={22} aria-hidden="true" /></span>
            <span className="hidden text-xl font-bold md:inline">Commerce<span className="text-[#ff8a5b]">Craft</span></span>
          </Link>

          <div className="hidden shrink-0 items-center gap-2 border-l border-white/15 pl-4 xl:flex">
            <Gem size={18} className="text-[#ff9d72]" aria-hidden="true" />
            <div className="leading-tight"><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">The weekly edit</span><span className="block text-xs font-bold">Fresh arrivals</span></div>
          </div>

          <div className="hidden min-w-0 flex-1 px-2 lg:flex">{searchForm()}</div>

          <nav className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2" aria-label="Account navigation">
            <Link href="/wishlist" className="relative flex min-h-11 items-center gap-2 rounded-md px-2 text-white transition hover:bg-white/10 sm:px-3" aria-label="Saved products">
              <span className="relative"><Heart size={21} aria-hidden="true" /><span className="absolute -right-2.5 -top-2.5"><WishlistCount /></span></span>
              <span className="hidden text-xs font-bold 2xl:inline">Saved</span>
            </Link>

            <Link href="/cart" className="relative flex min-h-11 items-center gap-2 rounded-md px-2 text-white transition hover:bg-white/10 sm:px-3" aria-label="Shopping cart">
              <span className="relative"><ShoppingBag size={22} aria-hidden="true" /><span className="absolute -right-2.5 -top-2.5"><CartCount /></span></span>
              <span className="hidden text-xs font-bold 2xl:inline">Cart</span>
            </Link>

            {user ? (
              <div className="ml-1 flex items-center gap-1 border-l border-white/15 pl-2">
                <Link href="/profile" className="flex h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2 transition hover:border-[#ff9d72] hover:bg-white/10 sm:px-2.5" title="Open your account">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#ef8354] text-[10px] font-bold text-[#172033]">{accountInitials}</span>
                  <span className="hidden max-w-24 leading-tight xl:block"><span className="block text-[10px] text-white/55">My account</span><span className="block truncate text-xs font-bold">View profile</span></span>
                </Link>
                <LogoutButton tone="dark" />
              </div>
            ) : (
              <Link href="/login" className="ml-1 flex min-h-11 items-center gap-2 rounded-md border border-white/20 px-2.5 transition hover:border-[#ff9d72] hover:bg-white/10 sm:px-3">
                <UserRound size={19} aria-hidden="true" />
                <span className="hidden leading-tight sm:block"><span className="block text-[10px] text-white/55">Hello, sign in</span><span className="block text-xs font-bold">Your account</span></span>
              </Link>
            )}
          </nav>
        </div>

        <div className="mx-auto flex max-w-[1600px] px-3 pb-3 sm:px-6 lg:hidden">{searchForm(true)}</div>
      </div>

      <nav className="relative border-b border-slate-200 bg-white" aria-label="Store navigation">
        <div className="mx-auto flex h-11 max-w-[1600px] items-center gap-1 overflow-x-auto px-3 [scrollbar-width:none] sm:px-6 lg:overflow-visible lg:px-8">
          <Link href="/" className={`shrink-0 rounded-md px-3 py-2 text-xs font-bold transition hover:bg-slate-100 ${pathname === "/" ? "text-[#d75e36]" : "text-slate-700"}`}>Home</Link>
          <Link href="/products" className={`shrink-0 rounded-md px-3 py-2 text-xs font-bold transition hover:bg-slate-100 ${pathname.startsWith("/products") ? "text-[#d75e36]" : "text-slate-700"}`}>Shop all</Link>
          <div className="relative hidden shrink-0 lg:block">
            <button type="button" onClick={() => setCollectionsOpen((open) => !open)} aria-expanded={collectionsOpen} aria-controls="collections-menu" className={`flex items-center gap-1 rounded-md px-3 py-2 text-xs font-bold transition hover:bg-slate-100 ${pathname.startsWith("/categories/") ? "text-[#d75e36]" : "text-slate-700"}`}>
              Collections <ChevronDown size={14} className={`transition ${collectionsOpen ? "rotate-180" : ""}`} />
            </button>
            {collectionsOpen ? <div id="collections-menu" className="absolute left-0 top-full z-50 mt-3 w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.24)]">
              <div className="bg-[#172033] px-5 py-4 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff9d72]">Shop by collection</p><p className="mt-1 text-base font-bold">Find your next favourite</p></div>
              <div className="p-2.5">{categories.map((category, index) => (
                <Link key={category.id} onClick={() => setCollectionsOpen(false)} href={`/categories/${category.slug}`} className="group flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-[#fff2ec]">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 transition group-hover:bg-[#ef8354] group-hover:text-[#172033]">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900">{category.name}</span><span className="mt-0.5 line-clamp-1 block text-xs text-slate-500">{category.description}</span></span><ArrowUpRight size={16} className="text-slate-300 transition group-hover:text-[#d75e36]" />
                </Link>
              ))}</div>
            </div> : null}
          </div>
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`} className="shrink-0 rounded-md px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#d75e36] lg:hidden">{category.name}</Link>
          ))}
          <Link href="/products?sort=rating" className="shrink-0 rounded-md px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#d75e36]">Top rated</Link>
          <Link href="/products?max=50" className="shrink-0 rounded-md px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-[#d75e36]">Under $50</Link>
          <div className="ml-auto hidden shrink-0 items-center gap-2 pl-6 text-xs font-bold text-moss xl:flex"><Sparkles size={15} className="text-[#e76f51]" aria-hidden="true" />New pieces, thoughtfully chosen</div>
        </div>
      </nav>

      {menuOpen ? (
        <nav className="max-h-[calc(100vh-154px)] overflow-y-auto border-b border-slate-200 bg-white px-4 py-4 shadow-xl lg:hidden" aria-label="Mobile menu">
          <div className="mx-auto grid max-w-xl gap-1">
            {user ? (
              <div className="mb-3 flex items-center gap-3 border-b border-slate-100 px-3 pb-4">
                <span className="grid size-10 place-items-center rounded-md bg-cream text-moss"><UserRound size={19} /></span>
                <div><p className="text-xs text-slate-500">Signed in as</p><p className="font-bold text-ink">{user.name}</p></div>
              </div>
            ) : null}
            {user ? <Link onClick={() => setMenuOpen(false)} href="/profile" className="rounded-md px-3 py-3 text-sm font-semibold hover:bg-slate-50">Profile & security</Link> : null}
            <Link onClick={() => setMenuOpen(false)} href="/" className="rounded-md px-3 py-3 text-sm font-semibold hover:bg-slate-50">Home</Link>
            <Link onClick={() => setMenuOpen(false)} href="/products" className="rounded-md px-3 py-3 text-sm font-semibold hover:bg-slate-50">Shop all products</Link>
            <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase text-slate-400">Collections</p>
            {categories.map((category) => (
              <Link key={category.id} onClick={() => setMenuOpen(false)} href={`/categories/${category.slug}`} className="rounded-md px-3 py-3 text-sm font-semibold hover:bg-slate-50">{category.name}</Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
