import { toErrorResponse } from "@/lib/errors";
import { authService } from "@/lib/services/auth-service";
import { passwordResetConfirmSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = passwordResetConfirmSchema.parse(await request.json());
    const result = await authService.resetPassword(
      payload.email,
      payload.code,
      payload.password
    );
    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
