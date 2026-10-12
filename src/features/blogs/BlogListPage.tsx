import { Link, Navigate, useSearchParams } from 'react-router';
import { ApiError } from '../../api/client.ts';
import { toPage } from '../../api/pagination.ts';
import type { Blog } from '../../api/types.ts';
import { useAuth } from '../../auth/AuthContext.ts';
import { EmptyState } from '../../components/EmptyState.tsx';
import { ErrorState } from '../../components/ErrorState.tsx';
import { PageTitle } from '../../components/PageTitle.tsx';
import { Pagination } from '../../components/Pagination.tsx';
import { Spinner } from '../../components/Spinner.tsx';
import { BlogMeta } from './BlogMeta.tsx';
import { excerpt } from './format.ts';
import { canCreateBlog } from './permissions.ts';
import { useBlogs } from './queries.ts';

/** The API's page size (backend #11); also used to page a plain array. */
const PAGE_SIZE = 10;

/** `?page=` as a positive integer; anything else is page 1. */
function parsePage(raw: string | null): number {
  const page = Number(raw ?? '1');
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

function BlogCard({ blog }: { blog: Blog }) {
  return (
    <article className="py-7">
      <h2 className="text-2xl leading-snug font-semibold tracking-tight">
        <Link
          to={`/blogs/${blog.id}`}
          className="rounded-sm text-ink hover:text-moss"
        >
          {blog.title}
        </Link>
      </h2>
      <BlogMeta blog={blog} />
      <p className="mt-3 max-w-prose text-ink-soft">{excerpt(blog.content)}</p>
    </article>
  );
}

function BlogList() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requested = parsePage(searchParams.get('page'));
  const { data, error, isPending, isError, isPlaceholderData, refetch } =
    useBlogs(requested);

  if (isPending) return <Spinner label="Loading blogs…" />;
  if (isError) {
    // Past the last page the API answers 404 "Invalid page.": start over.
    if (error instanceof ApiError && error.status === 404 && requested > 1) {
      return <Navigate to="/blogs" replace />;
    }
    return (
      <ErrorState
        error={error}
        title="Blogs didn't load"
        onRetry={() => void refetch()}
      />
    );
  }

  const { count, totalPages } = toPage(data, 1, PAGE_SIZE);
  if (count === 0) {
    return (
      <EmptyState
        title="No blogs yet"
        action={
          canCreateBlog(user) && (
            <Link
              to="/blogs/new"
              className="font-medium text-moss underline underline-offset-4 hover:text-moss-deep"
            >
              Write the first one
            </Link>
          )
        }
      >
        Blogs show up here once an author writes one.
      </EmptyState>
    );
  }

  // A plain array holds every page: past the end, show the last one.
  const page = Math.min(requested, totalPages);
  const { items } = toPage(data, page, PAGE_SIZE);

  return (
    <>
      <ul
        aria-busy={isPlaceholderData}
        className={`divide-y divide-mist border-y border-mist transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}
      >
        {items.map((blog) => (
          <li key={blog.id}>
            <BlogCard blog={blog} />
          </li>
        ))}
      </ul>
      <Pagination page={page} totalPages={totalPages} />
    </>
  );
}

export function BlogListPage() {
  const { user } = useAuth();
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle>Blogs</PageTitle>
        {canCreateBlog(user) && (
          <Link
            to="/blogs/new"
            className="inline-flex items-center justify-center rounded-md bg-moss px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-moss-deep"
          >
            New blog
          </Link>
        )}
      </div>
      <div className="mt-8">
        <BlogList />
      </div>
    </section>
  );
}
