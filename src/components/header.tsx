import { getCurrentUser } from "@/lib/current-user";
import { HeaderClient } from "@/components/header-client";
import { catalogRepository } from "@/lib/repositories/catalog";

export async function Header() {
  const [user, categories, products] = await Promise.all([
    getCurrentUser(),
    catalogRepository.listCategories(),
    catalogRepository.listProducts()
  ]);

  return <HeaderClient user={user} categories={categories} products={products} />;
}
