const DEV_API_URL = 'http://127.0.0.1:8000';

const rawApiUrl =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? DEV_API_URL : '');

/** Backend origin without a trailing slash, e.g. `https://api.example.com`. */
export const API_URL = rawApiUrl.replace(/\/+$/, '');
