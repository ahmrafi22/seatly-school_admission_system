import { useState, type FormEvent } from "react";
import { RiAddLine, RiErrorWarningLine, RiInformationLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { NumberField } from "@/components/base/number-field/number-field";
import { useI18n } from "@/src/i18n/LanguageProvider";
import { api, ApiError, type ClassSummary } from "@/src/lib/api";
import { usePolling } from "@/src/lib/usePolling";
import { SeatBar } from "@/src/components/SeatBar";
import { Freshness } from "@/src/components/Freshness";

// Mirrors the server's own limits, so the common mistakes are caught before a
// round trip and the copy can name the exact bounds.
const MAX_NAME = 200;
const MIN_SEATS = 1;
const MAX_SEATS = 10_000;

/**
 * Class administration.
 *
 * The brief asks for the whole system to be operable from the UI, which
 * includes creating a class — so this is a real form, not a note pointing at
 * curl. Validation mirrors the server's own rules (name required, 1–10,000
 * seats) so the common mistakes are caught before a round trip, and the
 * server's message still wins if it disagrees.
 */
export function ManageView({ onCreated }: { onCreated: () => void }) {
  const { t, tpl, n } = useI18n();
  const [name, setName] = useState("");
  const [seats, setSeats] = useState<number>(40);
  const [errors, setErrors] = useState<{ name?: string; seats?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [justCreated, setJustCreated] = useState<ClassSummary | null>(null);

  const classes = usePolling<ClassSummary[]>(() => api.listClasses(), 8_000);

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
      setJustCreated(created);
      setName("");
      setSeats(40);
      classes.refresh();
      onCreated();
    } catch (caught) {
      setFormError(
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error
            ? caught.message
            : t.errors.genericTitle,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-display-2 text-text-primary">{t.manage.heading}</h2>
        <p className="mt-1 max-w-[42rem] text-body-medium text-text-secondary">
          {t.manage.subheading}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
        <form
          onSubmit={submit}
          noValidate
          className="rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-card sm:p-6"
        >
          <h3 className="font-display text-title-3-semibold text-text-primary">
            {t.manage.formTitle}
          </h3>

          <div className="mt-5 flex flex-col gap-4">
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

            <Button
              type="submit"
              variant="primary"
              size="medium"
              className="h-10 w-full"
              disabled={saving}
              aria-busy={saving || undefined}
              leadingIcon={RiAddLine}
            >
              {saving ? t.manage.creating : t.manage.create}
            </Button>
          </div>

          {justCreated && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-accent-200 bg-accent-50 px-3 py-2.5 dark:border-accent-800 dark:bg-accent-950/40">
              <RiInformationLine
                className="mt-0.5 size-4 shrink-0 text-accent-700 dark:text-accent-300"
                aria-hidden
              />
              <p className="text-body-regular text-accent-900 dark:text-accent-100">
                {t.manage.created}: <strong className="font-medium">{justCreated.name}</strong> —{" "}
                {n(justCreated.totalSeats)} {t.common.seats}
              </p>
            </div>
          )}
        </form>

        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-headline-medium text-text-primary">{t.manage.existing}</h3>
            <Freshness
              lastCheckedAt={classes.lastCheckedAt}
              isFetching={classes.isFetching}
              failures={classes.failures}
            />
          </div>

          <div className="overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default shadow-card">
            {classes.data && classes.data.length === 0 && (
              <p className="px-5 py-10 text-center text-body-regular text-text-secondary">
                {t.classes.emptyBody}
              </p>
            )}

            {classes.data?.map((cls, index) => (
              <div
                key={cls.id}
                className={
                  index === 0
                    ? "px-5 py-4"
                    : "border-t border-separator-border px-5 py-4"
                }
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-body-medium text-text-primary">{cls.name}</p>
                    <p className="mt-0.5 text-caption-1-medium text-text-tertiary">
                      {n(cls.confirmedSeats)} {t.classes.confirmed.toLowerCase()} ·{" "}
                      {n(cls.heldSeats)} {t.classes.held.toLowerCase()} ·{" "}
                      {n(cls.availableSeats)} {t.classes.free.toLowerCase()}
                    </p>
                  </div>
                  <span className="text-figure shrink-0 text-[1.125rem] text-text-primary">
                    {n(cls.availableSeats)}
                    <span className="ms-1 text-caption-1-medium font-normal text-text-tertiary">
                      / {n(cls.totalSeats)}
                    </span>
                  </span>
                </div>
                <SeatBar cls={cls} size="sm" className="mt-2.5" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
