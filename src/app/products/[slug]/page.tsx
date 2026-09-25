import { notFound } from "next/navigation";
import Image from "next/image";
import { Check, RefreshCcw, ShieldCheck, Star, Truck } from "lucide-react";
import { catalogService } from "@/lib/services/catalog-service";
import { ProductActions } from "@/components/product-actions";
import { ProductGrid } from "@/components/product-grid";

type ProductDetailProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({ params }: ProductDetailProps) {
  const { slug } = await params;
  const page = await catalogService.getProductPage(slug);
  if (!page) notFound();

  const { product, related } = page;

  return (
    <div className="bg-white">
      <section className="mx-auto grid max-w-[1500px] lg:grid-cols-[1.15fr_.85fr]">
        <div className="relative min-h-[480px] bg-slate-100 lg:min-h-[720px]"><Image src={product.imageUrl} alt={product.name} fill priority className="object-cover" /></div>
        <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
          <p className="text-sm font-semibold uppercase text-[#d65f3f]">{product.categoryName}</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-[#172033] sm:text-5xl">{product.name}</h1>
          <div className="mt-4 flex items-center gap-3 text-sm text-ink/70">
            <span className="flex items-center gap-1">
              <Star size={16} className="fill-clay text-clay" aria-hidden="true" />
              {product.rating}
            </span>
            <span>{product.stock} in stock</span>
          </div>
          <p className="mt-7 text-3xl font-bold text-[#172033]">${product.price.toFixed(2)}</p>
          <p className="mt-5 max-w-xl leading-8 text-slate-600">{product.description}</p>
          <div className="mt-8">
            <ProductActions productId={product.id} />
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-cream px-3 py-1 text-xs font-semibold text-ink/70">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-8 grid gap-3 border-t border-slate-200 pt-6 text-sm text-slate-600 sm:grid-cols-2"><p className="flex items-center gap-2"><Truck size={17} className="text-emerald-700" />Free shipping over $100</p><p className="flex items-center gap-2"><RefreshCcw size={17} className="text-emerald-700" />30-day easy returns</p><p className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-700" />Secure checkout</p><p className="flex items-center gap-2"><Check size={17} className="text-emerald-700" />Quality checked</p></div>
        </div>
      </section>
      <section className="mx-auto max-w-[1500px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <p className="text-sm font-semibold uppercase text-emerald-700">Complete the edit</p><h2 className="mb-8 mt-2 text-3xl font-bold text-[#172033]">You may also like</h2>
        <ProductGrid products={related} />
      </section>
    </div>
  );
}
