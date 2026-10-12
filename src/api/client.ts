import { API_URL } from '../config.ts';

export type FieldErrors = Record<string, string[]>;

interface ApiErrorInit {
  detail?: string;
  fieldErrors?: FieldErrors;
  nonFieldErrors?: string[];
}

/**
 * A failed API call. `status` is the HTTP status, or 0 when the server
 * couldn't be reached. DRF bodies are mapped to `detail`, `nonFieldErrors`
 * (`non_field_errors`) and `fieldErrors` (`{"field": ["msg"]}`).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly detail?: string;
  readonly fieldErrors: FieldErrors;
  readonly nonFieldErrors: string[];

  constructor(
    status: number,
    init: ApiErrorInit = {},
    fallbackMessage?: string,
  ) {
    const fieldErrors = init.fieldErrors ?? {};
    const nonFieldErrors = init.nonFieldErrors ?? [];
    const firstFieldError = Object.values(fieldErrors)[0]?.[0];
    super(
      init.detail ??
        nonFieldErrors[0] ??
        firstFieldError ??
        fallbackMessage ??
        `Request failed with status ${status}`,
    );
    this.name = 'ApiError';
    this.status = status;
    this.detail = init.detail;
    this.fieldErrors = fieldErrors;
    this.nonFieldErrors = nonFieldErrors;
  }
}

function toMessages(value: unknown): string[] | undefined {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
    return value;
  }
  return undefined;
}

/** Maps a DRF error body (`{"detail"}`, `{"non_field_errors"}`, field errors). */
export function parseErrorBody(body: unknown): ApiErrorInit {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return {};
  }
  let detail: string | undefined;
  let nonFieldErrors: string[] = [];
  const fieldErrors: FieldErrors = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === 'detail' && typeof value === 'string') {
      detail = value;
    } else if (key === 'non_field_errors') {
      nonFieldErrors = toMessages(value) ?? [];
    } else {
      const messages = toMessages(value);
      if (messages) fieldErrors[key] = messages;
    }
  }
  return { detail, fieldErrors, nonFieldErrors };
}

let getToken: () => string | null = () => null;
let onUnauthorized: ((sentToken: string) => void) | null = null;

/** Registered by the auth provider: where `apiFetch` reads the token from. */
export function setAuthTokenGetter(getter: () => string | null): void {
  getToken = getter;
}

/**
 * Registered by the auth provider: called on a 401 for a request that sent a
 * token, with that token (so a late 401 for an old token can be ignored).
 */
export function setOnUnauthorized(
  callback: ((sentToken: string) => void) | null,
): void {
  onUnauthorized = callback;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

interface ApiFetchOptions extends RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Send the token when there is one (default `true`). */
  auth?: boolean;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * Calls the backend at `API_URL + path` (paths keep their trailing slash,
 * e.g. `/api/blogs/`). Resolves with the parsed JSON, or `undefined` for an
 * empty body (204). Rejects with `ApiError`; aborts are rethrown as-is.
 */
export async function apiFetch<T>(
  path: string,
  { method = 'GET', body, signal, auth = true }: ApiFetchOptions = {},
): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  const token = auth ? getToken() : null;
  if (token) headers.set('Authorization', `Token ${token}`);

  let response: Response;
  let text: string;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
    text = response.status === 204 ? '' : await response.text();
  } catch (error) {
    // Let aborts (e.g. TanStack Query cancelling) through untouched.
    if (signal?.aborted) throw signal.reason ?? error;
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(
      0,
      {},
      'Could not reach the server. Check your connection.',
    );
  }

  const data = text ? parseJson(text) : undefined;

  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized?.(token);
    throw new ApiError(
      response.status,
      parseErrorBody(data),
      response.statusText || undefined,
    );
  }
  if (text && data === undefined) {
    throw new ApiError(
      response.status,
      {},
      'The server sent an invalid response.',
    );
  }
  return data as T;
}
