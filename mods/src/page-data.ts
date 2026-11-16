import { BASE } from "./base-path";
import { uiStrings } from "../kit/components/i18n";
import { STRINGS } from "./i18n";
import { DEFAULT_LOCALE, LOCALES, localeAlternates, localeInfo, splitLocale, type Locale } from "./locales";
import type { RepositoryRenames } from "./lib/markdown";
import { CATALOG_JSON, modJsonPath, type ModSelection } from "./lib/mods";
import type { Readme } from "./lib/readme-language";
import type {
  Catalog,
  CatalogEntry,
  EntryJson,
  LipInfo,
  RawModEntry,
  RelatedMod,
  ReleaseInfo,
  ShowcaseItem,
  VersionTarget,
} from "./types";

/** A version's package file info and variants (`null`: it could not be loaded) and READMEs. */
export interface ModDetails {
  info: LipInfo | null;
  /** Variant name → its entries. */
  variants: Record<string, EntryJson[]> | null;
  /** The version's README in each of its languages; empty when it has none. */
  readmes: Readme[];
}

/**
 * Everything a page renders from, fetched at build time. It is embedded in
 * the prerendered HTML as JSON, so the browser hydrates from the same data,
 * and read back from that HTML when the app navigates to another page.
 */
export type PageData = (
  | { kind: "home"; catalog: Catalog }
  | {
      kind: "mod";
      id: string;
      mod: RawModEntry;
      entry: CatalogEntry;
      /** The mod's repository, where it lives today (see `getRepositoryUrl`). */
      repository: string;
      /** The selection the page is prerendered for, and its details. */
      prerendered: ModSelection & ModDetails;
      /** The README files to fetch for another version (`README.md`, `README.zh.md` …, see `readmeFiles`). */
      readmeFiles: string[];
      /** GitHub releases by version (empty without GitHub data). */
      releases: Record<string, ReleaseInfo>;
      /** What each version runs on, per variant (variant → version → target). */
      targets: Record<string, Record<string, VersionTarget>>;
      /** The versions read from a `lip.toml` (the others from a `tooth.json`). */
      lipToml: string[];
      /** Mods whose latest version depends on this one. */
      dependents: RelatedMod[];
      /** Mods any version depends on, by lower-case id (dependency cards). */
      related: Record<string, RelatedMod>;
      /** The repository takes issues (an Issues link); false when unknown. */
      hasIssues: boolean;
      /** The repository is listed under another id, whose page is the canonical one (an old name). */
      canonical?: string;
      /** The mod's gallery (the Gallery tab; empty: no tab). */
      showcase: ShowcaseItem[];
    }
  | { kind: "not-found" }
) & {
  /**
   * Mod repositories GitHub now serves under another name, so avatars
   * and README links can skip the redirect (see `server/github.ts`).
   */
  renames: RepositoryRenames;
};

export const SITE_NAME = "LeviMC Mods";
export const SITE_TAGLINE = "Mods & plugins for Minecraft Bedrock";
/**
 * Tab titles follow the LeviMC convention (kit 2.19): "<Page> - LeviMC" on levimc.org, with the section in between
 * inside it — the listing is "Mods - LeviMC", a mod "<name> - Mods - LeviMC" — and every 404 "Page not found - LeviMC".
 */
export const titled = (...parts: string[]) => [...parts, "LeviMC"].join(" - ");
/** LeviMC Mods is part of levimc.org (at `BASE`); it was pkg.levimc.org. */
export const SITE_ORIGIN = "https://levimc.org";

/** The home page's description, with the live counts. */
export function siteDescription(projects: number, locale: Locale = DEFAULT_LOCALE): string {
  return STRINGS[locale].siteDescription(projects);
}

const PAGE_DATA_ID = "mods-page-data";
const PAGE_DATA_SCRIPT = new RegExp(
  `<script type="application/json" id="${PAGE_DATA_ID}">([\\s\\S]*?)</script>`,
);

/** A `<script>` holding the page data; `<` is escaped so it cannot end early. */
export function pageDataScript(data: PageData): string {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c");
  return `<script type="application/json" id="${PAGE_DATA_ID}">${json}</script>`;
}

