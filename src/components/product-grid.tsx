import type { Product } from "@/types";
import { ProductCard } from "@/components/product-card";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink/20 bg-white p-10 text-center">
        <h2 className="text-xl font-semibold">No products found</h2>
        <p className="mt-2 text-ink/65">Try another search term, category, or price range.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
