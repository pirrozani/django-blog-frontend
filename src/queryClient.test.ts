import { describe, expect, it } from 'vitest';
import { ApiError } from './api/client.ts';
import { shouldRetry } from './queryClient.ts';

describe('shouldRetry', () => {
  it('never retries 4xx errors', () => {
    expect(shouldRetry(0, new ApiError(404))).toBe(false);
    expect(shouldRetry(0, new ApiError(401))).toBe(false);
    expect(shouldRetry(0, new ApiError(429))).toBe(false);
  });

  it('retries server and network errors twice', () => {
    expect(shouldRetry(0, new ApiError(503))).toBe(true);
    expect(shouldRetry(1, new ApiError(0))).toBe(true);
    expect(shouldRetry(2, new ApiError(0))).toBe(false);
  });
});
