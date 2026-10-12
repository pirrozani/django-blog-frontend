import { useQueryClient } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router';
import * as authApi from '../api/auth.ts';
import {
  ApiError,
  setAuthTokenGetter,
  setOnUnauthorized,
} from '../api/client.ts';
import type { Account } from '../api/types.ts';
import { AuthContext, type AuthStatus } from './AuthContext.ts';
import { clearToken, getToken, setToken } from './tokenStorage.ts';

// Every API call reads the token from storage, so it's set before any render.
setAuthTokenGetter(getToken);

interface AuthState {
  status: AuthStatus;
  user: Account | null;
}

const ANONYMOUS: AuthState = { status: 'anonymous', user: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<AuthState>(() =>
    getToken() ? { status: 'loading', user: null } : ANONYMOUS,
  );

  // Read inside the 401 handler without re-registering it on every change.
  const locationRef = useRef(location);
  const statusRef = useRef(state.status);
  const loggingOutRef = useRef(false);
  // Key of the location a logout started from; null when none is pending.
  const logoutFromKeyRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    locationRef.current = location;
    statusRef.current = state.status;
  });

  // Finish a logout once the router has rendered the new location. Going
  // anonymous earlier, while a protected page is still mounted, makes
  // RequireAuth redirect to /login instead.
  useEffect(() => {
    const fromKey = logoutFromKeyRef.current;
    if (fromKey === null || location.key === fromKey) return;
    logoutFromKeyRef.current = null;
    loggingOutRef.current = false;
    setState(ANONYMOUS);
  }, [location]);

  // A request that sent a token got 401: the token was revoked (e.g. another
  // visitor logged out of the shared demo account) or expired.
  useEffect(() => {
    setOnUnauthorized((sentToken) => {
      // A late 401 for a token that has since been replaced: ignore it.
      if (getToken() !== sentToken) return;
      const wasAuthenticated = statusRef.current === 'authenticated';
      clearToken();
      queryClient.clear();
      setState(ANONYMOUS);
      // Only an active session goes to /login: not a stale token on boot,
      // a logout in progress, or a visitor who was already anonymous.
      if (!wasAuthenticated || loggingOutRef.current) return;
      navigate('/login', {
        replace: true,
        state: { from: locationRef.current },
      });
    });
    return () => setOnUnauthorized(null);
  }, [navigate, queryClient]);

  // Boot: check a stored token with /api/auth/me/.
  useEffect(() => {
    if (state.status !== 'loading') return;
    const controller = new AbortController();
    authApi
      .me({ signal: controller.signal })
      .then((user) => setState({ status: 'authenticated', user }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        // 401 is handled by onUnauthorized. Otherwise (offline, server error)
        // keep the token and try again on the next load.
        if (!(error instanceof ApiError && error.status === 401)) {
          setState(ANONYMOUS);
        }
      });
    return () => controller.abort();
  }, [state.status]);

  const login = useCallback(async (username: string, password: string) => {
    const { token } = await authApi.login({ username, password });
    setToken(token);
    try {
      const user = await authApi.me();
      setState({ status: 'authenticated', user });
    } catch (error) {
      clearToken();
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    loggingOutRef.current = true;
    try {
      await authApi.logout();
    } catch {
      // Log out locally even if the server call fails.
    }
    clearToken();
    queryClient.clear();
    // Leave the page first; the effect above goes anonymous once it's left.
    logoutFromKeyRef.current = locationRef.current.key;
    await navigate('/blogs');
  }, [navigate, queryClient]);

  const value = useMemo(
    () => ({ ...state, login, logout }),
    [state, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
