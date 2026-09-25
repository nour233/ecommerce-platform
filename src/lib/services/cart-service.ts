import { AppError } from "@/lib/errors";
import { catalogRepository } from "@/lib/repositories/catalog";
import { userDataRepository } from "@/lib/repositories/user-data";
import type { CartSummary } from "@/types";

export const cartService = {
  async getCart(userId: string): Promise<CartSummary> {
    const rawItems = await userDataRepository.listCart(userId);
    const items = await Promise.all(
      rawItems.map(async (item) => {
        const product = item.product ?? (await catalogRepository.getProductById(item.productId));
        if (!product) return null;
        return { ...item, product };
      })
    );

    const validItems = items.filter((item): item is NonNullable<typeof item> => Boolean(item));
    return {
      items: validItems,
      subtotal: validItems.reduce((total, item) => total + item.product.price * item.quantity, 0),
      itemCount: validItems.reduce((total, item) => total + item.quantity, 0)
    };
  },

  async addItem(userId: string, productId: string, quantity: number) {
    const product = await catalogRepository.assertProduct(productId);
    if (quantity > product.stock) {
      throw new AppError("Requested quantity is higher than available stock", 409, "INSUFFICIENT_STOCK");
    }

    const cart = await this.getCart(userId);
    const existing = cart.items.find((item) => item.productId === productId);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    if (nextQuantity > product.stock) {
      throw new AppError("Requested quantity is higher than available stock", 409, "INSUFFICIENT_STOCK");
    }
    await userDataRepository.upsertCartItem(userId, productId, nextQuantity);
    return this.getCart(userId);
  },

  async updateQuantity(userId: string, productId: string, quantity: number) {
    const product = await catalogRepository.assertProduct(productId);
    if (quantity > product.stock) {
      throw new AppError("Requested quantity is higher than available stock", 409, "INSUFFICIENT_STOCK");
    }
    await userDataRepository.upsertCartItem(userId, productId, quantity);
    return this.getCart(userId);
  },

  async removeItem(userId: string, productId: string) {
    await userDataRepository.removeCartItem(userId, productId);
    return this.getCart(userId);
  }
};
