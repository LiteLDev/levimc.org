import { BASE } from "./base-path";
import type { RepositoryRenames } from "./lib/markdown";
import type { ModSelection } from "./lib/mods";
import type { Readme } from "./lib/readme-language";
import type {
  Catalog,
  CatalogEntry,
  ManifestVariant,
  ModInfo,
  RawModEntry,
  RelatedMod,
  ReleaseInfo,
  ShowcaseItem,
} from "./types";

/** A version's manifest info and variants (`null`: lipr has no manifest for it) and READMEs. */
export interface ModDetails {
  info: ModInfo | null;
  variants: ManifestVariant[] | null;
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
      tooth: string;
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
      /** The LeviLamina range of each version, per variant (empty without levilauncher.json). */
      llRanges: Record<string, Record<string, string>>;
      /** Mods whose latest version depends on this one. */
      dependents: RelatedMod[];
      /** Mods any version depends on, by lower-case tooth (dependency cards). */
      related: Record<string, RelatedMod>;
      /** The repository takes issues (an Issues link); false when unknown. */
      hasIssues: boolean;
      /** levilauncher.json was available ("Required by" is known). */
      dependentsKnown: boolean;
      /** The repository is listed under another tooth, whose page is the canonical one (an old name). */
      canonicalTooth?: string;
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
/** LeviMC Mods is part of levimc.org (at `BASE`); it was pkg.levimc.org. */
export const SITE_ORIGIN = "https://levimc.org";

/** The home page's description, with the live counts. */
export function siteDescription(projects: number): string {
  return `Browse ${projects} mods and plugins for Minecraft Bedrock — LeviLamina, LegacyScriptEngine and Endstone. Install any of them with lip.`;
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
  /** Absolute URL of the page; absent on the 404 page. */
  canonical?: string;
}

export function pageMeta(data: PageData): PageMeta {
  switch (data.kind) {
    case "home":
      return {
        title: `${SITE_NAME} — ${SITE_TAGLINE}`,
        description: siteDescription(data.catalog.stats.projects),
        canonical: `${SITE_ORIGIN}${BASE}`,
      };
    case "mod":
      return {
        title: `${data.entry.name} | ${SITE_NAME}`,
        description: data.mod.info.description || `${data.entry.name} on ${SITE_NAME}`,
        canonical: `${SITE_ORIGIN}${BASE}${data.canonicalTooth ?? data.tooth}/`,
      };
    case "not-found":
      return { title: `Not Found | ${SITE_NAME}`, description: `${SITE_NAME} — ${SITE_TAGLINE}` };
  }
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** `<head>` tags of a prerendered page, its data included. */
export function pageHead(data: PageData): string {
  const meta = pageMeta(data);
  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
  ];
  if (meta.canonical) {
    tags.push(`<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`);
  }
  tags.push(
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:image" content="${SITE_ORIGIN}${BASE}icon.png" />`,
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
