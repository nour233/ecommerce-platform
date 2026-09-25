"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  ChevronDown,
  Heart,
  MapPin,
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
import type { Category, User } from "@/types";

type HeaderClientProps = {
  user: User | null;
  categories: Category[];
};

export function HeaderClient({ user, categories }: HeaderClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");

  if (pathname.startsWith("/admin")) return null;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    const query = searchQuery.trim();
    if (query) params.set("q", query);
    if (searchCategory !== "all") params.set("category", searchCategory);
    setMenuOpen(false);
    router.push(`/products${params.size ? `?${params}` : ""}`);
  }

  const searchForm = (compact = false) => (
    <form
      onSubmit={submitSearch}
      role="search"
      className={`flex min-w-0 flex-1 overflow-hidden rounded-md bg-white ring-2 ring-transparent transition focus-within:ring-[#ef8354] ${compact ? "h-11" : "h-12"}`}
    >
      <label className="sr-only" htmlFor={compact ? "mobile-search-category" : "desktop-search-category"}>
        Search collection
      </label>
      <select
        id={compact ? "mobile-search-category" : "desktop-search-category"}
        value={searchCategory}
        onChange={(event) => setSearchCategory(event.target.value)}
        className="w-[92px] shrink-0 border-r border-slate-200 bg-[#f3f4f6] px-3 text-xs font-semibold text-slate-700 outline-none sm:w-36"
      >
        <option value="all">All collections</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </select>
      <label className="sr-only" htmlFor={compact ? "mobile-store-search" : "desktop-store-search"}>
        Search products
      </label>
      <input
        id={compact ? "mobile-store-search" : "desktop-store-search"}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        type="search"
        placeholder="Search products, materials and collections"
        className="min-w-0 flex-1 border-0 bg-white px-3 text-sm text-ink outline-none placeholder:text-slate-400 sm:px-4"
      />
      <button type="submit" className="grid w-12 shrink-0 place-items-center bg-[#ef8354] text-ink transition hover:bg-[#ff9d72] sm:w-14" aria-label="Search catalog" title="Search catalog">
        <Search size={22} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </form>
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
            <MapPin size={18} className="text-[#ff9d72]" aria-hidden="true" />
            <div className="leading-tight"><span className="block text-[10px] text-white/55">Delivering to</span><span className="block text-xs font-bold">Tunisia</span></div>
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
              <div className="ml-1 flex items-center border-l border-white/15 pl-2">
                <Link href="/profile" className="hidden max-w-32 rounded-md px-2 py-1 leading-tight transition hover:bg-white/10 xl:block" title={`${user.name} profile`}>
                  <span className="block text-[10px] text-white/55">Welcome back</span>
                  <span className="block truncate text-xs font-bold">{user.name.split(" ")[0]}</span>
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

      <nav className="border-b border-slate-200 bg-white" aria-label="Store navigation">
        <div className="mx-auto flex h-11 max-w-[1600px] items-center gap-1 overflow-x-auto px-3 [scrollbar-width:none] sm:px-6 lg:px-8">
          <Link href="/" className={`shrink-0 rounded-md px-3 py-2 text-xs font-bold transition hover:bg-slate-100 ${pathname === "/" ? "text-[#d75e36]" : "text-slate-700"}`}>Home</Link>
          <Link href="/products" className={`shrink-0 rounded-md px-3 py-2 text-xs font-bold transition hover:bg-slate-100 ${pathname.startsWith("/products") ? "text-[#d75e36]" : "text-slate-700"}`}>Shop all</Link>
          <details className="group relative hidden shrink-0 lg:block">
            <summary className={`flex cursor-pointer list-none items-center gap-1 rounded-md px-3 py-2 text-xs font-bold transition hover:bg-slate-100 ${pathname.startsWith("/categories/") ? "text-[#d75e36]" : "text-slate-700"}`}>
              Collections <ChevronDown size={14} className="transition group-open:rotate-180" />
            </summary>
            <div className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-md border border-slate-200 bg-white p-2 shadow-2xl">
              <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase text-slate-400">Shop by collection</p>
              {categories.map((category) => (
                <Link key={category.id} href={`/categories/${category.slug}`} className="block rounded-md px-3 py-3 transition hover:bg-slate-50">
                  <span className="block text-sm font-semibold text-slate-900">{category.name}</span>
                  <span className="mt-0.5 line-clamp-1 block text-xs text-slate-500">{category.description}</span>
                </Link>
              ))}
            </div>
          </details>
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
