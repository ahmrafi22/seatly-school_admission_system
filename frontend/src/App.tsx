import { useCallback, useEffect, useState } from "react";
import {
  RiBookOpenLine,
  RiLayoutGridLine,
  RiLogoutBoxLine,
  RiSettings3Line,
} from "@remixicon/react";
import { Toaster, toast } from "@/components/base/toast/toast";
import { Logo } from "@/src/components/Logo";
import { Toolbar } from "@/src/components/Toolbar";
import { IdentityGate } from "@/src/components/IdentityGate";
import { ClassesView } from "@/src/views/ClassesView";
import { MyApplicationsView } from "@/src/views/MyApplicationsView";
import { ManageView } from "@/src/views/ManageView";
import { LanguageProvider, useI18n } from "@/src/i18n/LanguageProvider";
import { useStudentId } from "@/src/lib/useStudentId";
import { api, ApiError, type MyHold } from "@/src/lib/api";
import { usePolling } from "@/src/lib/usePolling";
import { maskStudentId } from "@/src/lib/format";
import { cx } from "@/utils/cx";

type Tab = "classes" | "mine" | "manage";

const HOLD_POLL_MS = 5_000;

function App() {
  return (
    <LanguageProvider>
      <Shell />
      <Toaster position="bottom-end" limit={3} duration={5200} />
    </LanguageProvider>
  );
}

function Shell() {
  const { t } = useI18n();
  const { studentId, hasStudentId, setStudentId, clearStudentId } = useStudentId();
  const [tab, setTab] = useState<Tab>("classes");

  const holds = usePolling<MyHold[]>(
    () => (hasStudentId ? api.myHolds(studentId) : Promise.resolve([])),
    HOLD_POLL_MS,
  );

  // A hold that was HELD on the previous read and is EXPIRED now is worth a
  // single, quiet notice — the card already changed, so the toast confirms it
  // rather than announcing it from nowhere.
  const [previousStatuses, setPreviousStatuses] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    if (!holds.data) return;
    const now = new Map(holds.data.map((hold) => [hold.holdId, hold.status]));
    for (const [holdId, status] of now) {
      if (previousStatuses.get(holdId) === "HELD" && status === "EXPIRED") {
        toast.info(t.toast.expired, { description: t.toast.expiredBody });
        break;
      }
    }
    setPreviousStatuses(now);
    // Intentionally keyed on the data reference only.
  }, [holds.data]);

  const myHolds = holds.data ?? [];

  const onApplied = useCallback(() => {
    toast.success(t.toast.holdCreated, { description: t.toast.holdCreatedBody });
    holds.refresh();
    setTab("mine");
  }, [holds, t]);

  if (!hasStudentId) {
    return <IdentityGate onSubmit={setStudentId} />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background-full">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-background-primary-default focus:px-4 focus:py-2 focus:text-body-medium focus:text-text-primary focus:shadow-lg"
      >
        {t.nav.skipToContent}
      </a>

      <Header
        studentId={studentId}
        tab={tab}
        onTab={setTab}
        onChangeStudent={clearStudentId}
      />

      <main id="main" className="mx-auto w-full max-w-[80rem] flex-1 px-5 pb-20 pt-6 sm:px-8 sm:pt-8">
        {tab === "classes" && (
          <ClassesView
            studentId={studentId}
            myHolds={myHolds}
            onApplied={onApplied}
            onOpenMine={() => setTab("mine")}
          />
        )}

        {tab === "mine" && (
          <MyApplicationsView
            studentId={studentId}
            holds={myHolds}
            isLoading={holds.isLoading}
            isFetching={holds.isFetching}
            lastCheckedAt={holds.lastCheckedAt}
            failures={holds.failures}
            onRefresh={holds.refresh}
            onBrowse={() => setTab("classes")}
          />
        )}

        {tab === "manage" && <ManageView onCreated={() => holds.refresh()} />}
      </main>

      <Footer />
      <MobileTabs tab={tab} onTab={setTab} />
    </div>
  );
}

function Header({
  studentId,
  tab,
  onTab,
  onChangeStudent,
}: {
  studentId: string;
  tab: Tab;
  onTab: (tab: Tab) => void;
  onChangeStudent: () => void;
}) {
  const { t } = useI18n();

  const tabs: Array<{ id: Tab; label: string; icon: typeof RiBookOpenLine }> = [
    { id: "classes", label: t.nav.classes, icon: RiBookOpenLine },
    { id: "mine", label: t.nav.applications, icon: RiLayoutGridLine },
    { id: "manage", label: t.nav.manage, icon: RiSettings3Line },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-separator-border bg-background-full/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-3 px-5 py-3 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span aria-hidden className="hidden h-5 w-px bg-separator-border sm:block" />
            <span className="hidden items-center gap-2 sm:flex">
              <span className="text-caption-1-medium text-text-tertiary">
                {t.identity.label}
              </span>
              <bdi className="id-code rounded-md bg-background-secondary-default px-2 py-1 text-caption-1-medium text-text-secondary">
                {maskStudentId(studentId)}
              </bdi>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Toolbar />
            <button
              type="button"
              onClick={onChangeStudent}
              aria-label={t.identity.change}
              title={t.identity.change}
              className="grid size-9 cursor-pointer place-items-center rounded-2lg text-foreground-icon-secondary transition-colors hover:bg-background-secondary-hover hover:text-foreground-icon-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:outline-none"
            >
              <RiLogoutBoxLine className="size-4.5" aria-hidden />
            </button>
          </div>
        </div>

        <nav aria-label="Sections" className="hidden sm:block">
          <ul className="flex items-center gap-1">
            {tabs.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onTab(id)}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-1.5 text-body-medium transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:outline-none",
                      active
                        ? "bg-background-secondary-default text-text-primary"
                        : "text-text-secondary hover:bg-background-secondary-hover hover:text-text-primary",
                    )}
                  >
                    <Icon
                      className={cx("size-4", active ? "text-accent-700 dark:text-accent-400" : "")}
                      aria-hidden
                    />
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

function MobileTabs({ tab, onTab }: { tab: Tab; onTab: (tab: Tab) => void }) {
  const { t } = useI18n();
  const tabs: Array<{ id: Tab; label: string; icon: typeof RiBookOpenLine }> = [
    { id: "classes", label: t.nav.classes, icon: RiBookOpenLine },
    { id: "mine", label: t.nav.applications, icon: RiLayoutGridLine },
    { id: "manage", label: t.nav.manage, icon: RiSettings3Line },
  ];

  return (
    <nav
      aria-label="Sections"
      className="sticky bottom-0 z-30 border-t border-separator-border bg-background-full/95 backdrop-blur-md sm:hidden"
    >
      <ul className="flex items-stretch">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => onTab(id)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex h-14 w-full cursor-pointer flex-col items-center justify-center gap-1 text-caption-1-medium transition-colors focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:outline-none focus-visible:ring-inset",
                  active ? "text-accent-700 dark:text-accent-400" : "text-text-tertiary",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mx-auto w-full max-w-[80rem] px-5 pb-8 sm:px-8">
      <div className="flex flex-col gap-2 border-t border-separator-border pt-5 text-caption-1-medium text-text-tertiary sm:flex-row sm:items-center sm:justify-between">
        <span>{t.footer.note}</span>
        <span>{t.footer.builtWith}</span>
      </div>
    </footer>
  );
}

export default App;

// Re-exported for the error boundary in main.tsx.
export { ApiError };
