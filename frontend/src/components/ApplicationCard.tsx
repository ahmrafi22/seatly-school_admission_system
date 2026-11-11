import { useState } from "react";
import { RiTimeLine } from "@remixicon/react";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { Button } from "@/components/base/buttons/button";
import { Chip } from "@/components/base/badges/chip";
import { AlertDialog } from "@/components/base/modal/modal";
import { AdmissionFeeDialog } from "@/src/components/AdmissionFeeDialog";
import { useI18n } from "@/src/i18n/LanguageProvider";
import { api, type MyHold } from "@/src/lib/api";
import { readableError } from "@/src/lib/errors";
import { effectiveStatus, formatCountdown, formatTime } from "@/src/lib/format";

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
  const { t, locale } = useI18n();
  const [busy, setBusy] = useState<"cancel" | null>(null);
  const [feeOpen, setFeeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = effectiveStatus(hold.status, hold.expiresAt, now);
  const msLeft = Math.max(0, Date.parse(hold.expiresAt) - now);
  const urgent = status === "HELD" && msLeft > 0 && msLeft < 120_000;

  const cancel = async () => {
    setBusy("cancel");
    setError(null);
    try {
      await api.cancelHold(hold.holdId, studentId);
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
              {/* The digits roll, so they are hidden from the accessibility
                  tree and replaced with one stable reading. A screen reader
                  would otherwise hear a stream of changing digit nodes every
                  second. */}
              <span aria-hidden>
                <Countdown msLeft={msLeft} />
              </span>
              <span className="sr-only">{formatCountdown(msLeft)}</span>
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
              onClick={() => setFeeOpen(true)}
              disabled={busy !== null}
            >
              {t.hold.payFee}
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

      {/* Paying the fee is a hold, not a click: the seat leaves the pool for
          good and the payment stands, so the gesture has to be deliberate. */}
      <AdmissionFeeDialog
        isOpen={feeOpen}
        onOpenChange={setFeeOpen}
        hold={hold}
        studentId={studentId}
        onConfirmed={onChanged}
      />

      <AlertDialog
        isOpen={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t.hold.cancellingTitle}
        description={t.hold.cancellingBody}
        confirmLabel={t.hold.cancelYes}
        cancelLabel={t.common.cancel}
        pendingLabel={t.hold.cancelling}
        onConfirm={cancel}
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

/**
 * The hold countdown, as two rolling numbers.
 *
 * `NumberFlowGroup` is what makes this read as one clock rather than two
 * independent counters: the group batches both flows into a single animation
 * frame, so minutes and seconds always move together. Without it the seconds
 * digit can visibly land a frame before the minutes digit on the tick where
 * both change.
 *
 * Each half is padded to two digits by its `format` rather than by string
 * padding, so `04` is two real digits that roll, and a value that crosses from
 * `59` to `00` slides rather than jumping.
 */
function Countdown({ msLeft }: { msLeft: number }) {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return (
    <NumberFlowGroup>
      <span className="tabular">
        <NumberFlow
          value={minutes}
          format={{ minimumIntegerDigits: 2 }}
          trend={-1}
          aria-hidden
        />
        {":"}
        <NumberFlow
          value={seconds}
          format={{ minimumIntegerDigits: 2 }}
          trend={-1}
          aria-hidden
        />
      </span>
    </NumberFlowGroup>
  );
}
