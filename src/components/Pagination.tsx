import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';

interface PaginationProps {
  page: number;
  totalPages: number;
}

const controlClass = 'rounded-sm px-1 py-0.5 font-medium';

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
      <button
        type="button"
        disabled
        className={`${controlClass} cursor-not-allowed text-ink-soft opacity-50`}
      >
        {children}
      </button>
    );
  }
  return (
    <Link
      to={{ search }}
      rel={rel}
      className={`${controlClass} text-moss underline-offset-4 hover:text-moss-deep hover:underline`}
    >
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
      className="mt-8 flex items-center justify-between gap-4 text-sm"
    >
      <PageControl
        target={page > 1 ? page - 1 : null}
        search={searchFor(page - 1)}
        rel="prev"
      >
        Previous
      </PageControl>
      <p className="text-ink-soft">
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
