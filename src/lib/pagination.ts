export function paginate<T>(items: T[], rawPage: string | null, pageSize = 12) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const requested = rawPage && /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  const page = Math.min(pageCount, Math.max(1, Number.isSafeInteger(requested) ? requested : 1));
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageCount, from: items.length ? start + 1 : 0, to: Math.min(start + pageSize, items.length) };
}

export function productPageHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  if (page === 1) next.delete("page"); else next.set("page", String(page));
  return `/products${next.size ? `?${next}` : ""}#catalog-results`;
}
