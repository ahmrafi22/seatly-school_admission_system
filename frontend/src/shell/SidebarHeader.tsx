import { Logo } from "@/src/components/Logo";

/**
 * The sidebar's top slot. The kit puts a demo workspace switcher here; this
 * product has one school, so the mark takes the space instead. The slot is
 * narrow, so the wordmark would be clipped mid-letter.
 */
export function SidebarHeader() {
  return <Logo compact />;
}
