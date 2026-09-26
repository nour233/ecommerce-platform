import { env } from "@/lib/env";
import { db } from "@/lib/db/dynamo";
import { keys } from "@/lib/db/keys";
import type { ProductReview } from "@/types";

type ReviewRecord = ProductReview & { pk: string; sk: string; entityType: "ProductReview" };
export const reviewRepository = {
  async list(productId: string) { if (env.useMockDb) return []; return (await db.query<ReviewRecord>(keys.reviewPk(productId), "REVIEW#")).map(({ pk: _pk, sk: _sk, entityType: _entityType, ...review }) => review).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
  async save(review: ProductReview) { if (env.useMockDb) return review; await db.put({ pk: keys.reviewPk(review.productId), sk: keys.reviewSk(review.id), entityType: "ProductReview", ...review }); return review; }
};
