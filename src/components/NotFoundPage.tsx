import { Link } from 'react-router';
import { buttonClass } from './buttonStyles.ts';
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
    <section className="max-w-2xl">
      <PageTitle>{title}</PageTitle>
      <p className="mt-6 text-lg text-ink-muted">{message}</p>
      <Link to="/blogs" className={buttonClass('secondary', 'mt-10')}>
        Go to blogs
      </Link>
    </section>
  );
}
