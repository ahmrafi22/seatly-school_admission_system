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
 * The kit ships its sidebar as a floating, inset card. That reads as a panel
 * parked next to the page in a three-item app, so it is docked: flush left, full
 * height, no elevation, separated by one hairline. It stays expanded because a
 * rail of unlabelled icons makes the reader decode it before they can navigate.
 *
 * Two slots are repurposed: the kit's workspace switcher and team card do not
 * exist here, so the student's identity and the language/theme controls take
 * those places. Below `lg` the same sidebar renders inside a modal drawer.
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

  // Admin is pinned to the rail's foot: it serves the school office, not the
  // student, so it does not sit between the student's two destinations.
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
          {/* Desktop rail: in flow, fixed 260px, no vertical divider. */}
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
 * The top bar. It spans the full width and its bottom rule runs the whole way
 * across, which is the one line separating chrome from page. On a phone it also
 * carries the drawer button.
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

