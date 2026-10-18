import { useLayoutEffect, useRef, useState } from "react";
import {
  CATEGORY_BY_ID,
  ENV_BY_ID,
  LSE_LANGUAGES,
  PLATFORM_BY_ID,
  type SpriteName,
} from "../data/categories";
import { formatCompact, formatNumber, useI18n, type Strings } from "../i18n";
import type { Locale } from "../locales";
import { fitChips, initialFit } from "../lib/chip-fit";
import { packagePath } from "../lib/packages";
import type { CatalogEntry } from "../types";
import { formatUtcDate, RelativeDate } from "./local-date";
import { ProjectIcon } from "./project-icon";
import { RouterLink } from "./router-link";
import { Sprite } from "./sprite";

/** History state of a package page opened from the listing ("Back to search" then goes back). */
export const FROM_LISTING = { fromListing: true };

export interface Chip {
  key: string;
  label: string;
  icon?: SpriteName;
  tone?: string;
}

/**
 * Environment, the first category, the platforms, then the other categories
 * (Modrinth's order, except that the platform comes before a second category:
 * it is the first filter group, and a narrow row keeps only its first chips).
 */
export function entryChips(entry: CatalogEntry, locale: Locale, t: Strings): Chip[] {
  const chips: Chip[] = [];
  if (entry.env.length === 2) chips.push({ key: "env", label: t.envBoth, icon: "menu" });
  else if (entry.env.length === 1) {
    const env = ENV_BY_ID.get(entry.env[0]!);
    if (env) chips.push({ key: "env", label: env.label[locale], icon: env.icon });
  }
  const categories: Chip[] = [];
  for (const id of entry.categories) {
    const c = CATEGORY_BY_ID.get(id);
    if (c) categories.push({ key: `cat-${id}`, label: c.label[locale], icon: c.icon });
  }
  chips.push(...categories.slice(0, 1));
  for (const id of entry.platforms) {
    const p = PLATFORM_BY_ID.get(id);
    if (!p) continue;
    const lang = id === "lse" && entry.lang ? LSE_LANGUAGES[entry.lang] : undefined;
    chips.push({ key: `platform-${id}`, label: lang ? `${p.short} · ${lang}` : p.short, tone: p.tone });
  }
  chips.push(...categories.slice(1));
  return chips;
}

/** Keeps a "+N" tooltip inside its tag line, over the chip as far as it can. */
function place(host: HTMLElement) {
  const ul = host.closest<HTMLElement>(".pkg-row-tags");
  const tip = host.querySelector<HTMLElement>(".pkg-row-more-tip");
  if (!ul || !tip) return;
  const line = ul.getBoundingClientRect();
  const chip = host.getBoundingClientRect();
  const width = tip.offsetWidth;
  const left = Math.min(Math.max(0, chip.left + chip.width / 2 - line.left - width / 2), Math.max(0, line.width - width));
  tip.style.left = `${Math.round(left)}px`;
}

/**
 * The tags on one line: the chips that fit (measured, and again whenever the
 * row's width changes; see `fitChips`), the rest behind "+N", whose tooltip
 * lists them.
 * Before the first measurement (the prerendered page) a fixed count shows.
 */
