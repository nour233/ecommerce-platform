import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { campaignService } from "@/lib/services/campaign-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await currentAdmin();
    const { id } = await params;
    const campaign = await campaignService.mutate(id, await request.json());
    revalidatePath("/");
    revalidatePath(`/campaigns/${id}`);
    return Response.json({ data: campaign });
  } catch (error) { return toErrorResponse(error); }
}
