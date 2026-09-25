import { currentUserId } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { wishlistService } from "@/lib/services/wishlist-service";

export async function DELETE(_request: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params;
    const wishlist = await wishlistService.removeItem(await currentUserId(), productId);
    return Response.json({ data: wishlist });
  } catch (error) {
    return toErrorResponse(error);
  }
}
