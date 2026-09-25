import { toErrorResponse } from "@/lib/errors";
import { authService } from "@/lib/services/auth-service";
import { resendVerificationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = resendVerificationSchema.parse(await request.json());
    const result = await authService.resendRegistrationCode(payload.email);
    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
