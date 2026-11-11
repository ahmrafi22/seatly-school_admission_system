import { useState, type FormEvent } from "react";
import {
  RiAddLine,
  RiErrorWarningLine,
  RiRefreshLine,
} from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { NumberField } from "@/components/base/number-field/number-field";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  useModalClose,
} from "@/components/base/modal/modal";
import { toast } from "@/components/base/toast/toast";
import { useI18n } from "@/src/i18n/LanguageProvider";
import { api, type ClassSummary } from "@/src/lib/api";
import { usePolling } from "@/src/lib/usePolling";
import { SeatBar } from "@/src/components/SeatBar";
import { Freshness, OfflineBanner } from "@/src/components/Freshness";
import { readableError } from "@/src/lib/errors";
import { occupancyPercent } from "@/src/lib/format";

// Mirrors the server's limits so common mistakes are caught before a round trip.
const MAX_NAME = 200;
const MIN_SEATS = 1;
const MAX_SEATS = 10_000;

/**
 * Class administration. Every class is shown with its full inventory as one
 * card. Creating is behind a dialog so the default view is the numbers.
 *
 * The dialog mirrors the server's own limits (name required, 1-10,000 seats) so
 * common mistakes are caught before a round trip.
 */
export function ManageView({ onCreated }: { onCreated: () => void }) {
  const { t } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);

  const classes = usePolling<ClassSummary[]>(() => api.listClasses(), 8_000);
  const list = classes.data ?? [];

  const isLoading = classes.isLoading;
  const firstLoadFailed = isLoading === false && classes.data === null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-display-2 text-text-primary">{t.manage.heading}</h2>
          <p className="mt-1 max-w-[42rem] text-body-medium text-text-secondary">
            {t.manage.subheading}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="primary"
            size="medium"
            leadingIcon={RiAddLine}
            onClick={() => setDialogOpen(true)}
          >
            {t.manage.add}
          </Button>
        </div>
      </div>

      <OfflineBanner
        failures={classes.failures}
        onRetry={classes.refresh}
        isRetrying={classes.isFetching}
      />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1].map((key) => (
            <StatCardSkeleton key={key} />
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
          <h3 className="font-display text-title-3-semibold text-text-primary">
            {t.classes.emptyTitle}
          </h3>
          <p className="mt-1.5 max-w-[28rem] text-body-regular text-text-secondary">
            {t.manage.emptyBody}
          </p>
        </div>
      )}

      {list.length > 0 && (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-headline-medium text-text-primary">
              {t.manage.existing}
            </h3>
            <Freshness
              lastCheckedAt={classes.lastCheckedAt}
              isFetching={classes.isFetching}
              failures={classes.failures}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {list.map((cls) => (
              <ClassStatCard key={cls.id} cls={cls} />
            ))}
          </div>
        </>
      )}

      <CreateClassDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => {
          classes.refresh();
          onCreated();
        }}
      />
    </div>
  );
}

/**
 * One class's seat inventory: name, fill percentage, the seat bar, and the
 * counts behind it. Held is separate from confirmed because only one is
 * permanent.
 */
