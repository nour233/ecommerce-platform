import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const data = request.nextUrl.searchParams.get("data");
  if (!data || data.length > 1_000) return new Response("Invalid QR data", { status: 400 });

  try {
    const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=360x360&format=png&ecc=M&data=${encodeURIComponent(data)}`, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3_600 }
    });
    if (!response.ok) return new Response("QR generation unavailable", { status: 503 });
    return new Response(await response.arrayBuffer(), {
      headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600, s-maxage=3600" }
    });
  } catch {
    return new Response("QR generation unavailable", { status: 503 });
  }
}
