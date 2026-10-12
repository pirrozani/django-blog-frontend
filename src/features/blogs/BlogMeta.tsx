import { Link } from 'react-router';
import type { Blog } from '../../api/types.ts';
import { authorName } from '../users/authorName.ts';
import { formatBlogDate } from './format.ts';

interface BlogMetaProps {
  blog: Blog;
  className?: string;
}

/** "By <author> on <date>", with the author linking to their profile. */
export function BlogMeta({ blog, className = 'mt-2 text-sm' }: BlogMetaProps) {
  return (
    <p className={`text-ink-soft ${className}`}>
      By{' '}
      <Link
        to={`/users/${blog.author.id}`}
        className="rounded-sm font-medium text-moss underline-offset-4 hover:text-moss-deep hover:underline"
      >
        {authorName(blog.author)}
      </Link>{' '}
      on{' '}
      <time dateTime={blog.created_at}>{formatBlogDate(blog.created_at)}</time>
    </p>
  );
}
