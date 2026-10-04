import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference") ?? "";
  const total = Number(request.nextUrl.searchParams.get("total"));
  const items = Number(request.nextUrl.searchParams.get("items"));
  if (!/^CC-CART-[A-Z0-9-]{3,80}$/.test(reference) || !Number.isFinite(total) || total < 0 || total > 1_000_000 || !Number.isInteger(items) || items < 1 || items > 100) {
    return new Response("Invalid receipt data", { status: 400 });
  }

  const receiptUrl = new URL("/receipt", request.url);
  receiptUrl.searchParams.set("reference", reference);
  receiptUrl.searchParams.set("total", total.toFixed(2));
  receiptUrl.searchParams.set("items", String(items));

  try {
    const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=360x360&format=png&ecc=M&data=${encodeURIComponent(receiptUrl.toString())}`, {
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: 3_600 }
    });
    if (!response.ok) return new Response("QR generation unavailable", { status: 503 });
    return new Response(await response.arrayBuffer(), {
      headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=3600" }
    });
  } catch {
    return new Response("QR generation unavailable", { status: 503 });
  }
}
