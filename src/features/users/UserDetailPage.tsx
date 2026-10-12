import { Link, Navigate, useParams, useSearchParams } from 'react-router';
import { ApiError } from '../../api/client.ts';
import { PAGE_SIZE, toPage } from '../../api/pagination.ts';
import type { User } from '../../api/types.ts';
import { EmptyState } from '../../components/EmptyState.tsx';
import { ErrorState } from '../../components/ErrorState.tsx';
import { PageTitle } from '../../components/PageTitle.tsx';
import { Pagination } from '../../components/Pagination.tsx';
import { Spinner } from '../../components/Spinner.tsx';
import { parseId, parsePage } from '../../routeParams.ts';
import { BlogCard } from '../blogs/BlogCard.tsx';
import { formatBlogDate } from '../blogs/format.ts';
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
        className={`divide-y divide-mist border-y border-mist transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}
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
    <article>
      <Link
        to="/users"
        className="rounded-sm text-sm font-medium text-moss underline-offset-4 hover:text-moss-deep hover:underline"
      >
        All authors
      </Link>
      <div className="mt-4">
        <PageTitle>{authorName(user)}</PageTitle>
      </div>
      <p className="mt-3 text-ink-soft">
        {user.username} · Joined{' '}
        <time dateTime={user.register_at}>
          {formatBlogDate(user.register_at)}
        </time>
      </p>

      <section aria-labelledby="author-blogs" className="mt-12">
        <h2
          id="author-blogs"
          className="text-sm font-semibold tracking-wide text-ink-soft uppercase"
        >
          Blogs
        </h2>
        <div className="mt-4">
          <UserBlogs user={user} />
        </div>
      </section>
    </article>
  );
}

export function UserDetailPage() {
  const id = parseId(useParams().id);
  if (id === null) return <UserNotFound />;
  return <UserDetail id={id} />;
}
