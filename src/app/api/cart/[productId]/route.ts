import { currentUserId } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { cartService } from "@/lib/services/cart-service";
import { updateQuantitySchema } from "@/lib/validators";

export async function PATCH(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params;
    const payload = updateQuantitySchema.parse(await request.json());
    const cart = await cartService.updateQuantity(await currentUserId(), productId, payload.quantity);
    return Response.json({ data: cart });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params;
    const cart = await cartService.removeItem(await currentUserId(), productId);
    return Response.json({ data: cart });
  } catch (error) {
    return toErrorResponse(error);
  }
}
