import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { useAuth } from '../auth/AuthContext.ts';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-sm px-1 py-0.5 underline-offset-[6px] decoration-2 transition-colors',
    isActive
      ? 'text-ink underline decoration-moss'
      : 'text-ink-soft hover:text-ink',
  ].join(' ');

function AccountMenu() {
  const { status, user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  if (status === 'loading') return null;
  if (status === 'anonymous' || !user) {
    return (
      <Link
        to="/login"
        className="rounded-sm font-medium text-moss hover:text-moss-deep"
      >
        Log in
      </Link>
    );
  }

  return (
    <span className="flex items-baseline gap-3">
      <span className="text-ink-soft">@{user.username}</span>
      <button
        type="button"
        disabled={loggingOut}
        onClick={() => {
          setLoggingOut(true);
          void logout().finally(() => setLoggingOut(false));
        }}
        className="rounded-sm font-medium text-moss hover:text-moss-deep disabled:opacity-60"
      >
        {loggingOut ? 'Logging out…' : 'Log out'}
      </button>
    </span>
  );
}

export function Navbar() {
  return (
    <header className="border-b border-mist">
      <div className="mx-auto flex max-w-3xl flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
        <Link
          to="/blogs"
          className="font-serif text-xl font-semibold tracking-tight text-ink"
        >
          Django Blog
        </Link>
        <nav aria-label="Main" className="flex items-baseline gap-5 text-sm">
          <NavLink to="/blogs" className={navLinkClass}>
            Blogs
          </NavLink>
          <NavLink to="/users" className={navLinkClass}>
            Authors
          </NavLink>
          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}
