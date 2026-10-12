import type { AuthorSummary } from '../../api/types.ts';
import { authorName } from './authorName.ts';

type NamedAuthor = Pick<AuthorSummary, 'username' | 'first_name' | 'last_name'>;

const sizes = {
  sm: 'size-10 text-lg',
  md: 'size-12 text-xl',
  lg: 'size-16 text-3xl',
};

/** The author's initial in a circle. Decorative: their name sits next to it. */
export function AuthorMonogram({
  author,
  size = 'md',
}: {
  author: NamedAuthor;
  size?: keyof typeof sizes;
}) {
  return (
    <span
      aria-hidden="true"
      className={`${sizes[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-accent-wash font-serif font-medium text-accent-deep select-none`}
    >
      {Array.from(authorName(author))[0]?.toUpperCase()}
    </span>
  );
}
