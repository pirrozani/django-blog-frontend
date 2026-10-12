import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router';
import { z } from 'zod';
import { ApiError } from '../api/client.ts';
import { Button } from '../components/Button.tsx';
import { errorMessage } from '../components/errorMessage.ts';
import { PageTitle } from '../components/PageTitle.tsx';
import { Spinner } from '../components/Spinner.tsx';
import { useAuth } from './AuthContext.ts';

const README_URL = 'https://github.com/pirrozani/django-blog-frontend#readme';

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your username.'),
  password: z.string().min(1, 'Enter your password.'),
});

type LoginValues = z.infer<typeof loginSchema>;

const asString = (value: unknown) => (typeof value === 'string' ? value : '');

/** Where to go after logging in: the in-app page that sent the visitor here. */
function redirectTarget(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('from' in state)) {
    return '/blogs';
  }
  const from: unknown = state.from;
  if (typeof from !== 'object' || from === null) return '/blogs';
  const { pathname, search, hash } = from as Record<string, unknown>;
  // Same-app paths only: "/x", never "//host" or an absolute URL.
  if (
    typeof pathname !== 'string' ||
    !pathname.startsWith('/') ||
    pathname.startsWith('//') ||
    pathname === '/login'
  ) {
    return '/blogs';
  }
  return `${pathname}${asString(search)}${asString(hash)}`;
}

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return 'Too many login attempts. Wait a minute and try again.';
    }
    if (error.nonFieldErrors.length > 0) return error.nonFieldErrors.join(' ');
  }
  return errorMessage(error);
}

const inputClass =
  'mt-1 block w-full rounded-md border border-mist bg-white px-3 py-2 text-ink aria-invalid:border-danger';

export function LoginPage() {
  const { status, login } = useAuth();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  // Also handles the redirect right after a successful login.
  if (status === 'authenticated') {
    return <Navigate to={redirectTarget(location.state)} replace />;
  }
  // A stored token is still being checked; it may already be a session.
  if (status === 'loading') return <Spinner label="Checking your session…" />;

  const onSubmit = handleSubmit(async ({ username, password }) => {
    try {
      await login(username, password);
    } catch (error) {
      let shownOnField = false;
      if (error instanceof ApiError) {
        for (const field of ['username', 'password'] as const) {
          const messages = error.fieldErrors[field];
          if (messages) {
            setError(field, { message: messages.join(' ') });
            shownOnField = true;
          }
        }
      }
      if (!shownOnField) {
        setError('root.server', { message: loginErrorMessage(error) });
      }
    }
  });

  return (
    <section className="max-w-sm">
      <PageTitle>Log in</PageTitle>
      <p className="mt-4 text-ink-soft">
        Log in with the shared demo account to write, edit and delete blogs.{' '}
        <a
          href={README_URL}
          className="font-medium text-moss underline underline-offset-4 hover:text-moss-deep"
        >
          Demo credentials are in the README.
        </a>
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        {errors.root?.server && (
          <p
            role="alert"
            className="border-l-4 border-danger py-1 pl-3 text-sm text-ink"
          >
            {errors.root.server.message}
          </p>
        )}

        <div>
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={errors.username ? true : undefined}
            aria-describedby={errors.username ? 'username-error' : undefined}
            className={inputClass}
            {...register('username')}
          />
          {errors.username && (
            <p id="username-error" className="mt-1 text-sm text-danger">
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={inputClass}
            {...register('password')}
          />
          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-danger">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </section>
  );
}
