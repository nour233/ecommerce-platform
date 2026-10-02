import { expect, it } from "vitest";
import { paginate, productPageHref } from "@/lib/pagination";

it("splits products into pages without overlap and clamps out-of-range pages", () => {
  const products = Array.from({ length: 29 }, (_, index) => index);
  expect(paginate(products, "1").items).toEqual(products.slice(0, 12));
  expect(paginate(products, "2").items).toEqual(products.slice(12, 24));
  expect(paginate(products, "999")).toMatchObject({ page: 3, pageCount: 3, from: 25, to: 29, items: products.slice(24) });
  for (const raw of ["-1", "0", "abc", "2.5", null]) expect(paginate(products, raw).page).toBe(1);
  expect(paginate([], "3")).toMatchObject({ items: [], page: 1, pageCount: 1, from: 0, to: 0 });
});

it("keeps search, category, budget and sorting when changing pages", () => {
  const params = new URLSearchParams("q=lampe&category=home&max=50&sort=rating&page=2");
  const next = new URL(productPageHref(params, 3), "https://example.com");
  expect(next.searchParams.get("page")).toBe("3");
  for (const key of ["q", "category", "max", "sort"]) expect(next.searchParams.get(key)).toBe(params.get(key));
  expect(productPageHref(params, 1)).not.toContain("page=");
  expect(params.get("page")).toBe("2");
});
