import { catalogRepository } from "@/lib/repositories/catalog";
import { userDataRepository } from "@/lib/repositories/user-data";
import type { WishlistItem } from "@/types";

export const wishlistService = {
  async getWishlist(userId: string): Promise<WishlistItem[]> {
    const rawItems = await userDataRepository.listWishlist(userId);
    const items = await Promise.all(
      rawItems.map(async (item) => {
        const product = item.product ?? (await catalogRepository.getProductById(item.productId));
        if (!product) return null;
        return { ...item, product };
      })
    );
    return items.filter((item): item is WishlistItem => Boolean(item));
  },

  async addItem(userId: string, productId: string) {
    await catalogRepository.assertProduct(productId);
    await userDataRepository.addWishlistItem(userId, productId);
    return this.getWishlist(userId);
  },

  async removeItem(userId: string, productId: string) {
    await userDataRepository.removeWishlistItem(userId, productId);
    return this.getWishlist(userId);
  }
};
