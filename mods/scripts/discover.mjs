#!/usr/bin/env node
// Finds mod repositories repos.txt does not name yet and proposes each one in a pull request that adds it
// (.github/workflows/mods-discover.yml runs it every two hours):
//
//   node scripts/discover.mjs [--dry-run] [--max 20]
//
// A candidate is a repository GitHub's code search finds a tooth.json at the top of (what lipr searches for),
// not a fork, with a `v<semver>` tag whose tooth.json lip can read. Merging the pull request lists it; closing it
// keeps it out: a repository that ever had a pull request (its branch, `mods/add/<owner>/<repo>`) is never
// proposed again. Removing a line from repos.txt by hand works the same way only for repositories that came in
// through a pull request, so close one rather than reverting it.
//
// Needs GH_TOKEN (or GITHUB_TOKEN) with contents and pull-requests write access to GITHUB_REPOSITORY (default
// LiteLDev/levimc.org), and git for listing tags.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { migrateManifest } from "../src/lib/manifest.ts";
import { addRepo, parseRepoList } from "../src/lib/repo-list.ts";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const max = Number(args.includes("--max") ? args[args.indexOf("--max") + 1] : 20);
const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
const target = process.env.GITHUB_REPOSITORY ?? "LiteLDev/levimc.org";
const REPOS_PATH = "mods/repos.txt";
const SEARCH = "format_version path:/ filename:tooth.json";
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

if (!token) {
  console.error("GH_TOKEN is not set");
  process.exit(1);
}

async function api(path, init = {}) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://api.github.com/${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "levimc.org-mods-discover",
        "X-GitHub-Api-Version": "2022-11-28",
        ...init.headers,
      },
    });
    // code search allows 10 requests a minute
    if ((res.status === 403 || res.status === 429) && attempt < 4) {
      console.warn(`${path}: HTTP ${res.status}, again in a minute`);
      await new Promise((resolve) => setTimeout(resolve, 60_000));
      continue;
    }
    if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path}: HTTP ${res.status} ${await res.text()}`);
    return res.status === 204 ? null : res.json();
  }
}

/** Repositories with a tooth.json at the top (search results stop at 1000). */
async function search() {
  const repos = new Map();
  for (let page = 1; page <= 10; page++) {
    const data = await api(`search/code?q=${encodeURIComponent(SEARCH)}&per_page=100&page=${page}`);
    for (const { repository } of data.items) repos.set(repository.full_name.toLowerCase(), repository);
    if (data.items.length < 100) break;
  }
  return [...repos.values()];
}

/** The repository's newest `v<semver>` tag and how many it has. */
function tags(repo) {
  const out = execFileSync("git", ["-c", "credential.helper=", "ls-remote", "--tags", "--refs", `https://github.com/${repo}.git`], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  const versions = out
    .split("\n")
    .map((line) => line.split("\t")[1]?.replace(/^refs\/tags\//, "") ?? "")
    .filter((tag) => tag.startsWith("v") && SEMVER.test(tag.slice(1)));
  const key = (tag) => tag.slice(1).split(/[-+]/)[0].split(".").map(Number);
  const pre = (tag) => (tag.includes("-") ? 0 : 1);
  versions.sort((a, b) => {
    const [x, y] = [key(a), key(b)];
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2] || pre(a) - pre(b) || a.localeCompare(b);
  });
  return { latest: versions.at(-1), count: versions.length };
}

