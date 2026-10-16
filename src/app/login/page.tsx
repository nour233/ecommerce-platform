import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthPageShell } from "@/components/auth-page-shell";
import { getCurrentUser } from "@/lib/current-user";

const safeNextPath = (value?: string) =>
  value?.startsWith("/") && !value.startsWith("//") ? value : "/products";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const nextPath = safeNextPath((await searchParams).next);
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : nextPath);

  return (
    <AuthPageShell mode="login">
      <AuthForm mode="login" nextPath={nextPath} />
    </AuthPageShell>
  );
}
