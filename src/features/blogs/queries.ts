import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import {
  createBlog,
  deleteBlog,
  getBlog,
  listBlogs,
  updateBlog,
} from '../../api/blogs.ts';
import { ApiError } from '../../api/client.ts';
import type { ListResponse } from '../../api/pagination.ts';
import type { Blog, BlogRequest, PatchedBlogRequest } from '../../api/types.ts';
import { userKeys } from '../users/queries.ts';

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

/** Marks the blog lists and the author's blog list stale (refetched on view). */
function invalidateBlogLists(queryClient: QueryClient, authorId: number) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: blogKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: userKeys.blogs(authorId) }),
  ]);
}

/** `POST /api/blogs/`, then opens the new blog. */
export function useCreateBlog() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (blog: BlogRequest) => createBlog(blog),
    onSuccess: async (blog) => {
      queryClient.setQueryData(blogKeys.detail(blog.id), blog);
      void invalidateBlogLists(queryClient, blog.user);
      await navigate(`/blogs/${blog.id}`);
    },
  });
}

/** `PATCH /api/blogs/<id>/` with only the changed fields, then opens the blog. */
export function useUpdateBlog(id: number) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (changes: PatchedBlogRequest) => updateBlog(id, changes),
    onSuccess: async (blog) => {
      // The response is the updated blog: no need to refetch the detail.
      queryClient.setQueryData(blogKeys.detail(blog.id), blog);
      void invalidateBlogLists(queryClient, blog.user);
      await navigate(`/blogs/${blog.id}`);
    },
  });
}

/** `DELETE /api/blogs/<id>/`, then goes back to the list. */
export function useDeleteBlog() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (blog: Blog) => {
      try {
        await deleteBlog(blog.id);
      } catch (error) {
        // Already deleted (the demo account is shared): the goal is met.
        if (!(error instanceof ApiError && error.status === 404)) throw error;
      }
    },
    onSuccess: async (_, blog) => {
      // Refetch the cached lists before leaving, so /blogs never shows the
      // deleted blog. The detail page is still mounted: leave its query alone
      // (a refetch would 404) and drop it once the page is gone.
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: blogKeys.lists(),
          refetchType: 'all',
        }),
        queryClient.invalidateQueries({
          queryKey: userKeys.blogs(blog.user),
          refetchType: 'all',
        }),
      ]);
      await navigate('/blogs');
      // After the detail page has unmounted, so its query isn't recreated.
      setTimeout(() =>
        queryClient.removeQueries({ queryKey: blogKeys.detail(blog.id) }),
      );
    },
  });
}
