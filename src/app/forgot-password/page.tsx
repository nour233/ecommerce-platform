import { redirect } from "next/navigation";
import { AuthPageShell } from "@/components/auth-page-shell";
import { PasswordResetForm } from "@/components/password-reset-form";
import { getSessionUserId } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/users";

export default async function ForgotPasswordPage() {
  const userId = await getSessionUserId();
  if (userId && (await userRepository.getUser(userId))) redirect("/profile");

  return (
    <AuthPageShell mode="forgot">
      <PasswordResetForm />
    </AuthPageShell>
  );
}
