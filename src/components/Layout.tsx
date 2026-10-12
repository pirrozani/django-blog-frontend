import { Outlet, ScrollRestoration } from 'react-router';
import { Navbar } from './Navbar.tsx';
import { WakeUpBanner } from './WakeUpBanner.tsx';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <WakeUpBanner />
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-10 pb-16 sm:px-6">
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}
