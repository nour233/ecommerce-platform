import { currentUserId } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { setupAiService } from "@/lib/services/setup-ai-service";
import { aiSetupSchema } from "@/lib/validators";
import { consumePublicAiAttempt } from "@/lib/services/public-ai-quota";

export async function POST(request: Request) {
  try {
    await currentUserId();
    const { productId } = aiSetupSchema.parse(await request.json());
    await consumePublicAiAttempt(request);
    return Response.json({ data: await setupAiService.build(productId) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
