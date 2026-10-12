import { delay, http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_URL } from '../config.ts';
import { server } from '../mocks/server.ts';
import {
  ApiError,
  apiFetch,
  setAuthTokenGetter,
  setOnUnauthorized,
} from './client.ts';

const url = (path: string) => `${API_URL}${path}`;

async function catchApiError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('Expected the request to fail');
}

afterEach(() => {
  setAuthTokenGetter(() => null);
  setOnUnauthorized(null);
});

describe('apiFetch', () => {
  it('returns parsed JSON', async () => {
    server.use(
      http.get(url('/api/blogs/1/'), () => HttpResponse.json({ id: 1 })),
    );
    await expect(apiFetch('/api/blogs/1/')).resolves.toEqual({ id: 1 });
  });

  it('returns undefined for 204', async () => {
    server.use(
      http.delete(
        url('/api/blogs/1/'),
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    await expect(
      apiFetch('/api/blogs/1/', { method: 'DELETE' }),
    ).resolves.toBeUndefined();
  });

  it('sends JSON bodies', async () => {
    let received: unknown;
    let contentType: string | null = null;
    server.use(
      http.post(url('/api/blogs/'), async ({ request }) => {
        contentType = request.headers.get('Content-Type');
        received = await request.json();
        return HttpResponse.json({ id: 2 }, { status: 201 });
      }),
    );
    await apiFetch('/api/blogs/', {
      method: 'POST',
      body: { user: 1, title: 't', content: 'c' },
    });
    expect(contentType).toBe('application/json');
    expect(received).toEqual({ user: 1, title: 't', content: 'c' });
  });

  it('maps a 404 {"detail"} body', async () => {
    server.use(
      http.get(url('/api/blogs/999/'), () =>
        HttpResponse.json(
          { detail: 'No Blog matches the given query.' },
          {
            status: 404,
          },
        ),
      ),
    );
    const error = await catchApiError(apiFetch('/api/blogs/999/'));
    expect(error.status).toBe(404);
    expect(error.detail).toBe('No Blog matches the given query.');
    expect(error.message).toBe('No Blog matches the given query.');
    expect(error.fieldErrors).toEqual({});
  });

  it('maps 400 field errors', async () => {
    server.use(
      http.post(url('/api/blogs/'), () =>
        HttpResponse.json(
          {
            title: ['Ensure this field has no more than 200 characters.'],
            user: ['This field is required.'],
          },
          { status: 400 },
        ),
      ),
    );
    const error = await catchApiError(
      apiFetch('/api/blogs/', { method: 'POST', body: {} }),
    );
    expect(error.status).toBe(400);
    expect(error.detail).toBeUndefined();
    expect(error.fieldErrors).toEqual({
      title: ['Ensure this field has no more than 200 characters.'],
      user: ['This field is required.'],
    });
    expect(error.nonFieldErrors).toEqual([]);
  });

  it('maps 400 non_field_errors', async () => {
    server.use(
      http.post(url('/api/auth/token/'), () =>
        HttpResponse.json(
          { non_field_errors: ['Unable to log in with provided credentials.'] },
          { status: 400 },
        ),
      ),
    );
    const error = await catchApiError(
      apiFetch('/api/auth/token/', { method: 'POST', body: {} }),
    );
    expect(error.nonFieldErrors).toEqual([
      'Unable to log in with provided credentials.',
    ]);
    expect(error.message).toBe('Unable to log in with provided credentials.');
    expect(error.fieldErrors).toEqual({});
  });

  it('keeps the status for a non-JSON error body', async () => {
    server.use(
      http.get(
        url('/api/blogs/'),
        () => new HttpResponse('<h1>Bad Gateway</h1>', { status: 502 }),
      ),
    );
    const error = await catchApiError(apiFetch('/api/blogs/'));
    expect(error.status).toBe(502);
    expect(error.detail).toBeUndefined();
  });

  it('maps a network failure to status 0', async () => {
    server.use(http.get(url('/api/blogs/'), () => HttpResponse.error()));
    const error = await catchApiError(apiFetch('/api/blogs/'));
    expect(error.status).toBe(0);
  });

  it('rethrows aborts instead of mapping them to ApiError', async () => {
    server.use(
      http.get(url('/api/blogs/'), async () => {
        await delay('infinite');
        return HttpResponse.json([]);
      }),
    );
    const controller = new AbortController();
    const request = apiFetch('/api/blogs/', { signal: controller.signal });
    controller.abort();
    const error: unknown = await request.catch((e: unknown) => e);
    expect(error).not.toBeInstanceOf(ApiError);
    expect((error as Error).name).toBe('AbortError');
  });

  it('sends the token header only when a token is set', async () => {
    const seen: (string | null)[] = [];
    server.use(
      http.get(url('/api/auth/me/'), ({ request }) => {
        seen.push(request.headers.get('Authorization'));
        return HttpResponse.json({ id: 1, username: 'demo', is_staff: false });
      }),
    );
    await apiFetch('/api/auth/me/');
    setAuthTokenGetter(() => 'abc123');
    await apiFetch('/api/auth/me/');
    await apiFetch('/api/auth/me/', { auth: false });
    expect(seen).toEqual([null, 'Token abc123', null]);
  });

  it('calls onUnauthorized on a 401 only when a token was sent', async () => {
    const onUnauthorized = vi.fn();
    setOnUnauthorized(onUnauthorized);
    server.use(
      http.get(url('/api/auth/me/'), () =>
        HttpResponse.json({ detail: 'Invalid token.' }, { status: 401 }),
      ),
    );

    await catchApiError(apiFetch('/api/auth/me/'));
    expect(onUnauthorized).not.toHaveBeenCalled();

    setAuthTokenGetter(() => 'revoked');
    const error = await catchApiError(apiFetch('/api/auth/me/'));
    expect(error.status).toBe(401);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledWith('revoked');
  });
});
