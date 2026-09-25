import { catalogRepository } from "@/lib/repositories/catalog";
import { searchParamsSchema } from "@/lib/validators";

export const catalogService = {
  async getProducts(params?: URLSearchParams) {
    const parsed = searchParamsSchema.parse({
      q: params?.get("q") ?? undefined,
      category: params?.get("category") ?? undefined,
      min: params?.get("min") ?? undefined,
      max: params?.get("max") ?? undefined,
      sort: params?.get("sort") ?? undefined
    });

    const products = await catalogRepository.listProducts();
    const query = parsed.q.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesQuery =
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.tags.some((tag) => tag.toLowerCase().includes(query));
        const matchesCategory = parsed.category === "all" || product.categoryId === parsed.category;
        const matchesMin = parsed.min === undefined || product.price >= parsed.min;
        const matchesMax = parsed.max === undefined || product.price <= parsed.max;
        return matchesQuery && matchesCategory && matchesMin && matchesMax;
      })
      .sort((a, b) => {
        if (parsed.sort === "price-asc") return a.price - b.price;
        if (parsed.sort === "price-desc") return b.price - a.price;
        if (parsed.sort === "rating") return b.rating - a.rating;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  },

  async getProductPage(slug: string) {
    const product = await catalogRepository.getProductBySlug(slug);
    if (!product) return null;
    const related = (await catalogRepository.listProducts())
      .filter((candidate) => candidate.categoryId === product.categoryId && candidate.id !== product.id)
      .slice(0, 3);
    return { product, related };
  }
};
