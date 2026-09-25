import { getSessionUserId } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/users";
import { HeaderClient } from "@/components/header-client";
import { catalogRepository } from "@/lib/repositories/catalog";

export async function Header() {
  const userId = await getSessionUserId();
  const [user, categories] = await Promise.all([
    userId ? userRepository.getUser(userId) : null,
    catalogRepository.listCategories()
  ]);

  return <HeaderClient user={user} categories={categories} />;
}
