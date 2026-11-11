import { RiMoonLine, RiSunLine } from "@remixicon/react";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/base/segmented-control/segmented-control";
import { useThemeMode, applyThemeWithTransition } from "@/components/application/theme/theme-toggle";
import { useI18n } from "@/src/i18n/LanguageProvider";
import type { Lang } from "@/src/i18n/copy";

/** Language and theme in the header. Both persist across refreshes. */
export function Toolbar({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { lang, setLang, t } = useI18n();
  const theme = useThemeMode();
  const dark = theme === "dark";

  if (compact) {
    return (
      <div className={className}>
        <button
          type="button"
          aria-label={dark ? t.theme.light : t.theme.dark}
          aria-pressed={dark}
          title={dark ? t.theme.light : t.theme.dark}
          onClick={(event) => {
            void applyThemeWithTransition(dark ? "light" : "dark", {
              origin:
                event.clientX === 0 && event.clientY === 0
                  ? null
                  : { x: event.clientX, y: event.clientY },
              element: event.currentTarget,
              duration: 620,
            });
          }}
          className="grid size-9 cursor-pointer place-items-center rounded-2lg text-foreground-icon-secondary transition-colors hover:bg-background-secondary-hover hover:text-foreground-icon-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:outline-none"
        >
          {dark ? (
            <RiSunLine className="size-4.5" aria-hidden />
          ) : (
            <RiMoonLine className="size-4.5" aria-hidden />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <SegmentedControl
          aria-label={t.language.label}
          selectedKeys={[lang]}
          onSelectionChange={(keys) => {
            const next = [...keys][0];
            if (next === "en" || next === "bn") setLang(next as Lang);
          }}
          className="shrink-0"
        >
          <SegmentedControlItem id="en" className="px-2.5">
            EN
          </SegmentedControlItem>
          <SegmentedControlItem id="bn" className="px-2.5">
            বাংলা
          </SegmentedControlItem>
        </SegmentedControl>

        <button
          type="button"
          aria-label={dark ? t.theme.light : t.theme.dark}
          aria-pressed={dark}
          title={dark ? t.theme.light : t.theme.dark}
          onClick={(event) => {
            void applyThemeWithTransition(dark ? "light" : "dark", {
              origin:
                event.clientX === 0 && event.clientY === 0
                  ? null
                  : { x: event.clientX, y: event.clientY },
              element: event.currentTarget,
              duration: 620,
            });
          }}
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-2lg border border-border-button-default bg-background-primary-default text-foreground-icon-secondary shadow-card transition-colors hover:bg-background-primary-hover hover:text-foreground-icon-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:outline-none"
        >
          {dark ? (
            <RiSunLine className="size-4.5" aria-hidden />
          ) : (
            <RiMoonLine className="size-4.5" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
