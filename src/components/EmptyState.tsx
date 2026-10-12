import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
  /** A link or button that gets the visitor out of the empty state. */
  action?: ReactNode;
}

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="rounded-3xl bg-wash px-6 py-14 sm:px-12 sm:py-20">
      <h2 className="text-2xl font-medium tracking-tight">{title}</h2>
      {children && (
        <p className="mt-3 max-w-prose text-lg text-ink-muted">{children}</p>
      )}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
