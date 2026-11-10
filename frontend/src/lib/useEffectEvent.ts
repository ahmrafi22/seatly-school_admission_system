import { useCallback, useRef } from "react";

/**
 * A stable function that always calls the latest version of `fn`.
 *
 * The polling loop needs this: the interval must not restart every time the
 * component re-renders with a new inline fetcher, but it must never call a
 * stale one either. This is the smallest thing that gives both.
 */
export function useEffectEvent<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
): (...args: Args) => Result {
  const latest = useRef(fn);
  latest.current = fn;

  return useCallback((...args: Args) => latest.current(...args), []);
}
