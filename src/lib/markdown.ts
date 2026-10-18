import type { RepoBaseUrls } from "./packages";

/** `https:`, `mailto:`, or a protocol-relative `//host`. */
const ABSOLUTE_URL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * Repositories GitHub now serves under another name, as `owner/repo` in
 * lower case → current `Owner/Repo`. The build adds every package repository
 * that moved (see `server/repositories.ts`); these are LiteLDev's own, which
 * READMEs link to but which are not packages.
 */
export type RepositoryRenames = Readonly<Record<string, string>>;

const OWN_RENAMES: RepositoryRenames = {
  "futrime/lip": "LiteLDev/lip",
  "levilamina/levilamina": "LiteLDev/LeviLamina",
  "liteldev/helperlib": "LiteLDev/legacy-script-engine-api",
  "liteldev/legacyscriptengine_api": "LiteLDev/legacy-script-engine-api",
  "liteldev/levilamina-plugin-template": "LiteLDev/levilamina-mod-template",
};

/**
 * Retired documentation hosts of LeviMC projects. None of them resolves any
 * more; their pages live under docs.levimc.org now. Only pages known to exist
 * there keep their path (`paths`: old path → new path); any other path goes to
 * the project's docs home, so a rewritten link never ends on a 404.
 */
interface RetiredDocs {
  hosts: string[];
  home: string;
  paths?: Record<string, string>;
}

const RETIRED_DOCS: RetiredDocs[] = [
  {
    hosts: ["lamina.levimc.org", "levilamina.liteldev.com"],
    home: "https://docs.levimc.org/LeviLamina/",
    paths: {
      // The Quickstart became the install guide (LeviLamina's own README
      // switched to it in 1.9.3).
      "quickstart/": "user_guides/install/",
      "user_guides/install/": "user_guides/install/",
      "user_guides/install_on_client/": "user_guides/install_on_client/",
      "developer_guides/tutorials/create_your_first_mod/":
        "developer_guides/tutorials/create_your_first_mod/",
      "logo.svg": "logo.svg",
    },
  },
  {
    hosts: ["lse.levimc.org", "lse.liteldev.com", "legacy-script-engine.levimc.org"],
    home: "https://docs.levimc.org/LegacyScriptEngine/",
  },
  {
    hosts: ["lip.levimc.org", "lip.futrime.com", "lip.docs.litebds.com"],
    home: "https://docs.levimc.org/lip/",
    paths: {
      // lip's old docs routed in the fragment: `/en/#/tutorials/…`.
      "en/#/tutorials/create_a_lip_tooth": "guides/creating_packages.html",
    },
  },
  {
    hosts: ["levilauncher.levimc.org"],
    home: "https://docs.levimc.org/LeviLauncher/",
  },
];

/**
 * Single pages and hosts that moved: levimc.org's old product page, retired
 * paths in LiteLDev repositories, and a third-party host that is gone.
 */
