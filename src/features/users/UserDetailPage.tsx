import { Navigate, useParams, useSearchParams } from 'react-router';
import { ApiError } from '../../api/client.ts';
import { PAGE_SIZE, toPage } from '../../api/pagination.ts';
import type { User } from '../../api/types.ts';
import { EmptyState } from '../../components/EmptyState.tsx';
import { BackLink } from '../../components/BackLink.tsx';
import { ErrorState } from '../../components/ErrorState.tsx';
import { PageTitle } from '../../components/PageTitle.tsx';
import { Pagination } from '../../components/Pagination.tsx';
import { Spinner } from '../../components/Spinner.tsx';
import { parseId, parsePage } from '../../routeParams.ts';
import { BlogCard } from '../blogs/BlogCard.tsx';
import { formatBlogDate } from '../blogs/format.ts';
import { AuthorMonogram } from './AuthorMonogram.tsx';
import { authorName } from './authorName.ts';
import { useUser, useUserBlogs } from './queries.ts';
import { UserNotFound } from './UserNotFound.tsx';

function UserBlogs({ user }: { user: User }) {
  const [searchParams] = useSearchParams();
  const requested = parsePage(searchParams.get('page'));
  const { data, error, isPending, isError, isPlaceholderData, refetch } =
    useUserBlogs(user.id, requested);

  if (isPending) return <Spinner label="Loading their blogs…" />;
  if (isError) {
    // Past the last page the API answers 404 "Invalid page.": start over.
    if (error instanceof ApiError && error.status === 404 && requested > 1) {
      return <Navigate to={`/users/${user.id}`} replace />;
    }
    return (
      <ErrorState
        error={error}
        title="Their blogs didn't load"
        onRetry={() => void refetch()}
      />
    );
  }

  const { count, totalPages } = toPage(data, 1, PAGE_SIZE);
  if (count === 0) {
    return (
      <EmptyState title="No blogs yet">
        {authorName(user)} hasn't written anything yet.
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
        {items.map((blog) => (
          <li key={blog.id}>
            <BlogCard blog={blog} heading="h3" />
          </li>
        ))}
      </ul>
      <Pagination page={page} totalPages={totalPages} />
    </>
  );
}

function UserDetail({ id }: { id: number }) {
  const { data: user, error, isPending, isError, refetch } = useUser(id);

  if (isPending) return <Spinner label="Loading the author…" />;
  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <UserNotFound />;
    }
    return (
      <ErrorState
        error={error}
        title="This author didn't load"
        onRetry={() => void refetch()}
      />
    );
  }

  // email and mobile are personal data: the demo doesn't show them.
  return (
    <div>
      <BackLink to="/users">All authors</BackLink>
      <header className="mt-10 flex flex-col gap-6 sm:mt-14 sm:flex-row sm:items-center sm:gap-8">
        <AuthorMonogram author={user} size="lg" />
        <div className="min-w-0">
          <PageTitle>{authorName(user)}</PageTitle>
          <p className="mt-3 flex flex-wrap gap-x-5 text-ink-muted">
            <span>{user.username}</span>
            <span>
              Joined{' '}
              <time dateTime={user.register_at}>
                {formatBlogDate(user.register_at)}
              </time>
            </span>
          </p>
        </div>
      </header>

      <section
        aria-labelledby="author-blogs"
        className="mt-16 border-t border-line pt-12 sm:mt-24 sm:pt-16"
      >
        <h2 id="author-blogs" className="text-2xl font-medium tracking-tight">
          Blogs
        </h2>
        <div className="mt-6 sm:mt-8">
          <UserBlogs user={user} />
        </div>
      </section>
    </div>
  );
}

export function UserDetailPage() {
  const id = parseId(useParams().id);
  if (id === null) return <UserNotFound />;
  return <UserDetail id={id} />;
}
