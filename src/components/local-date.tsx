import { formatDate } from "../lib/packages";
import { useHydrated } from "../page-store";

/**
 * A date in the visitor's own format and time zone. The prerendered HTML
 * cannot know either, so it carries the UTC date, and the browser swaps in
 * the local one right after hydrating.
 */
export function LocalDate({ value }: { value: string }) {
  const hydrated = useHydrated();
  return (
    <time dateTime={value}>
      {formatDate(value, !hydrated)}
    </time>
  );
}
