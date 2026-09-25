import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthPageShell } from "@/components/auth-page-shell";
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
    <AuthPageShell mode="register">
      <AuthForm mode="register" nextPath={nextPath} />
    </AuthPageShell>
  );
}
