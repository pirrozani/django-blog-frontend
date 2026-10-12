import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { buttonClass } from './buttonStyles.ts';

interface PaginationProps {
  page: number;
  totalPages: number;
}

const controlClass = buttonClass('secondary', 'min-w-28');

function PageControl({
  target,
  search,
  rel,
  children,
}: {
  target: number | null;
  search: string;
  rel: 'prev' | 'next';
  children: ReactNode;
}) {
  if (target === null) {
    return (
      <button type="button" disabled className={controlClass}>
        {children}
      </button>
    );
  }
  return (
    <Link to={{ search }} rel={rel} className={controlClass}>
      {children}
    </Link>
  );
}

/** "Page x of y" with Previous/Next links that set `?page=`. Hidden for one page. */
export function Pagination({ page, totalPages }: PaginationProps) {
  const [searchParams] = useSearchParams();
  if (totalPages <= 1) return null;

  const searchFor = (target: number) => {
    const params = new URLSearchParams(searchParams);
    if (target <= 1) params.delete('page');
    else params.set('page', String(target));
    const search = params.toString();
    return search ? `?${search}` : '';
  };

  return (
    <nav
      aria-label="Pagination"
      className="mt-16 flex items-center justify-between gap-4 text-sm"
    >
      <PageControl
        target={page > 1 ? page - 1 : null}
        search={searchFor(page - 1)}
        rel="prev"
      >
        Previous
      </PageControl>
      <p className="text-ink-muted tabular-nums">
        Page {page} of {totalPages}
      </p>
      <PageControl
        target={page < totalPages ? page + 1 : null}
        search={searchFor(page + 1)}
        rel="next"
      >
        Next
      </PageControl>
    </nav>
  );
}
