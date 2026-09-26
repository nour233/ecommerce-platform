import { randomUUID } from "node:crypto";
import { toErrorResponse, AppError } from "@/lib/errors";
import { currentUserId } from "@/lib/api";
import { productReviewSchema } from "@/lib/validators";
import { catalogRepository } from "@/lib/repositories/catalog";
import { reviewRepository } from "@/lib/repositories/reviews";
import { userRepository } from "@/lib/repositories/users";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { try { return Response.json({ data: await reviewRepository.list((await params).id) }); } catch (error) { return toErrorResponse(error); } }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const userId = await currentUserId(); const productId = (await params).id; const payload = productReviewSchema.parse({ ...(await request.json()), productId }); if (!await catalogRepository.getProductById(productId)) throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND"); const user = await userRepository.getUser(userId); if (!user) throw new AppError("Authentication required", 401, "UNAUTHORIZED"); const review = await reviewRepository.save({ id: randomUUID(), productId, userId, authorName: user.name, rating: payload.rating, comment: payload.comment, createdAt: new Date().toISOString() }); return Response.json({ data: review }, { status: 201 }); } catch (error) { return toErrorResponse(error); } }
