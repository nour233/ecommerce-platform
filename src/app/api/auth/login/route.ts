import { toErrorResponse } from "@/lib/errors";
import { authService } from "@/lib/services/auth-service";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    const user = await authService.login(payload.email, payload.password);
    return Response.json({ data: user });
  } catch (error) {
    return toErrorResponse(error);
  }
}
