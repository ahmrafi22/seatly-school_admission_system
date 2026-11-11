import { useCallback, useEffect, useRef, useState } from "react";
import { cx } from "@/utils/cx";

/** How long the button must be held down. */
export const HOLD_MS = 1500;

/**
 * A button that fires only when held, not clicked. Confirming an admission is
 * irreversible, so the gesture has to be deliberate.
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
  // Read through a ref so a parent re-render cannot restart the hold.
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  // Written straight to the element: state would re-render every frame.
  const paint = useCallback((value: number) => {
    const el = fillRef.current;
    if (el) el.style.transform = `scaleX(${value})`;
  }, []);

  // Progress is measured from elapsed time, not from event count, because the
  // keyboard repeat rate is the browser's to choose.
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
    // Transition off while live, so the fill tracks the clock exactly.
    const el = fillRef.current;
    if (el) el.style.transition = "none";
    startRef.current = performance.now();
    paint(0);
    setHolding(true);
  }, [disabled, paint]);

  const stop = useCallback(() => {
    if (doneRef.current) return;
    const el = fillRef.current;
    if (el) {
      el.style.transition = "transform 200ms ease-out";
      el.style.transform = "scaleX(0)";
    }
    setHolding(false);
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== " " && event.key !== "Enter") return;
    // preventDefault also stops Space from scrolling the page.
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
      // Plain button rather than the kit's Button: the press state is the
      // affordance here. Classes below are the primary button's tokens.
      className={cx(
        "group relative flex h-12 w-full touch-none cursor-pointer select-none overflow-hidden rounded-2xl",
        "bg-accent-800 text-text-white shadow-xs dark:bg-accent-900",
        "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-border-focus-ring",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        // preventDefault stops text selection, so focus is taken by hand.
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
