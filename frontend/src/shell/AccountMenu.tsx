import { RiLogoutBoxRLine, RiUserLine } from "@remixicon/react";
import {
  Dropdown,
  DropdownDivider,
  DropdownItem,
  DropdownPopover,
  DropdownTrigger,
} from "@/components/base/dropdown/dropdown";
import { useI18n } from "@/src/i18n/LanguageProvider";
import { maskStudentId } from "@/src/lib/format";

/**
 * The account control in the top bar. There is no account record, so the panel
 * reveals the 17-digit number, grouped for reading, plus sign out.
 */
export function AccountMenu({
  studentId,
  onSignOut,
}: {
  studentId: string;
  onSignOut: () => void;
}) {
  const { t } = useI18n();

  return (
    <Dropdown>
      <DropdownTrigger
        aria-label={t.nav.account}
        className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-accent-100 text-accent-800 ring-1 ring-accent-200 transition-colors hover:bg-accent-200 focus-visible:ring-2 focus-visible:ring-border-focus-ring dark:bg-accent-900 dark:text-accent-100 dark:ring-accent-800 dark:hover:bg-accent-800"
      >
        <RiUserLine className="size-4.5" aria-hidden />
      </DropdownTrigger>

      <DropdownPopover aria-label={t.nav.account} placement="bottom end">
        <div className="flex flex-col gap-1 px-2 py-1.5">
          <span className="text-caption-1-medium text-text-tertiary">
            {t.nav.accountTitle}
          </span>
          <bdi className="id-code select-all text-body-medium text-text-primary">
            {maskStudentId(studentId)}
          </bdi>
        </div>

        <DropdownDivider />

        <DropdownItem onSelect={onSignOut}>
          <RiLogoutBoxRLine
            className="size-4 shrink-0 text-foreground-icon-secondary"
            aria-hidden
          />
          <span className="text-body-medium">{t.nav.signOut}</span>
        </DropdownItem>
      </DropdownPopover>
    </Dropdown>
  );
}
