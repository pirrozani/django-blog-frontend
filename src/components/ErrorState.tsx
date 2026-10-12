import { Button } from './Button.tsx';
import { errorMessage } from './errorMessage.ts';

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
    <div
      role="alert"
      className="rounded-3xl bg-danger-wash px-6 py-10 sm:px-12 sm:py-14"
    >
      <h2 className="text-2xl font-medium tracking-tight">{title}</h2>
      <p className="mt-3 max-w-prose text-ink-body">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-8" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
