import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile-client";
import { getCurrentUser } from "@/lib/current-user";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fprofile");
  return <ProfileClient initialUser={user} />;
}
