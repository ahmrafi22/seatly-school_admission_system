"use client";

import { useTemplateCopy } from "@/components/foundations/template-copy/template-copy";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  RiAsterisk,
  RiBankLine,
  RiCalendarLine,
  RiChatAiLine,
  RiCloseLine,
  RiCustomerServiceLine,
  RiHomeLine,
  RiImageAiLine,
  RiKanbanView2,
  RiMegaphoneLine,
  RiSearchLine,
  RiSettings4Line,
  RiUserSmileLine,
} from "@remixicon/react";
import { ThemeToggle } from "@/components/application/theme/theme-toggle";
import { Badge } from "@/components/base/badges/badge";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Kbd } from "@/components/base/kbd/kbd";
import { cx } from "@/utils/cx";
import { DashboardTeamMenu } from "./dashboard-team-menu";
import { DashboardUserMenu } from "./dashboard-user-menu";

/**
 * Figma source: Board UI → dashboard 1 → Sidebar, expanded (node 3731:2934).
 *
 * Floating sidebar panel, always expanded: 260px wide, p 12, radius/3xl (24px),
 * white 1px border, "Background/Sidebar Elevation" shadow, bg
 * background/secondary.
 */

type IconComponent = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

/**
 * A label slot that can be asked to collapse. The sidebar is always expanded
 * now, so it always renders at full width; the prop survives because the
 * component predates that decision and callers pass a constant.
 */
function Collapsible({ collapsed = false, children, className }: { collapsed?: boolean; children: ReactNode; className?: string }) {
  const localize = useTemplateCopy();
  return localize((
    <span
      className={cx(
        "flex min-w-0 items-center overflow-hidden transition-[max-width,opacity,filter] duration-300 ease-in-out",
        // Expanded, the cap is the row itself: a fixed cap (it was 160px)
        // clipped any label wider than it, "Components and Blocks" included.
        collapsed ? "max-w-0 opacity-0 blur-[3px]" : "max-w-full opacity-100 blur-0",
        className,
      )}
    >
      {children}
    </span>
  ));
}

