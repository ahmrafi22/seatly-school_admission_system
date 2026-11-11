import { cx } from "@/utils/cx";
import { useI18n } from "@/src/i18n/LanguageProvider";

/**
 * The wordmark. A seat seen from the front: a rounded square with a slot cut
 * out of it — the same "held seat" idea the product is about, drawn once and
 * reused at every size.
 *
 * The plate is a full circle, not a rounded square. Collapsed, the sidebar's
 * navigation rows are 36px squares with a 12px radius, and a 32px square mark
 * sitting directly above them read as a fourth row — an unlabelled destination
 * rather than the product's own name. A circle is a different shape class, so
 * the mark stays a mark at any width. It also matches the account avatar in the
 * top bar, which is the only other round plate in the chrome.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cx("size-8", className)} aria-hidden>
      <circle cx="16" cy="16" r="16" className="fill-accent-700 dark:fill-accent-500" />
      {/* The seat is nudged 1.6px up from where it sat in the square plate.
          A square has equal mass above and below the glyph, so the drawing could
          be placed by its box; a circle does not, and the seat's heavy base line
          left it visibly sagging below the centre. */}
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
 * The wordmark.
 *
 * Set in the display face at a weight one step below the headings, with the
 * tracking tightened so the round terminals of the `S` and `y` sit close without
 * touching. The full stop is part of the name, not punctuation: it is what makes
 * the mark read as a wordmark rather than a label.
 *
 * The `compact` form drops the word and keeps the mark, which is all that fits
 * in the 60px sidebar rail.
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
