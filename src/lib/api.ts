import { AppError } from "@/lib/errors";
import { getSessionUserId } from "@/lib/auth";
import { userRepository } from "@/lib/repositories/users";

export async function currentUserId() {
  const userId = await getSessionUserId();
  if (!userId || !(await userRepository.getUser(userId))) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  return userId;
}

export async function currentAdmin() {
  const userId = await currentUserId();
  const user = await userRepository.getUser(userId);
  if (!user || user.role !== "admin") {
    throw new AppError("Administrator access required", 403, "FORBIDDEN");
  }
  return user;
}
