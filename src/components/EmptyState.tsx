import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
  /** A link or button that gets the visitor out of the empty state. */
  action?: ReactNode;
}

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="border-y border-mist py-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children && <p className="mt-2 max-w-prose text-ink-soft">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
