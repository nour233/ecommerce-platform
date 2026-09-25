import { toErrorResponse } from "@/lib/errors";
import { authService } from "@/lib/services/auth-service";
import { passwordResetRequestSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = passwordResetRequestSchema.parse(await request.json());
    const result = await authService.requestPasswordReset(payload.email);
    return Response.json({ data: result }, { status: 202 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
