import { currentUserId } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { authService } from "@/lib/services/auth-service";
import { passwordChangeSchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  try {
    const payload = passwordChangeSchema.parse(await request.json());
    const result = await authService.changePassword(
      await currentUserId(),
      payload.currentPassword,
      payload.newPassword
    );
    return Response.json({ data: result });
  } catch (error) {
    return toErrorResponse(error);
  }
}
