import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Star } from "lucide-react";
import type { Product } from "@/types";
import { ProductActions } from "@/components/product-actions";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-md bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/products/${product.slug}`} className="relative block overflow-hidden bg-slate-100">
        <Image src={product.imageUrl} alt={product.name} width={800} height={900} className="aspect-[4/4.6] w-full object-cover transition duration-700 group-hover:scale-105" />
        <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-1 text-[9px] font-bold uppercase text-slate-800 backdrop-blur sm:left-3 sm:top-3 sm:px-2.5 sm:text-[11px]">New arrival</span>
        <span className="absolute bottom-3 right-3 grid size-10 translate-y-2 place-items-center rounded-full bg-white text-slate-950 opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight size={18} /></span>
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-5">
        <div className="flex-1 space-y-2 sm:space-y-2.5">
          <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase text-emerald-700">
            <span className="min-w-0 truncate">{product.categoryName}</span>
            <span className="flex shrink-0 items-center gap-1 text-ink/70">
              <Star size={13} className="fill-clay text-clay" aria-hidden="true" />
              {product.rating}
            </span>
          </div>
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#172033] transition group-hover:text-[#d65f3f] sm:text-lg">{product.name}</h3>
          </Link>
          <p className="hidden line-clamp-2 min-h-10 text-sm leading-5 text-ink/65 sm:block">{product.description}</p>
        </div>
        <div className="mt-3 border-t border-slate-100 pt-3 sm:mt-4 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:pt-4">
          <p className="text-base font-bold text-[#172033] sm:text-lg">${product.price.toFixed(2)}</p>
          <div className="mt-2 flex justify-end sm:mt-0"><ProductActions productId={product.id} compact /></div>
        </div>
      </div>
    </article>
  );
}
