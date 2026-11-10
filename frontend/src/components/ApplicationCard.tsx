import { useState } from "react";
import { RiCheckLine, RiTimeLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Chip } from "@/components/base/badges/chip";
import { AlertDialog } from "@/components/base/modal/modal";
import { useI18n } from "@/src/i18n/LanguageProvider";
import { api, ApiError, type MyHold } from "@/src/lib/api";
import { effectiveStatus, formatTime, localizeDigits } from "@/src/lib/format";

/**
 * One application, with its own live countdown.
 *
 * The status shown is `effectiveStatus`, not the stored one: a HELD row whose
 * `expiresAt` has passed reads EXPIRED here the instant the clock crosses,
 * without a reload and without waiting for the next poll. That is the
 * requirement stated most explicitly in the brief, and doing it on the client
 * means it is exact rather than "within a few seconds".
 */
export function ApplicationCard({
  hold,
  studentId,
  now,
  onChanged,
}: {
  hold: MyHold;
  studentId: string;
  now: number;
  onChanged: () => void;
}) {
  const { t, isBangla, locale } = useI18n();
  const [busy, setBusy] = useState<"confirm" | "cancel" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = effectiveStatus(hold.status, hold.expiresAt, now);
  const msLeft = Math.max(0, Date.parse(hold.expiresAt) - now);
  const urgent = status === "HELD" && msLeft > 0 && msLeft < 120_000;

  const n = (value: number) => localizeDigits(value, isBangla ? "bn" : "en");

  const run = async (action: "confirm" | "cancel") => {
    setBusy(action);
    setError(null);
    try {
      if (action === "confirm") {
        await api.confirmHold(hold.holdId, studentId);
      } else {
        await api.cancelHold(hold.holdId, studentId);
      }
      onChanged();
    } catch (caught) {
      setError(readableError(caught, t));
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-title-3-semibold text-text-primary">
            {hold.className}
          </h3>
          <StatusChip status={status} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption-1-medium text-text-tertiary">
          <span>
            {t.mine.expiresAt}: {formatTime(hold.expiresAt, locale)}
          </span>
          <span className="id-code text-[0.6875rem]">
            {t.hold.seatNumber} {hold.holdId.slice(0, 8)}
          </span>
        </div>

        {status === "HELD" && (
          <div
            className={
              urgent
                ? "mt-3 inline-flex items-center gap-2 rounded-xl bg-background-tertiary-error px-2.5 py-1.5 text-caption-1-semibold text-text-error-primary"
                : "mt-3 inline-flex items-center gap-2 rounded-xl bg-background-secondary-default px-2.5 py-1.5 text-caption-1-semibold text-text-secondary"
            }
          >
            <RiTimeLine className="size-3.5" aria-hidden />
            <span>
              {t.hold.expiresIn}{" "}
              <span className="tabular">{formatClock(msLeft, n)}</span>
            </span>
          </div>
        )}

        {status === "EXPIRED" && (
          <p className="mt-2 text-body-regular text-text-secondary">{t.hold.expiredBody}</p>
        )}

        {status === "CONFIRMED" && (
          <p className="mt-2 text-body-regular text-text-secondary">{t.hold.confirmedBody}</p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-background-tertiary-error px-3 py-2 text-body-regular text-text-error-primary"
          >
            {error}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:w-[13.5rem]">
        {status === "HELD" && (
          <>
            <Button
              variant="primary"
              size="medium"
              className="h-10 w-full"
              onClick={() => setConfirmOpen(true)}
              aria-busy={busy === "confirm" || undefined}
              disabled={busy !== null}
            >
              {busy === "confirm" ? t.hold.paying : t.hold.payFee}
            </Button>
            <Button
              variant="secondary"
              size="medium"
              className="h-10 w-full"
              onClick={() => setCancelOpen(true)}
              disabled={busy !== null}
            >
              {busy === "cancel" ? t.hold.cancelling : t.hold.cancelApplication}
            </Button>
          </>
        )}
      </div>

      <AlertDialog
        isOpen={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="default"
        icon={RiCheckLine}
        title={t.hold.confirmingTitle}
        description={t.hold.confirmingBody}
        confirmLabel={t.hold.confirmYes}
        cancelLabel={t.common.cancel}
        pendingLabel={t.hold.paying}
        onConfirm={() => run("confirm")}
      />

      <AlertDialog
        isOpen={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t.hold.cancellingTitle}
        description={t.hold.cancellingBody}
        confirmLabel={t.hold.cancelYes}
        cancelLabel={t.common.cancel}
        pendingLabel={t.hold.cancelling}
        onConfirm={() => run("cancel")}
      />
    </article>
  );
}

function StatusChip({ status }: { status: string }) {
  const { t } = useI18n();
  const map = {
    HELD: { color: "cyan" as const, label: t.mine.statusHeld },
    CONFIRMED: { color: "lime" as const, label: t.mine.statusConfirmed },
    EXPIRED: { color: "neutral" as const, label: t.mine.statusExpired },
    CANCELLED: { color: "rose" as const, label: t.mine.statusCancelled },
  };
  const entry = map[status as keyof typeof map] ?? map.EXPIRED;
  return (
    <Chip color={entry.color} variant="bold">
      {entry.label}
    </Chip>
  );
}

function formatClock(ms: number, n: (v: number) => string) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${n(m).padStart(2, "0")}:${n(s).padStart(2, "0")}`;
}

/** Turn any thrown value into a sentence, preferring the server's own detail. */
export function readableError(
  caught: unknown,
  t: ReturnType<typeof useI18n>["t"],
): string {
  if (caught instanceof ApiError) {
    if (caught.isNetworkError) {
      return `${t.errors.networkTitle}. ${t.errors.networkBody}`;
    }
    return caught.message;
  }
  return caught instanceof Error ? caught.message : t.errors.genericTitle;
}
