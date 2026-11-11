import { RiInboxLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { useI18n } from "@/src/i18n/LanguageProvider";
import type { MyHold } from "@/src/lib/api";
import { ApplicationCard } from "@/src/components/ApplicationCard";
import { Freshness } from "@/src/components/Freshness";
import { useNow } from "@/src/lib/usePolling";

/**
 * The student's own applications. Kept in sync by polling, so a hold that
 * expires while this tab is open turns EXPIRED on its own: the countdown drives
 * the chip and the next poll confirms it with the server.
 */
export function MyApplicationsView({
  studentId,
  holds,
  isLoading,
  isFetching,
  lastCheckedAt,
  failures,
  onRefresh,
  onBrowse,
}: {
  studentId: string;
  holds: MyHold[];
  isLoading: boolean;
  isFetching: boolean;
  lastCheckedAt: number | null;
  failures: number;
  onRefresh: () => void;
  onBrowse: () => void;
}) {
  const { t } = useI18n();
  const now = useNow(1000);

  const sorted = [...holds].sort((a, b) => {
    const rank = (status: string) =>
      status === "HELD" ? 0 : status === "CONFIRMED" ? 1 : status === "EXPIRED" ? 2 : 3;
    const diff = rank(a.status) - rank(b.status);
    if (diff !== 0) return diff;
    return Date.parse(b.expiresAt) - Date.parse(a.expiresAt);
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-display-2 text-text-primary">{t.mine.heading}</h2>
          <p className="mt-1 text-body-medium text-text-secondary">
            {t.mine.subheading}
          </p>
        </div>
        <Freshness lastCheckedAt={lastCheckedAt} isFetching={isFetching} failures={failures} />
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[0, 1].map((key) => (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5"
            >
              <div className="flex-1">
                <Skeleton shape="text" className="h-5 w-1/3 rounded-md" />
                <Skeleton shape="text" className="mt-2 h-3 w-1/2 rounded-md" />
              </div>
              <Skeleton shape="rect" className="h-10 w-40 rounded-2lg" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-border-button-default bg-background-primary-default px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-background-secondary-default text-foreground-icon-secondary">
            <RiInboxLine className="size-5" aria-hidden />
          </span>
          <h3 className="mt-4 font-display text-title-3-semibold text-text-primary">
            {t.mine.emptyTitle}
          </h3>
          <p className="mt-1.5 max-w-[28rem] text-body-regular text-text-secondary">
            {t.mine.emptyBody}
          </p>
          <Button variant="primary" size="medium" className="mt-5" onClick={onBrowse}>
            {t.mine.browse}
          </Button>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="flex flex-col gap-3">
          {sorted.map((hold) => (
            <ApplicationCard
              key={hold.holdId}
              hold={hold}
              studentId={studentId}
              now={now}
              onChanged={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
