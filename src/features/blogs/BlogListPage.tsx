import { Link, Navigate, useSearchParams } from 'react-router';
import { ApiError } from '../../api/client.ts';
import { PAGE_SIZE, toPage } from '../../api/pagination.ts';
import { useAuth } from '../../auth/AuthContext.ts';
import { buttonClass } from '../../components/buttonStyles.ts';
import { EmptyState } from '../../components/EmptyState.tsx';
import { ErrorState } from '../../components/ErrorState.tsx';
import { PageTitle } from '../../components/PageTitle.tsx';
import { Pagination } from '../../components/Pagination.tsx';
import { Spinner } from '../../components/Spinner.tsx';
import { parsePage } from '../../routeParams.ts';
import { BlogCard } from './BlogCard.tsx';
import { canCreateBlog } from './permissions.ts';
import { useBlogs } from './queries.ts';

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
            <Link to="/blogs/new" className={buttonClass()}>
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
        className={`transition-opacity duration-200 ${isPlaceholderData ? 'opacity-50' : ''}`}
      >
        {items.map((blog, index) =>
          // On the first page the newest blog leads the feed.
          page === 1 && index === 0 ? (
            <li key={blog.id} className="mb-6 border-b border-line pb-6">
              <BlogCard blog={blog} variant="lead" />
            </li>
          ) : (
            <li key={blog.id}>
              <BlogCard blog={blog} />
            </li>
          ),
        )}
      </ul>
      <Pagination page={page} totalPages={totalPages} />
    </>
  );
}

export function BlogListPage() {
  const { user } = useAuth();
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
        <div>
          <PageTitle>Blogs</PageTitle>
          <p className="mt-3 text-ink-muted sm:text-lg">
            Recent writing from every author, newest first.
          </p>
        </div>
        {canCreateBlog(user) && (
          <Link to="/blogs/new" className={buttonClass()}>
            New blog
          </Link>
        )}
      </div>
      <div className="mt-10 sm:mt-12">
        <BlogList />
      </div>
    </section>
  );
}
