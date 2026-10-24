// Build-time page data: the catalogue for `/mods/`, and for each mod page its
// default README and manifest, releases, LeviLamina ranges and the mods it
// depends on or is required by. Only the server bundle (prerender, dev server)
// imports this.
import { BASE } from "../base-path";
import {
  fetchReadme,
  getDefaultSelection,
  getRepositoryUrl,
  modPath,
  toothFromPath,
} from "../lib/mods";
import type { PageData } from "../page-data";
import type { RelatedMod } from "../types";
import { allDependencies, leviLaminaRanges, loadBuildData, related } from "./catalog";

/** `/mods/` and every mod that has a version to show. */
export async function listRoutes(): Promise<string[]> {
  const { index } = await loadBuildData();
  return [
    BASE,
    ...Object.entries(index.packages)
      .filter(([, mod]) => getDefaultSelection(mod))
      .map(([tooth]) => modPath(tooth)),
  ];
}

export async function loadPageData(pathname: string): Promise<PageData> {
  const data = await loadBuildData();
  const { index, catalog, renames } = data;

  if (pathname === BASE) {
    return { kind: "home", catalog, renames };
  }

  const tooth = toothFromPath(pathname);
  const mod = tooth !== null ? index.packages[tooth] : undefined;
  const entry = tooth !== null ? data.byTooth.get(tooth) : undefined;
  const selection = mod && getDefaultSelection(mod);
  if (tooth !== null && mod && entry && selection) {
    const repository = getRepositoryUrl(tooth, data.meta.get(tooth)?.url);
    const manifest = data.manifests.get(tooth) ?? null;
    const readme = await fetchReadme(repository, selection.version);
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
        readme,
      },
      releases: data.meta.get(tooth)?.releases ?? {},
      llRanges: leviLaminaRanges(data, tooth),
      dependents: (data.dependents.get(tooth.toLowerCase()) ?? []).map((t) => related(data, t)),
      related: relatedMap,
      hasIssues: data.meta.get(tooth)?.hasIssues ?? false,
      dependentsKnown: data.launcher !== null,
      renames,
    };
  }

  return { kind: "not-found", renames };
}
