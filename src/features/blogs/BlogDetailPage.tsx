import { Link, useParams } from 'react-router';
import { ApiError } from '../../api/client.ts';
import { useAuth } from '../../auth/AuthContext.ts';
import { Button } from '../../components/Button.tsx';
import { ErrorState } from '../../components/ErrorState.tsx';
import { NotFoundPage } from '../../components/NotFoundPage.tsx';
import { PageTitle } from '../../components/PageTitle.tsx';
import { Spinner } from '../../components/Spinner.tsx';
import { BlogMeta } from './BlogMeta.tsx';
import { useBlog } from './queries.ts';

/** The route's `:id` as a positive integer, or `null` when it isn't one. */
function parseBlogId(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function BlogNotFound() {
  return (
    <NotFoundPage
      title="Blog not found"
      message="This blog doesn't exist, or it was deleted."
    />
  );
}

function BlogDetail({ id }: { id: number }) {
  const { status } = useAuth();
  const { data: blog, error, isPending, isError, refetch } = useBlog(id);

  if (isPending) return <Spinner label="Loading the blog…" />;
  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <BlogNotFound />;
    }
    return (
      <ErrorState
        error={error}
        title="This blog didn't load"
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <article>
      <Link
        to="/blogs"
        className="rounded-sm text-sm font-medium text-moss underline-offset-4 hover:text-moss-deep hover:underline"
      >
        All blogs
      </Link>
      <div className="mt-4">
        <PageTitle>{blog.title}</PageTitle>
      </div>
      <BlogMeta blog={blog} className="mt-4" />

      {status === 'authenticated' && (
        <div className="mt-6 flex gap-3">
          <Link
            to={`/blogs/${blog.id}/edit`}
            className="inline-flex items-center justify-center rounded-md border border-mist bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink-soft"
          >
            Edit
          </Link>
          {/* Deleting is wired up in #6. */}
          <Button variant="danger" disabled>
            Delete
          </Button>
        </div>
      )}

      <div className="mt-10 max-w-prose border-t border-mist pt-8 font-serif text-lg leading-8 break-words whitespace-pre-wrap text-ink">
        {blog.content}
      </div>
    </article>
  );
}

export function BlogDetailPage() {
  const id = parseBlogId(useParams().id);
  if (id === null) return <BlogNotFound />;
  return <BlogDetail id={id} />;
}
