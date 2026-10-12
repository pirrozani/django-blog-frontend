import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError } from '../../api/client.ts';
import type { Blog } from '../../api/types.ts';
import { useAuth } from '../../auth/AuthContext.ts';
import { BackLink } from '../../components/BackLink.tsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.tsx';
import { errorMessage } from '../../components/errorMessage.ts';
import { ErrorState } from '../../components/ErrorState.tsx';
import { PageTitle } from '../../components/PageTitle.tsx';
import { Spinner } from '../../components/Spinner.tsx';
import { parseId } from '../../routeParams.ts';
import { AuthorMonogram } from '../users/AuthorMonogram.tsx';
import { authorName } from '../users/authorName.ts';
import { BlogNotFound } from './BlogNotFound.tsx';
import { formatBlogDate, paragraphs, readingMinutes } from './format.ts';
import { canChangeBlog } from './permissions.ts';
import { useBlog, useDeleteBlog } from './queries.ts';

const actionClass =
  'rounded-full px-5 py-2 text-sm font-medium transition-colors duration-200 ease-in-out';

function BlogActions({ blog }: { blog: Blog }) {
  const [confirming, setConfirming] = useState(false);
  const deletion = useDeleteBlog();

  return (
    <>
      {/* Floats at the bottom of the screen while the blog is in view. */}
      <div className="sticky bottom-6 z-30 mt-16 flex justify-center">
        <div
          role="group"
          aria-label="Blog actions"
          className="flex items-center gap-1 rounded-full bg-paper/75 p-1.5 shadow-float ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150"
        >
          <Link
            to={`/blogs/${blog.id}/edit`}
            className={`${actionClass} text-ink hover:bg-wash`}
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={`${actionClass} text-danger hover:bg-danger-wash`}
          >
            Delete
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirming}
        title={`Delete "${blog.title}"?`}
        confirmLabel="Delete"
        pending={deletion.isPending}
        error={deletion.isError ? errorMessage(deletion.error) : undefined}
        onConfirm={() => deletion.mutate(blog)}
        onCancel={() => {
          setConfirming(false);
          deletion.reset();
        }}
      >
        This can't be undone.
      </ConfirmDialog>
    </>
  );
}

function BlogDetail({ id }: { id: number }) {
  const { user } = useAuth();
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

  const name = authorName(blog.author);
  const minutes = readingMinutes(blog.content);

  return (
    <article className="mx-auto max-w-3xl">
      <BackLink to="/blogs">All blogs</BackLink>

      <header className="mt-8 border-b border-line pb-10 sm:mt-10 sm:pb-12">
        <PageTitle size="article">{blog.title}</PageTitle>
        <div className="mt-8 flex items-center gap-4">
          <AuthorMonogram author={blog.author} />
          <div className="text-sm">
            <Link
              to={`/users/${blog.author.id}`}
              className="text-base font-medium text-ink transition-colors duration-200 ease-in-out hover:text-accent"
            >
              {name}
            </Link>
            <p className="mt-0.5 flex flex-wrap gap-x-3 text-ink-muted">
              <time dateTime={blog.created_at}>
                {formatBlogDate(blog.created_at)}
              </time>
              <span>{minutes} min read</span>
            </p>
          </div>
        </div>
      </header>

      <div className="mt-10 max-w-reading font-serif text-lg leading-[1.75] text-ink-body sm:mt-12 sm:text-[1.1875rem]">
        {paragraphs(blog.content).map((paragraph, index) => (
          <p
            key={index}
            className="mt-[1.15em] break-words whitespace-pre-wrap first:mt-0"
          >
            {paragraph}
          </p>
        ))}
      </div>

      <aside
        aria-label="About the author"
        className="mt-16 flex items-center gap-5 rounded-3xl bg-wash p-6 sm:p-8"
      >
        <AuthorMonogram author={blog.author} size="lg" />
        <div>
          <p className="font-serif text-xl font-medium text-ink">{name}</p>
          <Link
            to={`/users/${blog.author.id}`}
            className="link-accent mt-1 inline-block text-sm"
          >
            More from this author
          </Link>
        </div>
      </aside>

      {canChangeBlog(user, blog) && <BlogActions blog={blog} />}
    </article>
  );
}

export function BlogDetailPage() {
  const id = parseId(useParams().id);
  if (id === null) return <BlogNotFound />;
  return <BlogDetail id={id} />;
}
