import type { RequestHandler } from 'msw';

/** Default MSW handlers. Tests add their own with `server.use(...)`. */
export const handlers: RequestHandler[] = [];
