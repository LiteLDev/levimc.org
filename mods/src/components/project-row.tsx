import { useLayoutEffect, useRef, useState } from "react";
import { featuredTagsOf, plainTagsOf } from "../data/featured-tags";
import { SIDE_BY_ID } from "../data/sides";
import type { SpriteName } from "../data/sprites";
import { formatCompact, formatNumber, useI18n, type Strings } from "../i18n";
import type { Locale } from "../locales";
import { initialFit } from "../lib/chip-fit";
import { watchChips } from "./chip-measure";
import { modPath, ownerUrl } from "../lib/mods";
import type { CatalogEntry } from "../types";
import { formatUtcDate, RelativeDate } from "./local-date";
import { ProjectIcon } from "./project-icon";
import { RouterLink } from "./router-link";
import { Sprite } from "./sprite";

/** History state of a mod page opened from the listing ("Back to search" then goes back). */
export const FROM_LISTING = { fromListing: true };

export interface Chip {
  key: string;
  label: string;
  icon?: SpriteName;
  /** The manifest's own tags behind a featured tag, in small grey text after its name. */
  raw?: string;
}

/** A chip's text, as the "+N" tooltip and its label read it. */
const chipText = (c: Chip) => (c.raw ? `${c.label} (${c.raw})` : c.label);

/** The side, the featured tags (`data/featured-tags.ts`, with the raw tags behind each), then the other tags. */
export function entryChips(entry: CatalogEntry, locale: Locale, t: Strings): Chip[] {
  const chips: Chip[] = [];
  if (entry.side.length === 2) chips.push({ key: "side", label: t.sideBoth, icon: "menu" });
  else if (entry.side.length === 1) {
    const side = SIDE_BY_ID.get(entry.side[0]!);
    if (side) chips.push({ key: "side", label: side.label[locale], icon: side.icon });
  }
  for (const { tag, raw } of featuredTagsOf(entry.tags)) {
    chips.push({ key: `tag-${tag.id}`, label: tag.label[locale], icon: tag.icon, raw: raw.join(" ") });
  }
  for (const tag of plainTagsOf(entry.tags)) chips.push({ key: `tag-${tag}`, label: `#${tag}` });
  return chips;
}

/** Keeps a "+N" tooltip inside its tag line, over the chip as far as it can. */
function place(host: HTMLElement) {
  const ul = host.closest<HTMLElement>(".mods-row-tags");
  const tip = host.querySelector<HTMLElement>(".mods-row-more-tip");
  if (!ul || !tip) return;
  const line = ul.getBoundingClientRect();
  const chip = host.getBoundingClientRect();
  const width = tip.offsetWidth;
  const left = Math.min(Math.max(0, chip.left + chip.width / 2 - line.left - width / 2), Math.max(0, line.width - width));
  tip.style.left = `${Math.round(left)}px`;
}

/**
 * The tags on one line: the chips that fit (measured once per label set,
 * fitted again whenever the row's width changes; see `fitChips` and
 * `chip-measure.ts`), the rest behind "+N", whose tooltip lists them.
 * Before the first measurement (the prerendered page) a fixed count shows.
 */
