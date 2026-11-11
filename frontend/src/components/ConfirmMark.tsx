import { cx } from "@/utils/cx";

/**
 * The green tick that confirms an admission.
 *
 * Two pieces, both drawn rather than faded in:
 *
 *   - the disc scales up from nothing, with a slight overshoot, so the mark
 *     arrives with a small physical push rather than simply appearing;
 *   - the tick itself is *drawn* — the path's dash offset runs from its full
 *     length to zero, which is why the tick appears to be written rather than
 *     revealed.
 *
 * The green is the same lime the CONFIRMED chip uses, so the moment in the
 * dialog and the badge on the card behind it are unmistakably the same fact.
 *
 * `pathLength="1"` normalises the dash maths: the tick's real length does not
 * matter, because the browser scales it to the path length we declare.
 */
export function ConfirmMark({ className }: { className?: string }) {
  return (
    <span className={cx("relative grid size-20 place-items-center", className)}>
      <span
        aria-hidden
        className="confirm-disc absolute inset-0 rounded-full bg-status-lime-background"
      />
      <svg viewBox="0 0 48 48" className="relative size-12 text-status-lime-text" aria-hidden>
        <path
          d="M13 24.5 L20.5 32 L35 16.5"
          pathLength="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="confirm-tick"
        />
      </svg>
    </span>
  );
}
