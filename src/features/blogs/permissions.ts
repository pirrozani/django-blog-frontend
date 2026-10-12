import type { Account, Blog } from '../../api/types.ts';

/**
 * Whether the account can write blogs: blogs belong to the account's author
 * profile, so an account without one gets 403 on create.
 */
export function canCreateBlog(account: Account | null): boolean {
  return account?.author_id != null;
}

/** Whether the account can edit or delete `blog`: its own, or any as staff. */
export function canChangeBlog(account: Account | null, blog: Blog): boolean {
  if (!account) return false;
  return account.is_staff || account.author_id === blog.user;
}
