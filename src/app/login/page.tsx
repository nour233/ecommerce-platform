import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthPageShell } from "@/components/auth-page-shell";
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
    <AuthPageShell mode="login">
      <AuthForm mode="login" nextPath={nextPath} />
    </AuthPageShell>
  );
}
