import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSessionUserId } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/users";

const safeNextPath = (value?: string) =>
  value?.startsWith("/") && !value.startsWith("//") ? value : "/products";

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const nextPath = safeNextPath((await searchParams).next);
  const userId = await getSessionUserId();
  if (userId && (await userRepository.getUser(userId))) redirect(nextPath);

  return (
    <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-8">
      <div className="max-w-xl">
        <p className="text-sm font-semibold uppercase text-moss">Create your account</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Make the store yours.</h1>
        <p className="mt-5 text-lg leading-8 text-ink/65">Keep a private cart and wishlist tied to your own account.</p>
      </div>
      <div className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <h2 className="text-2xl font-bold">Create account</h2>
        <div className="mt-6"><AuthForm mode="register" nextPath={nextPath} /></div>
      </div>
    </section>
  );
}
