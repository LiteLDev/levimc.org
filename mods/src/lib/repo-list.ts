// repos.txt: the GitHub repositories the catalogue is built from, one
// `owner/repo` per line, sorted case-insensitively. Each one's tags are its
// versions (see `server/registry.ts`). scripts/discover.ts proposes new ones
// in pull requests; merging one adds the line.

const REPO = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;

/** The repositories a repos.txt names (blank lines and `#` comments aside). */
export function parseRepoList(text: string): string[] {
  const repos: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    if (!line) continue;
    if (!REPO.test(line)) throw new Error(`repos.txt: not an owner/repo: ${JSON.stringify(raw)}`);
    if (!repos.some((r) => r.toLowerCase() === line.toLowerCase())) repos.push(line);
  }
  return repos;
}

const byName = (a: string, b: string) => a.toLowerCase().localeCompare(b.toLowerCase()) || a.localeCompare(b);

/** repos.txt with `repo` added in its place (unchanged when it is there in any case). */
export function addRepo(text: string, repo: string): string {
  const repos = parseRepoList(text);
  if (repos.some((r) => r.toLowerCase() === repo.toLowerCase())) return text;
  return `${[...repos, repo].sort(byName).join("\n")}\n`;
}
