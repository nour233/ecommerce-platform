import { currentAdmin } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { adminService } from "@/lib/services/admin-service";
import { adminUserRoleSchema } from "@/lib/validators";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const actor = await currentAdmin();
    const { id } = await params;
    const { role } = adminUserRoleSchema.parse(await request.json());
    return Response.json({ data: await adminService.updateUserRole(actor.id, id, role) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const actor = await currentAdmin();
    const { id } = await params;
    await adminService.deleteUser(actor.id, id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
