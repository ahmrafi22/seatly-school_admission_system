import { useState, type FormEvent } from "react";
import {
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiFileTextLine,
  RiLock2Line,
  RiUserHeartLine,
} from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useI18n } from "@/src/i18n/LanguageProvider";
import { isValidStudentId, STUDENT_ID_LENGTH } from "@/src/lib/useStudentId";
import { Logo } from "@/src/components/Logo";
import { SchoolScene } from "@/src/components/SchoolScene";
import { Toolbar } from "@/src/components/Toolbar";

/**
 * The first screen: capture the 17-digit registration number. No account and no
 * password, but it validates honestly and explains a failure in a sentence.
 *
 * Blurring an empty field is not an error, so it says nothing. The
 * digits-remaining counter only appears once there is something to count.
 */
export function IdentityGate({ onSubmit }: { onSubmit: (studentId: string) => void }) {
  const { t, tpl } = useI18n();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // One source of truth: the typed value is normalised to at most 17 digits
  // before it is stored, so the displayed and validated values cannot disagree.
  const sanitize = (raw: string) => raw.replace(/\D/g, "").slice(0, STUDENT_ID_LENGTH);

  const validate = (raw: string): string | null => {
    if (raw.length === 0) return tpl(t.identity.errorEmpty, { digits: STUDENT_ID_LENGTH });
    if (/\D/.test(raw)) return t.identity.errorFormat;
    if (raw.length < STUDENT_ID_LENGTH)
      return tpl(t.identity.errorShort, { digits: STUDENT_ID_LENGTH });
    if (raw.length > STUDENT_ID_LENGTH)
      return tpl(t.identity.errorLong, { digits: STUDENT_ID_LENGTH });
    return null;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const message = validate(value);
    setError(message);
    if (!message && isValidStudentId(value)) onSubmit(value);
  };

  const typed = value.length > 0;
  const remaining = STUDENT_ID_LENGTH - value.length;

  return (
    <div className="gate-ground relative flex min-h-dvh flex-col">
      <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <Logo />
        <Toolbar />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[80rem] flex-1 items-center px-5 pt-4 pb-32 sm:px-8 sm:pb-56 lg:pt-8">
        <div className="grid w-full grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.78fr)] lg:gap-24">
          <section className="w-full max-w-[36rem]">
            <div className="animate-rise">
              <p className="flex items-center gap-2 text-caption-1-semibold text-text-secondary uppercase">
                <span className="size-1.5 rounded-full bg-accent-500 dark:bg-accent-400" aria-hidden />
                {t.brandTagline}
              </p>

              <h1 className="mt-4 max-w-[30rem] text-display-1 text-balance text-text-primary">
                {t.identity.title}
              </h1>
              <p className="mt-5 max-w-[33rem] text-body-regular text-text-secondary">
                {tpl(t.identity.description, { digits: STUDENT_ID_LENGTH })}
              </p>

              <LandingBenefits />
            </div>
          </section>

          <form
            onSubmit={submit}
            noValidate
            className="animate-rise rounded-3xl border border-border-button-default bg-background-primary-default p-5 shadow-card [animation-delay:90ms] sm:p-7"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-accent-100 text-accent-700 dark:bg-accent-900 dark:text-accent-300">
                <RiFileTextLine className="size-5" aria-hidden />
              </div>
              <h2 className="text-title-2-medium text-text-primary">{t.identity.formTitle}</h2>
            </div>

            <div className="mt-6">
              <Input
                label={t.identity.label}
                placeholder={tpl(t.identity.placeholder, { digits: STUDENT_ID_LENGTH })}
                value={value}
                onChange={(next) => {
                  const clean = sanitize(next);
                  setValue(clean);
                  // Correct a message already on screen, but never raise one
                  // while the student is still typing.
                  if (error) setError(clean.length === 0 ? null : validate(clean));
                }}
                onBlur={() => {
                  if (value.length > 0) setError(validate(value));
                }}
                isInvalid={Boolean(error)}
                errorMessage={error ?? undefined}
                // No static hint and no permanent caption: at rest the field
                // shows only its placeholder, and the counter appears with the
                // first keystroke.
                trailingAddon={
                  typed ? (
                    remaining === 0 ? (
                      <span
                        className="flex shrink-0 items-center gap-1 ps-3 text-caption-1-medium whitespace-nowrap text-accent-700 dark:text-accent-400"
                        // The word is dropped on narrow screens to protect the
                        // number: 17 monospace digits plus a label does not fit
                        // a 320px phone. The tick stays, and the label moves to
                        // the accessible name.
                        aria-label={t.identity.complete}
                      >
                        <RiCheckboxCircleLine className="size-4" aria-hidden />
                        <span className="hidden sm:inline">{t.identity.complete}</span>
                      </span>
                    ) : (
                      <span className="field-note shrink-0 ps-3 text-caption-1-medium whitespace-nowrap text-text-secondary tabular">
                        {remaining === 1
                          ? t.identity.remainingOne
                          : tpl(t.identity.remaining, { n: remaining })}
                      </span>
                    )
                  ) : null
                }
                className="[&_input]:font-mono [&_input]:text-body-medium [&_input]:tracking-[0.08em]"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                name="studentId"
                size="medium"
              />
            </div>

            <Button
              type="submit"
              size="medium"
              className="mt-6 h-12 w-full text-body-medium"
              trailingIcon={RiArrowRightLine}
            >
              {t.identity.submit}
            </Button>

            <p className="mt-5 flex items-center justify-center gap-1.5 border-t border-separator-border pt-5 text-body-2-regular text-text-secondary">
              <RiLock2Line className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
              {t.identity.privacy}
            </p>
          </form>
        </div>
      </main>

      <SchoolScene />
    </div>
  );
}

function LandingBenefits() {
  const { t } = useI18n();
  return (
    <ul className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-body-2-regular text-text-secondary">
      <Benefit icon={RiUserHeartLine} label={t.identity.previewSecure} />
      <Benefit icon={RiLock2Line} label={t.identity.previewPrivate} />
      <Benefit icon={RiCheckboxCircleLine} label={t.identity.previewTrack} />
    </ul>
  );
}

function Benefit({ icon: Icon, label }: { icon: typeof RiLock2Line; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <Icon className="size-4.5 text-accent-700 dark:text-accent-400" aria-hidden />
      <span>{label}</span>
    </li>
  );
}
