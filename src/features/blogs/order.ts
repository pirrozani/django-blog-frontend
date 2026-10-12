import type { ListResponse } from '../../api/pagination.ts';
import type { Blog } from '../../api/types.ts';

/**
 * Newest first (`created_at`, then `id`), as the paginated API orders them.
 * A backend that doesn't paginate yet returns an unordered array: sort it.
 */
export function newestFirst(data: ListResponse<Blog>): ListResponse<Blog> {
  if (!Array.isArray(data)) return data;
  return [...data].sort((a, b) => {
    if (a.created_at !== b.created_at) {
      return a.created_at < b.created_at ? 1 : -1;
    }
    return b.id - a.id;
  });
}
