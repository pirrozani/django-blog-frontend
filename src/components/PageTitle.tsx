import type { ReactNode } from 'react';

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance text-ink sm:text-5xl">
      {children}
    </h1>
  );
}
