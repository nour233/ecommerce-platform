import { WishlistClient } from "@/components/wishlist-client";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

export default async function WishlistPage() {
  if (!(await getCurrentUser())) redirect("/login?next=/wishlist");

  return (
    <section className="bg-[#f4f5f3] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-[1400px]">
      <div className="mb-9">
        <p className="text-sm font-semibold uppercase text-[#d65f3f]">Your wishlist</p>
        <h1 className="mt-2 text-4xl font-bold text-[#172033] sm:text-5xl">Pieces worth remembering</h1>
        <p className="mt-3 max-w-2xl text-slate-500">A personal edit of everything you love, ready whenever you are.</p>
      </div>
      <WishlistClient />
      </div>
    </section>
  );
}
