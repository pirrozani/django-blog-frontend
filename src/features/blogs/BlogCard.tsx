import { Link } from 'react-router';
import type { Blog } from '../../api/types.ts';
import { BlogMeta } from './BlogMeta.tsx';
import { excerpt } from './format.ts';

interface BlogCardProps {
  blog: Blog;
  /** The title's heading level: `h3` under a section heading. */
  heading?: 'h2' | 'h3';
}

/** A blog in a list: title (linking to the blog), byline and excerpt. */
export function BlogCard({ blog, heading: Heading = 'h2' }: BlogCardProps) {
  return (
    <article className="py-7">
      <Heading className="text-2xl leading-snug font-semibold tracking-tight">
        <Link
          to={`/blogs/${blog.id}`}
          className="rounded-sm text-ink hover:text-moss"
        >
          {blog.title}
        </Link>
      </Heading>
      <BlogMeta blog={blog} />
      <p className="mt-3 max-w-prose text-ink-soft">{excerpt(blog.content)}</p>
    </article>
  );
}
