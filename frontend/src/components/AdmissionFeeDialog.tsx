import { useState } from "react";
import { RiBillLine } from "@remixicon/react";
import { Heading } from "react-aria-components";
import { Modal, ModalBody, ModalHeader, useModalClose } from "@/components/base/modal/modal";
import { Button } from "@/components/base/buttons/button";
import { HoldToConfirm } from "@/src/components/HoldToConfirm";
import { ConfirmMark } from "@/src/components/ConfirmMark";
import { useI18n } from "@/src/i18n/LanguageProvider";
import { api, type MyHold } from "@/src/lib/api";
import { readableError } from "@/src/lib/errors";
import { formatTime } from "@/src/lib/format";

/**
 * The admission-fee dialog.
 *
 * Confirming is the one irreversible thing a student can do here, so the
 * dialog is built around a deliberate gesture: the fee is confirmed by
 * *holding* a button, not by clicking it. A click is too easy to make by
 * accident on a phone held in one hand while carrying something else.
 *
 * The dialog then has two faces:
 *
 *   1. before — what is being paid for, and the hold-to-confirm control;
 *   2. after  — the green tick, drawn rather than shown, and the seat is
 *      secured.
 *
 * The second face does not open a separate screen the reader has to find: it
 * takes over the same panel, so the thing that changed is the only thing that
 * moved.
 *
 * The state lives inside the modal rather than in this wrapper, because React
 * Aria unmounts a closed modal's contents — so a hold confirmed in one visit
 * cannot read as a hold confirmed in the next.
 */
export function AdmissionFeeDialog({
  isOpen,
  onOpenChange,
  hold,
  studentId,
  onConfirmed,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hold: MyHold;
  studentId: string;
  onConfirmed: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm" role="dialog">
      <FeePanel
        hold={hold}
        studentId={studentId}
        onConfirmed={onConfirmed}
      />
    </Modal>
  );
}

function FeePanel({
  hold,
  studentId,
  onConfirmed,
}: {
  hold: MyHold;
  studentId: string;
  onConfirmed: () => void;
}) {
  const { t, locale } = useI18n();
  const close = useModalClose();
  const [state, setState] = useState<"idle" | "pending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  // Bumped after a failure so the hold control starts over rather than
  // remembering a hold that already completed.
  const [attempt, setAttempt] = useState(0);

  const confirm = async () => {
    setState("pending");
    setError(null);
    try {
      await api.confirmHold(hold.holdId, studentId);
      setState("done");
      onConfirmed();
    } catch (caught) {
      setState("idle");
      setError(readableError(caught, t));
      setAttempt((n) => n + 1);
    }
  };

  if (state === "done") {
    return (
      <div className="flex flex-col items-center px-6 pt-4 pb-6 text-center">
        <ConfirmMark />
        <Heading
          slot="title"
          className="mt-6 font-display text-title-2-medium text-text-primary"
        >
          {t.hold.confirmedTitle}
        </Heading>
        <p className="mt-2 max-w-[22rem] text-body-regular text-text-secondary">
          {t.hold.confirmedBody}
        </p>
        <p className="mt-4 text-body-medium text-text-tertiary">
          {hold.className} · {t.hold.seatNumber} {hold.holdId.slice(0, 8)}
        </p>
        <Button
          variant="primary"
          size="medium"
          className="mt-7 h-11 w-full"
          onClick={close}
        >
          {t.common.close}
        </Button>
      </div>
    );
  }

  return (
    <>
      <ModalHeader
        title={t.hold.payFee}
        description={t.hold.confirmingBody}
        icon={RiBillLine}
        closeLabel={t.common.close}
      />
      <ModalBody>
        {/* What is being paid for. Three facts and no more: the class, the
            application reference, and the moment the seat goes back into the
            pool if nothing is confirmed. */}
        <dl className="divide-y divide-separator-border rounded-2xl border border-border-button-default bg-background-secondary-default px-4">
          <Row label={t.hold.classLabel} value={hold.className} />
          <Row label={t.hold.seatNumber} value={hold.holdId.slice(0, 8)} mono />
          <Row label={t.hold.expiresLabel} value={formatTime(hold.expiresAt, locale)} />
        </dl>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-background-tertiary-error px-3 py-2 text-body-regular text-text-error-primary"
          >
            {error}
          </p>
        )}

        <div className="mt-5">
          <HoldToConfirm
            key={attempt}
            label={t.hold.holdToConfirm}
            holdingLabel={t.hold.holdingToConfirm}
            onComplete={confirm}
            disabled={state === "pending"}
          />
          <p className="mt-3 text-center text-caption-1-medium text-text-tertiary">
            {state === "pending" ? t.hold.paying : t.hold.holdHint}
          </p>
        </div>
      </ModalBody>
    </>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-caption-1-medium text-text-secondary">{label}</dt>
      <dd
        className={
          mono
            ? "id-code text-caption-1-medium text-text-primary"
            : "truncate text-caption-1-semibold text-text-primary"
        }
      >
        {value}
      </dd>
    </div>
  );
}
