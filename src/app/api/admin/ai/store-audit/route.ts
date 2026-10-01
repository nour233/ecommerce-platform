import { currentAdmin } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { catalogRepository } from "@/lib/repositories/catalog";
import { userDataRepository } from "@/lib/repositories/user-data";
import { adminAuditService } from "@/lib/services/admin-audit-service";

export async function POST() {
  try {
    await currentAdmin();
    const [products, categories, activity] = await Promise.all([
      catalogRepository.listProducts(),
      catalogRepository.listCategories(),
      userDataRepository.listAllActivity()
    ]);
    return Response.json({ data: await adminAuditService.analyze(products, categories, activity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
