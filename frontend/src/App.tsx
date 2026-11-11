import { useCallback, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "@/components/base/toast/toast";
import { IdentityGate } from "@/src/components/IdentityGate";
import { ClassesView } from "@/src/views/ClassesView";
import { MyApplicationsView } from "@/src/views/MyApplicationsView";
import { ManageView } from "@/src/views/ManageView";
import { useI18n } from "@/src/i18n/LanguageProvider";
import { useStudentId } from "@/src/lib/useStudentId";
import { api, type HoldCreated, type MyHold } from "@/src/lib/api";
import { usePolling } from "@/src/lib/usePolling";
import { AppShell, type Tab } from "@/src/shell/AppShell";

/**
 * The application, framed in a sidebar shell.
 *
 * Everything below the shell is shared: the same views, the same polling, the
 * same copy. Only the frame changed, which is the point — the sidebar is a
 * navigation decision, not a rewrite.
 */
const HOLD_POLL_MS = 5_000;

export default function App() {
  const { t, tpl } = useI18n();
  const { studentId, hasStudentId, setStudentId, clearStudentId } = useStudentId();
  const [tab, setTab] = useState<Tab>("classes");

  const holds = usePolling<MyHold[]>(
    () => (hasStudentId ? api.myHolds(studentId) : Promise.resolve([])),
    HOLD_POLL_MS,
  );

  // One quiet notice when a hold lapses while the page is open. Held in a ref
  // because it is never rendered, and state here would re-run the effect
  // against its own write.
  const previousStatuses = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    if (!holds.data) return;
    const next = new Map(holds.data.map((hold) => [hold.holdId, hold.status]));
    for (const [holdId, status] of next) {
      if (previousStatuses.current.get(holdId) === "HELD" && status === "EXPIRED") {
        toast.info(t.toast.expired, { description: t.toast.expiredBody });
        break;
      }
    }
    previousStatuses.current = next;
  }, [holds.data, t.toast.expired, t.toast.expiredBody]);

  const myHolds = holds.data ?? [];

  const onApplied = useCallback(
    (created: HoldCreated) => {
      const msLeft = Date.parse(created.expiresAt) - Date.now();
      const minutes = Math.max(1, Math.round(msLeft / 60_000));
      toast.success(tpl(t.toast.holdCreated, { minutes }), {
        description: t.toast.holdCreatedBody,
      });
      holds.refresh();
      setTab("mine");
    },
    [holds, t, tpl],
  );

  if (!hasStudentId) {
    return <IdentityGate onSubmit={setStudentId} />;
  }

  return (
    <>
      <AppShell
        tab={tab}
        onTab={setTab}
        studentId={studentId}
        onSwitchStudent={clearStudentId}
      >
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
      </AppShell>
      <Toaster position="bottom-end" limit={3} duration={5200} />
    </>
  );
}
