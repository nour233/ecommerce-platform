import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">404</p>
        <h1 className="mt-3 text-4xl font-bold">Page not found</h1>
        <p className="mt-4 text-ink/65">The page or product you requested does not exist.</p>
        <Link href="/products" className="focus-ring mt-7 inline-flex rounded-md bg-ink px-5 py-3 text-sm font-semibold text-white">
          Back to products
        </Link>
      </div>
    </section>
  );
}
