import type { ReactNode } from 'react';
import { Link } from 'react-router';

/** A quiet link back up the hierarchy, e.g. "All blogs". */
export function BackLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className="link-back group">
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-4 transition-transform duration-200 ease-in-out group-hover:-translate-x-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 3 5 8l5 5" />
      </svg>
      {children}
    </Link>
  );
}
