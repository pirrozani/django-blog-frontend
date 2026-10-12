import { ApiError } from '../api/client.ts';

/** A visitor-facing explanation of why a request failed. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return "Couldn't reach the server. Check your connection and try again.";
    }
    if (error.status >= 500) {
      return 'The server had a problem. Try again in a moment.';
    }
    return error.message;
  }
  return 'Something went wrong. Try again.';
}
