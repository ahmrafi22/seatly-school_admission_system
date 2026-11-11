import type { Copy } from "@/src/i18n/copy";

/**
 * The BoardUI sidebar and its menus carry their own English copy ("Quick
 * Search", "Support", "Settings", "No results"). Rather than fork the
 * component, the kit's `TemplateCopyProvider` is given a lookup that swaps
 * those strings for the active language.
 *
 * Anything not in the map is returned unchanged, so a string the kit adds in a
 * future version still renders in English instead of disappearing.
 */
export function buildTemplateTranslator(t: Copy): (text: string) => string {
  const map: Record<string, string> = {
    "Quick Search": t.nav.search,
    "Search navigation…": t.nav.searchPlaceholder,
    Search: t.nav.search,
    "No results": t.nav.noResults,
    Support: t.nav.support,
    Settings: t.nav.settings,
    "Close sidebar": t.nav.closeSidebar,
    "Filter template navigation": t.nav.searchPlaceholder,
    "Clear navigation search": t.nav.clearSearch,
    "My account": t.nav.account,
    "View profile": t.nav.viewProfile,
    "Log out": t.nav.logOut,
    "Switch student": t.nav.switchStudent,
  };

  return (text: string) => map[text] ?? text;
}
