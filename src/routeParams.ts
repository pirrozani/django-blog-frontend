/** A `:id` route param as a positive integer, or `null` when it isn't one. */
export function parseId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** `?page=` as a positive integer; anything else is page 1. */
export function parsePage(raw: string | null): number {
  const page = Number(raw ?? '1');
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}
