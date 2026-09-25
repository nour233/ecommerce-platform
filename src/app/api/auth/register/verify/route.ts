import { toErrorResponse } from "@/lib/errors";
import { authService } from "@/lib/services/auth-service";
import { verificationCodeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = verificationCodeSchema.parse(await request.json());
    const user = await authService.verifyRegistration(
      payload.email,
      payload.code
    );
    return Response.json({ data: user }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
