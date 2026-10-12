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
