import { cx } from "@/utils/cx";
import type { ClassSummary } from "@/src/lib/api";
import { occupancyPercent } from "@/src/lib/format";

/**
 * The seat inventory, drawn as one bar split into its three parts.
 *
 * This is the product's central fact — how many seats are gone, how many are
 * only temporarily held, how many are still free — so it is shown as a single
 * object rather than three unrelated numbers. Held seats are a lighter tint of
 * the confirmed colour on purpose: both are "taken right now", but only one is
 * permanent, and the bar should say so without a legend.
 *
 * `flex-grow` carries the proportions so a change animates as the parts slide
 * rather than snapping.
 */
export function SeatBar({
  cls,
  size = "md",
  className,
}: {
  cls: Pick<ClassSummary, "totalSeats" | "heldSeats" | "confirmedSeats">;
  size?: "sm" | "md";
  className?: string;
}) {
  const total = Math.max(1, cls.totalSeats);
  const confirmed = Math.max(0, Math.min(cls.confirmedSeats, total));
  const held = Math.max(0, Math.min(cls.heldSeats, total - confirmed));
  const free = Math.max(0, total - confirmed - held);

  return (
    <div
      className={cx(
        "flex w-full overflow-hidden rounded-full bg-seat-free",
        size === "sm" ? "h-1.5" : "h-2.5",
        className,
      )}
      role="img"
      aria-label={`${confirmed} confirmed, ${held} on hold, ${free} free of ${total}`}
    >
      {confirmed > 0 && (
        <span
          className="seat-segment bg-seat-confirmed"
          style={{ flexGrow: confirmed }}
        />
      )}
      {held > 0 && (
        <span className="seat-segment bg-seat-held" style={{ flexGrow: held }} />
      )}
      {free > 0 && (
        <span className="seat-segment" style={{ flexGrow: free }} />
      )}
    </div>
  );
}

/** A compact percentage, for places where the bar is too wide to fit. */
export function OccupancyRing({
  cls,
  className,
}: {
  cls: Pick<ClassSummary, "totalSeats" | "heldSeats" | "confirmedSeats">;
  className?: string;
}) {
  const percent = occupancyPercent(cls);
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;

  return (
    <svg
      viewBox="0 0 36 36"
      className={cx("size-9 -rotate-90", className)}
      aria-hidden
    >
      <circle
        cx="18"
        cy="18"
        r={radius}
        fill="none"
        strokeWidth="3.5"
        className="stroke-seat-free"
      />
      <circle
        cx="18"
        cy="18"
        r={radius}
        fill="none"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        className="stroke-seat-confirmed transition-[stroke-dasharray] duration-500 ease-out"
      />
    </svg>
  );
}
