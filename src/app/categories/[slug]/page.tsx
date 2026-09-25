import { notFound } from "next/navigation";
import Image from "next/image";
import { catalogRepository } from "@/lib/repositories/catalog";
import { ProductGrid } from "@/components/product-grid";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await catalogRepository.getCategoryBySlug(slug);
  if (!category) notFound();

  const products = (await catalogRepository.listProducts()).filter((product) => product.categoryId === category.id);

  return (
    <div className="bg-[#f4f5f3] pb-20">
      <section className="relative isolate min-h-[440px] overflow-hidden bg-[#172033] text-white"><Image src={category.imageUrl} alt={category.name} fill priority className="object-cover" /><div className="absolute inset-0 bg-[#111827]/60" /><div className="relative mx-auto flex min-h-[440px] max-w-[1500px] items-end px-4 py-14 sm:px-6 lg:px-8"><div><p className="text-sm font-semibold uppercase text-[#ffb38f]">Curated collection</p><h1 className="mt-3 text-5xl font-bold sm:text-6xl">{category.name}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-white/75">{category.description}</p></div></div></section>
      <section className="mx-auto max-w-[1500px] px-4 py-14 sm:px-6 lg:px-8"><div className="mb-8 flex items-end justify-between"><div><p className="text-sm font-semibold uppercase text-emerald-700">The edit</p><h2 className="mt-2 text-3xl font-bold text-[#172033]">Explore {category.name}</h2></div><p className="text-sm text-slate-500">{products.length} products</p></div><ProductGrid products={products} /></section>
    </div>
  );
}
