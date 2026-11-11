import NumberFlow, { type Format } from "@number-flow/react";
import { useI18n } from "@/src/i18n/LanguageProvider";

/**
 * A number that rolls when it changes.
 *
 * Polling means these figures change under the reader's eyes every few seconds,
 * and a digit that silently swaps from 7 to 6 is easy to miss — worse, it is
 * easy to misread, because nothing tells you the page moved. NumberFlow slides
 * the changed digits through a masked column, so the change is visible without
 * a flash, a toast, or a layout shift.
 *
 * Two details make this safe to use everywhere:
 *
 *   - The locale comes from the language provider, so Bangla gets Bangla
 *     numerals and its own thousands separator (`১,২৩৪`) from `Intl` rather
 *     than from a string replace.
 *   - The animation is `aria-hidden` and a plain-text reading sits beside it in
 *     an `sr-only` span. A screen reader gets a stable number instead of a
 *     stream of digit nodes, and — because the plain text is the only text in
 *     the accessibility tree — the animated element can never be read twice.
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
  const { locale } = useI18n();

  return (
    <>
      <span className="sr-only">{label}</span>
      <NumberFlow
        value={value}
        locales={locale}
        format={format}
        className={className}
        aria-hidden
      />
    </>
  );
}
