// Build-time page data: the catalogue for `/mods/`, and for each package page its
// default README and manifest, releases, LeviLamina ranges and the packages it
// depends on or is required by. Only the server bundle (prerender, dev server)
// imports this.
import { BASE } from "../base-path";
import {
  fetchReadme,
  getDefaultSelection,
  getRepositoryUrl,
  packagePath,
  toothFromPath,
} from "../lib/packages";
import type { PageData } from "../page-data";
import type { RelatedPackage } from "../types";
import { allDependencies, leviLaminaRanges, loadBuildData, related } from "./catalog";

/** `/mods/` and every package that has a version to show. */
export async function listRoutes(): Promise<string[]> {
  const { index } = await loadBuildData();
  return [
    BASE,
    ...Object.entries(index.packages)
      .filter(([, pkg]) => getDefaultSelection(pkg))
      .map(([tooth]) => packagePath(tooth)),
  ];
}

export async function loadPageData(pathname: string): Promise<PageData> {
  const data = await loadBuildData();
  const { index, catalog, renames } = data;

  if (pathname === BASE) {
    return { kind: "home", catalog, renames };
  }

  const tooth = toothFromPath(pathname);
  const pkg = tooth !== null ? index.packages[tooth] : undefined;
  const entry = tooth !== null ? data.byTooth.get(tooth) : undefined;
  const selection = pkg && getDefaultSelection(pkg);
  if (tooth !== null && pkg && entry && selection) {
    const repository = getRepositoryUrl(tooth, data.meta.get(tooth)?.url);
    const manifest = data.manifests.get(tooth) ?? null;
    const readme = await fetchReadme(repository, selection.version);
    const relatedMap: Record<string, RelatedPackage> = {};
    const deps = new Set(allDependencies(data, tooth));
    for (const variant of manifest?.variants ?? []) {
      for (const key of Object.keys(variant.dependencies ?? {})) deps.add(key.split("#")[0]!.toLowerCase());
    }
    for (const dep of deps) relatedMap[dep] = related(data, dep);
    return {
      kind: "package",
      tooth,
      pkg,
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

  return { kind: "not-found", tooths: Object.keys(index.packages), renames };
}
