import { Link, Navigate, useSearchParams } from 'react-router';
import { ApiError } from '../../api/client.ts';
import { PAGE_SIZE, toPage } from '../../api/pagination.ts';
import type { User } from '../../api/types.ts';
import { EmptyState } from '../../components/EmptyState.tsx';
import { ErrorState } from '../../components/ErrorState.tsx';
import { PageTitle } from '../../components/PageTitle.tsx';
import { Pagination } from '../../components/Pagination.tsx';
import { Spinner } from '../../components/Spinner.tsx';
import { parsePage } from '../../routeParams.ts';
import { formatBlogDate } from '../blogs/format.ts';
import { AuthorMonogram } from './AuthorMonogram.tsx';
import { authorName } from './authorName.ts';
import { useUsers } from './queries.ts';

function UserRow({ user }: { user: User }) {
  return (
    // The name's link covers the whole card (`after:inset-0`).
    <article className="group relative flex items-center gap-5 rounded-3xl p-5 transition duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-lift">
      <AuthorMonogram author={user} />
      <div className="min-w-0">
        <h2 className="text-xl leading-snug font-medium tracking-tight break-words">
          <Link
            to={`/users/${user.id}`}
            className="transition-colors duration-200 ease-in-out group-hover:text-accent-deep after:absolute after:inset-0 after:rounded-3xl"
          >
            {authorName(user)}
          </Link>
        </h2>
        <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-ink-muted">
          <span>{user.username}</span>
          <span>
            Joined{' '}
            <time dateTime={user.register_at}>
              {formatBlogDate(user.register_at)}
            </time>
          </span>
        </p>
      </div>
    </article>
  );
}

function UserList() {
  const [searchParams] = useSearchParams();
  const requested = parsePage(searchParams.get('page'));
  const { data, error, isPending, isError, isPlaceholderData, refetch } =
    useUsers(requested);

  if (isPending) return <Spinner label="Loading authors…" />;
  if (isError) {
    // Past the last page the API answers 404 "Invalid page.": start over.
    if (error instanceof ApiError && error.status === 404 && requested > 1) {
      return <Navigate to="/users" replace />;
    }
    return (
      <ErrorState
        error={error}
        title="Authors didn't load"
        onRetry={() => void refetch()}
      />
    );
  }

  const { count, totalPages } = toPage(data, 1, PAGE_SIZE);
  if (count === 0) {
    return (
      <EmptyState title="No authors yet">
        Authors show up here once someone adds one.
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
        className={`-mx-5 grid gap-2 transition-opacity duration-200 md:grid-cols-2 md:gap-x-6 ${isPlaceholderData ? 'opacity-50' : ''}`}
      >
        {items.map((user) => (
          <li key={user.id}>
            <UserRow user={user} />
          </li>
        ))}
      </ul>
      <Pagination page={page} totalPages={totalPages} />
    </>
  );
}

export function UserListPage() {
  return (
    <section>
      <PageTitle>Authors</PageTitle>
      <p className="mt-3 text-ink-muted sm:text-lg">
        Everyone who writes here. Open an author to read their blogs.
      </p>
      <div className="mt-10 sm:mt-12">
        <UserList />
      </div>
    </section>
  );
}
