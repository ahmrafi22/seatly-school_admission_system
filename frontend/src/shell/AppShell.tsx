import { useMemo, useState, type ReactNode } from "react";
import {
  RiBookOpenLine,
  RiLayoutGridLine,
  RiMenuLine,
  RiSettings3Line,
} from "@remixicon/react";
import { DashboardSidebar } from "@/components/application/dashboard/dashboard-sidebar";
import { TemplateCopyProvider } from "@/components/foundations/template-copy/template-copy";
import { Modal, ModalDialog } from "@/components/base/modal/modal";
import { Logo } from "@/src/components/Logo";
import { SidebarFooter } from "@/src/shell/SidebarFooter";
import { SidebarHeader } from "@/src/shell/SidebarHeader";
import { AccountMenu } from "@/src/shell/AccountMenu";
import { useI18n } from "@/src/i18n/LanguageProvider";
import { buildTemplateTranslator } from "@/src/shell/templateCopy";
import type { DashboardNavItem } from "@/components/application/dashboard/dashboard-sidebar";

export type Tab = "classes" | "mine" | "manage";

/**
 * The application shell, built on the BoardUI sidebar.
 *
 * The kit ships its sidebar as a floating card — inset from every viewport
 * edge, rounded, elevated, with the page ground visible around it. In a
 * three-item app that reads as a panel parked next to the page rather than as
 * the page's own navigation, so it is docked instead: flush to the left edge,
 * full height, square corners, no elevation. The only separation is a single
 * hairline on the inner edge.
 *
 * It is expanded, permanently: a rail that greets every visit as a stack of
 * unlabelled icons makes the reader decode it before they can navigate, and
 * with three destinations there is nothing to be gained by hiding their names.
 * There is no collapse control — the labelled rail is the only desktop
 * navigation, so it never shrinks.
 *
 * The rail sits in flow — an overlay would mean landing on a dimmed page under
 * a panel every visit — so it holds its own width and the content flexes
 * beside it.
 *
 * Two things had to be adapted rather than accepted:
 *
 *   - The kit renders its own workspace switcher and team card in the top and
 *     bottom slots. Neither exists in this product, so the student's identity
 *     and the language/theme controls take those places instead of sitting
 *     next to a fake workspace.
 *   - Below `lg` a labelled rail would eat most of a phone, so the same sidebar
 *     is rendered inside a modal drawer and a single menu button opens it.
 */
export function AppShell({
  tab,
  onTab,
  studentId,
  onSwitchStudent,
  children,
}: {
  tab: Tab;
  onTab: (tab: Tab) => void;
  studentId: string;
  onSwitchStudent: () => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items: DashboardNavItem[] = useMemo(
    () => [
      { key: "classes", label: t.nav.classes, icon: RiBookOpenLine },
      { key: "mine", label: t.nav.applications, icon: RiLayoutGridLine },
    ],
    [t],
  );

  // The admin section is pinned to the rail's foot, directly above the
  // preferences: it serves a different reader — the school's office, not the
  // student — so it does not sit between the student's two destinations.
  const bottomItems: DashboardNavItem[] = useMemo(
    () => [
      { key: "manage", label: t.nav.manage, icon: RiSettings3Line, badge: t.nav.adminBadge },
    ],
    [t],
  );

  const translate = useMemo(() => buildTemplateTranslator(t), [t]);

  return (
    <TemplateCopyProvider translate={translate}>
      <div className="min-h-dvh bg-background-full">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-background-primary-default focus:px-4 focus:py-2 focus:text-body-medium focus:text-text-primary focus:shadow-lg"
        >
          {t.nav.skipToContent}
        </a>

        <TopBar
          onOpen={() => setMobileOpen(true)}
          studentId={studentId}
          onSignOut={onSwitchStudent}
        />

        <div className="flex min-h-[calc(100dvh-var(--navbar-height))]">
          {/* Desktop rail, docked and in flow, always expanded.
              The slot is the rail's own 260px — the labelled navigation is the
              only desktop navigation, so the content column's left edge is the
              same pixel on every visit.

              No vertical divider: the navbar's rule above already separates the
              chrome from the page, and a line down a dark ground reads as a seam
              rather than as structure. */}
          <div className="sticky top-[var(--navbar-height)] hidden h-[calc(100dvh-var(--navbar-height))] w-[260px] shrink-0 lg:block">
            <DashboardSidebar
              docked
              showHeader={false}
              selected={tab}
              items={items}
              bottomItems={bottomItems}
              showThemeToggle={false}
              showSecondaryNav={false}
              showSearch={false}
              onNavigate={(key) => onTab(key as Tab)}
              footer={<SidebarFooter />}
            />
          </div>

          <div className="flex min-h-full min-w-0 flex-1 flex-col">
            <main
              id="main"
              className="mx-auto w-full max-w-[80rem] flex-1 px-5 pb-16 pt-5 sm:px-8 sm:pt-6 lg:pt-8"
            >
              {children}
            </main>
            <Footer />
          </div>
        </div>

        <Modal
          isOpen={mobileOpen}
          onOpenChange={setMobileOpen}
          size="sm"
          overlayClassName="lg:hidden items-start justify-start p-3"
          className="!gap-0 !border-0 !bg-transparent !p-0 !shadow-none"
        >
          <ModalDialog aria-label={t.nav.openMenu} className="!gap-0 !border-0 !bg-transparent !p-0">
            <DashboardSidebar
              mobile
              onClose={() => setMobileOpen(false)}
              selected={tab}
              items={items}
              bottomItems={bottomItems}
              showThemeToggle={false}
              showSecondaryNav={false}
              showSearch={false}
              onNavigate={(key) => {
                onTab(key as Tab);
                setMobileOpen(false);
              }}
              header={<SidebarHeader />}
              footer={<SidebarFooter />}
            />
          </ModalDialog>
        </Modal>
      </div>
    </TemplateCopyProvider>
  );
}

/**
 * The bar across the top of the window.
 *
 * It spans the full width, including the strip above the sidebar, and its
 * bottom rule runs the whole way across. That is deliberate: the rule is the
 * one line that separates "chrome" from "page", and a rule that stopped at the
 * sidebar's edge would say the sidebar is a separate surface rather than part
 * of the same window. With no vertical divider, this rule is also what holds
 * the two regions together visually.
 *
 * Because the rule crosses the sidebar's column, the brand cannot live inside
 * the sidebar's top row — it would be cut in half by the line. So the wordmark
 * sits here, in the bar, on the sidebar's side of it. That is why the sidebar's
 * own header slot is no longer used on desktop.
 *
 * On a phone the bar is the only navigation surface, so it also carries the
 * drawer button.
 */
function TopBar({
  onOpen,
  studentId,
  onSignOut,
}: {
  onOpen: () => void;
  studentId: string;
  onSignOut: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="sticky top-0 z-30 border-b border-separator-border bg-background-full/85 backdrop-blur-md">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-2.5 sm:px-8 lg:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpen}
            aria-label={t.nav.openMenu}
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-2lg text-foreground-icon-secondary transition-colors hover:bg-background-secondary-hover hover:text-foreground-icon-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:outline-none lg:hidden"
          >
            <RiMenuLine className="size-5" aria-hidden />
          </button>
          <Logo />
        </div>

        <AccountMenu studentId={studentId} onSignOut={onSignOut} />
      </div>
    </div>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mx-auto w-full max-w-[80rem] px-5 pb-8 sm:px-8">
      <div className="border-t border-separator-border pt-5 text-caption-1-medium text-text-tertiary">
        {t.footer.note}
      </div>
    </footer>
  );
}

