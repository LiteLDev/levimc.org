// Where each package's GitHub repository lives today. A tooth keeps the
// repository path it was published under, and GitHub redirects renamed and
// transferred repositories from there; the build asks GitHub for the current
// addresses (one GraphQL request per 100 packages) so "View on GitHub",
// avatars and README links point straight at them.
//
// Needs GITHUB_TOKEN (GitHub's GraphQL API requires one; the workflow passes
// its own). Without a token, or if GitHub cannot be reached, every link keeps
// the tooth's address, which GitHub redirects as before.
import type { RepositoryRenames } from "../lib/markdown";

const GITHUB_PREFIX = "github.com/";
const GITHUB_URL = "https://github.com/";
const BATCH = 100;

interface RepositoryNode {
  url: string;
}

async function query(
  token: string,
  tooths: string[],
): Promise<Map<string, string>> {
  const fields = tooths.map((tooth, i) => {
    const [owner = "", name = ""] = tooth.slice(GITHUB_PREFIX.length).split("/");
    return `r${i}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { url }`;
  });
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "pkg.levimc.org-build",
    },
    body: JSON.stringify({ query: `query { ${fields.join("\n")} }` }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL API: HTTP ${res.status}`);
  const { data } = (await res.json()) as {
    data?: Record<string, RepositoryNode | null>;
  };
  const urls = new Map<string, string>();
  tooths.forEach((tooth, i) => {
    const url = data?.[`r${i}`]?.url;
    if (url) urls.set(tooth, url);
  });
  return urls;
}

/** Tooth → current repository URL, for the tooths GitHub knows. */
export async function resolveRepositories(
  tooths: string[],
): Promise<Map<string, string>> {
  const token = process.env.GITHUB_TOKEN;
  const github = tooths.filter((t) => t.startsWith(GITHUB_PREFIX) && t.split("/").length === 3);
  if (!token) {
    console.warn("GITHUB_TOKEN is not set: repository links keep the tooths' addresses");
    return new Map();
  }
  try {
    const urls = new Map<string, string>();
    for (let i = 0; i < github.length; i += BATCH) {
      for (const [tooth, url] of await query(token, github.slice(i, i + BATCH))) {
        urls.set(tooth, url);
      }
    }
    return urls;
  } catch (error) {
    console.warn(`Could not resolve repository addresses: ${String(error)}`);
    return new Map();
  }
}

/**
 * The packages among `repositories` (tooth → current URL) whose repository
 * moved, as lower-case `owner/repo` → current `Owner/Repo`: the form README
 * links and avatars are matched against (see `updateUrl` in `lib/markdown.ts`).
 */
export function repositoryRenames(repositories: Map<string, string>): RepositoryRenames {
  const renames: Record<string, string> = {};
  for (const [tooth, url] of repositories) {
    if (!tooth.startsWith(GITHUB_PREFIX) || !url.startsWith(GITHUB_URL)) continue;
    const from = tooth.slice(GITHUB_PREFIX.length).toLowerCase();
    const to = url.slice(GITHUB_URL.length);
    if (to.toLowerCase() !== from) renames[from] = to;
  }
  return renames;
}
