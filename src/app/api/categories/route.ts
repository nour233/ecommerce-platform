import { catalogRepository } from "@/lib/repositories/catalog";
import { toErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const categories = await catalogRepository.listCategories();
    return Response.json({ data: categories });
  } catch (error) {
    return toErrorResponse(error);
  }
}
