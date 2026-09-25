import { env } from "@/lib/env";
import { db } from "@/lib/db/dynamo";
import { keys } from "@/lib/db/keys";
import { store } from "@/lib/db/mock";
import type { CartItem, Product, WishlistItem } from "@/types";

export type PersistedCartItem = Omit<CartItem, "product"> & { product?: Product };
export type PersistedWishlistItem = Omit<WishlistItem, "product"> & { product?: Product };
type CartRecord = PersistedCartItem & { pk: string; sk: string; entityType: "CartItem" };
type WishlistRecord = PersistedWishlistItem & { pk: string; sk: string; entityType: "WishlistItem" };

export const userDataRepository = {
  async listCart(userId: string): Promise<PersistedCartItem[]> {
    if (env.useMockDb) return store.cart.filter((item) => item.userId === userId);
    return db.query<CartRecord>(keys.cartPk(userId), "CART#");
  },

  async upsertCartItem(userId: string, productId: string, quantity: number) {
    if (env.useMockDb) {
      const existing = store.cart.find((item) => item.userId === userId && item.productId === productId);
      const product = store.products.find((candidate) => candidate.id === productId);
      if (!product) return;
      if (existing) {
        existing.quantity = quantity;
        return;
      }
      store.cart.push({ userId, productId, quantity, product, addedAt: new Date().toISOString() });
      return;
    }

    await db.put({
      pk: keys.cartPk(userId),
      sk: keys.cartSk(productId),
      entityType: "CartItem",
      userId,
      productId,
      quantity,
      addedAt: new Date().toISOString()
    });
  },

  async removeCartItem(userId: string, productId: string) {
    if (env.useMockDb) {
      store.cart = store.cart.filter((item) => !(item.userId === userId && item.productId === productId));
      return;
    }
    await db.delete(keys.cartPk(userId), keys.cartSk(productId));
  },

  async listWishlist(userId: string): Promise<PersistedWishlistItem[]> {
    if (env.useMockDb) return store.wishlist.filter((item) => item.userId === userId);
    return db.query<WishlistRecord>(keys.wishlistPk(userId), "WISHLIST#");
  },

  async addWishlistItem(userId: string, productId: string) {
    if (env.useMockDb) {
      const exists = store.wishlist.some((item) => item.userId === userId && item.productId === productId);
      const product = store.products.find((candidate) => candidate.id === productId);
      if (!exists && product) {
        store.wishlist.push({ userId, productId, product, addedAt: new Date().toISOString() });
      }
      return;
    }

    await db.putIfAbsent({
      pk: keys.wishlistPk(userId),
      sk: keys.wishlistSk(productId),
      entityType: "WishlistItem",
      userId,
      productId,
      addedAt: new Date().toISOString()
    });
  },

  async removeWishlistItem(userId: string, productId: string) {
    if (env.useMockDb) {
      store.wishlist = store.wishlist.filter((item) => !(item.userId === userId && item.productId === productId));
      return;
    }
    await db.delete(keys.wishlistPk(userId), keys.wishlistSk(productId));
  }
};
