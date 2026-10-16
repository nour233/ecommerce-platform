import { getSessionUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { userRepository } from "@/lib/repositories/users";
import type { User } from "@/types";

/**
 * Resolves the current account from the persistent store. In the temporary
 * demo data mode, Vercel can route two requests to different functions, so
 * the signed session keeps the authenticated identity available as a fallback.
 */
export async function getCurrentUser(): Promise<User | null> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const storedUser = await userRepository.getUser(sessionUser.id);
  if (storedUser) return storedUser;

  return env.useMockDb ? sessionUser : null;
}
