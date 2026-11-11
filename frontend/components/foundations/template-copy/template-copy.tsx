"use client";

import { cloneElement, createContext, isValidElement, useContext, useMemo, type ReactNode } from "react";

export type TemplateCopyTranslator = (text: string) => string;
type CopySettings = { translate: TemplateCopyTranslator; render?: <T>(node: T) => T };
const CopyContext = createContext<CopySettings | null>(null);
const MenuContext = createContext<ReactNode>(null);

/** Optional application language control shared by template account menus. */
export function TemplateMenuProvider({ languageSelector, children }: { languageSelector?: ReactNode; children: ReactNode }) {
  return <MenuContext.Provider value={languageSelector ?? null}>{children}</MenuContext.Provider>;
}

export function useTemplateLanguageSelector() {
  return useContext(MenuContext);
}

/** Optional application copy for templates. Without a provider, source copy is unchanged. */
export function TemplateCopyProvider({ translate, render, children }: CopySettings & { children: ReactNode }) {
  const settings = useMemo(() => ({ translate, render }), [translate, render]);
  return <CopyContext.Provider value={settings}>{children}</CopyContext.Provider>;
}

// Only display copy is translated. IDs, form values, data keys, URLs, styles,
// event handlers and application state retain their original values.
const textProps = new Set([
  "children", "title", "subtitle", "description", "label", "textValue", "placeholder", "alt",
  "aria-label", "aria-description", "metricLabel", "emptyMessage", "caption", "heading", "text", "content", "renderValue",
]);
const dataProps = new Set(["items", "options", "tabs", "columns", "series", "ranges", "stats", "data", "nodes", "bar", "line"]);
const dataText = new Set(["label", "title", "description", "subtitle", "header", "role", "joined"]);
const renderProps = new Set(["children", "cell", "header", "formatter", "tickFormatter", "labelFormatter", "renderItem", "node", "link", "tick", "label", "content", "renderValue"]);

/** Translate rendered copy while preserving React nodes, collection IDs and callbacks. */
export function translateTemplateCopy<T>(value: T, translate: TemplateCopyTranslator): T {
  function visit(value: unknown, data = false): unknown {
    if (typeof value === "string") return data ? value : translate(value);
    if (Array.isArray(value)) {
      const result = value.map((item, index) => {
        const visited = visit(item, data);
        if (visited === item) return visited;
        if (!isValidElement(visited)) return visited;

        // A rebuilt array loses React's key tracking unless every entry
        // carries one. Elements that already had a key keep it; the rest are
        // *static* JSX children — `<aside>` with several direct children gives
        // React an unkeyed array, which is legal only because the array is the
        // same one every render. Replacing it with a new array makes React
        // reconcile it as a dynamic list, so each entry needs a key now.
        //
        // Index keys are safe here precisely because these children are
        // static: they cannot reorder.
        const key = (item as { key?: string | null })?.key;
        return cloneElement(visited, {
          key: key === null || key === undefined ? `tc-${index}` : key,
        } as never);
      });
      return result.every((item, index) => item === value[index]) ? value : result;
    }
    if (isValidElement<Record<string, unknown>>(value)) {
      if (typeof value.type === "string" && ["pre", "code", "kbd", "script", "style"].includes(value.type)) return value;
      const updates: Record<string, unknown> = {};
      for (const [key, original] of Object.entries(value.props)) {
        if (textProps.has(key)) updates[key] = renderProps.has(key) && typeof original === "function"
          ? (...args: unknown[]) => visit(original(...args)) : visit(original);
        else if (dataProps.has(key)) updates[key] = visit(original, true);
        else if (renderProps.has(key) && typeof original === "function") updates[key] = (...args: unknown[]) => visit(original(...args));
      }
      const changed = Object.entries(updates).some(([key, result]) => result !== value.props[key]);
      if (!changed) return value;
      // Carry the element's own key onto the clone. Without it, a translated
      // child of a mapped list loses the identity React reconciles on and the
      // console fills with "unique key" warnings.
      const cloned = cloneElement(value, updates);
      const key = (value as { key?: string | null }).key;
      return key === null || key === undefined ? cloned : cloneElement(value, { ...updates, key });
    }
    if (data && value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
      const result: Record<string, unknown> = { ...value };
      for (const [key, original] of Object.entries(result)) {
        if (renderProps.has(key) && typeof original === "function") result[key] = (...args: unknown[]) => visit(original(...args));
        else if (dataText.has(key)) result[key] = visit(original);
        else if (original && typeof original === "object") result[key] = visit(original, true);
      }
      return Object.entries(result).some(([key, item]) => item !== (value as Record<string, unknown>)[key]) ? result : value;
    }
    return value;
  }
  return visit(value) as T;
}

/** Apply to a template component's returned JSX; copy updates through React, including portals. */
export function useTemplateCopy() {
  const settings = useContext(CopyContext);
  return useMemo(() => <T,>(node: T): T => settings?.render ? settings.render(node) : settings ? translateTemplateCopy(node, settings.translate) : node, [settings]);
}
