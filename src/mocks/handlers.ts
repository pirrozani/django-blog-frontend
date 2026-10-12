import { http, HttpResponse, type RequestHandler } from 'msw';
import { API_URL } from '../config.ts';

/** Default MSW handlers. Tests add their own with `server.use(...)`. */
export const handlers: RequestHandler[] = [
  // The layout's wake-up banner pings this on every render of the app.
  http.get(`${API_URL}/api/health/`, () => HttpResponse.json({ status: 'ok' })),
  // /blogs is the home page: most app-level tests land on it.
  http.get(`${API_URL}/api/blogs/`, () =>
    HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
  ),
  http.get(`${API_URL}/api/blogs/:id/`, () =>
    HttpResponse.json(
      { detail: 'No Blog matches the given query.' },
      { status: 404 },
    ),
  ),
];
