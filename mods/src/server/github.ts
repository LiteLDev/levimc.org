// What GitHub knows about each mod's repository: where it lives today (a
// tooth keeps the path it was published under; GitHub redirects renamed and
// transferred repositories from there), when it was created, its license and
// its releases. One GraphQL request per 50 mods.
//
// Needs GITHUB_TOKEN (GitHub's GraphQL API requires one; the workflow passes
// its own). Without a token, or if GitHub cannot be reached, the build goes on
// without this data: links keep the tooth's address, dates come from the
// index, and the "Newest" sort and the License filter are left out (also when
// only some batches could be read).
import type { RepositoryRenames } from "../lib/markdown";
import type { ReleaseInfo } from "../types";

const GITHUB_PREFIX = "github.com/";
const GITHUB_URL = "https://github.com/";
const BATCH = 50;
const RELEASES = 100;

export interface RepoMeta {
  /** Where the repository lives today. */
  url: string;
  createdAt?: string;
  /** SPDX id, when GitHub recognises a license. */
  license?: string;
  /** Releases by version (the tag without a leading `v`). */
  releases: Record<string, ReleaseInfo>;
  /** The most recent release's date. */
  latestRelease?: string;
  /** The repository takes issues. */
  hasIssues: boolean;
}

interface ReleaseNode {
  tagName: string;
  publishedAt: string | null;
  isPrerelease: boolean;
}

interface ReleaseConnection {
  totalCount: number;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  nodes: ReleaseNode[];
}

interface RepositoryNode {
  url: string;
  createdAt: string;
  hasIssuesEnabled: boolean;
  licenseInfo: { spdxId: string | null } | null;
  releases: ReleaseConnection;
}

const RELEASE_FIELDS = `totalCount pageInfo { hasNextPage endCursor } nodes { tagName publishedAt isPrerelease }`;

