import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { cx } from "@/utils/cx";
import { useI18n } from "@/src/i18n/LanguageProvider";

/**
 * How current the numbers on screen are.
 *
 * Three states, and each one answers a question the student actually has:
 *
 *   live    — "these counts were read at 14:32:07"
 *   updating— "a read is in flight right now"
 *   offline — "the server is not answering, so what you see may be stale"
 *
 * The time is an absolute clock reading rather than "3s ago". A relative label
 * has to be recomputed every second to stay true, which makes it flicker and
 * tells the reader nothing they can act on; a timestamp is stable, readable at
 * a glance, and unambiguous across a tab switch.
 *
 * The clock digits roll on each successful poll, so a refresh that changes
 * nothing still shows that it happened — the seconds move. That is the whole
 * reason the reload button could be removed: the page already proves it is
 * live, every four seconds, without being asked.
 *
 * The offline state is a stated requirement: a stopped backend has to produce
 * readable text in the page, not a frozen screen and a console error. It lives
 * here rather than in a toast because a toast disappears — the page must keep
 * saying it for as long as it is true.
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

  // The clock stays mounted while a refresh is in flight.
  //
  // The first version switched the label to "Updating…" whenever `isFetching`
  // was true, which meant the timestamp unmounted and remounted on every poll —
  // so the rolling digits never had a previous value to roll *from*, and the
  // animation silently did nothing. It also made the label flicker once every
  // four seconds. A background refresh is not a state the reader needs to see
  // named; the seconds moving is the evidence.
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
      // Announced politely: a student using a screen reader should hear the
      // server go quiet without the page interrupting them every 5 seconds.
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
              ? // A read is in flight: the dot changes tone, but the clock text
                // stays put. This is the only thing `isFetching` is allowed to
                // touch — see the note above about unmounting the digits.
                "bg-accent-400"
              : tone === "working"
                ? "bg-accent-400"
                : "live-dot bg-accent-500",
        )}
      />

      {/* One plain sentence for the accessibility tree. The visible clock
          below is a stack of rolling digits, which would be read as a stream
          of changing nodes; this is what `role="status"` actually announces,
          and it is also the element's accessible name. */}
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
 * "8:09:15 PM", with each field as a rolling number.
 *
 * The separators and the day period stay as plain text; only the hour, minute
 * and second roll. They are wrapped in a `NumberFlowGroup` so all three fields
 * advance in one animation frame — three independent counters drift apart by a
 * frame on the tick where the second carries into the minute, and that reads
 * as a stutter rather than as a clock.
 */
function ClockTime({ epochMs, locale }: { epochMs: number; locale: string }) {
  const date = new Date(epochMs);

  const hour = date.getHours() % 12 || 12;
  const minute = date.getMinutes();
  const second = date.getSeconds();

  // `locale` is a BCP 47 tag, so it is "bn-BD" rather than "bn". Comparing
  // against "bn" would never match, and the Bangla clock would quietly render
  // Latin digits.
  const bcp47 = locale.startsWith("bn") ? "bn-BD" : "en-US";

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
 * The banner shown when polling has failed repeatedly. Separated from the
 * inline label so it can carry the explanation and a retry, and only appears
 * once the failure is real rather than a single dropped request.
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
