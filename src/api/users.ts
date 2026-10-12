import { apiFetch, type RequestOptions } from './client.ts';
import type { ListResponse } from './pagination.ts';
import type { Blog, User } from './types.ts';

const pageQuery = (page: number) => (page > 1 ? `?page=${page}` : '');

/**
 * One page of authors (content, not login accounts), newest first. A backend
 * that doesn't paginate yet ignores `?page=` and returns them all.
 */
export function listUsers(
  page = 1,
  options?: RequestOptions,
): Promise<ListResponse<User>> {
  return apiFetch<ListResponse<User>>(`/api/users/${pageQuery(page)}`, options);
}

export function getUser(id: number, options?: RequestOptions): Promise<User> {
  return apiFetch<User>(`/api/users/${id}/`, options);
}

/**
 * One page of an author's blogs: 200 with an empty list when there are none,
 * 404 for an unknown author.
 */
export function listUserBlogs(
  id: number,
  page = 1,
  options?: RequestOptions,
): Promise<ListResponse<Blog>> {
  return apiFetch<ListResponse<Blog>>(
    `/api/users/${id}/blogs/${pageQuery(page)}`,
    options,
  );
}
