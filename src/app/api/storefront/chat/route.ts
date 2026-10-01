import { toErrorResponse } from "@/lib/errors";
import { storeChatService } from "@/lib/services/store-chat-service";
import { storefrontChatSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const input = storefrontChatSchema.parse(await request.json());
    return Response.json({ data: { message: await storeChatService.reply(input) } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
