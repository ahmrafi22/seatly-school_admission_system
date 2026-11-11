import { ApiError } from "@/src/lib/api";
import type { Copy } from "@/src/i18n/copy";

/**
 * Turn any thrown value into a sentence, preferring the server's own detail.
 *
 * Lives in `lib` rather than in a component so that both the card and the
 * fee dialog can report a failure the same way without importing each other.
 */
export function readableError(caught: unknown, t: Copy): string {
  if (caught instanceof ApiError) {
    if (caught.isNetworkError) {
      return `${t.errors.networkTitle}. ${t.errors.networkBody}`;
    }
    return caught.message;
  }
  return caught instanceof Error ? caught.message : t.errors.genericTitle;
}
