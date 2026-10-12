import { useEffect, useState } from 'react';
import { health } from '../api/auth.ts';

/** How long the server may take before the banner appears. */
export const WAKE_UP_DELAY_MS = 2_000;
/** After this long without an answer, stop waiting and offer a retry. */
export const WAKE_UP_TIMEOUT_MS = 90_000;

type Status = 'checking' | 'waking' | 'ready' | 'failed';

/**
 * Pings `/api/health/` on load. Render's free tier sleeps, so the first
 * request can take about a minute; this tells visitors why.
 */
export function WakeUpBanner() {
  const [status, setStatus] = useState<Status>('checking');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let settled = false;

    const showTimer = setTimeout(() => {
      setStatus((current) => (current === 'checking' ? 'waking' : current));
    }, WAKE_UP_DELAY_MS);
    const giveUpTimer = setTimeout(() => {
      settled = true;
      controller.abort();
      setStatus('failed');
    }, WAKE_UP_TIMEOUT_MS);

    health({ signal: controller.signal })
      .then(() => {
        if (!settled) setStatus('ready');
      })
      .catch(() => {
        if (!settled) setStatus('failed');
      })
      .finally(() => {
        settled = true;
        clearTimeout(showTimer);
        clearTimeout(giveUpTimer);
      });

    return () => {
      settled = true;
      clearTimeout(showTimer);
      clearTimeout(giveUpTimer);
      controller.abort();
    };
  }, [attempt]);

  const visible = status === 'waking' || status === 'failed';

  // The live region stays mounted so screen readers announce its new text.
  return (
    <div role="status" className="bg-amber-wash text-sm text-amber">
      {visible && (
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
          {status === 'waking' ? (
            <>
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-amber motion-safe:animate-pulse"
              />
              <p>Waking up the free server, this can take up to a minute…</p>
            </>
          ) : (
            <>
              <p>The server didn't respond. Try again in a moment.</p>
              <button
                type="button"
                onClick={() => {
                  setStatus('waking');
                  setAttempt((n) => n + 1);
                }}
                className="rounded-sm font-medium underline underline-offset-4 hover:no-underline"
              >
                Try again
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
