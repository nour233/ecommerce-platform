import { currentAdmin } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { catalogRepository } from "@/lib/repositories/catalog";
import { adminService } from "@/lib/services/admin-service";
import { adminProductSchema } from "@/lib/validators";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    await currentAdmin();
    const { id } = await params;
    const product = await adminService.updateProduct(id, adminProductSchema.parse(await request.json()));
    return Response.json({ data: product });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await currentAdmin();
    const { id } = await params;
    await catalogRepository.deleteProduct(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
