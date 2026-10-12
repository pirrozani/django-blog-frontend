/** A `:id` route param as a positive integer, or `null` when it isn't one. */
export function parseBlogId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
