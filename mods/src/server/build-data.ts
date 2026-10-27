// Build-time page data: the catalogue for `/mods/`, and for each mod page its
// default READMEs and manifest, gallery, releases, LeviLamina ranges and the mods it
// depends on or is required by. Only the server bundle (prerender, dev server)
// imports this.
import { BASE } from "../base-path";
import {
  fetchReadmes,
  getDefaultSelection,
  getRepositoryUrl,
  modPath,
  toothFromPath,
} from "../lib/mods";
import { DEFAULT_README_FILES } from "../lib/readme-language.ts";
import type { PageData } from "../page-data";
import type { RelatedMod } from "../types";
import { allDependencies, leviLaminaRanges, loadBuildData, related } from "./catalog";
import { loadShowcase } from "./showcase";

/** `/mods/` and every listed or unlisted mod that has a version to show (see `lib/listing.ts`). */
export async function listRoutes(): Promise<string[]> {
  const { index, byTooth } = await loadBuildData();
  return [
    BASE,
    ...[...byTooth.keys()]
      .filter((tooth) => getDefaultSelection(index.packages[tooth]!))
      .map((tooth) => modPath(tooth)),
  ];
}

/** The pages for the sitemap: every page but those of old names of a repository. */
export async function listSitemapRoutes(): Promise<string[]> {
  const { listings } = await loadBuildData();
  const old = new Set(
    [...listings].filter(([, l]) => l.status === "unlisted" && l.reason === "duplicate").map(([tooth]) => modPath(tooth)),
  );
  return (await listRoutes()).filter((route) => !old.has(route));
}

const pages = new Map<string, Promise<PageData>>();

/** A page's data, once per build (the page and its JSON share it, see `server/api.ts`). */
export function loadPageData(pathname: string): Promise<PageData> {
  let page = pages.get(pathname);
  if (!page) {
    page = buildPageData(pathname);
    pages.set(pathname, page);
  }
  return page;
}

async function buildPageData(pathname: string): Promise<PageData> {
  const data = await loadBuildData();
  const { index, catalog, renames } = data;

  if (pathname === BASE) {
    return { kind: "home", catalog, renames };
  }

  const tooth = toothFromPath(pathname);
  const mod = tooth !== null ? index.packages[tooth] : undefined;
  const entry = tooth !== null ? data.byTooth.get(tooth) : undefined;
  const selection = mod && getDefaultSelection(mod);
  const listing = tooth !== null ? data.listings.get(tooth) : undefined;
  if (tooth !== null && mod && entry && selection) {
    const repository = getRepositoryUrl(tooth, data.meta.get(tooth)?.url);
    const manifest = data.manifests.get(tooth) ?? null;
    // without GitHub's file list, the usual names are tried on GitHub (README.md elsewhere)
    const readmeFiles =
      data.meta.get(tooth)?.readmeFiles ?? (repository.startsWith("https://github.com/") ? DEFAULT_README_FILES : ["README.md"]);
    const [readmes, showcase] = await Promise.all([
      fetchReadmes(repository, selection.version, readmeFiles),
      loadShowcase(repository),
    ]);
    const relatedMap: Record<string, RelatedMod> = {};
    const deps = new Set(allDependencies(data, tooth));
    for (const variant of manifest?.variants ?? []) {
      for (const key of Object.keys(variant.dependencies ?? {})) deps.add(key.split("#")[0]!.toLowerCase());
    }
    for (const dep of deps) relatedMap[dep] = related(data, dep);
    return {
      kind: "mod",
      tooth,
      mod,
      entry,
      repository,
      prerendered: {
        ...selection,
        info: manifest?.info ?? null,
        variants: manifest?.variants ?? null,
        readmes,
      },
      readmeFiles,
      releases: data.meta.get(tooth)?.releases ?? {},
      llRanges: leviLaminaRanges(data, tooth),
      dependents: (data.dependents.get(tooth.toLowerCase()) ?? []).map((t) => related(data, t)),
      related: relatedMap,
      hasIssues: data.meta.get(tooth)?.hasIssues ?? false,
      ...(listing?.status === "unlisted" && listing.reason === "duplicate" ? { canonicalTooth: listing.canonical } : {}),
      showcase,
      renames,
    };
  }

  return { kind: "not-found", renames };
}
