export default function Loading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-10 w-64 animate-pulse rounded-md bg-ink/10" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-80 animate-pulse rounded-lg bg-white" />
        ))}
      </div>
    </section>
  );
}
