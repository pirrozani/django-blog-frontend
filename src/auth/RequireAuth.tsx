import { Navigate, Outlet, useLocation } from 'react-router';
import { Spinner } from '../components/Spinner.tsx';
import { useAuth } from './AuthContext.ts';

/** Route guard: renders the child routes only for a logged-in visitor. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Spinner label="Checking your session…" />;
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
