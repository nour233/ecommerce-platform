import { catalogService } from "@/lib/services/catalog-service";
import { toErrorResponse } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const products = await catalogService.getProducts(searchParams);
    return Response.json({ data: products });
  } catch (error) {
    return toErrorResponse(error);
  }
}
