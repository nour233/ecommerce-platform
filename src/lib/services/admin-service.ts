import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/errors";
import { catalogRepository } from "@/lib/repositories/catalog";
import { userRepository } from "@/lib/repositories/users";
import type { Category, Product, UserRole } from "@/types";

type ProductInput = Omit<Product, "id" | "categoryName" | "createdAt">;
type CategoryInput = Omit<Category, "id">;

async function assertUniqueSlug(kind: "product" | "category", slug: string, currentId?: string) {
  const collection = kind === "product"
    ? await catalogRepository.listProducts()
    : await catalogRepository.listCategories();
  if (collection.some((item) => item.slug === slug && item.id !== currentId)) {
    throw new AppError(`This ${kind} slug is already in use`, 409, "SLUG_IN_USE");
  }
}

export const adminService = {
  async createProduct(input: ProductInput) {
    await assertUniqueSlug("product", input.slug);
    const category = await catalogRepository.getCategoryById(input.categoryId);
    if (!category) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    return catalogRepository.saveProduct({
      ...input,
      id: `prod-${randomUUID()}`,
      categoryName: category.name,
      createdAt: new Date().toISOString()
    });
  },

  async updateProduct(id: string, input: ProductInput) {
    const current = await catalogRepository.getProductById(id);
    if (!current) throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    await assertUniqueSlug("product", input.slug, id);
    const category = await catalogRepository.getCategoryById(input.categoryId);
    if (!category) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    return catalogRepository.saveProduct({
      ...input,
      id,
      categoryName: category.name,
      createdAt: current.createdAt
    });
  },

  async createCategory(input: CategoryInput) {
    await assertUniqueSlug("category", input.slug);
    return catalogRepository.saveCategory({ ...input, id: `cat-${randomUUID()}` });
  },

  async updateCategory(id: string, input: CategoryInput) {
    const current = await catalogRepository.getCategoryById(id);
    if (!current) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    await assertUniqueSlug("category", input.slug, id);
    const category = await catalogRepository.saveCategory({ ...input, id });
    const products = (await catalogRepository.listProducts()).filter((product) => product.categoryId === id);
    await Promise.all(products.map((product) => catalogRepository.saveProduct({ ...product, categoryName: category.name })));
    return category;
  },

  async updateUserRole(actorId: string, userId: string, role: UserRole) {
    if (actorId === userId && role !== "admin") {
      throw new AppError("You cannot remove your own administrator role", 409, "SELF_ROLE_CHANGE");
    }
    return userRepository.updateRole(userId, role);
  },

  async deleteUser(actorId: string, userId: string) {
    if (actorId === userId) {
      throw new AppError("You cannot delete your own account", 409, "SELF_DELETE");
    }
    await userRepository.deleteUser(userId);
  }
};
