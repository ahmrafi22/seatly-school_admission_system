import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { cx } from "@/utils/cx";
import { useI18n } from "@/src/i18n/LanguageProvider";

/**
 * How current the numbers on screen are: live, updating, or offline. Shows an
 * absolute clock reading rather than "3s ago", because a relative label has to
 * be recomputed every second and tells the reader nothing they can act on.
 */
export function Freshness({
  lastCheckedAt,
  isFetching,
  failures,
  className,
}: {
  lastCheckedAt: number | null;
  isFetching: boolean;
  failures: number;
  className?: string;
}) {
  const { t, tpl, locale } = useI18n();

  const offline = failures >= 2;
  const hasRead = lastCheckedAt !== null;

  // The clock stays mounted during a refresh. Unmounting it would leave the
  // rolling digits with no previous value to animate from, and flicker the label.
  let tone: "live" | "working" | "offline";
  let plain: string;

  if (offline) {
    tone = "offline";
    plain = t.freshness.offline;
  } else if (!hasRead) {
    tone = "working";
    plain = t.freshness.updating;
  } else {
    tone = "live";
    plain = tpl(t.freshness.updatedAt, { time: formatClockTime(lastCheckedAt, locale) });
  }

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 text-caption-1-medium",
        tone === "offline" ? "text-text-error-primary" : "text-text-tertiary",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className={cx(
          "relative inline-block size-1.5 shrink-0 rounded-full",
          tone === "offline"
            ? "bg-text-error-primary"
            : isFetching
              ? // In-flight read: only the dot changes, never the digits.
                "bg-accent-400"
              : tone === "working"
                ? "bg-accent-400"
                : "live-dot bg-accent-500",
        )}
      />

      {/* The rolling digits below are unreadable to a screen reader; this is
          what role="status" actually announces. */}
      <span className="sr-only">{plain}</span>

      <span aria-hidden>
        {tone === "live" && lastCheckedAt !== null ? (
          <>
            {t.freshness.updated}{" "}
            <ClockTime epochMs={lastCheckedAt} locale={locale} />
          </>
        ) : (
          plain
        )}
      </span>
    </span>
  );
}

/**
 * "8:09:15 PM" with rolling digits in English. Grouped so all three fields
 * advance in one frame.
 */
function ClockTime({ epochMs, locale }: { epochMs: number; locale: string }) {
  const date = new Date(epochMs);

  const hour = date.getHours() % 12 || 12;
  const minute = date.getMinutes();
  const second = date.getSeconds();

  // locale is a BCP 47 tag ("bn-BD"), so compare the language subtag only.
  const bcp47 = locale.startsWith("bn") ? "bn-BD" : "en-US";

  // Plain text in Bangla; see the note in Num.tsx.
  if (bcp47 === "bn-BD") {
    return (
      <span className="tabular" aria-hidden>
        {formatClockTime(epochMs, locale)}
      </span>
    );
  }

  const period =
    new Intl.DateTimeFormat(bcp47, { hour: "numeric", hour12: true })
      .formatToParts(date)
      .find((part) => part.type === "dayPeriod")?.value ?? "";

  return (
    <NumberFlowGroup>
      <span className="tabular">
        <NumberFlow value={hour} locales={bcp47} aria-hidden />
        {":"}
        <NumberFlow value={minute} locales={bcp47} format={{ minimumIntegerDigits: 2 }} aria-hidden />
        {":"}
        <NumberFlow value={second} locales={bcp47} format={{ minimumIntegerDigits: 2 }} aria-hidden />
        {period ? ` ${period}` : null}
      </span>
    </NumberFlowGroup>
  );
}

function formatClockTime(epochMs: number, locale: string): string {
  return new Intl.DateTimeFormat(locale.startsWith("bn") ? "bn-BD" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date(epochMs));
}

/**
 * The banner for repeated polling failures. Separate from the inline label so it
 * can carry the explanation and a retry.
 */
export function OfflineBanner({
  failures,
  onRetry,
  isRetrying,
}: {
  failures: number;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const { t } = useI18n();
  if (failures < 2) return null;

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-border-error-default bg-background-tertiary-error p-4 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-background-primary-default text-text-error-primary"
        >
          <svg viewBox="0 0 20 20" fill="none" className="size-4">
            <path
              d="M10 6.5v4.2M10 13.7h.01"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-body-medium text-text-primary">{t.freshness.offline}</p>
          <p className="mt-0.5 text-body-regular text-text-secondary">
            {t.freshness.offlineBody}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-2lg border border-border-button-default bg-background-primary-default px-3 text-body-medium text-text-primary shadow-xs transition-colors hover:bg-background-primary-hover focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:text-text-tertiary"
      >
        {t.common.retry}
      </button>
    </div>
  );
}
