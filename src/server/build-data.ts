// Build-time data: the lipr index, each package's default README and
// manifest, and where its repository lives. Only the server bundle (prerender,
// dev server) imports this.
import {
  fetchManifestInfo,
  fetchPackageIndex,
  fetchReadme,
  getDefaultSelection,
  getRepositoryUrl,
  normalizePackageIndex,
  packagePath,
  toothFromPath,
} from "../lib/packages";
import type { RepositoryRenames } from "../lib/markdown";
import type { PageData } from "../page-data";
import type { PackageIndex } from "../types";
import { repositoryRenames, resolveRepositories } from "./repositories";

let index: Promise<PackageIndex> | undefined;
let repositories:
  | Promise<{ urls: Map<string, string>; renames: RepositoryRenames }>
  | undefined;

/** The lipr index, fetched once per build. */
function loadIndex(): Promise<PackageIndex> {
  index ??= fetchPackageIndex();
  return index;
}

/** Current repository URLs, and the ones that moved, looked up once per build. */
function loadRepositories() {
  repositories ??= loadIndex()
    .then(({ packages }) => resolveRepositories(Object.keys(packages)))
    .then((urls) => ({ urls, renames: repositoryRenames(urls) }));
  return repositories;
}

/** `/` and every package that has a version to show. */
export async function listRoutes(): Promise<string[]> {
  const { packages } = await loadIndex();
  return [
    "/",
    ...Object.entries(packages)
      .filter(([, pkg]) => getDefaultSelection(pkg))
      .map(([tooth]) => packagePath(tooth)),
  ];
}

export async function loadPageData(pathname: string): Promise<PageData> {
  const packageIndex = await loadIndex();
  const { urls: repositoryUrls, renames } = await loadRepositories();

  if (pathname === "/") {
    return { kind: "home", packages: normalizePackageIndex(packageIndex), renames };
  }

  const tooth = toothFromPath(pathname);
  const pkg = tooth !== null ? packageIndex.packages[tooth] : undefined;
  const selection = pkg && getDefaultSelection(pkg);
  if (tooth !== null && pkg && selection) {
    const repository = getRepositoryUrl(tooth, repositoryUrls.get(tooth));
    const [info, readme] = await Promise.all([
      fetchManifestInfo(tooth, selection.version),
      fetchReadme(repository, selection.version),
    ]);
    return {
      kind: "package",
      tooth,
      pkg,
      repository,
      prerendered: { ...selection, info, readme },
      renames,
    };
  }

  return { kind: "not-found", tooths: Object.keys(packageIndex.packages), renames };
}
