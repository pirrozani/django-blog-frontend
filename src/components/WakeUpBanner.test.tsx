import { act, render, screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_URL } from '../config.ts';
import { server } from '../mocks/server.ts';
import {
  WAKE_UP_DELAY_MS,
  WAKE_UP_TIMEOUT_MS,
  WakeUpBanner,
} from './WakeUpBanner.tsx';

const HEALTH = `${API_URL}/api/health/`;
const WAKING = /waking up the free server/i;
const FAILED = /the server didn't respond/i;

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('WakeUpBanner', () => {
  it('appears when health is slow and goes away on response', async () => {
    server.use(
      http.get(HEALTH, async () => {
        await delay(5_000);
        return HttpResponse.json({ status: 'ok' });
      }),
    );
    render(<WakeUpBanner />);

    await advance(WAKE_UP_DELAY_MS - 100);
    expect(screen.queryByText(WAKING)).not.toBeInTheDocument();

    await advance(200);
    expect(screen.getByText(WAKING)).toBeInTheDocument();

    await advance(5_000);
    expect(screen.queryByText(WAKING)).not.toBeInTheDocument();
  });

  it('never shows when health answers quickly', async () => {
    render(<WakeUpBanner />);
    await advance(WAKE_UP_DELAY_MS * 2);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('offers a retry when health fails', async () => {
    server.use(http.get(HEALTH, () => HttpResponse.error()));
    render(<WakeUpBanner />);
    await advance(0);
    expect(screen.getByText(FAILED)).toBeInTheDocument();

    server.resetHandlers();
    await act(() => screen.getByRole('button', { name: 'Try again' }).click());
    await advance(0);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('gives up after the timeout', async () => {
    server.use(
      http.get(HEALTH, async () => {
        await delay('infinite');
        return HttpResponse.json({ status: 'ok' });
      }),
    );
    render(<WakeUpBanner />);
    await advance(WAKE_UP_DELAY_MS);
    expect(screen.getByText(WAKING)).toBeInTheDocument();

    await advance(WAKE_UP_TIMEOUT_MS);
    expect(screen.getByText(FAILED)).toBeInTheDocument();
  });
});
