import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getSessionUserId } from "@/lib/auth";
import { catalogRepository } from "@/lib/repositories/catalog";
import { userDataRepository } from "@/lib/repositories/user-data";
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
  const productsById = new Map(products.map((product) => [product.id, product]));
  const initialUserCommerce = await Promise.all(users.map(async (user) => {
    const [cart, wishlist] = await Promise.all([
      userDataRepository.listCart(user.id),
      userDataRepository.listWishlist(user.id)
    ]);
    return {
      userId: user.id,
      cart: cart.flatMap((item) => {
        const product = item.product ?? productsById.get(item.productId);
        return product ? [{ ...item, product }] : [];
      }),
      wishlist: wishlist.flatMap((item) => {
        const product = item.product ?? productsById.get(item.productId);
        return product ? [{ ...item, product }] : [];
      })
    };
  }));

  return (
    <AdminDashboard
      currentUser={currentUser}
      initialProducts={products}
      initialCategories={categories}
      initialUsers={users}
      initialUserCommerce={initialUserCommerce}
    />
  );
}
