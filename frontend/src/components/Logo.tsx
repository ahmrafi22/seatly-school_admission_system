import { cx } from "@/utils/cx";
import { useI18n } from "@/src/i18n/LanguageProvider";

/**
 * The wordmark mark: a seat drawn inside a circular plate. A circle rather than
 * a rounded square so it does not read as a fourth navigation row in the
 * sidebar, and so it matches the account avatar.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cx("size-8", className)} aria-hidden>
      <circle cx="16" cy="16" r="16" className="fill-accent-700 dark:fill-accent-500" />
      {/* Nudged 1.6px up: a circle has no even mass like a square plate, so the
          seat's heavy base line sat below the optical centre. */}
      <path
        d="M10 19.9v-6.2c0-1.3 1-2.3 2.3-2.3h7.4c1.3 0 2.3 1 2.3 2.3v6.2"
        className="stroke-accent-50 dark:stroke-accent-950"
        strokeWidth="2.1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M8.5 19.9h15"
        className="stroke-accent-50 dark:stroke-accent-950"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="16" cy="15.6" r="1.35" className="fill-accent-50 dark:fill-accent-950" />
    </svg>
  );
}

/**
 * The wordmark. The full stop is part of the name. The `compact` form drops the
 * word and keeps the mark, which is all that fits in the narrow sidebar slot.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      {!compact && (
        <span className="font-display text-[1.0625rem] leading-none font-semibold tracking-[-0.03em] text-text-primary">
          {t.brand}
        </span>
      )}
    </span>
  );
}
