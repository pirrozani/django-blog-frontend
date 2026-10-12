import { isRouteErrorResponse, useRouteError } from 'react-router';
import { ErrorState } from './ErrorState.tsx';
import { NotFoundPage } from './NotFoundPage.tsx';
import { SHELL_CLASS } from './shell.ts';

interface RouteErrorPageProps {
  /** True for the root route, where the Layout (and its `<main>`) failed too. */
  standalone?: boolean;
}

/** Route `errorElement`: catches render errors and unmatched routes. */
export function RouteErrorPage({ standalone = false }: RouteErrorPageProps) {
  const error = useRouteError();

  const content =
    isRouteErrorResponse(error) && error.status === 404 ? (
      <NotFoundPage />
    ) : (
      <ErrorState
        error={error}
        title="Something broke on this page"
        onRetry={() => window.location.reload()}
      />
    );

  if (!standalone) return content;
  return (
    <main className={`${SHELL_CLASS} pt-12 pb-24 sm:pt-20`}>{content}</main>
  );
}
