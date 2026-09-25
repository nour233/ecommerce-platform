import { currentUserId } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { userRepository } from "@/lib/repositories/users";

export async function GET() {
  try {
    const user = await userRepository.getUser(await currentUserId());
    return user ? Response.json({ data: user }) : Response.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
