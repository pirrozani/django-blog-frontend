import { Link } from 'react-router';
import type { Blog } from '../../api/types.ts';
import { BlogMeta } from './BlogMeta.tsx';
import { excerpt } from './format.ts';

interface BlogCardProps {
  blog: Blog;
  /** The title's heading level: `h3` under a section heading. */
  heading?: 'h2' | 'h3';
  /** `lead` sets the newest blog large at the top of the feed. */
  variant?: 'lead' | 'row';
}

// The title's link covers the whole card (`after:inset-0`); the author link
// sits above it (`z-10` in BlogMeta) so both stay clickable.
const cardClass =
  'group relative -mx-5 rounded-3xl px-5 transition duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-lift has-[:focus-visible]:shadow-lift sm:-mx-8 sm:px-8';

const titleLinkClass =
  'transition-colors duration-200 ease-in-out group-hover:text-accent-deep after:absolute after:inset-0 after:rounded-3xl';

/** A blog in a list: title (linking to the blog), byline and excerpt. */
export function BlogCard({
  blog,
  heading: Heading = 'h2',
  variant = 'row',
}: BlogCardProps) {
  if (variant === 'lead') {
    return (
      <article className={`${cardClass} py-8 sm:py-10`}>
        <Heading className="max-w-3xl text-2xl leading-[1.15] font-medium tracking-[-0.015em] text-balance break-words sm:text-3xl">
          <Link to={`/blogs/${blog.id}`} className={titleLinkClass}>
            {blog.title}
          </Link>
        </Heading>
        <BlogMeta blog={blog} className="mt-4" />
        <p className="mt-4 max-w-2xl font-serif text-lg leading-relaxed text-ink-body">
          {excerpt(blog.content)}
        </p>
      </article>
    );
  }

  return (
    <article
      className={`${cardClass} grid gap-x-12 gap-y-3 py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]`}
    >
      <div>
        <Heading className="text-xl leading-snug font-medium tracking-tight break-words sm:text-[1.375rem]">
          <Link to={`/blogs/${blog.id}`} className={titleLinkClass}>
            {blog.title}
          </Link>
        </Heading>
        <BlogMeta blog={blog} className="mt-3" />
      </div>
      <p className="max-w-prose leading-relaxed break-words text-ink-muted md:pt-1.5">
        {excerpt(blog.content)}
      </p>
    </article>
  );
}