function ChipList({ chips }: { chips: Chip[] }) {
  const { t } = useI18n();
  const ref = useRef<HTMLUListElement>(null);
  // which chips show, as "1" or "0" per chip (a string, so an unchanged measurement does not render again)
  const [fit, setFit] = useState<string | null>(null);
  const shown = fit ?? initialFit(chips.length).map(Number).join("");
  const rest = chips.filter((_, i) => shown[i] !== "1");
  const signature = chips.map((c) => c.label).join("\n");

  useLayoutEffect(() => {
    const ul = ref.current;
    if (!ul || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      // every chip in one unwrapped line, at its full width
      ul.classList.add("is-measuring");
      const widths = [...ul.querySelectorAll<HTMLElement>(":scope > [data-chip]")].map((li) => li.getBoundingClientRect().width);
      const more = ul.querySelector<HTMLElement>(":scope > .pkg-row-more-li")?.getBoundingClientRect().width ?? 0;
      const style = getComputedStyle(ul);
      const gap = parseFloat(style.columnGap) || 0;
      const room = ul.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
      ul.classList.remove("is-measuring");
      setFit(fitChips(widths, gap, more, room).map(Number).join(""));
      // an open tooltip follows its chip
      const open = ul.querySelector<HTMLElement>(".pkg-row-more-host:hover, .pkg-row-more-host:focus-within");
      if (open) requestAnimationFrame(() => place(open));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(ul);
    // the web fonts change the chips' widths, not the row's
    void document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [signature]);

  const chip = (c: Chip) =>
    c.tone ? (
      <span className={`kit-badge kit-badge-${c.tone} pkg-row-platform`}>{c.label}</span>
    ) : (
      <span className="pkg-chip">
        {c.icon ? <Sprite name={c.icon} /> : null}
        {c.label}
      </span>
    );
  return (
    <ul ref={ref} className="pkg-row-tags" data-fit={fit === null ? undefined : ""}>
      {chips.map((c, i) => (
        <li key={c.key} data-chip="" className={shown[i] === "1" ? undefined : "is-overflow"}>
          {chip(c)}
        </li>
      ))}
      {chips.length ? (
        <li className={`pkg-row-more-li${rest.length ? "" : " is-overflow"}`}>
          <span
            className="kit-tooltip-host pkg-row-more-host"
            data-placement="top"
            onPointerEnter={(e) => place(e.currentTarget)}
            onFocus={(e) => place(e.currentTarget)}
          >
            <button
              type="button"
              className="pkg-chip pkg-row-more"
              tabIndex={rest.length ? undefined : -1}
              aria-label={`+${rest.length}: ${rest.map((c) => c.label).join(", ")}`}
            >
              +{Math.max(1, rest.length)}
            </button>
            <span role="tooltip" className="mc-tooltip kit-tooltip pkg-row-more-tip" aria-hidden="true">
              <span className="mc-tooltip-title">{t.moreTags(rest.length)}</span>
              {rest.map((c) => (
                <span key={c.key} className="mc-tooltip-lore">
                  {c.label}
                </span>
              ))}
            </span>
          </span>
        </li>
      ) : null}
    </ul>
  );
}

interface ProjectRowProps {
  entry: CatalogEntry;
  /** Rows near the top load their icon at once. */
  eager: boolean;
  /** Where the owner link goes (the listing filtered by author). */
  ownerHref: string;
}

/**
 * One result: icon, "Name by owner", description, chips and stats. The name
 * is the link and covers the whole row; the owner link and the "+N" chip sit
 * above it. List rows and grid cards are the same markup (see styles.css).
 */
export function ProjectRow({ entry, eager, ownerHref }: ProjectRowProps) {
  const { t, locale } = useI18n();
  const chips = entryChips(entry, locale, t);
  const description = entry.description.trim();
  return (
    <article className="px-card pkg-row" data-tooth={entry.tooth}>
      <span className="kit-slot pkg-row-icon">
        <ProjectIcon icon={entry.icon} owner={entry.owner} size={72} eager={eager} />
      </span>
      <div className="pkg-row-head">
        <h3 className="pkg-row-name">
          <RouterLink href={packagePath(entry.tooth)} className="pkg-card-link" state={FROM_LISTING}>
            {entry.name}
          </RouterLink>
        </h3>
        <span className="pkg-row-by">
          {t.by}{" "}
          <RouterLink href={ownerHref} className="pkg-row-owner">
            {entry.owner}
          </RouterLink>
        </span>
      </div>
      <p className={description ? "pkg-row-desc" : "pkg-row-desc pkg-row-desc-empty"}>{description || t.noDescription}</p>
      <ChipList chips={chips} />
      {/* above the row's link for its tooltip; a click still opens the package (the link is the keyboard path) */}
      <div
        className="pkg-row-stats kit-tooltip-host"
        data-placement="top"
        onClick={(e) => e.currentTarget.closest(".pkg-row")?.querySelector<HTMLAnchorElement>(".pkg-card-link")?.click()}
      >
        {entry.stars > 0 ? (
          <span className="pkg-stat pkg-stat-stars">
            <Sprite name="diamond" />
            <span aria-hidden="true">{formatCompact(entry.stars, locale)}</span>
            <span className="kit-sr-only">{t.starsExact(formatNumber(entry.stars, locale))}</span>
          </span>
        ) : null}
        <span className="pkg-stat pkg-stat-updated">
          <Sprite name="clock" />
          <RelativeDate value={entry.updated} />
        </span>
        {(entry.requiredBy ?? 0) >= 2 ? (
          <span className="pkg-stat pkg-stat-required">
            <Sprite name="bookQuill" />
            {t.requiredBy(entry.requiredBy ?? 0)}
          </span>
        ) : null}
        <span className="mc-tooltip kit-tooltip pkg-row-stats-tip" aria-hidden="true">
          <span className="mc-tooltip-title">{entry.name}</span>
          {entry.stars > 0 ? <span className="mc-tooltip-lore">{t.starsExact(formatNumber(entry.stars, locale))}</span> : null}
          <span className="mc-tooltip-lore">{t.updatedExact(formatUtcDate(entry.updated, locale))}</span>
          {(entry.requiredBy ?? 0) > 0 ? <span className="mc-tooltip-lore">{t.requiredBy(entry.requiredBy ?? 0)}</span> : null}
        </span>
      </div>
    </article>
  );
}
