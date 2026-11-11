import { Logo } from "@/src/components/Logo";

/**
 * The sidebar's top slot.
 *
 * The kit puts a demo workspace switcher here. This product has one school and
 * one student, so the wordmark takes that space instead.
 *
 * The slot is capped at 206px by a hard `max-width` on a box with 8px of
 * padding — so whatever is inside has to fit *and* be the right shape for the
 * width. That is why the slot renders the mark alone: the wordmark would be
 * clipped mid-letter, and a clipped wordmark reads as a rendering bug rather
 * than as an abbreviation.
 */
export function SidebarHeader() {
  return <Logo compact />;
}
