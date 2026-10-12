import { http, HttpResponse, type RequestHandler } from 'msw';
import { API_URL } from '../config.ts';

/** Default MSW handlers. Tests add their own with `server.use(...)`. */
export const handlers: RequestHandler[] = [
  // The layout's wake-up banner pings this on every render of the app.
  http.get(`${API_URL}/api/health/`, () => HttpResponse.json({ status: 'ok' })),
];
