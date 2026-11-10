import { useState } from "react";
import {
  RiArrowRightLine,
  RiErrorWarningLine,
  RiRefreshLine,
  RiSchoolLine,
} from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { useI18n } from "@/src/i18n/LanguageProvider";
import { api, ApiError, type ClassSummary, type MyHold } from "@/src/lib/api";
import { usePolling } from "@/src/lib/usePolling";
import { ClassCard, ClassCardSkeleton } from "@/src/components/ClassCard";
import { Freshness, OfflineBanner } from "@/src/components/Freshness";
import { readableError } from "@/src/components/ApplicationCard";

const POLL_MS = 4_000;

/**
 * The list of open classes.
 *
 * Polls every four seconds so seat counts move without a reload, and surfaces
 * the last successful read in the header. A failed poll does not blank the
 * list: the last known counts stay on screen, dimmed under an honest banner,
 * because "the server is down" is more useful than "no classes".
 */
export function ClassesView({
  studentId,
  myHolds,
  onApplied,
  onOpenMine,
}: {
  studentId: string;
  myHolds: MyHold[];
  onApplied: () => void;
  onOpenMine: () => void;
}) {
  const { t, isBangla } = useI18n();
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const classes = usePolling<ClassSummary[]>(() => api.listClasses(), POLL_MS);
  const list = classes.data ?? [];

  const statusByClass = new Map<string, MyHold["status"]>();
  for (const hold of myHolds) {
    // A confirmed seat outranks a live hold, which outranks a terminal row.
    const current = statusByClass.get(hold.classId);
    if (current === "CONFIRMED") continue;
    if (hold.status === "CONFIRMED" || !current) {
      statusByClass.set(hold.classId, hold.status);
    }
  }

  const apply = async (cls: ClassSummary) => {
    setApplyingId(cls.id);
    setActionError(null);
    try {
      await api.createHold(cls.id, studentId);
      onApplied();
      classes.refresh();
    } catch (caught) {
      setActionError(readableError(caught, t));
      // A 409 means someone took the last seat: read again so the card tells
      // the truth rather than leaving a stale number next to an error.
      if (caught instanceof ApiError && caught.status === 409) classes.refresh();
    } finally {
      setApplyingId(null);
    }
  };

  const isLoading = classes.isLoading;
  const firstLoadFailed = isLoading === false && classes.data === null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-display-2 text-text-primary">{t.classes.heading}</h2>
          <p className="mt-1 text-body-medium text-text-secondary">
            {t.classes.subheading}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Freshness
            lastCheckedAt={classes.lastCheckedAt}
            isFetching={classes.isFetching}
            failures={classes.failures}
          />
          <Button
            variant="secondary"
            size="small"
            iconOnly
            aria-label={t.common.retry}
            onClick={classes.refresh}
            leadingIcon={RiRefreshLine}
          />
        </div>
      </div>

      <OfflineBanner
        failures={classes.failures}
        onRetry={classes.refresh}
        isRetrying={classes.isFetching}
      />

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-border-error-default bg-background-tertiary-error px-4 py-3"
        >
          <RiErrorWarningLine
            className="mt-0.5 size-4 shrink-0 text-text-error-primary"
            aria-hidden
          />
          <p className="text-body-regular text-text-primary">{actionError}</p>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <ClassCardSkeleton key={key} />
          ))}
        </div>
      )}

      {!isLoading && firstLoadFailed && (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-border-button-default bg-background-primary-default px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-background-tertiary-error text-text-error-primary">
            <RiErrorWarningLine className="size-5" aria-hidden />
          </span>
          <h3 className="mt-4 font-display text-title-3-semibold text-text-primary">
            {t.errors.networkTitle}
          </h3>
          <p className="mt-1.5 max-w-[26rem] text-body-regular text-text-secondary">
            {t.errors.networkBody}
          </p>
          <Button
            variant="secondary"
            size="medium"
            className="mt-5"
            leadingIcon={RiRefreshLine}
            onClick={classes.refresh}
          >
            {t.common.retry}
          </Button>
        </div>
      )}

      {!isLoading && !firstLoadFailed && list.length === 0 && (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-border-button-default bg-background-primary-default px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-background-secondary-default text-foreground-icon-secondary">
            <RiSchoolLine className="size-5" aria-hidden />
          </span>
          <h3 className="mt-4 font-display text-title-3-semibold text-text-primary">
            {t.classes.emptyTitle}
          </h3>
          <p className="mt-1.5 max-w-[28rem] text-body-regular text-text-secondary">
            {t.classes.emptyBody}
          </p>
        </div>
      )}

      {list.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              myStatus={statusByClass.get(cls.id)}
              onApply={apply}
              isApplying={applyingId === cls.id}
              isBusy={applyingId !== null && applyingId !== cls.id}
            />
          ))}
        </div>
      )}

      {myHolds.some((hold) => hold.status === "HELD") && (
        <button
          type="button"
          onClick={onOpenMine}
          className="group mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3 text-start transition-colors hover:bg-accent-100 focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:outline-none dark:border-accent-800 dark:bg-accent-950/40 dark:hover:bg-accent-900/40"
        >
          <span className="text-body-medium text-accent-900 dark:text-accent-100">
            {isBangla
              ? "আপনার একটি আসন সংরক্ষিত আছে — সময় শেষ হওয়ার আগে নিশ্চিত করুন"
              : "You have a seat on hold — confirm it before the timer runs out"}
          </span>
          <RiArrowRightLine
            className="size-4 shrink-0 text-accent-700 transition-transform group-hover:translate-x-0.5 dark:text-accent-300"
            aria-hidden
          />
        </button>
      )}
    </div>
  );
}
