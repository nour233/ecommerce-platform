import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile-client";
import { getSessionUserId } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/users";

export default async function ProfilePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login?next=%2Fprofile");
  const user = await userRepository.getUser(userId);
  if (!user) redirect("/login?next=%2Fprofile");
  return <ProfileClient initialUser={user} />;
}
