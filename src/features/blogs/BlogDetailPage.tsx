import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ApiError } from '../../api/client.ts';
import type { Blog } from '../../api/types.ts';
import { useAuth } from '../../auth/AuthContext.ts';
import { Button } from '../../components/Button.tsx';
import { ConfirmDialog } from '../../components/ConfirmDialog.tsx';
import { errorMessage } from '../../components/errorMessage.ts';
import { ErrorState } from '../../components/ErrorState.tsx';
import { PageTitle } from '../../components/PageTitle.tsx';
import { Spinner } from '../../components/Spinner.tsx';
import { BlogMeta } from './BlogMeta.tsx';
import { parseBlogId } from './blogId.ts';
import { BlogNotFound } from './BlogNotFound.tsx';
import { canChangeBlog } from './permissions.ts';
import { useBlog, useDeleteBlog } from './queries.ts';

function BlogActions({ blog }: { blog: Blog }) {
  const [confirming, setConfirming] = useState(false);
  const deletion = useDeleteBlog();

  return (
    <div className="mt-6 flex gap-3">
      <Link
        to={`/blogs/${blog.id}/edit`}
        className="inline-flex items-center justify-center rounded-md border border-mist bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink-soft"
      >
        Edit
      </Link>
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Delete
      </Button>
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
    </div>
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

      {canChangeBlog(user, blog) && <BlogActions blog={blog} />}

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
