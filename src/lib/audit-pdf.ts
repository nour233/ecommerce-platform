import { jsPDF } from "jspdf";
import type { AdminAuditReport } from "@/lib/services/admin-audit-service";
import type { Product, UserCommerceData } from "@/types";

const NAVY: [number, number, number] = [20, 30, 51];
const INK: [number, number, number] = [38, 49, 68];
const CORAL: [number, number, number] = [245, 119, 82];
const MINT: [number, number, number] = [45, 196, 144];
const VIOLET: [number, number, number] = [112, 63, 223];
const PAPER: [number, number, number] = [247, 248, 252];

export function createAuditPdf(report: AdminAuditReport, products: Product[], activity: UserCommerceData[], exportedAt = new Date()) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const clean = (text: string) => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/\*\*/g, "").replace(/[^\u0020-\u00ff\n]/g, " ");
  const available = products.filter((product) => product.stock > 0).length;
  const lowStock = products.filter((product) => product.stock < 10).sort((left, right) => left.stock - right.stock);
  const carts = activity.reduce((sum, user) => sum + user.cart.reduce((count, item) => count + item.quantity, 0), 0);
  const saves = activity.reduce((sum, user) => sum + user.wishlist.length, 0);
  let y = 28;

  const pageDecoration = () => {
    pdf.setFillColor(...PAPER); pdf.rect(0, 0, 210, 297, "F");
    pdf.setFillColor(...NAVY); pdf.rect(0, 0, 210, 14, "F"); pdf.setFillColor(...CORAL); pdf.rect(18, 14, 48, 1.4, "F");
    pdf.setFillColor(...MINT); pdf.circle(195, 24, 16, "F"); pdf.setFillColor(230, 246, 239); pdf.circle(201, 30, 16, "F");
    pdf.setTextColor(...NAVY); pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.text("COMMERCECRAFT", 18, 9);
    pdf.setFont("helvetica", "normal"); pdf.setTextColor(119, 132, 153); pdf.setFontSize(7); pdf.text("GROWTH DESK / CONFIDENTIAL STORE REPORT", 18, 22);
  };
  const footer = () => {
    const page = pdf.getCurrentPageInfo().pageNumber;
    pdf.setDrawColor(223, 228, 238); pdf.line(18, 282, 192, 282); pdf.setFont("helvetica", "normal"); pdf.setTextColor(119, 132, 153); pdf.setFontSize(7.5);
    pdf.text("CommerceCraft growth desk - anonymized catalog signals", 18, 288); pdf.text(`PAGE ${String(page).padStart(2, "0")}`, 192, 288, { align: "right" });
  };
  const nextPage = () => { footer(); pdf.addPage(); pageDecoration(); y = 32; };
  const section = (title: string, caption?: string) => {
    if (y > 248) nextPage();
    pdf.setFillColor(...VIOLET); pdf.rect(18, y - 5, 2.5, 13, "F"); pdf.setTextColor(...NAVY); pdf.setFont("helvetica", "bold"); pdf.setFontSize(16); pdf.text(clean(title), 25, y);
    if (caption) { pdf.setTextColor(119, 132, 153); pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.text(clean(caption), 25, y + 5.5); }
    y += caption ? 15 : 11;
  };
  const paragraph = (text: string) => {
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(9.5); pdf.setTextColor(...INK);
    const lines = pdf.splitTextToSize(clean(text), 166) as string[];
    for (const line of lines) { if (y > 270) nextPage(); pdf.text(line, 25, y); y += 5.6; }
    y += 4;
  };

  pdf.setFillColor(...NAVY); pdf.rect(0, 0, 210, 297, "F"); pdf.setFillColor(...CORAL); pdf.circle(187, 35, 47, "F"); pdf.setFillColor(...VIOLET); pdf.circle(184, 39, 31, "F"); pdf.setFillColor(...MINT); pdf.circle(30, 264, 39, "F");
  pdf.setFillColor(255, 255, 255); pdf.roundedRect(18, 23, 34, 10, 5, 5, "F"); pdf.setTextColor(...NAVY); pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.text("COMMERCECRAFT", 23, 29.5);
  pdf.setFillColor(...VIOLET); pdf.roundedRect(18, 75, 54, 7, 3.5, 3.5, "F"); pdf.setTextColor(255, 255, 255); pdf.setFontSize(7); pdf.text("AI PERFORMANCE REPORT", 23, 79.6);
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(33); pdf.text("Your store,", 18, 107); pdf.text("made actionable.", 18, 121);
  pdf.setFont("helvetica", "normal"); pdf.setTextColor(215, 224, 239); pdf.setFontSize(12); pdf.text("A visual diagnostic of the signals, risks and", 18, 143); pdf.text("growth opportunities inside your live catalog.", 18, 151);
  pdf.setFillColor(255, 255, 255); pdf.roundedRect(18, 180, 174, 42, 5, 5, "F"); pdf.setTextColor(...NAVY); pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.text("STORE SNAPSHOT", 26, 193);
  pdf.setFont("helvetica", "normal"); pdf.setTextColor(...INK); pdf.setFontSize(10); pdf.text(`${products.length} produits reviewed`, 26, 206); pdf.text(`${available} currently available`, 88, 206); pdf.text(`${lowStock.length} stock alerts`, 145, 206);
  pdf.setTextColor(215, 224, 239); pdf.setFontSize(8); pdf.text(`Generated ${exportedAt.toLocaleString("fr-FR", { timeZone: "Africa/Casablanca" })} - Casablanca`, 18, 274); pdf.text(`Source: ${report.source === "anthropic" ? "Claude AI" : "Groq AI"} / anonymized store data`, 18, 282);

  pdf.addPage(); pageDecoration(); section("The store at a glance", "A concise snapshot before the detailed diagnostic.");
  const metrics: Array<[string, string, [number, number, number]]> = [["PRODUCTS", String(products.length), NAVY], ["AVAILABLE", String(available), MINT], ["CART SIGNALS", String(carts), CORAL], ["WISHLIST SAVES", String(saves), VIOLET]];
  metrics.forEach(([label, value, color], index) => { const x = 18 + (index % 2) * 87; const top = y + Math.floor(index / 2) * 32; pdf.setFillColor(255, 255, 255); pdf.roundedRect(x, top, 80, 25, 4, 4, "F"); pdf.setFillColor(...color); pdf.circle(x + 11, top + 11, 5, "F"); pdf.setTextColor(119, 132, 153); pdf.setFont("helvetica", "bold"); pdf.setFontSize(7); pdf.text(label, x + 21, top + 9); pdf.setTextColor(...NAVY); pdf.setFontSize(18); pdf.text(value, x + 21, top + 18); });
  y += 73; section("What needs attention", "Catalog signals that should inform the next decision.");
  pdf.setFillColor(255, 248, 240); pdf.roundedRect(18, y - 3, 174, 24, 4, 4, "F"); pdf.setTextColor(...CORAL); pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.text(`${lowStock.length} products need a stock review`, 25, y + 5); pdf.setTextColor(...INK); pdf.setFont("helvetica", "normal"); pdf.setFontSize(8.5); pdf.text(lowStock.length ? lowStock.slice(0, 4).map((product) => `${product.name} (${product.stock})`).join("  |  ") : "No products are below the configured stock threshold.", 25, y + 13);
  y += 33; section("AI diagnostic", "Recommendations grounded in your current catalog.");
  for (const line of report.narrative.replace(/\r/g, "").split(/\n+/).filter((item) => item.trim())) { if (/^#{1,3}\s/.test(line)) section(line.replace(/^#{1,3}\s*/, "")); else paragraph(line); }
  section("Inventory watchlist", "Prioritize availability before amplifying demand."); if (!lowStock.length) paragraph("All products currently hold at least 10 units of inventory."); for (const product of lowStock) paragraph(`${product.name} - ${product.stock === 0 ? "Out of stock" : `${product.stock} unit(s) remaining`}`);
  if (!products.length) paragraph("Aucun signal d'interet pour les produits disponibles.");
  footer();
  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) { pdf.setPage(page); pdf.setFont("helvetica", "normal"); pdf.setTextColor(119, 132, 153); pdf.setFontSize(7.5); pdf.text(`${page} / ${pageCount}`, 192, 288, { align: "right" }); }
  return pdf;
}
