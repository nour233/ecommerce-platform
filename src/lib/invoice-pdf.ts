import { jsPDF } from "jspdf";
import type { CartSummary } from "@/types";

async function qrDataUrl(value: string) {
  const response = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&format=png&data=${encodeURIComponent(value)}`);
  if (!response.ok) throw new Error("QR code unavailable");
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("QR code could not be read"));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function downloadCartInvoice(cart: CartSummary) {
  const invoiceNumber = `CC-${Date.now().toString(36).toUpperCase()}`;
  const issuedAt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date());
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const width = pdf.internal.pageSize.getWidth();
  pdf.setFillColor(23, 32, 51); pdf.rect(0, 0, width, 48, "F");
  pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(24); pdf.text("CommerceCraft", 18, 24);
  pdf.setFontSize(10); pdf.setFont("helvetica", "normal"); pdf.text("DEMONSTRATION INVOICE", 18, 33);
  pdf.setTextColor(23, 32, 51); pdf.setFont("helvetica", "bold"); pdf.setFontSize(16); pdf.text("Invoice summary", 18, 63);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.setTextColor(71, 85, 105);
  pdf.text(`Invoice: ${invoiceNumber}`, 18, 72); pdf.text(`Issued: ${issuedAt}`, 18, 78); pdf.text("Payment status: Not captured — demonstration only", 18, 84);
  let y = 101;
  pdf.setFillColor(241, 245, 249); pdf.rect(18, y - 8, width - 36, 10, "F");
  pdf.setTextColor(51, 65, 85); pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.text("ITEM", 21, y - 1); pdf.text("QTY", width - 65, y - 1); pdf.text("AMOUNT", width - 38, y - 1);
  y += 10; pdf.setFont("helvetica", "normal"); pdf.setFontSize(10);
  for (const item of cart.items) {
    if (y > 238) { pdf.addPage(); y = 24; }
    pdf.setTextColor(23, 32, 51); pdf.text(item.product.name.slice(0, 54), 21, y);
    pdf.setTextColor(71, 85, 105); pdf.text(String(item.quantity), width - 61, y);
    pdf.text(`$${(item.product.price * item.quantity).toFixed(2)}`, width - 38, y, { align: "right" });
    y += 9;
  }
  y += 4; pdf.setDrawColor(203, 213, 225); pdf.line(18, y, width - 18, y); y += 11;
  pdf.setTextColor(23, 32, 51); pdf.setFont("helvetica", "bold"); pdf.setFontSize(13); pdf.text("Total", width - 66, y); pdf.text(`$${cart.subtotal.toFixed(2)}`, width - 18, y, { align: "right" });
  const verification = JSON.stringify({ issuer: "CommerceCraft", invoice: invoiceNumber, issuedAt, total: Number(cart.subtotal.toFixed(2)), currency: "USD", items: cart.itemCount });
  try { pdf.addImage(await qrDataUrl(verification), "PNG", 18, y + 16, 34, 34); } catch { /* The invoice remains usable if the QR provider is temporarily unavailable. */ }
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.text("Verify this invoice", 58, y + 25);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139); pdf.text("Scan the QR code to read the invoice reference and total.", 58, y + 31);
  pdf.text("This document is a checkout demonstration and is not proof of payment.", 18, 282);
  pdf.save(`${invoiceNumber}-invoice.pdf`);
}
