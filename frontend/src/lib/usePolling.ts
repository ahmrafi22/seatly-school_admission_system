import { useCallback, useEffect, useRef, useState } from "react";

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
 * Polling pauses while the tab is hidden and reads immediately when it becomes
 * visible again, so a background tab does not hammer the API.
 */
export interface PollState<T> {
  data: T | null;
  /** A read is currently in flight. */
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

  // Refs, not state: the loop must always call the newest fetcher without
  // restarting, and must be able to stop itself on unmount.
  const fetcherRef = useRef(fetcher);
  const inFlight = useRef(false);
  const alive = useRef(true);
  const timer = useRef<number | null>(null);

  // Keep the ref current in an effect rather than during render, so the
  // component stays a pure function of its props.
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    // Overlapping polls would stack up against a slow server; skipping a tick
    // is better than queueing one.
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
  }, []);

  useEffect(() => {
    let cancelled = false;

    // One self-scheduling chain, so a slow response delays the next tick
    // instead of piling up behind it.
    const tick = async () => {
      if (cancelled) return;
      if (!document.hidden) {
        await run();
      }
      if (cancelled || !alive.current) return;
      timer.current = window.setTimeout(tick, intervalMs);
    };

    void tick();

    const onWake = () => {
      if (document.hidden) return;
      // Returning to the tab: the data is certainly stale, so read at once
      // rather than waiting out the rest of the interval.
      void run();
    };

    window.addEventListener("focus", onWake);
    document.addEventListener("visibilitychange", onWake);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onWake);
      document.removeEventListener("visibilitychange", onWake);
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [intervalMs, run]);

  return { data, isFetching, isLoading, lastCheckedAt, failures, error, refresh: run };
}

/** A clock that ticks once a second, for countdowns and freshness labels. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
