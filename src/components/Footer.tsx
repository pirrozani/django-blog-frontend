import { API_URL } from '../config.ts';
import { SHELL_CLASS } from './shell.ts';

const LINKS = [
  { label: 'API reference', href: `${API_URL}/api/schema/swagger-ui/` },
  {
    label: 'Frontend source',
    href: 'https://github.com/pirrozani/django-blog-frontend',
  },
  { label: 'Backend source', href: 'https://github.com/pirrozani/django-api' },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div
        className={`${SHELL_CLASS} flex flex-col gap-6 py-10 text-sm sm:flex-row sm:items-center sm:justify-between`}
      >
        <p className="flex flex-col gap-1 text-ink-muted sm:flex-row sm:items-baseline sm:gap-4">
          <span className="font-serif text-base font-medium text-ink">
            Django Blog
          </span>{' '}
          <span>A React front end for a Django REST API.</span>
        </p>
        <nav
          aria-label="Project"
          className="flex flex-wrap gap-x-6 gap-y-2 text-ink-muted"
        >
          {LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="transition-colors duration-200 ease-in-out hover:text-ink"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
