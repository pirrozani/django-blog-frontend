import { Link } from 'react-router';
import type { Blog } from '../../api/types.ts';
import { authorName } from '../users/authorName.ts';
import { formatBlogDate } from './format.ts';

interface BlogMetaProps {
  blog: Blog;
  className?: string;
}

/** "By <author>" and the date, with the author linking to their profile. */
export function BlogMeta({ blog, className = '' }: BlogMetaProps) {
  return (
    <p
      className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-ink-muted ${className}`}
    >
      <span>
        By{' '}
        <Link
          to={`/users/${blog.author.id}`}
          className="relative z-10 font-medium text-ink-body transition-colors duration-200 ease-in-out hover:text-accent"
        >
          {authorName(blog.author)}
        </Link>
      </span>
      <time dateTime={blog.created_at}>{formatBlogDate(blog.created_at)}</time>
    </p>
  );
}