function ChipList({ chips }: { chips: Chip[] }) {
  const { t } = useI18n();
  const ref = useRef<HTMLUListElement>(null);
  // which chips show, as "1" or "0" per chip (a string, so an unchanged measurement does not render again)
  const [fit, setFit] = useState<string | null>(null);
  const shown = fit ?? initialFit(chips.length).map(Number).join("");
  const rest = chips.filter((_, i) => shown[i] !== "1");
  const signature = chips.map(chipText).join("\n");

  useLayoutEffect(() => {
    const ul = ref.current;
    if (!ul) return;
    // measured in one batch with every other row, from one ResizeObserver (see chip-measure.ts)
    return watchChips(ul, signature, (next) => {
      setFit(next);
      // an open tooltip follows its chip
      const open = ul.querySelector<HTMLElement>(".mods-row-more-host:hover, .mods-row-more-host:focus-within");
      if (open) requestAnimationFrame(() => place(open));
    });
  }, [signature]);

  const chip = (c: Chip) => (
    <span className="mods-chip">
      {c.icon ? <Sprite name={c.icon} /> : null}
      {c.label}
      {c.raw ? <span className="mods-raw-tag">{c.raw}</span> : null}
    </span>
  );
  return (
    <ul ref={ref} className="mods-row-tags" data-fit={fit === null ? undefined : ""}>
      {chips.map((c, i) => (
        <li key={c.key} data-chip="" className={shown[i] === "1" ? undefined : "is-overflow"}>
          {chip(c)}
        </li>
      ))}
      {chips.length ? (
        <li className={`mods-row-more-li${rest.length ? "" : " is-overflow"}`}>
          <span
            className="kit-tooltip-host mods-row-more-host"
            data-placement="top"
            onPointerEnter={(e) => place(e.currentTarget)}
            onFocus={(e) => place(e.currentTarget)}
          >
            <button
              type="button"
              className="mods-chip mods-row-more"
              tabIndex={rest.length ? undefined : -1}
              aria-label={`+${rest.length}: ${rest.map(chipText).join(", ")}`}
            >
              +{Math.max(1, rest.length)}
            </button>
            <span role="tooltip" className="mc-tooltip kit-tooltip mods-row-more-tip" aria-hidden="true">
              <span className="mc-tooltip-title">{t.moreTags(rest.length)}</span>
              {rest.map((c) => (
                <span key={c.key} className="mc-tooltip-lore">
                  {chipText(c)}
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
}

/**
 * One result: icon, "Name by owner", description, chips and stats. The name
 * is the link and covers the whole row; the owner link (to the owner on
 * GitHub) and the "+N" chip sit above it. List rows and grid cards are the same markup (see styles.css).
 */
export function ProjectRow({ entry, eager }: ProjectRowProps) {
  const { t, locale } = useI18n();
  const chips = entryChips(entry, locale, t);
  const description = entry.description.trim();
  return (
    <article className="px-card mods-row" data-id={entry.id}>
      <span className="kit-slot mods-row-icon">
        <ProjectIcon icon={entry.logo} iconId={entry.logoId} owner={entry.owner} size={72} eager={eager} />
      </span>
      <div className="mods-row-head">
        <h3 className="mods-row-name">
          <RouterLink href={modPath(entry.id)} className="mods-card-link" state={FROM_LISTING}>
            {entry.name}
          </RouterLink>
        </h3>
        <span className="mods-row-by">
          {t.by}{" "}
          <a href={ownerUrl(entry.owner)} className="mods-row-owner" target="_blank" rel="noopener noreferrer">
            {entry.owner}
          </a>
        </span>
      </div>
      <p className={description ? "mods-row-desc" : "mods-row-desc mods-row-desc-empty"}>{description || t.noDescription}</p>
      <ChipList chips={chips} />
      {/* above the row's link for its tooltip; a click still opens the mod (the link is the keyboard path) */}
      <div
        className="mods-row-stats kit-tooltip-host"
        data-placement="top"
        onClick={(e) => e.currentTarget.closest(".mods-row")?.querySelector<HTMLAnchorElement>(".mods-card-link")?.click()}
      >
        {entry.stars > 0 ? (
          <span className="mods-stat mods-stat-stars">
            <Sprite name="diamond" />
            <span aria-hidden="true">{formatCompact(entry.stars, locale)}</span>
            <span className="kit-sr-only">{t.starsExact(formatNumber(entry.stars, locale))}</span>
          </span>
        ) : null}
        <span className="mods-stat mods-stat-updated">
          <Sprite name="clock" />
          <RelativeDate value={entry.updated} />
        </span>
        {(entry.requiredBy ?? 0) >= 2 ? (
          <span className="mods-stat mods-stat-required">
            <Sprite name="bookQuill" />
            {t.requiredBy(entry.requiredBy ?? 0)}
          </span>
        ) : null}
        <span className="mc-tooltip kit-tooltip mods-row-stats-tip" aria-hidden="true">
          <span className="mc-tooltip-title">{entry.name}</span>
          {entry.stars > 0 ? <span className="mc-tooltip-lore">{t.starsExact(formatNumber(entry.stars, locale))}</span> : null}
          <span className="mc-tooltip-lore">{t.updatedExact(formatUtcDate(entry.updated, locale))}</span>
          {(entry.requiredBy ?? 0) > 0 ? <span className="mc-tooltip-lore">{t.requiredBy(entry.requiredBy ?? 0)}</span> : null}
        </span>
      </div>
    </article>
  );
}
