import { apiFetch, type RequestOptions } from './client.ts';
import type { Account, AuthTokenRequest, Health, Token } from './types.ts';

/** `POST /api/auth/token/`: 400 `non_field_errors` on bad credentials, 429 when throttled. */
export function login(credentials: AuthTokenRequest): Promise<Token> {
  return apiFetch<Token>('/api/auth/token/', {
    method: 'POST',
    body: credentials,
    auth: false,
  });
}

/** `POST /api/auth/logout/`: revokes the token for every session on the account. */
export function logout(): Promise<void> {
  return apiFetch<void>('/api/auth/logout/', { method: 'POST' });
}

export function me(options?: RequestOptions): Promise<Account> {
  return apiFetch<Account>('/api/auth/me/', options);
}

/** `GET /api/health/`: no DB access, used to wake the free backend. */
export function health(options?: RequestOptions): Promise<Health> {
  return apiFetch<Health>('/api/health/', { ...options, auth: false });
}
