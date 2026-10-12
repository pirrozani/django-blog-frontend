/** DRF's paginated list shape (backend issue #11). */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** A list response: a plain array today, paginated once the backend paginates. */
export type ListResponse<T> = T[] | Paginated<T>;

export interface Page<T> {
  items: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Normalizes a list response into one page. A plain array is sliced on the
 * client; a paginated response is taken as the server's page `page`.
 * `page` below 1 (or not a number) becomes 1; a page past the end is empty.
 *
 * For a paginated response, `pageSize` must equal the server's page size
 * (10, per backend #11), since `totalPages` is derived from it.
 */
export function toPage<T>(
  data: ListResponse<T>,
  page: number,
  pageSize = 10,
): Page<T> {
  const current = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const size = Number.isFinite(pageSize)
    ? Math.max(1, Math.floor(pageSize))
    : 10;

  if (Array.isArray(data)) {
    const start = (current - 1) * size;
    return {
      items: data.slice(start, start + size),
      count: data.length,
      page: current,
      pageSize: size,
      totalPages: Math.max(1, Math.ceil(data.length / size)),
    };
  }

  return {
    items: data.results,
    count: data.count,
    page: current,
    pageSize: size,
    totalPages: Math.max(1, Math.ceil(data.count / size)),
  };
}
