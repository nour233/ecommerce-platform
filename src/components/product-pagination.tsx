import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { productPageHref } from "@/lib/pagination";

export function ProductPagination({ page, pageCount, params }: { page: number; pageCount: number; params: URLSearchParams }) {
  if (pageCount <= 1) return null;
  const numbers = Array.from(new Set([1, pageCount, page - 1, page, page + 1])).filter((number) => number > 0 && number <= pageCount).sort((a, b) => a - b);
  const button = "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-600 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700";
  return <nav aria-label="Pagination des produits" className="flex flex-wrap items-center justify-center gap-2">
    {page > 1 ? <Link href={productPageHref(params, page - 1)} aria-label="Page précédente" className={button}><ChevronLeft size={17} /><span className="hidden sm:inline">Précédent</span></Link> : <span aria-disabled="true" className={`${button} pointer-events-none opacity-40`}><ChevronLeft size={17} /><span className="hidden sm:inline">Précédent</span></span>}
    {numbers.map((number, index) => <span key={number} className="inline-flex items-center gap-2">{index > 0 && number - numbers[index - 1] > 1 ? <span className="px-1 text-slate-400">…</span> : null}<Link href={productPageHref(params, number)} aria-label={`Page ${number}`} aria-current={number === page ? "page" : undefined} className={number === page ? `${button.replace("border-slate-200 bg-white", "border-emerald-700 bg-emerald-700").replace("text-slate-600", "text-white")} hover:text-white` : button}>{number}</Link></span>)}
    {page < pageCount ? <Link href={productPageHref(params, page + 1)} aria-label="Page suivante" className={button}><span className="hidden sm:inline">Suivant</span><ChevronRight size={17} /></Link> : <span aria-disabled="true" className={`${button} pointer-events-none opacity-40`}><span className="hidden sm:inline">Suivant</span><ChevronRight size={17} /></span>}
  </nav>;
}
