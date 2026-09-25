import { toErrorResponse } from "@/lib/errors";
import { authService } from "@/lib/services/auth-service";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = registerSchema.parse(await request.json());
    const result = await authService.requestRegistration(
      payload.name,
      payload.email,
      payload.password
    );
    return Response.json({ data: result }, { status: 202 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
