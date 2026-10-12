import type { AuthorSummary } from '../../api/types.ts';

type NamedAuthor = Pick<AuthorSummary, 'username' | 'first_name' | 'last_name'>;

/** An author's full name, or their username when they have none. */
export function authorName({
  username,
  first_name,
  last_name,
}: NamedAuthor): string {
  return `${first_name} ${last_name}`.trim() || username;
}
