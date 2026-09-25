import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, PackageCheck, RefreshCcw, Sparkles } from "lucide-react";
import { catalogRepository } from "@/lib/repositories/catalog";
import { ProductGrid } from "@/components/product-grid";

export default async function HomePage() {
  const [categories, products] = await Promise.all([catalogRepository.listCategories(), catalogRepository.listProducts()]);
  const featured = products.slice(0, 6);

  return (
    <div className="bg-white">
      <section className="relative isolate h-[72vh] min-h-[590px] max-h-[760px] overflow-hidden bg-[#172033] text-white">
        <Image src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=2000&q=90" alt="A curated modern living room" fill priority className="object-cover object-center" />
        <div className="absolute inset-0 bg-[#111827]/65" />
        <div className="relative mx-auto flex h-full max-w-[1500px] items-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl pb-10">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase text-[#ffb38f]"><Sparkles size={16} /> The new everyday collection</p>
            <h1 className="mt-5 text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">Better objects for everyday living.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">Thoughtful design, lasting materials and useful details. Discover pieces selected to make home, work and life feel considered.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex min-h-12 items-center gap-3 rounded-md bg-[#ef8354] px-6 text-sm font-bold text-white transition hover:bg-[#e76f51]">Shop the collection <ArrowRight size={18} /></Link>
              <Link href="/categories/home-living" className="inline-flex min-h-12 items-center rounded-md border border-white/35 px-6 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white hover:text-slate-950">Explore home</Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/15 bg-black/20 backdrop-blur-md">
          <div className="mx-auto grid max-w-[1500px] grid-cols-3 divide-x divide-white/15 px-4 sm:px-6 lg:px-8">
            {["Curated essentials", "Secure checkout", "30-day returns"].map((text, index) => <div key={text} className="flex items-center justify-center gap-2 px-2 py-4 text-center text-[11px] font-semibold uppercase text-white/80 sm:text-xs">{index === 0 ? <BadgeCheck size={16} /> : index === 1 ? <PackageCheck size={16} /> : <RefreshCcw size={16} />}<span>{text}</span></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div><p className="text-sm font-semibold uppercase text-[#d65f3f]">Shop your way</p><h2 className="mt-2 max-w-2xl text-4xl font-bold leading-tight text-[#172033] sm:text-5xl">Collections for every part of your day.</h2></div>
          <Link href="/products" className="hidden items-center gap-2 border-b border-slate-900 pb-1 text-sm font-semibold sm:flex">View everything <ArrowRight size={16} /></Link>
        </div>
        <div className="grid gap-5 md:grid-cols-12">
          {categories.map((category, index) => (
            <Link key={category.id} href={`/categories/${category.slug}`} className={`group relative isolate min-h-[360px] overflow-hidden rounded-md ${index === 0 ? "md:col-span-7" : index === 1 ? "md:col-span-5" : "md:col-span-12 lg:min-h-[420px]"}`}>
              <Image src={category.imageUrl} alt={category.name} fill className="object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-6 text-white sm:p-8"><div><p className="text-xs font-semibold uppercase text-white/70">0{index + 1} / Collection</p><h3 className="mt-2 text-3xl font-bold">{category.name}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-white/75">{category.description}</p></div><span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-slate-950 transition group-hover:rotate-[-35deg]"><ArrowRight size={19} /></span></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#f2f4f3] py-16 lg:py-24">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-5"><div><p className="text-sm font-semibold uppercase text-emerald-700">New and noteworthy</p><h2 className="mt-2 text-4xl font-bold text-[#172033]">Fresh finds, thoughtfully chosen.</h2></div><Link href="/products" className="hidden rounded-md bg-[#172033] px-5 py-3 text-sm font-semibold text-white sm:inline-flex">Shop all products</Link></div>
          <ProductGrid products={featured} />
        </div>
      </section>

      <section className="grid bg-[#172033] text-white lg:grid-cols-2">
        <div className="relative min-h-[460px] lg:min-h-[600px]"><Image src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=85" alt="A focused modern workspace" fill className="object-cover" /></div>
        <div className="flex items-center px-6 py-16 sm:px-12 lg:px-16"><div className="max-w-xl"><p className="text-sm font-semibold uppercase text-[#ffb38f]">Designed around real life</p><h2 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">Less clutter. Better choices. More room to live.</h2><p className="mt-6 text-lg leading-8 text-slate-300">We bring useful products together in one considered edit, so finding what belongs in your space feels simple.</p><Link href="/products?sort=rating" className="mt-8 inline-flex items-center gap-3 border-b border-white pb-2 text-sm font-semibold">Discover top-rated pieces <ArrowRight size={17} /></Link></div></div>
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-8 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        {[{ icon: BadgeCheck, title: "Selected for quality", text: "Useful products with strong materials, details and reviews." }, { icon: PackageCheck, title: "Delivered with care", text: "Reliable shipping and clear stock information on every item." }, { icon: RefreshCcw, title: "Easy to reconsider", text: "Simple returns within 30 days when something is not quite right." }].map(({ icon: Icon, title, text }) => <div key={title} className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-md bg-[#ffede5] text-[#d65f3f]"><Icon size={21} /></span><div><h3 className="font-bold text-[#172033]">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div></div>)}
      </section>
    </div>
  );
}