async function graphql<T>(token: string, query: string): Promise<T> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "levimc.org-mods-build",
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL API: HTTP ${res.status}`);
  const body = (await res.json()) as { data?: T; errors?: { type?: string; message: string }[] };
  // A repository that no longer exists is a NOT_FOUND error next to the other results.
  const fatal = body.errors?.filter((e) => e.type !== "NOT_FOUND");
  if (!body.data || fatal?.length) throw new Error(`GitHub GraphQL API: ${fatal?.[0]?.message ?? "no data"}`);
  return body.data;
}

const ownerAndName = (tooth: string) => {
  const [owner = "", name = ""] = tooth.slice(GITHUB_PREFIX.length).split("/");
  return `owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}`;
};

function addReleases(meta: RepoMeta, nodes: ReleaseNode[]) {
  for (const node of nodes) {
    if (!node.publishedAt) continue;
    const version = node.tagName.replace(/^v(?=\d)/, "");
    meta.releases[version] ??= { tag: node.tagName, date: node.publishedAt, prerelease: node.isPrerelease };
    if (!meta.latestRelease || node.publishedAt > meta.latestRelease) meta.latestRelease = node.publishedAt;
  }
}

let cost = 0;

async function queryBatch(token: string, tooths: string[]): Promise<Map<string, RepoMeta>> {
  const fields = tooths.map(
    (tooth, i) =>
      `r${i}: repository(${ownerAndName(tooth)}) { url createdAt hasIssuesEnabled licenseInfo { spdxId } ` +
      `releases(first: ${RELEASES}, orderBy: { field: CREATED_AT, direction: DESC }) { ${RELEASE_FIELDS} } }`,
  );
  const data = await graphql<Record<string, RepositoryNode | null> & { rateLimit: { cost: number } }>(
    token,
    `query { rateLimit { cost remaining } ${fields.join("\n")} }`,
  );
  cost += data.rateLimit.cost;
  const out = new Map<string, RepoMeta>();
  for (const [i, tooth] of tooths.entries()) {
    const node = data[`r${i}`] as RepositoryNode | null | undefined;
    if (!node) continue;
    const spdx = node.licenseInfo?.spdxId;
    const meta: RepoMeta = {
      url: node.url,
      createdAt: node.createdAt,
      ...(spdx ? { license: spdx } : {}),
      releases: {},
      hasIssues: node.hasIssuesEnabled,
    };
    addReleases(meta, node.releases.nodes);
    // Mods with more releases than one page (LeviLamina, LegacyScriptEngine) get the rest one by one.
    let { hasNextPage, endCursor } = node.releases.pageInfo;
    while (hasNextPage && endCursor) {
      const more = await graphql<{ repository: { releases: ReleaseConnection } | null; rateLimit: { cost: number } }>(
        token,
        `query { rateLimit { cost remaining } repository(${ownerAndName(tooth)}) { releases(first: ${RELEASES}, after: ${JSON.stringify(endCursor)}, orderBy: { field: CREATED_AT, direction: DESC }) { ${RELEASE_FIELDS} } } }`,
      );
      cost += more.rateLimit.cost;
      if (!more.repository) break;
      addReleases(meta, more.repository.releases.nodes);
      ({ hasNextPage, endCursor } = more.repository.releases.pageInfo);
    }
    out.set(tooth, meta);
  }
  return out;
}

export interface RepoMetaResult {
  /** Tooth → what GitHub knows about its repository, for the tooths GitHub knows. */
  meta: Map<string, RepoMeta>;
  /**
   * Every batch was read. Only then do the License filter and the "Newest"
   * sort cover the whole catalogue (a mod missing from a failed batch
   * would look closed-source and the oldest).
   */
  complete: boolean;
}

/** What GitHub knows about the mods' repositories (a failed batch is tried once more). */
export async function fetchRepoMeta(tooths: string[]): Promise<RepoMetaResult> {
  const token = process.env.GITHUB_TOKEN;
  const github = tooths.filter((t) => t.startsWith(GITHUB_PREFIX) && t.split("/").length === 3);
  if (!token) {
    console.warn("GITHUB_TOKEN is not set: no GitHub data (links keep the tooths' addresses, dates come from the index)");
    return { meta: new Map(), complete: false };
  }
  const meta = new Map<string, RepoMeta>();
  let complete = true;
  for (let i = 0; i < github.length; i += BATCH) {
    const batch = github.slice(i, i + BATCH);
    // a failed batch costs its own mods' data, not the others'
    let result: Map<string, RepoMeta> | undefined;
    for (let attempt = 1; !result && attempt <= 2; attempt++) {
      // a moment's pause before the retry: a rate limit or a 502 rarely clears at once
      if (attempt > 1) await new Promise((resolve) => setTimeout(resolve, 3000));
      try {
        result = await queryBatch(token, batch);
      } catch (error) {
        console.warn(`::warning::Could not read GitHub data for ${batch.length} mods (attempt ${attempt} of 2): ${String(error)}`);
      }
    }
    if (result) for (const [tooth, m] of result) meta.set(tooth, m);
    else complete = false;
  }
  console.log(`GitHub: ${meta.size} of ${github.length} repositories (GraphQL cost ${cost})${complete ? "" : "; incomplete, so no License filter and no Newest sort"}`);
  return { meta, complete };
}

/**
 * The mods whose repository moved, as lower-case `owner/repo` → current
 * `Owner/Repo`: the form README links and avatars are matched against (see
 * `updateUrl` in `lib/markdown.ts`).
 */
export function repositoryRenames(meta: Map<string, { url: string }>): RepositoryRenames {
  const renames: Record<string, string> = {};
  for (const [tooth, { url }] of meta) {
    if (!tooth.startsWith(GITHUB_PREFIX) || !url.startsWith(GITHUB_URL)) continue;
    const from = tooth.slice(GITHUB_PREFIX.length).toLowerCase();
    const to = url.slice(GITHUB_URL.length);
    if (to.toLowerCase() !== from) renames[from] = to;
  }
  return renames;
}