/** The page data embedded in a prerendered page's HTML. */
export function parsePageData(html: string): PageData | null {
  const json = PAGE_DATA_SCRIPT.exec(html)?.[1];
  return json ? (JSON.parse(json) as PageData) : null;
}

/** The page data of the document being hydrated. */
export function readEmbeddedPageData(): PageData | null {
  const json = document.getElementById(PAGE_DATA_ID)?.textContent;
  return json ? (JSON.parse(json) as PageData) : null;
}

export interface PageMeta {
  title: string;
  description: string;
  /** The page's language. */
  locale: Locale;
  /** Absolute URL of the page; absent on the 404 page. */
  canonical?: string;
  /** The page in each language (absolute URLs; absent on the 404 page and on an old name's page). */
  alternates?: Record<Locale, string>;
  /** The page's JSON (under `/api/v4/mods/`); absent on the 404 page. */
  json?: string;
}

/** The page's meta data at `pathname` (`/mods/…`, `/zh-Hans/mods/…`: the language comes from the URL). */
export function pageMeta(data: PageData, pathname: string = BASE): PageMeta {
  const { locale } = splitLocale(pathname);
  const t = STRINGS[locale];
  // "Mods" as the LeviMC bar says it in this language
  const mods = uiStrings(localeInfo(locale).lang).mods;
  const absolute = (path: string) => {
    const alternates = localeAlternates(path);
    return Object.fromEntries(LOCALES.map((l) => [l.code, `${SITE_ORIGIN}${alternates[l.code]}`])) as Record<Locale, string>;
  };
  switch (data.kind) {
    case "home": {
      const alternates = absolute(BASE);
      return {
        title: titled(mods),
        description: t.siteDescription(data.catalog.stats.projects),
        locale,
        canonical: alternates[locale],
        alternates,
        json: `${SITE_ORIGIN}${CATALOG_JSON}`,
      };
    }
    case "mod": {
      // an old name's page points to the current one's, in the same language
      const alternates = absolute(`${BASE}${data.canonical ?? data.id}/`);
      return {
        title: titled(data.entry.name, mods),
        description: data.mod.info.description || `${data.entry.name} on ${SITE_NAME}`,
        locale,
        canonical: alternates[locale],
        alternates: data.canonical ? undefined : alternates,
        json: `${SITE_ORIGIN}${modJsonPath(data.id)}`,
      };
    }
    case "not-found":
      return { title: titled(t.notFoundTitle), description: `${t.siteName} — ${t.tagline}`, locale };
  }
}

/** og:locale of each language (the underscore form, with a territory). */
const OG_LOCALES: Record<Locale, string> = { en: "en_US", "zh-CN": "zh_CN", "zh-Hant": "zh_TW" };

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** `<head>` tags of the prerendered page at `pathname`, its data included. */
export function pageHead(data: PageData, pathname: string = BASE): string {
  const meta = pageMeta(data, pathname);
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
  ];
  if (meta.canonical) {
    tags.push(`<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`);
  }
  if (meta.alternates) {
    for (const l of LOCALES) {
      tags.push(`<link rel="alternate" hreflang="${l.lang}" href="${escapeHtml(meta.alternates[l.code])}" />`);
    }
    tags.push(`<link rel="alternate" hreflang="x-default" href="${escapeHtml(meta.alternates[DEFAULT_LOCALE])}" />`);
  }
  if (meta.json) {
    tags.push(`<link rel="alternate" type="application/json" href="${escapeHtml(meta.json)}" />`);
  }
  tags.push(
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:image" content="${SITE_ORIGIN}${BASE}icon.png" />`,
    `<meta property="og:locale" content="${OG_LOCALES[meta.locale]}" />`,
    ...(meta.alternates
      ? LOCALES.filter((l) => l.code !== meta.locale).map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALES[l.code]}" />`)
      : []),
  );
  if (meta.canonical) {
    tags.push(`<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`);
  }
  if (data.kind === "not-found") {
    tags.push(`<meta name="robots" content="noindex" />`);
  }
  tags.push(pageDataScript(data));
  return tags.join("\n    ");
}
