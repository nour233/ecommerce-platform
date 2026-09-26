"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowDownUp, Check, LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";
import clsx from "clsx";
import type { Category } from "@/types";

type Filters = { q: string; category: string; min: string; max: string; sort: string };
type SearchSuggestion = { id: string; name: string; categoryName: string; tags: string[] };
type FilterBarProps = { categories: Category[]; defaults: Partial<Filters>; resultCount: number; suggestions: SearchSuggestion[] };
const empty: Filters = { q: "", category: "all", min: "", max: "", sort: "featured" };
const RECENT_SEARCHES_KEY = "commercecraft-recent-searches";
const MAX_RECENT_SEARCHES = 5;

export function FilterBar({ categories, defaults, resultCount, suggestions }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<Filters>({ ...empty, ...defaults });
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [typing, setTyping] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const invalidPrice = filters.min !== "" && filters.max !== "" && Number(filters.min) > Number(filters.max);
  const active = filters.q !== "" || filters.category !== "all" || filters.min !== "" || filters.max !== "" || filters.sort !== "featured";
  const normalizedQuery = filters.q.trim().toLowerCase();
  const matchingSuggestions = useMemo(() => {
    if (normalizedQuery.length < 2) return [];
    return suggestions.filter((product) => [product.name, product.categoryName, ...product.tags].some((value) => value.toLowerCase().includes(normalizedQuery))).slice(0, 5);
  }, [normalizedQuery, suggestions]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]");
      if (Array.isArray(saved)) setRecentSearches(saved.filter((item): item is string => typeof item === "string").slice(0, MAX_RECENT_SEARCHES));
    } catch { window.localStorage.removeItem(RECENT_SEARCHES_KEY); }
    function restore() {
      if (timer.current) clearTimeout(timer.current);
      const params = new URLSearchParams(window.location.search);
      setFilters(Object.fromEntries(Object.entries(empty).map(([key, value]) => [key, params.get(key) ?? value])) as Filters);
      setTyping(false);
    }
    window.addEventListener("popstate", restore);
    return () => { if (timer.current) clearTimeout(timer.current); window.removeEventListener("popstate", restore); };
  }, []);

  function rememberSearch(query: string) {
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) return;
    setRecentSearches((current) => {
      const next = [cleanQuery, ...current.filter((item) => item.toLowerCase() !== cleanQuery.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  }

  function update(next: Filters, delay = 0) {
    setFilters(next);
    if (timer.current) clearTimeout(timer.current);
    if (next.min !== "" && next.max !== "" && Number(next.min) > Number(next.max)) { setTyping(false); return; }
    setTyping(delay > 0);
    const navigate = () => {
      setTyping(false);
      const params = new URLSearchParams();
      Object.entries(next).forEach(([key, value]) => { if (value && value !== empty[key as keyof Filters]) params.set(key, value); });
      startTransition(() => router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false }));
    };
    if (delay) timer.current = setTimeout(navigate, delay); else navigate();
  }

  function chooseSearch(query: string) { rememberSearch(query); setSearchFocused(false); update({ ...filters, q: query }); }

  return (
    <section aria-label="Product filters" className="rounded-2xl border border-slate-200/80 bg-white/95 p-2.5 shadow-[0_16px_38px_rgba(15,23,42,0.10)] backdrop-blur sm:p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1"><Search size={19} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700" /><input aria-label="Search products" type="search" value={filters.q} onFocus={() => setSearchFocused(true)} onBlur={() => { rememberSearch(filters.q); window.setTimeout(() => setSearchFocused(false), 150); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); chooseSearch(filters.q); } }} onChange={(event) => update({ ...filters, q: event.target.value }, 350)} placeholder="Search the collection" className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/10" />
          {searchFocused && (matchingSuggestions.length > 0 || (normalizedQuery.length < 2 && recentSearches.length > 0)) ? <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-md border border-slate-200 bg-white p-2 shadow-xl" role="listbox" aria-label="Search suggestions"><p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{matchingSuggestions.length > 0 ? "Suggestions" : "Recent searches"}</p>{(matchingSuggestions.length > 0 ? matchingSuggestions.map((product) => ({ label: product.name, detail: product.categoryName })) : recentSearches.map((query) => ({ label: query, detail: "Recent search" }))).map((item) => <button key={item.label} type="button" role="option" aria-selected={false} onMouseDown={(event) => event.preventDefault()} onClick={() => chooseSearch(item.label)} className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left transition hover:bg-emerald-50"><span className="truncate text-sm font-semibold text-slate-800">{item.label}</span><span className="ml-3 shrink-0 text-xs text-slate-500">{item.detail}</span></button>)}</div> : null}
        </div>
        <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm"><span className="mr-2 font-semibold text-slate-700">Price</span>{(["min", "max"] as const).map((bound, index) => <label key={bound} className="flex items-center">{index === 1 ? <span className="mx-2 text-slate-300">—</span> : null}<span className="text-slate-400">$</span><span className="sr-only">{bound === "min" ? "Minimum price" : "Maximum price"}</span><input type="number" min="0" step="0.01" aria-invalid={invalidPrice} value={filters[bound]} onChange={(event) => { if (Number(event.target.value) >= 0) update({ ...filters, [bound]: event.target.value }, 450); }} placeholder={bound === "min" ? "Min" : "Max"} className="h-10 w-14 bg-transparent px-1 text-sm outline-none sm:w-16" /></label>)}</div>
        <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 lg:min-w-52"><ArrowDownUp size={16} aria-hidden="true" className="text-emerald-700" /><span className="sr-only">Sort products</span><select value={filters.sort} onChange={(event) => update({ ...filters, sort: event.target.value })} className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"><option value="featured">Fresh arrivals</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="rating">Top rated</option></select></label>
        <p role="status" className="flex h-11 min-w-28 items-center justify-center gap-2 rounded-xl bg-[#172033] px-4 text-sm font-semibold text-white shadow-sm"><LoaderCircle size={15} className={clsx("motion-safe:animate-spin", !(pending || typing) && "hidden")} /><span className={pending || typing ? "inline" : "hidden"}>Loading</span><span className={pending || typing ? "hidden" : "inline"}><span translate="no">{resultCount}</span> <span>items</span></span></p>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5"><span className="mr-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400"><SlidersHorizontal size={13} /> Collections</span>{[{ id: "all", name: "All" }, ...categories].map((category) => <button key={category.id} type="button" aria-pressed={filters.category === category.id} onClick={() => update({ ...filters, category: category.id })} className={clsx("inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition", filters.category === category.id ? "border-emerald-700 bg-emerald-700 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-800")}><Check size={13} aria-hidden="true" className={filters.category === category.id ? "block" : "hidden"} />{category.name}</button>)}<button type="button" aria-pressed={filters.min === "" && filters.max === "50"} onClick={() => update({ ...filters, min: "", max: "50" })} className={clsx("min-h-8 rounded-full border px-3 text-xs font-semibold transition", filters.min === "" && filters.max === "50" ? "border-[#e76f51] bg-[#e76f51] text-white shadow-sm" : "border-[#e76f51]/25 bg-[#fff3ed] text-[#b84f34] hover:border-[#e76f51]")}>Under $50</button><button type="button" onClick={() => { setSearchFocused(false); update(empty); }} className={clsx("ml-auto min-h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900", active ? "inline-flex" : "hidden")}><X size={14} /><span>Clear filters</span></button></div>
      {invalidPrice ? <p role="alert" className="mt-2 text-sm text-red-700">Maximum price must be greater than minimum price.</p> : null}
    </section>
  );
}
