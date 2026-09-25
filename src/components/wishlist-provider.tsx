"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { WishlistItem } from "@/types";

const WishlistContext = createContext<{
  items: WishlistItem[];
  setItems: (items: WishlistItem[]) => void;
} | null>(null);

export function WishlistProvider({ initialItems, children }: { initialItems: WishlistItem[]; children: ReactNode }) {
  const [items, setItems] = useState(initialItems);
  return <WishlistContext.Provider value={{ items, setItems }}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("WishlistProvider is required");
  return context;
}

export function WishlistCount() {
  const { items } = useWishlist();
  return (
    <span aria-live="polite" aria-atomic="true" className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-bold tabular-nums text-white">
      <span className="sr-only">Saved products: </span><span translate="no">{items.length}</span>
    </span>
  );
}
