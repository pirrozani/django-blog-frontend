import type { ReactNode } from 'react';

interface PageTitleProps {
  children: ReactNode;
  /** `article` sets a blog's title larger, in the display cut. */
  size?: 'page' | 'article';
}

const sizes = {
  page: 'text-[2rem] sm:text-[2.5rem]',
  article: 'text-[clamp(1.75rem,4vw,2.75rem)]',
};

export function PageTitle({ children, size = 'page' }: PageTitleProps) {
  return (
    <h1
      className={`${sizes[size]} leading-[1.08] font-medium tracking-[-0.02em] text-balance break-words text-ink`}
    >
      {children}
    </h1>
  );
}
