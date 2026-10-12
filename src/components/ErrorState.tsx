import { ApiError } from '../api/client.ts';
import { Button } from './Button.tsx';

/** A visitor-facing explanation of why a request failed. */
function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return "Couldn't reach the server. Check your connection and try again.";
    }
    if (error.status >= 500) {
      return 'The server had a problem. Try again in a moment.';
    }
    return error.message;
  }
  return 'Something went wrong. Try again.';
}

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
}

export function ErrorState({
  error,
  title = "This didn't load",
  onRetry,
}: ErrorStateProps) {
  return (
    <div role="alert" className="border-l-4 border-danger py-2 pl-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-ink-soft">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
