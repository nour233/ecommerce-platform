import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthPageShell } from "@/components/auth-page-shell";
import { getCurrentUser } from "@/lib/current-user";

const safeNextPath = (value?: string) =>
  value?.startsWith("/") && !value.startsWith("//") ? value : "/products";

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const nextPath = safeNextPath((await searchParams).next);
  if (await getCurrentUser()) redirect(nextPath);

  return (
    <AuthPageShell mode="register">
      <AuthForm mode="register" nextPath={nextPath} />
    </AuthPageShell>
  );
}
