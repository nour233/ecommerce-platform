import { catalogRepository } from "@/lib/repositories/catalog";
import { catalogService } from "@/lib/services/catalog-service";
import { FilterBar } from "@/components/filter-bar";
import { ProductGrid } from "@/components/product-grid";

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolved = await searchParams;
  const params = new URLSearchParams();
  Object.entries(resolved).forEach(([key, value]) => {
    if (typeof value === "string") params.set(key, value);
  });

  const [categories, products] = await Promise.all([
    catalogRepository.listCategories(),
    catalogService.getProducts(params)
  ]);

  return (
    <section className="bg-[#f4f5f3] pb-20">
      <div className="bg-[#172033] px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1500px]">
          <p className="text-sm font-semibold uppercase text-[#ffb38f]">The full collection</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6"><div><h1 className="text-5xl font-bold sm:text-6xl">Shop all products</h1><p className="mt-4 max-w-2xl text-lg text-slate-300">Objects chosen for better spaces, smoother routines and everyday use.</p></div><p className="text-sm text-slate-400">{products.length} curated pieces</p></div>
        </div>
      </div>
      <div className="mx-auto -mt-6 max-w-[1500px] space-y-10 px-4 sm:px-6 lg:px-8">
        <FilterBar
          categories={categories}
          resultCount={products.length}
          defaults={{
            q: typeof resolved.q === "string" ? resolved.q : "",
            category: typeof resolved.category === "string" ? resolved.category : "all",
            min: typeof resolved.min === "string" ? resolved.min : "",
            max: typeof resolved.max === "string" ? resolved.max : "",
            sort: typeof resolved.sort === "string" ? resolved.sort : "featured"
          }}
        />
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
