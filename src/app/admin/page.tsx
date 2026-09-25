import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getSessionUserId } from "@/lib/auth";
import { catalogRepository } from "@/lib/repositories/catalog";
import { userRepository } from "@/lib/repositories/users";

export default async function AdminPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login?next=/admin");
  const currentUser = await userRepository.getUser(userId);
  if (!currentUser || currentUser.role !== "admin") redirect("/");

  const [products, categories, users] = await Promise.all([
    catalogRepository.listProducts(),
    catalogRepository.listCategories(),
    userRepository.listUsers()
  ]);

  return (
    <AdminDashboard
      currentUser={currentUser}
      initialProducts={products}
      initialCategories={categories}
      initialUsers={users}
    />
  );
}
