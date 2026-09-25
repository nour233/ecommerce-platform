"use client";

import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import clsx from "clsx";
import { usePathname, useRouter } from "next/navigation";
import { useWishlist } from "@/components/wishlist-provider";
import { useCart } from "@/components/cart-provider";

type ProductActionsProps = {
  productId: string;
  compact?: boolean;
};

export function ProductActions({ productId, compact = false }: ProductActionsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState<"cart" | "wishlist" | null>(null);
  const [message, setMessage] = useState("");
  const { items, setItems } = useWishlist();
  const { setCart } = useCart();
  const saved = items.some((item) => item.productId === productId);

  async function addToCart() {
    setLoading("cart");
    setMessage("");
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 })
      });
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      const payload = await response.json();
      setMessage(response.ok ? "Added to cart" : payload.error ?? "Could not add item");
      if (response.ok) setCart(payload.data);
    } catch {
      setMessage("Could not reach the server");
    } finally {
      setLoading(null);
    }
  }

  async function addToWishlist() {
    setLoading("wishlist");
    setMessage("");
    try {
      const response = await fetch(saved ? `/api/wishlist/${encodeURIComponent(productId)}` : "/api/wishlist", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: saved ? undefined : JSON.stringify({ productId })
      });
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      const payload = await response.json();
      if (response.ok) setItems(payload.data);
      setMessage(response.ok ? (saved ? "Removed from wishlist" : "Saved to your wishlist") : payload.error ?? "Could not save");
    } catch {
      setMessage("Could not reach the server");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className={clsx("flex items-center gap-2", compact ? "justify-end" : "flex-wrap")}>
      <button
        type="button"
        onClick={addToCart}
        disabled={loading === "cart"}
        className={clsx(
          "focus-ring inline-flex h-10 items-center justify-center rounded-md bg-ink px-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-wait disabled:opacity-60",
          compact ? "w-10 px-0" : "gap-2"
        )}
        aria-label="Add to cart"
        title="Add to cart"
      >
        <ShoppingCart size={17} aria-hidden="true" />
        {!compact ? <span>{loading === "cart" ? "Adding" : "Add to cart"}</span> : null}
      </button>
      <button
        type="button"
        onClick={addToWishlist}
        disabled={loading === "wishlist"}
        className={clsx("focus-ring grid size-10 place-items-center rounded-full border transition-all duration-200 motion-safe:hover:scale-110 motion-safe:active:scale-90 disabled:cursor-wait disabled:opacity-60", saved ? "border-rose-200 bg-rose-50 text-rose-600 shadow-sm shadow-rose-200" : "border-ink/15 bg-white text-ink hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600")}
        aria-pressed={saved}
        aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        title={saved ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart size={18} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
      </button>
      {!compact && message ? <p className="min-w-full text-sm text-moss">{message}</p> : null}
    </div>
  );
}
