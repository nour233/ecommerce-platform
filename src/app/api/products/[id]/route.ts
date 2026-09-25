import { catalogRepository } from "@/lib/repositories/catalog";
import { toErrorResponse } from "@/lib/errors";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await catalogRepository.getProductById(id);
    return product ? Response.json({ data: product }) : Response.json({ error: "Product not found" }, { status: 404 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
