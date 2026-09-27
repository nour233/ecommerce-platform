import { currentAdmin } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { catalogRepository } from "@/lib/repositories/catalog";
import { productAiService } from "@/lib/services/product-ai-service";
import { adminAiProductSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    await currentAdmin();
    const { imageUrl } = adminAiProductSchema.parse(await request.json());
    const categories = await catalogRepository.listCategories();
    return Response.json({ data: await productAiService.suggestFromImage(imageUrl, categories) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
