import { describe, expect, it } from "vitest";
import { buildStoreInsights } from "@/lib/services/store-insights";
import { store } from "@/lib/db/mock";

describe("store insights", () => {
  it("identifies stock risks and the product receiving the most customer interest", () => {
    const product = store.products[0];
    if (!product) throw new Error("The catalog must include a product");
    const products = store.products.map((item) => item.id === product.id ? { ...item, stock: 3 } : item);
    const insights = buildStoreInsights(products, store.categories, [{
      userId: "customer-one",
      cart: [{ userId: "customer-one", productId: product.id, product, quantity: 2, addedAt: "2026-01-01T00:00:00.000Z" }],
      wishlist: [{ userId: "customer-one", productId: product.id, product, addedAt: "2026-01-01T00:00:00.000Z" }]
    }]);

    expect(insights.find((item) => item.id === "inventory")?.title).toContain("low-stock");
    expect(insights.find((item) => item.id === "demand")?.title).toContain(product.name);
    expect(insights.find((item) => item.id === "catalog")).toBeDefined();
  });
});