const MOVED_PAGES: [RegExp, string][] = [
  [/^https?:\/\/levimc\.org\/software\/levilamina\/?(?=[?#]|$)/i, "https://docs.levimc.org/LeviLamina/"],
  // `develop` was merged into `main`; this one is a directory, which GitHub shows under `tree/`.
  [
    /^https?:\/\/(?:www\.)?github\.com\/LiteLDev\/LeviLamina\/(?:blob|tree)\/develop\/src\/ll\/api\/i18n\/?(?=[?#]|$)/i,
    "https://github.com/LiteLDev/LeviLamina/tree/main/src/ll/api/i18n",
  ],
  [
    /^https?:\/\/(?:www\.)?github\.com\/LiteLDev\/LeviLamina\/(blob|tree)\/develop\//i,
    "https://github.com/LiteLDev/LeviLamina/$1/main/",
  ],
  // The test workflow was merged into the build workflow.
  [
    /^https?:\/\/(?:www\.)?github\.com\/LiteLDev\/MoreDimensions\/actions\/workflows\/test_build\.yml(?=[?#]|$)/i,
    "https://github.com/LiteLDev/MoreDimensions/actions/workflows/build.yml",
  ],
  // Afdian's old domain no longer resolves; its pages live on afdian.com.
  [/^https?:\/\/(?:www\.)?afdian\.tv(?=[/?#]|$)/i, "https://afdian.com"],
];

const HOST_URL = /^https?:\/\/([^/?#]+)([^?#]*)(\?[^#]*)?(#.*)?$/i;

function moveRetiredDocs(url: string): string | null {
  const match = HOST_URL.exec(url);
  if (!match) return null;
  const host = match[1]!.toLowerCase();
  const site = RETIRED_DOCS.find((s) => s.hosts.includes(host));
  if (!site) return null;
  const path = (match[2] ?? "").replace(/^\/+/, "");
  const hash = match[4] ?? "";
  const paths = site.paths ?? {};
  // A known page keeps its fragment; the fragment is the route on hash-routed hosts.
  const withHash = paths[path + hash];
  if (withHash !== undefined) return site.home + withHash;
  const known = paths[path] ?? paths[`${path}/`];
  if (known !== undefined) return site.home + known + hash;
  return site.home;
}

const GITHUB_REPO_URL =
  /^https?:\/\/(?:www\.)?(github\.com|raw\.githubusercontent\.com)\/([^/?#]+)\/([^/?#]+?)(?=\.git(?:[/?#]|$)|[/?#]|$)/i;

function renameRepository(url: string, renames: RepositoryRenames): string {
  const match = GITHUB_REPO_URL.exec(url);
  if (!match) return url;
  const [whole, host, owner, repo] = match as unknown as [string, string, string, string];
  const key = `${owner}/${repo}`.toLowerCase();
  const current = renames[key] ?? OWN_RENAMES[key];
  if (!current || current.toLowerCase() === key) return url;
  return `https://${host.toLowerCase()}/${current}${url.slice(whole.length)}`;
}

/**
 * Points an absolute URL at where its target lives today: retired LeviMC
 * hosts, renamed repositories, and single pages that moved. READMEs and
 * manifests of published versions never change, so this happens when they are
 * rendered; the link text stays as the author wrote it.
 */
export function updateUrl(url: string, renames: RepositoryRenames = {}): string {
  const docs = moveRetiredDocs(url);
  if (docs !== null) return docs;
  const renamed = renameRepository(url, renames);
  for (const [from, to] of MOVED_PAGES) {
    if (from.test(renamed)) return renamed.replace(from, to);
  }
  return renamed;
}

/** A URL fragment as the id it names (`%E7%89%B9%E6%80%A7` → `特性`), or as is when malformed. */
export function decodeFragment(fragment: string): string {
  try {
    return decodeURIComponent(fragment);
  } catch {
    return fragment;
  }
}

const BLOB = "/blob/";

/**
 * Resolves a repository-relative path the way GitHub does for a README at the
 * repository root: against `blob/<ref>/README.md`. `/x` starts at the
 * repository root. A path that stays inside the repository is served from
 * `inside` (raw files for images, the file browser for links); one that climbs
 * above it (`../../actions/workflows/build.yml/badge.svg`) leaves the
 * `blob/<ref>/` part behind, just as it does on GitHub. The ref counts as one
 * level however many segments it has (`refs/tags/v1` on other hosts).
 */
function resolveRelative(url: string, inside: string, blob: string): string {
  const split = url.search(/[?#]/);
  const path = split < 0 ? url : url.slice(0, split);
  const rest = split < 0 ? "" : url.slice(split);

  const segments = path.replace(/^\/+/, "").split("/");
  const kept: string[] = [];
  let above = 0;
  segments.forEach((segment, i) => {
    const last = i === segments.length - 1;
    if (segment === "." || segment === "..") {
      if (segment === "..") {
        if (kept.length > 0) kept.pop();
        else above++;
      }
      if (last) kept.push(""); // `docs/..` names a directory
      return;
    }
    kept.push(segment);
  });

  if (above === 0) return inside + kept.join("/") + rest;
  // `https://github.com/o/r/blob/v1/` → levels `o`, `r`, `blob`, `v1`.
  const at = blob.lastIndexOf(BLOB);
  const repository = new URL(at < 0 ? blob : blob.slice(0, at));
  const levels = repository.pathname.split("/").filter(Boolean);
  if (at >= 0) levels.push("blob", blob.slice(at + BLOB.length).replace(/\/$/, ""));
  const parent = levels.slice(0, Math.max(0, levels.length - above));
  return `${repository.origin}/${[...parent, ...kept].join("/")}${rest}`;
}

/**
 * Resolves each URL of a `srcset` (`a.png 1x, b.png 2x`) like an image `src`.
 * Parsed the way browsers do: a candidate's URL runs to the next whitespace,
 * so commas inside URLs (`?repos=a,b`, `data:` URLs) stay where they are.
 */
export function resolveSrcSet(
  srcset: string,
  bases: RepoBaseUrls,
  renames: RepositoryRenames = {},
): string {
  const candidates: string[] = [];
  let i = 0;
  while (i < srcset.length) {
    while (i < srcset.length && /[\s,]/.test(srcset[i]!)) i++;
    if (i >= srcset.length) break;
    let end = i;
    while (end < srcset.length && !/\s/.test(srcset[end]!)) end++;
    let url = srcset.slice(i, end);
    let descriptors = "";
    if (url.endsWith(",")) {
      url = url.replace(/,+$/, "");
    } else {
      const comma = srcset.indexOf(",", end);
      const stop = comma < 0 ? srcset.length : comma;
      descriptors = srcset.slice(end, stop).trim();
      end = stop;
    }
    i = end;
    const resolved = resolveMarkdownUrl(url, "image", bases, renames) ?? url;
    candidates.push(descriptors ? `${resolved} ${descriptors}` : resolved);
  }
  return candidates.join(", ");
}

export type MarkdownUrlKind = "link" | "image";

/**
 * Points a URL from a README at the repository it was written in.
 *
 * READMEs are written to be read on their host — `assets/icon.png`, `LICENSE`,
 * `docs/getting-started.md` — so a browser would otherwise resolve them against
 * this site. In-page anchors (`#code-of-conduct`) are already meaningful, and
 * absolute URLs pass through {@link updateUrl}.
 */
export function resolveMarkdownUrl(
  url: string | undefined,
  kind: MarkdownUrlKind,
  bases: RepoBaseUrls,
  renames: RepositoryRenames = {},
): string | undefined {
  if (!url) return url;
  // `#%E7%89%B9%E6%80%A7` names the heading `#特性`: spell it like its id.
  if (url.startsWith("#")) return decodeFragment(url);
  if (ABSOLUTE_URL.test(url)) return updateUrl(url, renames);
  return resolveRelative(url, kind === "image" ? bases.raw : bases.blob, bases.blob);
}

/**
 * Package avatars come from manifests that are never updated once published,
 * so URLs on retired hosts and renamed repositories are rewritten here
 * (`lamina.levimc.org/logo.svg`). Anything else that fails to load falls back
 * to the chest sprite.
 */
export function resolveAvatarUrl(
  url: string | undefined,
  renames: RepositoryRenames = {},
): string | undefined {
  return url && updateUrl(url, renames);
}

const COLOR_SCHEME_QUERY = /^\s*\(\s*prefers-color-scheme\s*:\s*(dark|light)\s*\)\s*$/i;

/**
 * GitHub's light/dark image pairs (`<source media="(prefers-color-scheme: dark)">`)
 * follow the operating system; on this site they follow the theme the visitor
 * picked. With no explicit pick (`resolved` is null) the media query is kept.
 */
export function themedMedia(
  media: string | undefined,
  resolved: "light" | "dark" | null,
): string | undefined {
  if (!media || !resolved) return media;
  const match = COLOR_SCHEME_QUERY.exec(media);
  if (!match) return media;
  return match[1]!.toLowerCase() === resolved ? "all" : "not all";
}
