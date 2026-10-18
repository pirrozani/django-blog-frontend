import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext.ts';
import { SHELL_CLASS } from './shell.ts';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-full px-3 py-1.5 transition-colors duration-200 ease-in-out focus-visible:outline-paper',
    isActive
      ? 'bg-white/15 text-paper'
      : 'text-paper/80 hover:bg-white/10 hover:text-paper',
  ].join(' ');

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-2xl px-4 py-3 text-base transition-colors duration-200 ease-in-out',
    isActive
      ? 'bg-wash font-medium text-ink'
      : 'text-ink-body hover:bg-wash hover:text-ink',
  ].join(' ');

function AccountMenu({ layout }: { layout: 'inline' | 'stacked' }) {
  const { status, user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const stacked = layout === 'stacked';

  if (status === 'loading') return null;
  if (status === 'anonymous' || !user) {
    return (
      <Link
        to="/login"
        className={
          stacked
            ? 'mt-1 rounded-2xl bg-accent px-4 py-3 text-center text-base font-medium text-paper transition-colors duration-200 ease-in-out hover:bg-accent-deep'
            : 'ml-2 rounded-full bg-paper px-4 py-1.5 font-medium text-accent transition duration-200 ease-in-out hover:bg-accent-wash hover:shadow-lift focus-visible:outline-paper'
        }
      >
        Log in
      </Link>
    );
  }

  const name =
    user.author_id != null ? (
      <Link
        to={`/users/${user.author_id}`}
        className={
          stacked
            ? 'font-medium text-ink transition-colors duration-200 ease-in-out hover:text-accent'
            : 'font-medium text-paper underline-offset-4 hover:underline focus-visible:outline-paper'
        }
      >
        {user.username}
      </Link>
    ) : (
      <span
        className={stacked ? 'font-medium text-ink' : 'font-medium text-paper'}
      >
        {user.username}
      </span>
    );

  const logOutButton = (className: string) => (
    <button
      type="button"
      disabled={loggingOut}
      onClick={() => {
        setLoggingOut(true);
        void logout().finally(() => setLoggingOut(false));
      }}
      className={`${className} transition-colors duration-200 ease-in-out disabled:opacity-60`}
    >
      {loggingOut ? 'Logging out…' : 'Log out'}
    </button>
  );

  if (stacked) {
    return (
      <div className="mt-1 border-t border-line pt-2">
        <p className="px-4 py-2 text-sm text-ink-muted">Signed in as {name}</p>
        {logOutButton(
          'w-full rounded-2xl px-4 py-3 text-left text-base text-ink-body hover:bg-wash hover:text-ink',
        )}
      </div>
    );
  }

  return (
    <span className="ml-2 flex items-center gap-3 border-l border-white/20 pl-4">
      <span className="text-paper/80">Signed in as {name}</span>
      {logOutButton(
        'rounded-full px-3 py-1.5 font-medium text-paper/80 enabled:hover:bg-white/10 enabled:hover:text-paper focus-visible:outline-paper',
      )}
    </span>
  );
}

/** True once the page has scrolled away from the top. */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 4);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return scrolled;
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      {open ? (
        <path d="M6 6l12 12M18 6 6 18" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}

/** Small screens: the nav and account links in a pop-up under the header. */
function MobileMenu() {
  const location = useLocation();
  // Remember the location the menu opened on: any navigation closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === location.key;
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpenOn(null);
      buttonRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenOn(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="md:hidden"
      onBlur={(event) => {
        // Tabbing out of the menu closes it, so it never covers the focused
        // element. A null target (e.g. Safari clicks) is left to pointerdown.
        const next = event.relatedTarget;
        if (
          open &&
          next instanceof Node &&
          !event.currentTarget.contains(next)
        ) {
          setOpenOn(null);
        }
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? 'mobile-menu' : undefined}
        onClick={() => setOpenOn(open ? null : location.key)}
        className="-mr-2 flex size-10 items-center justify-center rounded-full text-paper transition-colors duration-200 ease-in-out hover:bg-white/10 focus-visible:outline-paper"
      >
        <span className="sr-only">Menu</span>
        <MenuIcon open={open} />
      </button>
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Main menu"
          className="absolute inset-x-5 top-full mt-1 flex flex-col gap-1 rounded-3xl bg-paper p-2 shadow-float ring-1 ring-black/5 sm:inset-x-auto sm:right-8 sm:w-72 motion-safe:animate-[menu-in_200ms_ease-out]"
        >
          <NavLink to="/blogs" className={mobileLinkClass}>
            Blogs
          </NavLink>
          <NavLink to="/users" className={mobileLinkClass}>
            Authors
          </NavLink>
          <AccountMenu layout="stacked" />
        </nav>
      )}
    </div>
  );
}

export function Navbar() {
  const scrolled = useScrolled();
  return (
    <header
      className={`sticky top-0 z-40 bg-accent transition-shadow duration-300 ease-in-out ${scrolled ? 'shadow-[0_1px_0_var(--color-accent-deep)]' : ''}`}
    >
      <div
        className={`${SHELL_CLASS} flex items-center justify-between gap-6 py-3 md:py-4`}
      >
        <Link
          to="/blogs"
          className="font-serif text-xl font-medium tracking-tight text-paper focus-visible:outline-paper"
        >
          Django Blog
        </Link>
        <nav
          aria-label="Main"
          className="hidden items-center gap-1 text-sm md:flex"
        >
          <NavLink to="/blogs" className={navLinkClass}>
            Blogs
          </NavLink>
          <NavLink to="/users" className={navLinkClass}>
            Authors
          </NavLink>
          <AccountMenu layout="inline" />
        </nav>
        <MobileMenu />
      </div>
    </header>
  );
}
