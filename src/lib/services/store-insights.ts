import type { Category, Product, StoreInsight, UserCommerceData } from "@/types";

type ProductInterest = { cartQuantity: number; wishlistCount: number };

export function buildStoreInsights(
  products: Product[],
  categories: Category[],
  customerData: UserCommerceData[]
): StoreInsight[] {
  const unavailable = products.filter((product) => product.stock === 0);
  const lowStock = products.filter((product) => product.stock > 0 && product.stock < 10);
  const productInterest = new Map<string, ProductInterest>();

  for (const customer of customerData) {
    for (const item of customer.cart) {
      const current = productInterest.get(item.productId) ?? { cartQuantity: 0, wishlistCount: 0 };
      current.cartQuantity += item.quantity;
      productInterest.set(item.productId, current);
    }
    for (const item of customer.wishlist) {
      const current = productInterest.get(item.productId) ?? { cartQuantity: 0, wishlistCount: 0 };
      current.wishlistCount += 1;
      productInterest.set(item.productId, current);
    }
  }

  const mostRequested = [...productInterest.entries()]
    .map(([productId, interest]) => ({ product: products.find((product) => product.id === productId), ...interest }))
    .filter((item): item is { product: Product; cartQuantity: number; wishlistCount: number } => Boolean(item.product))
    .sort((first, second) => (second.cartQuantity + second.wishlistCount) - (first.cartQuantity + first.wishlistCount))[0];
  const productsPerCategory = new Map(categories.map((category) => [category.id, 0]));
  for (const product of products) productsPerCategory.set(product.categoryId, (productsPerCategory.get(product.categoryId) ?? 0) + 1);
  const lightestCategory = categories
    .map((category) => ({ category, count: productsPerCategory.get(category.id) ?? 0 }))
    .sort((first, second) => first.count - second.count)[0];

  const inventoryInsight: StoreInsight = unavailable.length
    ? { id: "inventory", title: `${unavailable.length} product${unavailable.length === 1 ? " is" : "s are"} out of stock`, description: `Restock ${unavailable.slice(0, 2).map((product) => product.name).join(" and ")} to keep the catalog available.`, tone: "orange" }
    : lowStock.length
      ? { id: "inventory", title: `${lowStock.length} low-stock product${lowStock.length === 1 ? " needs" : "s need"} attention`, description: `${lowStock.slice(0, 2).map((product) => product.name).join(" and ")} should be reviewed before the next customer order.`, tone: "orange" }
      : { id: "inventory", title: "Inventory is in a healthy range", description: "Every active product has at least ten units available for customers.", tone: "emerald" };

  const demandInsight: StoreInsight = mostRequested
    ? { id: "demand", title: `${mostRequested.product.name} has the strongest customer interest`, description: `${mostRequested.wishlistCount} wishlist save${mostRequested.wishlistCount === 1 ? "" : "s"} and ${mostRequested.cartQuantity} cart item${mostRequested.cartQuantity === 1 ? "" : "s"} point to demand. Keep it featured.`, tone: "rose" }
    : { id: "demand", title: "Customer interest is ready to be measured", description: "Cart and wishlist activity will reveal the products customers value most.", tone: "sky" };

  const catalogInsight: StoreInsight = lightestCategory
    ? { id: "catalog", title: `${lightestCategory.category.name} has the smallest collection`, description: `It currently contains ${lightestCategory.count} product${lightestCategory.count === 1 ? "" : "s"}. Adding complementary items can make the storefront feel more balanced.`, tone: "sky" }
    : { id: "catalog", title: "Create the first storefront collection", description: "Categories help customers navigate the catalog and discover related products.", tone: "sky" };

  return [inventoryInsight, demandInsight, catalogInsight];
}
