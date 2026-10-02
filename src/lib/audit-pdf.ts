import { jsPDF } from "jspdf";
import type { AdminAuditReport } from "@/lib/services/admin-audit-service";
import type { Product, UserCommerceData } from "@/types";

export function createAuditPdf(report: AdminAuditReport, products: Product[], activity: UserCommerceData[], exportedAt = new Date()) {
  const pdf = new jsPDF();
  const clean = (text: string) => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/\*\*/g, "").replace(/[^\u0020-\u00ff\n]/g, " ");
  let y = 48;
  function header() {
    pdf.setFillColor(23, 32, 51); pdf.rect(0, 0, 210, 34, "F");
    pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(18);
    pdf.text("CommerceCraft", 18, 16);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(10); pdf.text("Diagnostic de la boutique - Rapport IA", 18, 25);
  }
  function write(text: string, heading = false) {
    pdf.setFont("helvetica", heading ? "bold" : "normal"); pdf.setFontSize(heading ? 13 : 10);
    const lines = pdf.splitTextToSize(clean(text), 174) as string[];
    for (const line of lines) {
      if (y > 269) { pdf.addPage(); header(); y = 48; }
      if (heading) pdf.setTextColor(109, 40, 217); else pdf.setTextColor(51, 65, 85);
      pdf.text(line, 18, y); y += heading ? 7 : 5.5;
    }
    y += heading ? 3 : 5;
  }
  header();
  write(`Export du ${exportedAt.toLocaleString("fr-FR", { timeZone: "Africa/Casablanca" })} (Casablanca)`);
  write("Indicateurs du catalogue", true);
  const available = products.filter((p) => p.stock > 0).length;
  const lowStock = products.filter((p) => p.stock < 10).sort((a, b) => a.stock - b.stock);
  const carts = activity.reduce((sum, user) => sum + user.cart.reduce((n, item) => n + item.quantity, 0), 0);
  const saves = activity.reduce((sum, user) => sum + user.wishlist.length, 0);
  write(`${products.length} produits | ${available} disponibles | ${lowStock.length} stocks sous 10 unites`);
  write(`${carts} unites dans les paniers | ${saves} ajouts en favoris`);
  write(`Descriptions de 100 caracteres ou plus : ${products.filter((p) => p.description.trim().length >= 100).length}/${products.length}`);
  write("Diagnostic et recommandations de l'IA", true);
  for (const paragraph of report.narrative.replace(/\r/g, "").split(/\n+/).filter((line) => line.trim())) {
    const heading = /^#{1,3}\s/.test(paragraph);
    write(paragraph.replace(/^#{1,3}\s*/, ""), heading);
  }
  write("Produits a surveiller", true);
  if (!lowStock.length) write("Tous les produits disposent d'au moins 10 unites en stock.");
  for (const p of lowStock) write(`${p.name} - ${p.stock === 0 ? "Rupture de stock" : `${p.stock} unite(s) restante(s)`}`);
  write("Interet client - produits disponibles", true);
  const ranked = products.filter((p) => p.stock > 0).map((p) => {
    const cart = activity.reduce((sum, user) => sum + user.cart.filter((item) => item.productId === p.id).reduce((n, item) => n + item.quantity, 0), 0);
    const wishlist = activity.reduce((sum, user) => sum + user.wishlist.filter((item) => item.productId === p.id).length, 0);
    return { name: p.name, cart, wishlist, score: cart + wishlist };
  }).filter((p) => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
  if (!ranked.length) write("Aucun signal d'interet pour les produits disponibles.");
  for (const p of ranked) write(`${p.name} - Panier : ${p.cart} | Favoris : ${p.wishlist}`);
  write(`Analyse generee par ${report.source === "anthropic" ? "Claude AI" : "Groq AI"}. Donnees clients agregees, sans identites. Les indicateurs correspondent au catalogue au moment de l'export.`);
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page); pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
    pdf.text("CommerceCraft | Diagnostic IA", 18, 286); pdf.text(`${page} / ${pages}`, 192, 286, { align: "right" });
  }
  return pdf;
}
