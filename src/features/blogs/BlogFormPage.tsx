import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useForm, type UseFormSetError } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { ApiError } from '../../api/client.ts';
import type { Blog, PatchedBlogRequest } from '../../api/types.ts';
import { useAuth } from '../../auth/AuthContext.ts';
import { Button } from '../../components/Button.tsx';
import { errorMessage } from '../../components/errorMessage.ts';
import { ErrorState } from '../../components/ErrorState.tsx';
import { PageTitle } from '../../components/PageTitle.tsx';
import { Spinner } from '../../components/Spinner.tsx';
import { parseBlogId } from './blogId.ts';
import { BlogNotFound } from './BlogNotFound.tsx';
import { canChangeBlog, canCreateBlog } from './permissions.ts';
import { useBlog, useCreateBlog, useUpdateBlog } from './queries.ts';
import { blogSchema, TITLE_MAX_LENGTH, type BlogValues } from './schema.ts';

const FIELDS = ['title', 'content'] as const;

const inputClass =
  'mt-1 block w-full rounded-md border border-mist bg-white px-3 py-2 text-ink aria-invalid:border-danger';

const linkClass =
  'font-medium text-moss underline underline-offset-4 hover:text-moss-deep';

/**
 * Puts a failed save on the form: field errors under their fields, anything
 * else (`detail`, `non_field_errors`, other fields) in the form-level alert.
 */
function showServerError(
  error: unknown,
  setError: UseFormSetError<BlogValues>,
) {
  if (
    !(error instanceof ApiError) ||
    error.status === 0 ||
    error.status >= 500
  ) {
    setError('root.server', { message: errorMessage(error) });
    return;
  }
  let shownOnField = false;
  const others = [error.detail, ...error.nonFieldErrors];
  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    const formField = FIELDS.find((name) => name === field);
    if (formField) {
      // Focus the first field the server rejected, as client errors do.
      setError(
        formField,
        { message: messages.join(' ') },
        { shouldFocus: !shownOnField },
      );
      shownOnField = true;
    } else {
      others.push(`${field}: ${messages.join(' ')}`);
    }
  }
  const message = others.filter(Boolean).join(' ');
  if (message || !shownOnField) {
    setError('root.server', { message: message || errorMessage(error) });
  }
}

interface BlogFormProps {
  defaultValues: BlogValues;
  submitLabel: string;
  pendingLabel: string;
  cancelTo: string;
  /** Saves the values; rejects with the API error. */
  onSave: (values: BlogValues) => Promise<unknown>;
}

function BlogForm({
  defaultValues,
  submitLabel,
  pendingLabel,
  cancelTo,
  onSave,
}: BlogFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BlogValues>({
    resolver: zodResolver(blogSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await onSave(values);
    } catch (error) {
      showServerError(error, setError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
      {errors.root?.server && (
        <p
          role="alert"
          className="border-l-4 border-danger py-1 pl-3 text-sm text-ink"
        >
          {errors.root.server.message}
        </p>
      )}

      <div>
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          maxLength={TITLE_MAX_LENGTH}
          aria-required="true"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? 'title-error' : undefined}
          className={inputClass}
          {...register('title')}
        />
        {errors.title && (
          <p id="title-error" className="mt-1 text-sm text-danger">
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="content" className="text-sm font-medium">
          Content
        </label>
        <textarea
          id="content"
          rows={14}
          aria-required="true"
          aria-invalid={errors.content ? true : undefined}
          aria-describedby={errors.content ? 'content-error' : undefined}
          className={`${inputClass} font-serif text-lg leading-8`}
          {...register('content')}
        />
        {errors.content && (
          <p id="content-error" className="mt-1 text-sm text-danger">
            {errors.content.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? pendingLabel : submitLabel}
        </Button>
        <Link to={cancelTo} className={linkClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

function NewBlog() {
  const { user } = useAuth();
  const create = useCreateBlog();

  if (!canCreateBlog(user)) {
    return (
      <p className="mt-6 text-ink-soft">
        This account has no author profile, so it can't write blogs.{' '}
        <Link to="/blogs" className={linkClass}>
          Back to blogs
        </Link>
      </p>
    );
  }

  return (
    <BlogForm
      defaultValues={{ title: '', content: '' }}
      submitLabel="Publish"
      pendingLabel="Publishing…"
      cancelTo="/blogs"
      onSave={(values) => create.mutateAsync(values)}
    />
  );
}

/** Only the fields that differ from the saved blog. */
function changedFields(blog: Blog, values: BlogValues): PatchedBlogRequest {
  const changes: PatchedBlogRequest = {};
  for (const field of FIELDS) {
    if (values[field] !== blog[field]) changes[field] = values[field];
  }
  return changes;
}

function EditForm({ blog }: { blog: Blog }) {
  const update = useUpdateBlog(blog.id);
  const navigate = useNavigate();
  const detailPath = `/blogs/${blog.id}`;

  return (
    <BlogForm
      defaultValues={{ title: blog.title, content: blog.content }}
      submitLabel="Save changes"
      pendingLabel="Saving…"
      cancelTo={detailPath}
      onSave={async (values) => {
        const changes = changedFields(blog, values);
        if (Object.keys(changes).length === 0) return navigate(detailPath);
        return update.mutateAsync(changes);
      }}
    />
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="max-w-prose">
      <PageTitle>{title}</PageTitle>
      {children}
    </section>
  );
}

function EditBlog({ id }: { id: number }) {
  const { user } = useAuth();
  const { data: blog, error, isPending, isError, refetch } = useBlog(id);

  if (isError && error instanceof ApiError && error.status === 404) {
    return <BlogNotFound />;
  }

  let body: ReactNode;
  if (isPending) {
    body = <Spinner label="Loading the blog…" />;
  } else if (isError) {
    body = (
      <div className="mt-6">
        <ErrorState
          error={error}
          title="This blog didn't load"
          onRetry={() => void refetch()}
        />
      </div>
    );
  } else if (!canChangeBlog(user, blog)) {
    body = (
      <p className="mt-6 text-ink-soft">
        You can only edit your own blogs.{' '}
        <Link to={`/blogs/${blog.id}`} className={linkClass}>
          Back to the blog
        </Link>
      </p>
    );
  } else {
    body = <EditForm blog={blog} />;
  }
  return <FormSection title="Edit blog">{body}</FormSection>;
}

/** `/blogs/new` and `/blogs/:id/edit` (inside `RequireAuth`). */
export function BlogFormPage() {
  const rawId = useParams().id;
  if (rawId === undefined) {
    return (
      <FormSection title="New blog">
        <NewBlog />
      </FormSection>
    );
  }
  const id = parseBlogId(rawId);
  if (id === null) return <BlogNotFound />;
  return <EditBlog id={id} />;
}
