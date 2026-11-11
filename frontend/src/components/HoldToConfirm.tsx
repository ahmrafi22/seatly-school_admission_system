import { useCallback, useEffect, useRef, useState } from "react";
import { cx } from "@/utils/cx";

/**
 * How long the button must be held down.
 *
 * Long enough that the gesture is unmistakable, short enough that it does not
 * become a chore: 1.5 seconds. A press that falls short simply does nothing.
 */
export const HOLD_MS = 1500;

/**
 * A button that fires only when it is *held*, not clicked.
 *
 * Confirming an admission is irreversible — the seat leaves the pool and the
 * payment stands — so the act has to be deliberate. A tap is too easy to make
 * by accident on a phone held in one hand while carrying something else.
 * Holding requires a sustained, intentional movement.
 *
 * How it behaves:
 *
 *   - press and hold: a fill sweeps across the button from the leading edge.
 *     Releasing early snaps it back to empty and nothing happens.
 *   - the fill reaches the end: the hold is complete and `onComplete` fires.
 *   - keyboard: `Space` and `Enter` start and stop the hold the same way, so
 *     the gesture is not mouse-only. The key must be *held*, and the browser's
 *     auto-repeat is what drives it — which is why the fill is measured from
 *     elapsed time rather than from the number of events received.
 *
 * The fill is functional feedback rather than decoration, so it survives
 * `prefers-reduced-motion`; only its easing is dropped.
 */
export function HoldToConfirm({
  label,
  holdingLabel,
  onComplete,
  disabled = false,
  className,
}: {
  label: string;
  holdingLabel: string;
  onComplete: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const [holding, setHolding] = useState(false);

  const fillRef = useRef<HTMLSpanElement | null>(null);
  const startRef = useRef(0);
  const doneRef = useRef(false);
  // The completion callback is read through a ref so that a parent re-render
  // cannot restart the hold mid-gesture.
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  // The fill is written straight to the element rather than through state: it
  // changes every frame, and re-rendering the tree sixty times a second to
  // move one rectangle would be absurd.
  const paint = useCallback((value: number) => {
    const el = fillRef.current;
    if (el) el.style.transform = `scaleX(${value})`;
  }, []);

  // One animation frame drives the whole fill, so the progress is a function
  // of elapsed time rather than of how many events fired. That matters on the
  // keyboard path, where the repeat rate is the browser's to choose.
  useEffect(() => {
    if (!holding) return;

    let frame = 0;
    const step = () => {
      const elapsed = performance.now() - startRef.current;
      const next = Math.min(1, elapsed / HOLD_MS);

      if (next >= 1) {
        paint(1);
        setHolding(false);
        doneRef.current = true;
        completeRef.current();
        return;
      }

      paint(next);
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [holding, paint]);

  const start = useCallback(() => {
    if (doneRef.current || disabled) return;
    // The fill tracks the clock exactly while the hold is live, so the
    // transition is off; it is switched back on only for the snap-back.
    const el = fillRef.current;
    if (el) el.style.transition = "none";
    startRef.current = performance.now();
    paint(0);
    setHolding(true);
  }, [disabled, paint]);

  const stop = useCallback(() => {
    if (doneRef.current) return;
    // A released hold snaps back rather than staying where it was: the fill
    // is a live readout of the gesture, not a progress bar with a memory.
    const el = fillRef.current;
    if (el) {
      el.style.transition = "transform 200ms ease-out";
      el.style.transform = "scaleX(0)";
    }
    setHolding(false);
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== " " && event.key !== "Enter") return;
    // The browser's auto-repeat drives the fill; preventDefault stops Space
    // from also scrolling the page.
    event.preventDefault();
    if (event.repeat) return;
    start();
  };

  const onKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    stop();
  };

  return (
    <button
      type="button"
      // A plain button rather than the kit's Button: that component styles a
      // click affordance, and here the press state *is* the affordance. The
      // tokens below are the ones the kit's primary button wears.
      className={cx(
        "group relative flex h-12 w-full touch-none cursor-pointer select-none overflow-hidden rounded-2xl",
        "bg-accent-800 text-text-white shadow-xs dark:bg-accent-900",
        "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus-ring",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        // preventDefault stops the browser selecting the label under a resting
        // finger, so focus is taken by hand.
        event.preventDefault();
        event.currentTarget.focus();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        start();
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={stop}
      onContextMenu={(event) => event.preventDefault()}
      disabled={disabled}
    >
      {/* The fill. It grows from the leading edge, so it reads as the hold
          travelling rather than as a bar that is merely getting longer. The
          button's own track is the darker accent; the fill is the gradient the
          primary button wears, so a completed hold ends on exactly the button
          the reader was expecting. */}
      <span
        ref={fillRef}
        aria-hidden
        className="absolute inset-0 origin-left bg-linear-to-b from-accent-500 to-accent-600 rtl:origin-right"
        style={{ transform: "scaleX(0)" }}
      />
      <span
        aria-live="polite"
        className="pointer-events-none relative inline-flex items-center justify-center gap-2 px-4 text-body-medium"
      >
        {holding ? holdingLabel : label}
      </span>
    </button>
  );
}
