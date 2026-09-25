"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { CartSummary } from "@/types";

const CartContext = createContext<{
  cart: CartSummary;
  setCart: (cart: CartSummary) => void;
} | null>(null);

export function CartProvider({ initialCart, children }: { initialCart: CartSummary; children: ReactNode }) {
  const [cart, setCart] = useState(initialCart);
  return <CartContext.Provider value={{ cart, setCart }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("CartProvider is required");
  return context;
}

export function CartCount() {
  const { cart } = useCart();
  return (
    <span aria-live="polite" aria-atomic="true" className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-moss px-1.5 text-xs font-bold tabular-nums text-white">
      <span className="sr-only">Cart items: </span>
      <span translate="no">{cart.itemCount}</span>
    </span>
  );
}
