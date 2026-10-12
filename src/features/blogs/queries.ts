import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getBlog, listBlogs } from '../../api/blogs.ts';
import type { ListResponse } from '../../api/pagination.ts';
import type { Blog } from '../../api/types.ts';

export const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (page: number) => [...blogKeys.lists(), page] as const,
  detail: (id: number) => [...blogKeys.all, 'detail', id] as const,
};

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

/**
 * Page `page` of the blogs (cut with `toPage`). The previous page stays on
 * screen while the next one loads.
 */
export function useBlogs(page: number) {
  return useQuery({
    queryKey: blogKeys.list(page),
    queryFn: ({ signal }) => listBlogs(page, { signal }),
    select: newestFirst,
    placeholderData: keepPreviousData,
  });
}

export function useBlog(id: number) {
  return useQuery({
    queryKey: blogKeys.detail(id),
    queryFn: ({ signal }) => getBlog(id, { signal }),
  });
}
