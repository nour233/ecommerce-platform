import { currentAdmin } from "@/lib/api";
import { toErrorResponse } from "@/lib/errors";
import { campaignRepository } from "@/lib/repositories/campaigns";
import { campaignService } from "@/lib/services/campaign-service";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function GET() {
  try {
    await currentAdmin();
    return Response.json({ data: (await campaignRepository.list()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) });
  } catch (error) { return toErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const admin = await currentAdmin();
    return Response.json({ data: await campaignService.generate(await request.json(), admin.id) }, { status: 201 });
  } catch (error) { return toErrorResponse(error); }
}