async function manifestAt(repo, tag) {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${repo}/${encodeURIComponent(tag)}/tooth.json`);
    return res.ok ? migrateManifest(JSON.parse(await res.text())) : null;
  } catch {
    // unreachable, or not JSON: the next run tries again
    return null;
  }
}

/** The branches of every pull request the target ever had. */
async function proposed() {
  const branches = new Set();
  for (let page = 1; ; page++) {
    const pulls = await api(`repos/${target}/pulls?state=all&per_page=100&page=${page}`);
    for (const pull of pulls) branches.add(pull.head.ref.toLowerCase());
    if (pulls.length < 100) return branches;
  }
}

const cell = (text) => String(text ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim() || "—";

function body(repository, tag, count, manifest) {
  const repo = repository.full_name;
  return [
    `Adds [${repo}](https://github.com/${repo}) to \`${REPOS_PATH}\`: GitHub's code search found a \`tooth.json\` there.`,
    "",
    "| | |",
    "| --- | --- |",
    `| Name | ${cell(manifest.info.name)} |`,
    `| Description | ${cell(manifest.info.description)} |`,
    `| Tags | ${manifest.info.tags.length ? manifest.info.tags.map((t) => `\`${cell(t)}\``).join(" ") : "—"} |`,
    `| Tooth | \`${cell(manifest.tooth)}\` |`,
    `| Latest version | [\`${tag}\`](https://github.com/${repo}/blob/${encodeURIComponent(tag)}/tooth.json) (${count} version tag${count === 1 ? "" : "s"}) |`,
    `| Repository | ${cell(repository.description)} |`,
    "",
    "Merge it to list the repository's versions on LeviMC Mods at the next deploy. Close it to keep the repository out: the discovery never proposes a repository twice.",
    "",
    "_Opened by `mods/scripts/discover.mjs` (`.github/workflows/mods-discover.yml`)._",
  ].join("\n");
}

async function propose(repository, tag, count, manifest) {
  const repo = repository.full_name;
  const branch = `mods/add/${repo.toLowerCase()}`;
  const title = `LeviMC Mods: add ${repo}`;
  if (dryRun) {
    console.log(`[dry run] ${title} (${tag}, ${manifest.tooth})`);
    return;
  }
  const { default_branch: base } = await api(`repos/${target}`);
  const { object } = await api(`repos/${target}/git/ref/heads/${base}`);
  const file = await api(`repos/${target}/contents/${REPOS_PATH}?ref=${base}`);
  const text = Buffer.from(file.content, "base64").toString("utf8");
  try {
    await api(`repos/${target}/git/refs`, { method: "POST", body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: object.sha }) });
  } catch (error) {
    // the branch of a run that stopped before its pull request
    if (!String(error).includes("HTTP 422")) throw error;
    await api(`repos/${target}/git/refs/heads/${branch}`, { method: "PATCH", body: JSON.stringify({ sha: object.sha, force: true }) });
  }
  await api(`repos/${target}/contents/${REPOS_PATH}`, {
    method: "PUT",
    body: JSON.stringify({ message: title, content: Buffer.from(addRepo(text, repo)).toString("base64"), sha: file.sha, branch }),
  });
  const pull = await api(`repos/${target}/pulls`, {
    method: "POST",
    body: JSON.stringify({ title, head: branch, base, body: body(repository, tag, count, manifest) }),
  });
  console.log(`${title}: ${pull.html_url}`);
}

const known = new Set(parseRepoList(readFileSync("repos.txt", "utf8")).map((r) => r.toLowerCase()));
const found = await search();
const history = await proposed();
const candidates = found.filter((r) => !r.fork && !known.has(r.full_name.toLowerCase()) && !history.has(`mods/add/${r.full_name.toLowerCase()}`));
console.log(`search: ${found.length} repositories; ${candidates.length} neither listed nor proposed before`);

let opened = 0;
for (const repository of candidates) {
  if (opened >= max) break;
  let latest, count;
  try {
    ({ latest, count } = tags(repository.full_name));
  } catch (error) {
    console.warn(`${repository.full_name}: tags unavailable (${String(error).split("\n")[0]})`);
    continue;
  }
  if (!latest) {
    console.log(`${repository.full_name}: no version tag yet`);
    continue;
  }
  const manifest = await manifestAt(repository.full_name, latest);
  if (!manifest) {
    console.log(`${repository.full_name}: no tooth.json lip can read at ${latest}`);
    continue;
  }
  await propose(repository, latest, count, manifest);
  opened++;
}
console.log(`${dryRun ? "would open" : "opened"} ${opened} pull request${opened === 1 ? "" : "s"}`);