function NavItem({
  icon: Icon,
  label,
  badge,
  isSelected = false,
  href = "#",
  onClick,
}: {
  icon: IconComponent;
  label: string;
  badge?: ReactNode;
  isSelected?: boolean;
  href?: string;
  /** Action rows (e.g. Settings → modal) intercept the navigation. */
  onClick?: () => void;
}) {
  const localize = useTemplateCopy();
  return localize((
    <a
      href={onClick ? undefined : href}
      onClick={
        onClick
          ? (event) => {
              event.preventDefault();
              onClick();
            }
          : undefined
      }
      aria-current={isSelected ? "page" : undefined}
      aria-label={label}
      className={cx(
        "flex w-full cursor-pointer items-center justify-between overflow-hidden rounded-2lg p-2",
        "transition-colors duration-300 ease-in-out",
        isSelected
          ? "bg-accent-600 hover:bg-accent-700"
          : "hover:bg-background-secondary-hover",
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Icon
          className={cx("size-5 shrink-0", isSelected ? "text-white" : "text-foreground-icon-secondary")}
          aria-hidden
        />
        <Collapsible className="flex-1">
          <span
            className={cx(
              "text-body-medium whitespace-nowrap",
              isSelected ? "text-white" : "text-text-secondary",
            )}
          >
            {label}
          </span>
        </Collapsible>
      </span>
      {badge && <Collapsible>{badge}</Collapsible>}
    </a>
  ));
}

/** A primary navigation row. Rows without an `href` are decoration only. */
export interface DashboardNavItem {
  key: string;
  label: string;
  icon: IconComponent;
  href?: string;
  badge?: string | number;
}

/** Kept as a name for callers that typed their `selected` prop; any key works. */
export type DashboardNavKey = string;

/** The Pro dashboard's navigation, the default set. */
export const DASHBOARD_NAV: DashboardNavItem[] = [
  { key: "home", label: "Home", icon: RiHomeLine, href: "/templates/dashboard", badge: 152 },
  { key: "project-board", label: "Project board", icon: RiKanbanView2, href: "/templates/project-board" },
  { key: "marketing", label: "Marketing", icon: RiMegaphoneLine, href: "/templates/marketing" },
  { key: "calendar", label: "Calendar", icon: RiCalendarLine, href: "/templates/calendar" },
  { key: "finance", label: "Finance", icon: RiBankLine, href: "/templates/finance" },
  { key: "medical", label: "Medical Report", icon: RiAsterisk, href: "/templates/medical-profile" },
  { key: "ai-chat", label: "AI Chat", icon: RiChatAiLine, href: "/templates/ai-chat" },
  { key: "ai-image", label: "AI Image Generation", icon: RiImageAiLine, href: "/templates/ai-image-generation" },
  { key: "profile", label: "Profile", icon: RiUserSmileLine, href: "/templates/ai-profile" },
];

/**
 * The primary rows. A component of its own so the closure over the search
 * query lives here.
 */
function NavRows({
  items,
  query,
  selected,
  secondaryMatch,
  onNavigate,
}: {
  items: DashboardNavItem[];
  query: string;
  selected: string;
  /** Whether Support or Settings matches, so "No results" only shows when nothing does. */
  secondaryMatch: boolean;
  /** Single-page apps select a tab instead of following an href. */
  onNavigate?: (key: string) => void;
}) {
  const localize = useTemplateCopy();
  const shown = items.filter((item) => item.label.toLocaleLowerCase().includes(query));
  if (shown.length === 0 && !secondaryMatch) {
    return localize(<p className="px-2 py-3 text-body-regular text-text-tertiary">No results</p>);
  }
  return (
    <div className="contents">
      {shown.map((item) => {
        const isSelected = selected === item.key;
        return (
          <NavItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            href={item.href}
            isSelected={isSelected}
            onClick={onNavigate ? () => onNavigate(item.key) : undefined}
            badge={
              item.badge !== undefined ? (
                <Badge color={isSelected ? "primary" : "neutral"}>{item.badge}</Badge>
              ) : undefined
            }
          />
        );
      })}
    </div>
  );
}

export function DashboardSidebar({
  mobile = false,
  onClose,
  fluid = false,
  docked = false,
  showHeader = true,
  showThemeToggle = true,
  selected = "home",
  items = DASHBOARD_NAV,
  bottomItems,
  flat = false,
  onNavigate,
  footer,
  header,
  showSecondaryNav = true,
  showSearch = true,
  className,
}: {
  /** Rendered inside the mobile drawer: close button instead of collapse. */
  mobile?: boolean;
  onClose?: () => void;
  /** Width fills its container instead of the fixed 260px (e.g. the landing
   *  page, where the sidebar isn't in a drawer). */
  fluid?: boolean;
  /** Hide the app-level theme control when the sidebar is used as marketing artwork. */
  showThemeToggle?: boolean;
  /** Which nav item shows the selected (filled blue) state. */
  selected?: DashboardNavKey;
  /** Primary navigation rows. The Pro dashboard's set unless a screen brings its own. */
  items?: DashboardNavItem[];
  /**
   * Rows pinned to the rail's foot, directly above the footer. Unlike the
   * primary nav these are never filtered by the quick search — they are
   * always visible, which is the point of pinning them.
   */
  bottomItems?: DashboardNavItem[];
  /** Removes the floating panel treatment for a sidebar revealed beneath mobile content. */
  flat?: boolean;
  /**
   * Docks the sidebar to the viewport edge: full height, square corners, no
   * elevation — a rail rather than a card.
   */
  docked?: boolean;
  /**
   * Hide the top row — the workspace slot. The app shell moves it into the
   * navbar so the brand is not cut in half by the navbar's full-width rule,
   * which leaves this row empty.
   */
  showHeader?: boolean;
  /** Called with the item key instead of following its href (single-page apps). */
  onNavigate?: (key: string) => void;
  /** Replaces the bottom "team" card (this product has a student, not a team). */
  footer?: ReactNode;
  /** Replaces the top workspace switcher, which is demo data in the kit. */
  header?: ReactNode;
  /** Hide the kit's Support / Settings rows when the product has neither. */
  showSecondaryNav?: boolean;
  /** Hide the quick-search control (a three-item nav does not need one). */
  showSearch?: boolean;
  className?: string;
} = {}) {
  const localize = useTemplateCopy();
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState("");
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchFieldRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = (label: string) => label.toLocaleLowerCase().includes(normalizedQuery);
  const secondaryLabels = ["Support", "Settings"];
  const secondaryMatch = secondaryLabels.some(matches);

  const activateSearch = useCallback(() => {
    setSearchActive(true);
  }, []);

  const deactivateSearch = useCallback((restoreFocus: boolean) => {
    setQuery("");
    setSearchActive(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => searchTriggerRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    if (!searchActive) return;
    const frame = window.requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [searchActive]);

  useEffect(() => {
    if (!searchActive) return;

    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && searchFieldRef.current?.contains(target)) return;
      deactivateSearch(false);
    };

    document.addEventListener("click", onOutsideClick);
    return () => document.removeEventListener("click", onOutsideClick);
  }, [deactivateSearch, searchActive]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if (event.key.toLocaleLowerCase() === "l" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        activateSearch();
      }
    };

    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [activateSearch]);

  return localize((
    <aside
      className={cx(
        "flex h-full shrink-0 flex-col justify-between overflow-hidden",
        docked
          ? // Docked: the rail is not a surface at all — it is the left edge of
            // the page. Same ground as the content column, no border, no
            // elevation, so there is nothing to see where one ends and the other
            // begins.
            //
            // It used to be `background-primary-default` (white on light,
            // neutral-800 on dark), which is the *card* colour. Once the vertical
            // divider was removed that left the rail as a distinctly lighter
            // block ending in mid-air — a panel with its edge missing. Matching
            // the page ground is what makes "merged" actually true, and the
            // selected nav row is accent-filled, so navigation still reads
            // without a surface behind it.
            "relative bg-background-full"
          : flat
            ? "bg-background-full"
            : "rounded-3xl border border-border-button-white bg-background-secondary-default shadow-sidebar",
        "transition-[width] duration-300 ease-in-out",
        // Docked has no border (the hairline is an overlay), so it needs 12px
        // of padding rather than the kit's 11px to arrive at a 36px column.
        //
        // The extra top padding on the docked rail is breathing room for the
        // brand: flush against the top edge it reads as a header bar, and the
        // navigation under it crowds the wordmark. 12px more is enough to make
        // the mark feel placed rather than jammed. Bottom padding is unchanged,
        // so the footer stays where it was.
        fluid
          ? "w-full p-3"
          : docked
            ? "w-[260px] px-3 pt-6 pb-3"
            : "w-[260px] p-3",
        className,
      )}
    >
      {/* No inner hairline here: with the shell reserving the full expanded
          width, the rail can be narrower than the column it lives in, and a
          line drawn on the rail's own edge would sit at 60px with a bare strip
          after it. The divider belongs to the *zone* boundary, so the shell
          draws it. */}
      {/* `overflow-y: auto` forces the x axis to clip too, and this box hugs
          its contents on every side — so the selected item's 1px ring, the
          profile's hover pill (which outsets 6px) and focus rings all landed
          outside it. Padding moves the clip edge out; the matching negative
          margin borrows that space back from the rail's own padding, leaving
          every child exactly where it was. */}
      <div
        className="-m-2 flex min-h-0 w-[calc(100%+16px)] flex-col gap-3 overflow-y-auto p-2 [scrollbar-width:none]"
      >
        {/* Workspace switcher. Omitted entirely when the caller has moved it
            into the navbar. */}
        {showHeader && (
        <div className="flex w-full items-center justify-between">
          {/* The clip is here so the row's overflow stays hidden, but it also
              cropped the trigger's hover pill down to four corner arcs. Same
              trick as the scroller: pad the clip box out by the pill's 8px
              reach and pull it back with a negative margin, so the widths below
              are 16px larger than the footprint they produce. */}
          <div className="-m-2 min-w-0 flex-1 overflow-hidden p-2">
            {header ?? (
              <DashboardUserMenu
                avatarClassName={
                  flat
                    ? "bg-background-tertiary-default dark:bg-background-secondary-default"
                    : undefined
                }
              />
            )}
          </div>
          {mobile && flat ? (
            <div
              ref={searchFieldRef}
              className={cx(
                "flex h-9 items-center overflow-hidden rounded-full bg-background-tertiary-default transition-[width,box-shadow] duration-300 ease-in-out",
                searchActive
                  ? "w-full gap-2 pe-2.5 ps-2 ring-2 ring-inset ring-border-button-active"
                  : "w-9 gap-0 px-2",
              )}
            >
              <button
                ref={searchTriggerRef}
                type="button"
                aria-label="Search"
                onClick={activateSearch}
                className="flex size-5 shrink-0 cursor-pointer items-center justify-center text-foreground-icon-secondary"
              >
                <RiSearchLine className="size-5" aria-hidden />
              </button>
              <input
                ref={searchInputRef}
                type="search"
                aria-label="Filter template navigation"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    deactivateSearch(true);
                  }
                }}
                placeholder="Search..."
                tabIndex={searchActive ? 0 : -1}
                className={cx(
                  "min-w-0 bg-transparent text-body-medium tracking-[-0.015em] text-text-primary outline-none placeholder:text-text-tertiary",
                  "transition-[width,opacity] duration-200 ease-in-out",
                  searchActive
                    ? "w-full flex-1 opacity-100 delay-100"
                    : "pointer-events-none w-0 flex-none opacity-0 delay-0",
                )}
              />
              <CloseButton
                size="2xs"
                aria-label="Clear navigation search"
                onClick={() => deactivateSearch(true)}
                className={cx(
                  "shrink-0 bg-background-tertiary-hover transition-opacity duration-150",
                  searchActive ? "opacity-100 delay-150" : "pointer-events-none opacity-0 delay-0",
                )}
              />
            </div>
          ) : mobile ? (
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={onClose}
              className="cursor-pointer text-foreground-icon-secondary"
            >
              <RiCloseLine className="size-5" aria-hidden />
            </button>
          ) : null}
        </div>
        )}

        <div className="flex w-full flex-col gap-3">
          {showSearch && (
            <>
{/* Quick search */}
          {!flat && (searchActive ? (
            <div
              ref={searchFieldRef}
              className="flex w-full items-center gap-2 rounded-full bg-background-tertiary-default py-2 pe-2.5 ps-2 ring-2 ring-inset ring-border-button-active transition-[background-color,box-shadow] duration-[var(--input-transition-ms)] ease"
            >
              <RiSearchLine className="size-5 shrink-0 text-foreground-icon-secondary" aria-hidden />
              <input
                ref={searchInputRef}
                type="search"
                aria-label="Filter template navigation"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    deactivateSearch(true);
                  }
                }}
                placeholder="Search navigation…"
                className="min-w-0 flex-1 bg-transparent text-body-medium text-text-primary outline-none placeholder:text-text-tertiary"
              />
              <CloseButton
                size="2xs"
                aria-label="Clear navigation search"
                onClick={() => deactivateSearch(true)}
                className="bg-background-tertiary-hover"
              />
            </div>
          ) : (
            <button
              ref={searchTriggerRef}
              type="button"
              aria-label="Quick Search"
              onClick={activateSearch}
              className="flex w-full cursor-pointer items-center gap-2 rounded-full bg-background-tertiary-default p-2 hover:bg-background-tertiary-hover/55"
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <RiSearchLine className="size-5 shrink-0 text-foreground-icon-secondary" aria-hidden />
                <span className="text-body-medium whitespace-nowrap text-text-secondary">
                  Quick Search
                </span>
              </span>
              <Kbd>⌘L</Kbd>
            </button>
          ))}

                      </>
          )}

          {/* Primary nav with a 2px inset for the selected fill's breathing
              room. */}
          <nav className="flex w-full flex-col gap-1 px-0.5">
            <NavRows
              items={items}
              query={normalizedQuery}
              selected={selected}
              secondaryMatch={secondaryMatch}
              onNavigate={onNavigate}
            />
          </nav>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-3">
        {/* Rows the app pins to the rail's foot — an admin section, say. They
            render above the preferences and are never search-filtered. */}
        {bottomItems && bottomItems.length > 0 && (
          <nav className="flex w-full flex-col gap-1">
            {bottomItems.map((item) => (
              <NavItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                href={item.href}
                isSelected={selected === item.key}
                onClick={onNavigate ? () => onNavigate(item.key) : undefined}
                badge={
                  item.badge !== undefined ? (
                    <Badge color={selected === item.key ? "primary" : "neutral"}>
                      {item.badge}
                    </Badge>
                  ) : undefined
                }
              />
            ))}
          </nav>
        )}
        {showThemeToggle && (
          <ThemeToggle
            appearance="sidebar-segmented"
            className={flat ? "!bg-background-secondary-default" : undefined}
          />
        )}
        {/* Secondary nav */}
        {showSecondaryNav && (
        <nav className="flex w-full flex-col gap-1">
          {matches("Support") && <NavItem icon={RiCustomerServiceLine} label="Support" />}
          {matches("Settings") && (
            <NavItem icon={RiSettings4Line} label="Settings" onClick={() => undefined} />
          )}
        </nav>
        )}

        {/* Team card, or whatever the app passes in its place. */}
        {footer ?? (
          <DashboardTeamMenu
            className={flat ? "!bg-background-secondary-default" : undefined}
          />
        )}
      </div>
    </aside>
  ));
}
