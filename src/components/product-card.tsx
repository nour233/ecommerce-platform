import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Star } from "lucide-react";
import type { Product } from "@/types";
import { ProductActions } from "@/components/product-actions";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group overflow-hidden rounded-md bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/products/${product.slug}`} className="relative block overflow-hidden bg-slate-100">
        <Image src={product.imageUrl} alt={product.name} width={800} height={900} className="aspect-[4/4.6] w-full object-cover transition duration-700 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-800 backdrop-blur">New arrival</span>
        <span className="absolute bottom-3 right-3 grid size-10 translate-y-2 place-items-center rounded-full bg-white text-slate-950 opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight size={18} /></span>
      </Link>
      <div className="space-y-4 p-5">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase text-emerald-700">
            <span>{product.categoryName}</span>
            <span className="flex items-center gap-1 text-ink/70">
              <Star size={14} className="fill-clay text-clay" aria-hidden="true" />
              {product.rating}
            </span>
          </div>
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-lg font-bold leading-snug text-[#172033] transition group-hover:text-[#d65f3f]">{product.name}</h3>
          </Link>
          <p className="line-clamp-2 min-h-10 text-sm leading-5 text-ink/65">{product.description}</p>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-lg font-bold text-[#172033]">${product.price.toFixed(2)}</p>
          <ProductActions productId={product.id} compact />
        </div>
      </div>
    </article>
  );
}
