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

  const [categories, products, catalog] = await Promise.all([
    catalogRepository.listCategories(),
    catalogService.getProducts(params),
    catalogRepository.listProducts()
  ]);

  return (
    <section className="bg-[#f4f5f3] pb-20">
      <div className="relative overflow-hidden bg-[#172033] px-4 py-8 text-white sm:px-6 lg:px-8 lg:py-10">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-[#ef8354]/20 blur-3xl" /><div className="absolute -bottom-24 left-1/3 size-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-[1500px]">
          <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="inline-flex rounded-full border border-[#ffb38f]/25 bg-[#ef8354]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ffb38f]">The full collection</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Shop all products</h1><p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">Objects chosen for better spaces, smoother routines and everyday use.</p></div><p className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300"><span className="mr-1.5 text-[#ff9d72]">✦</span>{products.length} curated pieces</p></div>
        </div>
      </div>
      <div className="mx-auto -mt-4 max-w-[1500px] space-y-9 px-4 sm:px-6 lg:px-8">
        <FilterBar
          categories={categories}
          suggestions={catalog.map((product) => ({
            id: product.id,
            name: product.name,
            categoryName: product.categoryName,
            tags: product.tags
          }))}
          maxBudget={Math.ceil(Math.max(...catalog.map((product) => product.price)) / 10) * 10}
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
