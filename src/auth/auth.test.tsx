import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiFetch } from '../api/client.ts';
import { API_URL } from '../config.ts';
import { server } from '../mocks/server.ts';
import { renderRoute } from '../test/renderRoute.tsx';
import { getToken, setToken } from './tokenStorage.ts';

const url = (path: string) => `${API_URL}${path}`;
const DEMO = { id: 1, username: 'demo', is_staff: false };

function meReturns(account = DEMO) {
  server.use(
    http.get(url('/api/auth/me/'), ({ request }) =>
      request.headers.get('Authorization')
        ? HttpResponse.json(account)
        : HttpResponse.json({ detail: 'Not authenticated.' }, { status: 401 }),
    ),
  );
}

async function fillAndSubmit(username: string, password: string) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Username'), username);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('RequireAuth', () => {
  it('redirects an anonymous visitor to /login', async () => {
    const { router } = renderRoute('/blogs/new');
    expect(
      await screen.findByRole('heading', { name: 'Log in' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
  });
});

describe('LoginPage', () => {
  it('logs in and returns to the page that required it', async () => {
    meReturns();
    let sent: unknown;
    server.use(
      http.post(url('/api/auth/token/'), async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ token: 't0k3n' });
      }),
    );
    const { router } = renderRoute('/blogs/new');

    await fillAndSubmit('demo', 'secret');

    expect(
      await screen.findByRole('heading', { name: 'New blog' }),
    ).toBeInTheDocument();
    expect(sent).toEqual({ username: 'demo', password: 'secret' });
    expect(router.state.location.pathname).toBe('/blogs/new');
    expect(screen.getByText('@demo')).toBeInTheDocument();
    expect(getToken()).toBe('t0k3n');
  });

  it('ignores a redirect target outside the app', async () => {
    meReturns();
    server.use(
      http.post(url('/api/auth/token/'), () =>
        HttpResponse.json({ token: 't0k3n' }),
      ),
    );
    const { router } = renderRoute('/login');
    await act(() =>
      router.navigate('/login', {
        replace: true,
        state: { from: { pathname: '//evil.example/path' } },
      }),
    );

    await fillAndSubmit('demo', 'secret');

    await waitFor(() => expect(router.state.location.pathname).toBe('/blogs'));
  });

  it("shows the API's message for wrong credentials", async () => {
    server.use(
      http.post(url('/api/auth/token/'), () =>
        HttpResponse.json(
          { non_field_errors: ['Unable to log in with provided credentials.'] },
          { status: 400 },
        ),
      ),
    );
    renderRoute('/login');

    await fillAndSubmit('demo', 'wrong');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to log in with provided credentials.',
    );
    expect(getToken()).toBeNull();
  });

  it('shows a throttle message on 429', async () => {
    server.use(
      http.post(url('/api/auth/token/'), () =>
        HttpResponse.json(
          {
            detail: 'Request was throttled. Expected available in 42 seconds.',
          },
          { status: 429 },
        ),
      ),
    );
    renderRoute('/login');

    await fillAndSubmit('demo', 'secret');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many login attempts. Wait a minute and try again.',
    );
  });

  it('validates required fields before calling the API', async () => {
    renderRoute('/login');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Enter your username.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
  });

  it('sends a logged-in visitor on to /blogs', async () => {
    setToken('t0k3n');
    meReturns();
    const { router } = renderRoute('/login');
    await waitFor(() => expect(router.state.location.pathname).toBe('/blogs'));
  });
});

describe('AuthProvider', () => {
  it('restores the session from a stored token', async () => {
    setToken('t0k3n');
    meReturns();
    renderRoute('/blogs');
    expect(await screen.findByText('@demo')).toBeInTheDocument();
  });

  it('drops a revoked token on boot without redirecting', async () => {
    setToken('revoked');
    server.use(
      http.get(url('/api/auth/me/'), () =>
        HttpResponse.json({ detail: 'Invalid token.' }, { status: 401 }),
      ),
    );
    const { router } = renderRoute('/blogs');
    expect(
      await screen.findByRole('link', { name: 'Log in' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/blogs');
    expect(getToken()).toBeNull();
  });

  it('sends the visitor to /login when the token is revoked later', async () => {
    setToken('t0k3n');
    meReturns();
    const { router } = renderRoute('/blogs?page=2');
    await screen.findByText('@demo');

    server.use(
      http.get(url('/api/blogs/'), () =>
        HttpResponse.json({ detail: 'Invalid token.' }, { status: 401 }),
      ),
    );
    await act(() => apiFetch('/api/blogs/').catch(() => undefined));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.state).toMatchObject({
      from: { pathname: '/blogs', search: '?page=2' },
    });
    expect(getToken()).toBeNull();
  });

  it('ignores a late 401 for a token that was replaced', async () => {
    setToken('t0k3n');
    meReturns();
    renderRoute('/blogs');
    await screen.findByText('@demo');

    server.use(
      http.get(url('/api/blogs/'), async () => {
        // The visitor logs in again while this old-token request is in flight.
        setToken('n3w-t0k3n');
        return HttpResponse.json({ detail: 'Invalid token.' }, { status: 401 });
      }),
    );
    await act(() => apiFetch('/api/blogs/').catch(() => undefined));

    expect(getToken()).toBe('n3w-t0k3n');
    expect(screen.getByText('@demo')).toBeInTheDocument();
  });

  it('logs out from a protected page to /blogs, not /login', async () => {
    setToken('t0k3n');
    meReturns();
    let logoutAuth: string | null = null;
    server.use(
      http.post(url('/api/auth/logout/'), ({ request }) => {
        logoutAuth = request.headers.get('Authorization');
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { router } = renderRoute('/blogs/new');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Blogs' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/blogs');
    expect(getToken()).toBeNull();
    expect(logoutAuth).toBe('Token t0k3n');
  });

  it('logs out locally even when the API call fails', async () => {
    setToken('t0k3n');
    meReturns();
    server.use(http.post(url('/api/auth/logout/'), () => HttpResponse.error()));
    const { router } = renderRoute('/users');
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(
      await screen.findByRole('link', { name: 'Log in' }),
    ).toBeInTheDocument();
    expect(getToken()).toBeNull();
    expect(router.state.location.pathname).toBe('/blogs');
  });
});
