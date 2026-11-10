import { cx } from "@/utils/cx";
import { useI18n } from "@/src/i18n/LanguageProvider";

/**
 * The wordmark. A seat seen from the front: a rounded square with a slot cut
 * out of it — the same "held seat" idea the product is about, drawn once and
 * reused at every size.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cx("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-accent-700 dark:fill-accent-500" />
      <path
        d="M10 21.5v-6.2c0-1.3 1-2.3 2.3-2.3h7.4c1.3 0 2.3 1 2.3 2.3v6.2"
        className="stroke-accent-50 dark:stroke-accent-950"
        strokeWidth="2.1"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M8.5 21.5h15"
        className="stroke-accent-50 dark:stroke-accent-950"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="16" cy="17.2" r="1.35" className="fill-accent-50 dark:fill-accent-950" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      {!compact && (
        <span className="font-display text-[1.0625rem] leading-none font-semibold tracking-[-0.02em] text-text-primary">
          {t.brand}
        </span>
      )}
    </span>
  );
}
