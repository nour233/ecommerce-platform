import { currentAdmin } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { adminService } from "@/lib/services/admin-service";
import { adminProductSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await currentAdmin();
    const product = await adminService.createProduct(adminProductSchema.parse(await request.json()));
    return Response.json({ data: product }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