function ClassStatCard({ cls }: { cls: ClassSummary }) {
  const { t, n } = useI18n();
  const fill = Math.round(occupancyPercent(cls));

  return (
    <article className="flex flex-col rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="min-w-0 truncate text-title-3-semibold text-text-primary">
          {cls.name}
        </h4>
        <span className="shrink-0 text-figure text-text-primary">
          {n(fill)}
          <span className="text-caption-1-medium font-normal text-text-tertiary">%</span>
        </span>
      </div>

      <SeatBar cls={cls} className="mt-3" />

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-separator-border pt-4 sm:grid-cols-4">
        <Stat label={t.classes.totalSeats} value={cls.totalSeats} />
        <Stat label={t.classes.confirmed} value={cls.confirmedSeats} />
        <Stat label={t.classes.held} value={cls.heldSeats} />
        <Stat label={t.classes.free} value={cls.availableSeats} />
      </dl>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const { n } = useI18n();
  return (
    <div className="min-w-0">
      <dt className="truncate text-caption-1-medium text-text-tertiary">{label}</dt>
      <dd className="mt-0.5 text-figure text-text-primary">{n(value)}</dd>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-card">
      <div className="h-5 w-2/5 animate-pulse rounded-md bg-background-tertiary-default" />
      <div className="mt-4 h-2.5 w-full animate-pulse rounded-full bg-background-tertiary-default" />
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div
            key={key}
            className="h-8 animate-pulse rounded-md bg-background-tertiary-default"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * The create-class dialog. State lives inside the panel because React Aria
 * unmounts closed contents, so every visit starts blank.
 */
function CreateClassDialog({
  isOpen,
  onOpenChange,
  onCreated,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="md" role="dialog">
      <CreateClassPanel onCreated={onCreated} />
    </Modal>
  );
}

function CreateClassPanel({ onCreated }: { onCreated: () => void }) {
  const { t, tpl } = useI18n();
  const close = useModalClose();
  const [name, setName] = useState("");
  const [seats, setSeats] = useState<number>(40);
  const [errors, setErrors] = useState<{ name?: string; seats?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: { name?: string; seats?: string } = {};

    const trimmed = name.trim();
    if (trimmed.length === 0) nextErrors.name = t.manage.errorName;
    else if (trimmed.length > MAX_NAME) {
      nextErrors.name = tpl(t.manage.nameHint, { max: MAX_NAME });
    }

    if (!Number.isInteger(seats) || seats < MIN_SEATS || seats > MAX_SEATS) {
      nextErrors.seats = tpl(t.manage.errorSeats, { min: MIN_SEATS, max: MAX_SEATS });
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      const created = await api.createClass(trimmed, seats);
      toast.success(t.toast.classCreated, { description: created.name });
      onCreated();
      close();
    } catch (caught) {
      setFormError(readableError(caught, t));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ModalHeader
        title={t.manage.formTitle}
        closeLabel={t.common.close}
      />

      <ModalBody>
        <form
          id="create-class"
          onSubmit={submit}
          noValidate
          className="flex flex-col gap-4 pb-2"
        >
          <Input
            label={t.manage.nameLabel}
            placeholder={t.manage.namePlaceholder}
            hint={tpl(t.manage.nameHint, { max: MAX_NAME })}
            value={name}
            onChange={(next) => {
              setName(next);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            isInvalid={Boolean(errors.name)}
            errorMessage={errors.name}
            maxLength={200}
            autoComplete="off"
          />

          <NumberField
            label={t.manage.seatsLabel}
            hint={tpl(t.manage.seatsHint, { min: MIN_SEATS, max: MAX_SEATS })}
            value={seats}
            onChange={setSeats}
            minValue={MIN_SEATS}
            maxValue={MAX_SEATS}
            step={1}
            isInvalid={Boolean(errors.seats)}
          />
          {errors.seats && (
            <p className="-mt-2 text-caption-1-medium text-text-error-primary">
              {errors.seats}
            </p>
          )}

          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-background-tertiary-error px-3 py-2.5"
            >
              <RiErrorWarningLine
                className="mt-0.5 size-4 shrink-0 text-text-error-primary"
                aria-hidden
              />
              <p className="text-body-regular text-text-primary">{formError}</p>
            </div>
          )}
        </form>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" size="medium" onClick={close}>
          {t.common.cancel}
        </Button>
        <Button
          type="submit"
          form="create-class"
          variant="primary"
          size="medium"
          disabled={saving}
          aria-busy={saving || undefined}
          leadingIcon={RiAddLine}
        >
          {saving ? t.manage.creating : t.manage.create}
        </Button>
      </ModalFooter>
    </>
  );
}
