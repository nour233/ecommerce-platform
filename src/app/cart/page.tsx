import { CartClient } from "@/components/cart-client";
import { getSessionUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { userRepository } from "@/lib/repositories/users";

export default async function CartPage() {
  const userId = await getSessionUserId();
  if (!userId || !(await userRepository.getUser(userId))) redirect("/login?next=/cart");

  return (
    <section className="bg-[#f4f5f3] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-[1400px]">
      <div className="mb-9">
        <p className="text-sm font-semibold uppercase text-[#d65f3f]">Shopping bag</p>
        <h1 className="mt-2 text-4xl font-bold text-[#172033] sm:text-5xl">Review your selection</h1>
        <p className="mt-3 text-slate-500">Adjust quantities, confirm your favorites and continue when everything feels right.</p>
      </div>
      <CartClient />
      </div>
    </section>
  );
}
