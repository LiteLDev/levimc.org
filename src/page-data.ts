import type { RepositoryRenames } from "./lib/markdown";
import type { PackageSelection } from "./lib/packages";
import type { Package, PackageInfo, RawPackageEntry } from "./types";

/** A version's manifest info (`null`: use the index's) and README. */
export interface PackageDetails {
  info: PackageInfo | null;
  /** `null` when the version has no README. */
  readme: string | null;
}

/**
 * Everything a page renders from, fetched at build time. It is embedded in
 * the prerendered HTML as JSON, so the browser hydrates from the same data,
 * and read back from that HTML when the app navigates to another page.
 */
export type PageData = (
  | { kind: "home"; packages: Package[] }
  | {
      kind: "package";
      tooth: string;
      pkg: RawPackageEntry;
      /** The package's repository, where it lives today (see `getRepositoryUrl`). */
      repository: string;
      /** The selection the page is prerendered for, and its details. */
      prerendered: PackageSelection & PackageDetails;
    }
  | { kind: "not-found"; tooths: string[] }
) & {
  /**
   * Package repositories GitHub now serves under another name, so avatars
   * and README links can skip the redirect (see `server/repositories.ts`).
   */
  renames: RepositoryRenames;
};

export const SITE_NAME = "bedrinth";
export const SITE_DESCRIPTION = "A package index for LeviLamina";
export const SITE_ORIGIN = "https://pkg.levimc.org";

const PAGE_DATA_ID = "pkg-page-data";
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
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
        canonical: `${SITE_ORIGIN}/`,
      };
    case "package":
      return {
        title: `${data.pkg.info.name} | ${SITE_NAME}`,
        description: data.pkg.info.description,
        canonical: `${SITE_ORIGIN}/packages/${data.tooth}/`,
      };
    case "not-found":
      return { title: `Not Found | ${SITE_NAME}`, description: SITE_DESCRIPTION };
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
