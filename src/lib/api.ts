import { AppError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/current-user";

export async function currentUserId() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  return user.id;
}

export async function currentAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new AppError("Administrator access required", 403, "FORBIDDEN");
  }
  return user;
}
