// The demo stores its token in localStorage; see the README's token-storage
// trade-off. Storage can be blocked (private mode, disabled cookies), so every
// access is guarded and blocked storage behaves as "no token".
const TOKEN_KEY = 'django-blog.token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Blocked storage: the session lasts until the page is reloaded.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
}
