import { currentUserId } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { wishlistService } from "@/lib/services/wishlist-service";
import { wishlistItemSchema } from "@/lib/validators";

export async function GET() {
  try {
    const wishlist = await wishlistService.getWishlist(await currentUserId());
    return Response.json({ data: wishlist });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = wishlistItemSchema.parse(await request.json());
    const wishlist = await wishlistService.addItem(await currentUserId(), payload.productId);
    return Response.json({ data: wishlist }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
