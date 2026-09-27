import { currentUserId } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { userRepository } from "@/lib/repositories/users";

export async function POST() {
  try {
    const lastActiveAt = await userRepository.touchPresence(await currentUserId());
    return Response.json({ data: { lastActiveAt } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
