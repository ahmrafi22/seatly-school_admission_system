import { RiMoonLine, RiSunLine, RiTranslate2 } from "@remixicon/react";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/base/segmented-control/segmented-control";
import {
  applyThemeWithTransition,
  useThemeMode,
} from "@/components/application/theme/theme-toggle";
import { useI18n } from "@/src/i18n/LanguageProvider";
import type { Lang } from "@/src/i18n/copy";

/**
 * The sidebar footer: the two device preferences. The identity has its own
 * control in the top bar, so repeating it here would be the same fact twice.
 *
 * Collapsed, the rail is too narrow for a segmented control, so language becomes
 * a single button labelled with the language it switches to.
 */
export function SidebarFooter({ collapsed = false }: { collapsed?: boolean }) {
  const { lang, setLang, t } = useI18n();
  const theme = useThemeMode();
  const dark = theme === "dark";

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    void applyThemeWithTransition(dark ? "light" : "dark", {
      origin:
        event.clientX === 0 && event.clientY === 0
          ? null
          : { x: event.clientX, y: event.clientY },
      element: event.currentTarget,
      duration: 620,
    });
  };

  if (collapsed) {
    return (
      <div className="flex w-full flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setLang(lang === "bn" ? "en" : "bn")}
          aria-label={lang === "bn" ? t.language.en : t.language.bn}
          title={lang === "bn" ? t.language.en : t.language.bn}
          className="grid size-9 cursor-pointer place-items-center rounded-2lg text-foreground-icon-secondary transition-colors hover:bg-background-secondary-hover hover:text-foreground-icon-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:outline-none"
        >
          <RiTranslate2 className="size-4.5" aria-hidden />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={dark ? t.theme.light : t.theme.dark}
          aria-pressed={dark}
          title={dark ? t.theme.light : t.theme.dark}
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
    <div className="flex w-full flex-col gap-3">
      <SegmentedControl
        aria-label={t.language.label}
        selectedKeys={[lang]}
        onSelectionChange={(keys) => {
          const next = [...keys][0];
          if (next === "en" || next === "bn") setLang(next as Lang);
        }}
        className="w-full"
      >
        <SegmentedControlItem id="en" className="flex-1">
          EN
        </SegmentedControlItem>
        <SegmentedControlItem id="bn" className="flex-1">
          বাংলা
        </SegmentedControlItem>
      </SegmentedControl>

      <button
        type="button"
        onClick={toggleTheme}
        aria-pressed={dark}
        className="flex w-full cursor-pointer items-center gap-2 rounded-2lg bg-background-primary-hover px-2.5 py-2 text-body-2-medium text-text-secondary transition-colors hover:bg-background-secondary-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:outline-none"
      >
        {dark ? (
          <RiSunLine className="size-4 shrink-0" aria-hidden />
        ) : (
          <RiMoonLine className="size-4 shrink-0" aria-hidden />
        )}
        <span className="truncate">{dark ? t.theme.light : t.theme.dark}</span>
      </button>
    </div>
  );
}
