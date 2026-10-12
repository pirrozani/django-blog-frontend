import { Link } from 'react-router';
import { PageTitle } from './PageTitle.tsx';

interface NotFoundPageProps {
  title?: string;
  message?: string;
}

export function NotFoundPage({
  title = 'Page not found',
  message = "There's nothing at this address.",
}: NotFoundPageProps) {
  return (
    <section>
      <PageTitle>{title}</PageTitle>
      <p className="mt-4 text-ink-soft">{message}</p>
      <Link
        to="/blogs"
        className="mt-6 inline-block font-medium text-moss underline underline-offset-4 hover:text-moss-deep"
      >
        Go to blogs
      </Link>
    </section>
  );
}
