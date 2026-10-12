import { apiFetch, type RequestOptions } from './client.ts';
import type { ListResponse } from './pagination.ts';
import type { Blog, BlogRequest, PatchedBlogRequest } from './types.ts';

/**
 * One page of blogs, newest first. A backend that doesn't paginate yet
 * ignores `?page=` and returns every blog as a plain array.
 */
export function listBlogs(
  page = 1,
  options?: RequestOptions,
): Promise<ListResponse<Blog>> {
  const query = page > 1 ? `?page=${page}` : '';
  return apiFetch<ListResponse<Blog>>(`/api/blogs/${query}`, options);
}

export function getBlog(id: number, options?: RequestOptions): Promise<Blog> {
  return apiFetch<Blog>(`/api/blogs/${id}/`, options);
}

export function createBlog(blog: BlogRequest): Promise<Blog> {
  return apiFetch<Blog>('/api/blogs/', { method: 'POST', body: blog });
}

/** Partial update (`PATCH`): send only the changed fields. */
export function updateBlog(
  id: number,
  changes: PatchedBlogRequest,
): Promise<Blog> {
  return apiFetch<Blog>(`/api/blogs/${id}/`, {
    method: 'PATCH',
    body: changes,
  });
}

export function deleteBlog(id: number): Promise<void> {
  return apiFetch<void>(`/api/blogs/${id}/`, { method: 'DELETE' });
}
