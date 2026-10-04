import { toErrorResponse } from "@/lib/errors";
import { storeChatService } from "@/lib/services/store-chat-service";
import { storefrontChatSchema } from "@/lib/validators";
import { consumePublicAiAttempt } from "@/lib/services/public-ai-quota";

export async function POST(request: Request) {
  try {
    const input = storefrontChatSchema.parse(await request.json());
    await consumePublicAiAttempt(request);
    return Response.json({ data: await storeChatService.reply(input) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
