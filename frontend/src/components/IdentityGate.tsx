import { useState, type FormEvent } from "react";
import { RiArrowRightLine, RiIdCardLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useI18n } from "@/src/i18n/LanguageProvider";
import { isValidStudentId, STUDENT_ID_LENGTH } from "@/src/lib/useStudentId";
import { Logo } from "@/src/components/Logo";
import { Toolbar } from "@/src/components/Toolbar";

/**
 * The first screen: capture the 17-digit registration number.
 *
 * No account, no password. The number is the identity, so this screen has one
 * job and does it with as little ceremony as possible — but it validates
 * honestly (digits only, exactly 17) and explains the failure in a sentence
 * rather than a red border alone.
 */
export function IdentityGate({ onSubmit }: { onSubmit: (studentId: string) => void }) {
  const { t, isBangla } = useI18n();
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One source of truth: whatever the student types is normalised to at most
  // 17 digits before it is stored, so the displayed value and the validated
  // value can never disagree.
  const sanitize = (raw: string) => raw.replace(/\D/g, "").slice(0, STUDENT_ID_LENGTH);
  const digitsOnly = value;

  const validate = (raw: string): string | null => {
    if (raw.length === 0) return t.identity.errorEmpty;
    if (/\D/.test(raw)) return t.identity.errorFormat;
    if (raw.length < STUDENT_ID_LENGTH) return t.identity.errorShort;
    if (raw.length > STUDENT_ID_LENGTH) return t.identity.errorLong;
    return null;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    const message = validate(value);
    setError(message);
    if (!message && isValidStudentId(value)) onSubmit(value);
  };

  const remaining = STUDENT_ID_LENGTH - digitsOnly.length;

  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -right-32 size-[38rem] rounded-full bg-accent-100/60 blur-3xl dark:bg-accent-900/20" />
        <div className="absolute -bottom-48 -left-40 size-[34rem] rounded-full bg-accent-50/80 blur-3xl dark:bg-accent-950/40" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <Toolbar />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 pb-16 sm:px-8">
        <div className="w-full max-w-[30rem]">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-border-button-default bg-background-primary-default px-3 py-1 text-caption-1-semibold text-text-secondary shadow-card">
              <RiIdCardLine className="size-3.5 text-accent-600 dark:text-accent-400" aria-hidden />
              {t.brandTagline}
            </span>

            <h1 className="mt-5 text-display-1 text-text-primary">
              {t.identity.title}
            </h1>
            <p className="mt-3 max-w-[26rem] text-body-medium text-text-secondary">
              {t.identity.description}
            </p>

            <form onSubmit={submit} noValidate className="mt-8">
              <Input
                label={t.identity.label}
                placeholder={t.identity.placeholder}
                value={digitsOnly}
                onChange={(next) => {
                  const clean = sanitize(next);
                  setValue(clean);
                  if (touched) setError(validate(clean));
                }}
                onBlur={() => {
                  setTouched(true);
                  setError(validate(value));
                }}
                isInvalid={Boolean(error)}
                errorMessage={error ?? undefined}
                hint={
                  remaining > 0
                    ? isBangla
                      ? `${remaining} সংখ্যা বাকি`
                      : `${remaining} digit${remaining === 1 ? "" : "s"} to go`
                    : t.identity.hint
                }
                // A registration number is a code: monospaced, tabular, always
                // left-to-right even inside a Bangla interface.
                className="[&_input]:font-mono [&_input]:tracking-[0.08em]"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                name="studentId"
                size="medium"
              />

              <Button
                type="submit"
                size="medium"
                className="mt-6 h-11 w-full text-body-medium"
                trailingIcon={RiArrowRightLine}
              >
                {t.identity.submit}
              </Button>
            </form>

            <p className="mt-6 flex items-start gap-2 text-caption-1-medium text-text-tertiary">
              <span
                aria-hidden
                className="mt-[3px] inline-block size-1 shrink-0 rounded-full bg-accent-500"
              />
              {t.identity.hint}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
