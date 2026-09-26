import { beforeEach, describe, expect, it } from "vitest";
import { cartService } from "@/lib/services/cart-service";
import { wishlistService } from "@/lib/services/wishlist-service";
import { store } from "@/lib/db/mock";

const firstUser = "test-user-one";
const secondUser = "test-user-two";
const product = store.products.find((item) => item.stock >= 3);

if (!product) throw new Error("The catalog must contain a product with at least three units in stock");

beforeEach(() => {
  store.cart = [];
  store.wishlist = [];
});

describe("cart service", () => {
  it("keeps carts separate, combines quantities, and calculates the subtotal", async () => {
    await cartService.addItem(firstUser, product.id, 1);
    const firstCart = await cartService.addItem(firstUser, product.id, 2);
    const secondCart = await cartService.getCart(secondUser);

    expect(firstCart.itemCount).toBe(3);
    expect(firstCart.items).toHaveLength(1);
    expect(firstCart.items[0]?.quantity).toBe(3);
    expect(firstCart.subtotal).toBe(product.price * 3);
    expect(secondCart).toMatchObject({ itemCount: 0, subtotal: 0, items: [] });
  });

  it("rejects a quantity that exceeds available stock", async () => {
    await expect(
      cartService.addItem(firstUser, product.id, product.stock + 1)
    ).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });
  });
});

describe("wishlist service", () => {
  it("prevents duplicates and keeps each user's wishlist private", async () => {
    await wishlistService.addItem(firstUser, product.id);
    const firstWishlist = await wishlistService.addItem(firstUser, product.id);
    const secondWishlist = await wishlistService.getWishlist(secondUser);

    expect(firstWishlist).toHaveLength(1);
    expect(firstWishlist[0]?.productId).toBe(product.id);
    expect(secondWishlist).toEqual([]);
  });

  it("removes a saved product", async () => {
    await wishlistService.addItem(firstUser, product.id);
    await expect(wishlistService.removeItem(firstUser, product.id)).resolves.toEqual([]);
  });
});
