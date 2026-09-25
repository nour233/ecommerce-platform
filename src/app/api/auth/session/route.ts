import { getSessionUserId } from "@/lib/auth";
import { toErrorResponse } from "@/lib/errors";
import { userRepository } from "@/lib/repositories/users";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return Response.json({ data: null });
    return Response.json({ data: await userRepository.getUser(userId) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
