import { PageTitle } from './PageTitle.tsx';

/** Placeholder for pages that later issues build. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <section>
      <PageTitle>{title}</PageTitle>
      <p className="mt-4 text-ink-soft">This page isn't built yet.</p>
    </section>
  );
}
