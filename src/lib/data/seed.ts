import catalog from "@/lib/data/catalog.json";
import type { Category, Product, User } from "@/types";

export const demoUser: User = {
  id: "demo-user",
  name: "Selim Demo",
  email: "selim@example.com",
  role: "customer",
  createdAt: "2026-09-24T00:00:00.000Z"
};

export const categories: Category[] = catalog.categories;
export const products: Product[] = catalog.products;
