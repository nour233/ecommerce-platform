import { getCurrentUser } from "@/lib/current-user";
import { toErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    return Response.json({ data: await getCurrentUser() });
  } catch (error) {
    return toErrorResponse(error);
  }
}
