import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSessionUserId } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/users";

const safeNextPath = (value?: string) =>
  value?.startsWith("/") && !value.startsWith("//") ? value : "/products";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const nextPath = safeNextPath((await searchParams).next);
  const userId = await getSessionUserId();
  if (userId) {
    const user = await userRepository.getUser(userId);
    if (user) redirect(user.role === "admin" ? "/admin" : nextPath);
  }

  return (
    <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-8">
      <div className="max-w-xl">
        <p className="text-sm font-semibold uppercase text-moss">Welcome back</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Your saved products are waiting.</h1>
        <p className="mt-5 text-lg leading-8 text-ink/65">Log in to access your personal cart and wishlist across the store.</p>
      </div>
      <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <h2 className="text-2xl font-bold">Log in</h2>
        <div className="mt-6"><AuthForm mode="login" nextPath={nextPath} /></div>
      </div>
    </section>
  );
}
