import { expect, it } from "vitest";
import { createAuditPdf } from "@/lib/audit-pdf";

it("exports a paginated PDF without losing the end of a long diagnostic", () => {
  const pdf = createAuditPdf({ source: "anthropic", narrative: `## Priorité à traiter\n${"Description détaillée du diagnostic. ".repeat(500)}\nFIN DU DIAGNOSTIC` }, [], [], new Date("2026-10-02T10:00:00Z"));
  const output = pdf.output();
  expect(output.startsWith("%PDF-")).toBe(true);
  expect(pdf.getNumberOfPages()).toBeGreaterThan(1);
  expect(output).toContain("FIN DU DIAGNOSTIC");
  expect(output).toContain(`${pdf.getNumberOfPages()} / ${pdf.getNumberOfPages()}`);
});

it("exports an empty catalog with explicit empty states", () => {
  const pdf = createAuditPdf({ source: "anthropic", narrative: "Catalogue vide." }, [], []);
  expect(pdf.output()).toContain("0 produits");
  expect(pdf.output()).toContain("Aucun signal");
});
