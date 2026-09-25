import { currentAdmin } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { adminService } from "@/lib/services/admin-service";
import { adminCategorySchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await currentAdmin();
    const category = await adminService.createCategory(adminCategorySchema.parse(await request.json()));
    return Response.json({ data: category }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
