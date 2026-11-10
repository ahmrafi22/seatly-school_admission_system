import { useCallback, useEffect, useRef, useState } from "react";
import { useEffectEvent } from "@/src/lib/useEffectEvent";

/**
 * Polls an async source on an interval and exposes enough state for the
 * interface to be honest about freshness.
 *
 * Deliberately not a data-fetching library: the whole requirement here is
 * "seat counts update every few seconds without a reload, and a dead server
 * must be visible" — which needs exactly four things, and a cache layer would
 * obscure all of them:
 *
 *   1. a first load that is distinguishable from a refresh,
 *   2. the timestamp of the last *successful* read,
 *   3. a failure count that survives a single blip,
 *   4. cancellation of in-flight work on unmount.
 *
 * Polling pauses while the tab is hidden and resumes with an immediate fetch
 * when it becomes visible again, so a background tab does not hammer the API.
 */
export interface PollState<T> {
  data: T | null;
  /** The read currently in flight. */
  isFetching: boolean;
  /** True only until the first result arrives. */
  isLoading: boolean;
  /** When the last successful read completed, in epoch ms. */
  lastCheckedAt: number | null;
  /** Consecutive failures; 0 means the last attempt worked. */
  failures: number;
  /** The last failure, or null once a read succeeds again. */
  error: Error | null;
  /** Force a read now. */
  refresh: () => void;
}

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
): PollState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const [failures, setFailures] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // A ref, not state: the interval callback must never see a stale fetcher, and
  // changing the fetcher must not restart the timer.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const inFlight = useRef(false);
  const alive = useRef(true);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useEffectEvent(async () => {
    // Overlapping polls would stack up on a slow server; a skipped tick is
    // better than a queue of them.
    if (inFlight.current) return;
    inFlight.current = true;
    setIsFetching(true);

    try {
      const result = await fetcherRef.current();
      if (!alive.current) return;
      setData(result);
      setLastCheckedAt(Date.now());
      setFailures(0);
      setError(null);
    } catch (caught) {
      if (!alive.current) return;
      setFailures((count) => count + 1);
      setError(caught instanceof Error ? caught : new Error(String(caught)));
    } finally {
      if (alive.current) {
        setIsFetching(false);
        setIsLoading(false);
      }
      inFlight.current = false;
    }
  });

  const schedule = useEffectEvent(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    const tick = () => {
      timer.current = null;
      if (document.hidden) {
        schedule();
        return;
      }
      void run().finally(() => {
        if (alive.current) schedule();
      });
    };
    timer.current = window.setTimeout(tick, intervalMs);
  });

  useEffect(() => {
    void run();
    schedule();

    const onVisibility = () => {
      if (document.hidden) return;
      // Coming back to the tab: the data is certainly stale, so read at once
      // rather than waiting out the remainder of the interval.
      void run();
    };

    window.addEventListener("focus", onVisibility);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onVisibility);
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
    // `run` and `schedule` are effect events: stable by construction.
  }, [intervalMs]);

  const refresh = useCallback(() => {
    void run();
  }, [run]);

  return { data, isFetching, isLoading, lastCheckedAt, failures, error, refresh };
}

/** A clock that ticks once a second, for countdowns. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
