import { AppError } from "@/lib/errors";
import { env } from "@/lib/env";
import { db } from "@/lib/db/dynamo";
import { keys } from "@/lib/db/keys";
import { store } from "@/lib/db/mock";
import type { Category, Product } from "@/types";

type ProductRecord = Product & { pk: string; sk: string; entityType: "Product" };
type CategoryRecord = Category & { pk: string; sk: string; entityType: "Category" };

const toProduct = (record: ProductRecord): Product => ({
  id: record.id,
  slug: record.slug,
  name: record.name,
  description: record.description,
  categoryId: record.categoryId,
  categoryName: record.categoryName,
  price: record.price,
  rating: record.rating,
  stock: record.stock,
  imageUrl: record.imageUrl,
  tags: record.tags,
  createdAt: record.createdAt
});

const toCategory = (record: CategoryRecord): Category => ({
  id: record.id,
  slug: record.slug,
  name: record.name,
  description: record.description,
  imageUrl: record.imageUrl
});

export const catalogRepository = {
  async listProducts() {
    if (env.useMockDb) return store.products;
    const records = await db.query<ProductRecord>(keys.productPk);
    return records.map(toProduct);
  },

  async listCategories() {
    if (env.useMockDb) return store.categories;
    const records = await db.query<CategoryRecord>(keys.categoryPk);
    return records.map(toCategory);
  },

  async getProductById(id: string) {
    if (env.useMockDb) return store.products.find((product) => product.id === id) ?? null;
    const record = await db.get<ProductRecord>(keys.productPk, keys.productSk(id));
    if (!record) return null;
    return toProduct(record);
  },

  async getProductBySlug(slug: string) {
    const products = await this.listProducts();
    return products.find((product) => product.slug === slug) ?? null;
  },

  async getCategoryBySlug(slug: string) {
    const categories = await this.listCategories();
    return categories.find((category) => category.slug === slug) ?? null;
  },

  async assertProduct(productId: string) {
    const product = await this.getProductById(productId);
    if (!product) throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    if (product.stock < 1) throw new AppError("Product is out of stock", 409, "OUT_OF_STOCK");
    return product;
  },

  async saveProduct(product: Product) {
    if (env.useMockDb) {
      const index = store.products.findIndex((candidate) => candidate.id === product.id);
      if (index >= 0) store.products[index] = product;
      else store.products.push(product);
      return product;
    }
    await db.put({
      pk: keys.productPk,
      sk: keys.productSk(product.id),
      entityType: "Product",
      ...product
    });
    return product;
  },

  async deleteProduct(id: string) {
    const product = await this.getProductById(id);
    if (!product) throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    if (env.useMockDb) store.products = store.products.filter((candidate) => candidate.id !== id);
    else await db.delete(keys.productPk, keys.productSk(id));
  },

  async getCategoryById(id: string) {
    if (env.useMockDb) return store.categories.find((category) => category.id === id) ?? null;
    const record = await db.get<CategoryRecord>(keys.categoryPk, keys.categorySk(id));
    return record ? toCategory(record) : null;
  },

  async saveCategory(category: Category) {
    if (env.useMockDb) {
      const index = store.categories.findIndex((candidate) => candidate.id === category.id);
      if (index >= 0) store.categories[index] = category;
      else store.categories.push(category);
      return category;
    }
    await db.put({
      pk: keys.categoryPk,
      sk: keys.categorySk(category.id),
      entityType: "Category",
      ...category
    });
    return category;
  },

  async deleteCategory(id: string) {
    const category = await this.getCategoryById(id);
    if (!category) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");
    const hasProducts = (await this.listProducts()).some((product) => product.categoryId === id);
    if (hasProducts) {
      throw new AppError("Move or delete the products in this category first", 409, "CATEGORY_NOT_EMPTY");
    }
    if (env.useMockDb) store.categories = store.categories.filter((candidate) => candidate.id !== id);
    else await db.delete(keys.categoryPk, keys.categorySk(id));
  }
};
