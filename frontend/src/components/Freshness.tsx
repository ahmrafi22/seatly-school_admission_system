import { cx } from "@/utils/cx";
import { useI18n } from "@/src/i18n/LanguageProvider";
import { useNow } from "@/src/lib/usePolling";

/**
 * How current the numbers on screen are.
 *
 * Three states, and each one answers a question the student actually has:
 *
 *   live    — "these counts were read 3 seconds ago"  (the polling is working)
 *   updating— "a read is in flight right now"
 *   offline — "the server is not answering, so what you see may be stale"
 *
 * The last state is a stated requirement: a stopped backend has to produce
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
  const { t, isBangla } = useI18n();
  // A clock, so "updated 3s ago" actually counts up between polls. Reading
  // Date.now() during render would freeze the label until the next fetch.
  const now = useNow(1000);

  const offline = failures >= 2;
  const age = lastCheckedAt === null ? null : now - lastCheckedAt;

  let text: string;
  let tone: "live" | "working" | "offline";

  if (offline) {
    tone = "offline";
    text = t.freshness.offline;
  } else if (isFetching) {
    tone = "working";
    text = t.freshness.updating;
  } else if (age === null) {
    tone = "working";
    text = t.freshness.updating;
  } else if (age < 5_000) {
    tone = "live";
    text = `${t.freshness.updated} ${t.freshness.updatedNow}`;
  } else if (age < 60_000) {
    tone = "live";
    const seconds = Math.floor(age / 1000);
    text = t.freshness.secondsAgo.replace("{n}", isBangla ? toBn(seconds) : String(seconds));
  } else {
    tone = "live";
    const minutes = Math.floor(age / 60_000);
    text = t.freshness.minutesAgo.replace("{n}", isBangla ? toBn(minutes) : String(minutes));
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
            : tone === "working"
              ? "bg-accent-400"
              : "live-dot bg-accent-500",
        )}
      />
      {text}
    </span>
  );
}

function toBn(n: number): string {
  const map = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/\d/g, (d) => map[Number(d)]);
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
