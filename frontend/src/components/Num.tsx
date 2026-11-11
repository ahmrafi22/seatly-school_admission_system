import NumberFlow, { type Format } from "@number-flow/react";
import { useI18n } from "@/src/i18n/LanguageProvider";

/**
 * A number that rolls when it changes, so a polled figure updating under the
 * reader's eyes is not missed. The animation is aria-hidden and paired with a
 * plain-text reading for screen readers.
 *
 * Bangla renders as plain text: number-flow collapses to zero width when it is
 * given a Bengali locale, which hides the figure entirely.
 */
export function Num({
  value,
  label,
  className,
  format,
}: {
  value: number;
  /** The plain-text reading, e.g. "12 available". */
  label: string;
  className?: string;
  format?: Format;
}) {
  const { locale, isBangla } = useI18n();

  return (
    <>
      <span className="sr-only">{label}</span>
      {isBangla ? (
        <span aria-hidden className={className}>
          {label}
        </span>
      ) : (
        <NumberFlow
          value={value}
          locales={locale}
          format={format}
          className={className}
          aria-hidden
        />
      )}
    </>
  );
}
