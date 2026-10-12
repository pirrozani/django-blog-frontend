import { apiFetch, type RequestOptions } from './client.ts';
import type { ListResponse } from './pagination.ts';
import type { Blog, BlogRequest, PatchedBlogRequest } from './types.ts';

export function listBlogs(
  options?: RequestOptions,
): Promise<ListResponse<Blog>> {
  return apiFetch<ListResponse<Blog>>('/api/blogs/', options);
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
