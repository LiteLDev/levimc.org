import { useI18n, type Locale } from "../i18n";
import { useHydrated } from "../page-store";

const intlLocale = (locale: Locale) => (locale === "en" ? "en-US" : locale);

/** A date as the build prints it: UTC, so every visitor's browser hydrates the same text. */
export function formatUtcDate(iso: string, locale: Locale = "en"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(intlLocale(locale), { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" });
}

/** A date in the visitor's own format and time zone. */
export function formatLocalDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(intlLocale(locale), { year: "numeric", month: "long", day: "numeric" });
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "3 days ago" / "3天前" relative to `now`. */
export function formatRelative(iso: string, locale: Locale, now = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const seconds = Math.round((t - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.trunc(seconds / size), unit);
  }
  return rtf.format(0, "minute");
}

/**
 * A date in the visitor's own format and time zone. The prerendered HTML
 * cannot know either, so it carries the UTC date, and the browser swaps in
 * the local one right after hydrating.
 */
export function LocalDate({ value }: { value: string }) {
  const hydrated = useHydrated();
  const { locale } = useI18n();
  return <time dateTime={value}>{hydrated ? formatLocalDate(value, locale) : formatUtcDate(value)}</time>;
}

/** "3 days ago" after hydration; the UTC date before. */
export function RelativeDate({ value }: { value: string }) {
  const hydrated = useHydrated();
  const { locale } = useI18n();
  return <time dateTime={value}>{hydrated ? formatRelative(value, locale) : formatUtcDate(value)}</time>;
}
