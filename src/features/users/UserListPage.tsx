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
import { authorName } from './authorName.ts';
import { useUsers } from './queries.ts';

function UserRow({ user }: { user: User }) {
  return (
    <article className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-5">
      <div>
        <h2 className="text-xl leading-snug font-semibold tracking-tight">
          <Link
            to={`/users/${user.id}`}
            className="rounded-sm text-ink hover:text-moss"
          >
            {authorName(user)}
          </Link>
        </h2>
        <p className="mt-0.5 text-sm text-ink-soft">@{user.username}</p>
      </div>
      <p className="text-sm text-ink-soft">
        Joined{' '}
        <time dateTime={user.register_at}>
          {formatBlogDate(user.register_at)}
        </time>
      </p>
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
        className={`divide-y divide-mist border-y border-mist transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}
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
      <div className="mt-8">
        <UserList />
      </div>
    </section>
  );
}
