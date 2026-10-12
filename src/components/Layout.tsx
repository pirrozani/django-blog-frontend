import { Outlet, ScrollRestoration } from 'react-router';
import { Footer } from './Footer.tsx';
import { Navbar } from './Navbar.tsx';
import { SHELL_CLASS } from './shell.ts';
import { WakeUpBanner } from './WakeUpBanner.tsx';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <WakeUpBanner />
      <Navbar />
      <main className={`${SHELL_CLASS} flex-1 pt-10 pb-20 sm:pt-16 sm:pb-28`}>
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
