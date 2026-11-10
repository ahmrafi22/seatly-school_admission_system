/**
 * Small formatting helpers. Kept separate from the components so the countdown
 * and the seat arithmetic are testable in isolation.
 */

import type { HoldStatus } from "@/src/lib/api";

/** `MM:SS`, counting down. Never negative. */
export function formatCountdown(msRemaining: number): string {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * A hold is live only while the server says HELD *and* the clock agrees. The
 * server reclaims lapsed holds lazily, so between polls the client has to make
 * the same judgement itself — otherwise the countdown would sit at 00:00 while
 * the row still read HELD.
 */
export function effectiveStatus(
  status: HoldStatus,
  expiresAt: string,
  now: number,
): HoldStatus {
  if (status !== "HELD") return status;
  const expires = Date.parse(expiresAt);
  if (Number.isNaN(expires)) return status;
  return expires <= now ? "EXPIRED" : "HELD";
}

/** A short, unambiguous timestamp: "10 Nov, 14:32". */
export function formatTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** "12 seats" / "12 টি আসন" — plural handled by the dictionary, not here. */
export function seatsFilled(c: {
  totalSeats: number;
  heldSeats: number;
  confirmedSeats: number;
}): number {
  return c.heldSeats + c.confirmedSeats;
}

/**
 * Percentage of a class's seats that are taken, clamped to 0–100 so a
 * temporarily inconsistent read can never render a bar wider than its track.
 */
export function occupancyPercent(c: {
  totalSeats: number;
  heldSeats: number;
  confirmedSeats: number;
}): number {
  if (c.totalSeats <= 0) return 0;
  const percent = (seatsFilled(c) / c.totalSeats) * 100;
  return Math.min(100, Math.max(0, percent));
}

/** Bengali numerals, when the interface is in Bangla. */
export function localizeDigits(value: number | string, locale: string): string {
  if (locale !== "bn") return String(value);
  const map = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(value).replace(/\d/g, (d) => map[Number(d)]);
}

/** A registration number is always shown as ASCII digits, in both languages. */
export function maskStudentId(id: string): string {
  if (id.length !== 17) return id;
  return `${id.slice(0, 4)} ${id.slice(4, 8)} ${id.slice(8, 13)} ${id.slice(13)}`;
}
