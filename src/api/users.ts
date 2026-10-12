import { apiFetch, type RequestOptions } from './client.ts';
import type { ListResponse } from './pagination.ts';
import type { Blog, User } from './types.ts';

/** Authors (content), not login accounts. */
export function listUsers(
  options?: RequestOptions,
): Promise<ListResponse<User>> {
  return apiFetch<ListResponse<User>>('/api/users/', options);
}

export function getUser(id: number, options?: RequestOptions): Promise<User> {
  return apiFetch<User>(`/api/users/${id}/`, options);
}

/** An author's blogs: 200 with an empty list when there are none, 404 for an unknown author. */
export function listUserBlogs(
  id: number,
  options?: RequestOptions,
): Promise<ListResponse<Blog>> {
  return apiFetch<ListResponse<Blog>>(`/api/users/${id}/blogs/`, options);
}
