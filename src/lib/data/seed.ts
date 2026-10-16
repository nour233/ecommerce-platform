import catalog from "@/lib/data/catalog.json";
import type { Category, Product, User } from "@/types";

export const demoUser: User = {
  id: "demo-user",
  name: "CommerceCraft Demo",
  email: "demo@commercecraft.test",
  role: "customer",
  createdAt: "2026-09-24T00:00:00.000Z"
};

// Public demo credentials for the temporary mock database only.
// The production DynamoDB flow stores a unique password hash per customer.
export const demoUserCredentials = {
  passwordSalt: "6efffa66bbde1bcb5a7d30cde0d7b2bf",
  passwordHash:
    "b6272cca679a0991cf40122c58573819eab418f8a3dd67fd70105e540fe4d423facf1ed01825e26b26d602a247c1c7139573d423502856daf3dd8628c2296711"
};

export const categories: Category[] = catalog.categories;
export const products: Product[] = catalog.products;
