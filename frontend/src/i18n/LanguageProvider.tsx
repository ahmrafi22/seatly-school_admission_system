import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dictionaries, type Copy, type Lang } from "@/src/i18n/copy";
import { localizeDigits } from "@/src/lib/format";

const LANG_KEY = "getseatly:lang";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Copy;
  /** BCP 47 tag for Intl formatting. */
  locale: string;
  isBangla: boolean;
  /**
   * Fill `{name}` placeholders and localize any digit in the result. Copy holds
   * no numerals of its own; the interface decides at render time whether a
   * number reads as `17` or `১৭`.
   */
  tpl: (template: string, vars?: Record<string, string | number>) => string;
  /** A number, formatted for the current language. */
  n: (value: number | string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(LANG_KEY);
    if (stored === "bn" || stored === "en") return stored;
  } catch {
    // Storage can be blocked; the default is fine.
  }
  // A Bengali-speaking visitor with no stored choice most likely wants Bangla.
  if (navigator.language?.toLowerCase().startsWith("bn")) return "bn";
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang === "bn" ? "bn" : "en";
    // Both languages are LTR; setting it stops a stale `dir` from lingering.
    document.documentElement.dir = "ltr";
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      // Non-fatal: the choice just won't survive a refresh.
    }
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    const n = (input: number | string) => {
      // Group thousands per language, then localize the digits.
      const formatted =
        typeof input === "number"
          ? new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US").format(input)
          : input;
      return localizeDigits(formatted, lang);
    };

    const tpl = (template: string, vars?: Record<string, string | number>) => {
      return template.replace(/\{(\w+)\}/g, (match, key: string) => {
        const replacement = vars?.[key];
        if (replacement === undefined) return match;
        // Numbers go through the localizer; strings are left alone.
        return typeof replacement === "number" ? n(replacement) : replacement;
      });
    };

    return {
      lang,
      setLang,
      t: dictionaries[lang],
      locale: lang === "bn" ? "bn-BD" : "en-GB",
      isBangla: lang === "bn",
      tpl,
      n,
    };
  }, [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useI18n must be used inside a LanguageProvider");
  }
  return context;
}
