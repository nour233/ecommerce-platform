import { currentUserId } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { cartService } from "@/lib/services/cart-service";
import { cartItemSchema } from "@/lib/validators";

export async function GET() {
  try {
    const cart = await cartService.getCart(await currentUserId());
    return Response.json({ data: cart });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = cartItemSchema.parse(await request.json());
    const cart = await cartService.addItem(await currentUserId(), payload.productId, payload.quantity);
    return Response.json({ data: cart }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
