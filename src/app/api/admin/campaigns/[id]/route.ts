import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { campaignService } from "@/lib/services/campaign-service";
import { campaignRepository } from "@/lib/repositories/campaigns";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await currentAdmin();
    const { id } = await params;
    const campaign = await campaignService.mutate(id, await request.json());
    revalidatePath("/");
    revalidatePath("/campaigns");
    revalidatePath(`/campaigns/${id}`);
    return Response.json({ data: campaign });
  } catch (error) { return toErrorResponse(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await currentAdmin();
    const { id } = await params;
    const body = await request.json() as { version?: unknown };
    if (typeof body.version !== "number" || !Number.isInteger(body.version) || body.version < 1) return Response.json({ error: "Invalid campaign version." }, { status: 400 });
    await campaignRepository.remove(id, body.version);
    revalidatePath("/");
    revalidatePath("/campaigns");
    revalidatePath(`/campaigns/${id}`);
    return Response.json({ data: { id } });
  } catch (error) { return toErrorResponse(error); }
}
