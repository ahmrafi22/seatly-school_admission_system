import { cx } from "@/utils/cx";

/**
 * The confirmed tick. The disc scales in and the tick is drawn via dash offset.
 * The lime matches the CONFIRMED chip so both read as the same fact.
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
