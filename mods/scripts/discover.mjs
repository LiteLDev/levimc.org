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
// LiteLDev/levimc.org), and git for listing tags. SEARCH_TOKEN, when set, is used for the code search alone: the code
// search allowance of a workflow's GITHUB_TOKEN (10 requests a minute) is shared beyond this workflow and is often used
// up before the first request, while a personal token has its own.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { migrateManifest } from "../src/lib/manifest.ts";
import { addRepo, parseRepoList } from "../src/lib/repo-list.ts";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const max = Number(args.includes("--max") ? args[args.indexOf("--max") + 1] : 20);
const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
const searchToken = process.env.SEARCH_TOKEN || token;
const target = process.env.GITHUB_REPOSITORY ?? "LiteLDev/levimc.org";
const REPOS_PATH = "mods/repos.txt";
const SEARCH = "format_version path:/ filename:tooth.json";
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

if (!token) {
  console.error("GH_TOKEN is not set");
  process.exit(1);
}

class RateLimited extends Error {}

/** How long GitHub asks to wait before the next request (milliseconds), and what said so. */
async function retryDelay(res) {
  const after = Number(res.headers.get("retry-after"));
  if (after > 0) return [after * 1000, "retry-after"];
  const reset = Number(res.headers.get("x-ratelimit-reset"));
  if (res.headers.get("x-ratelimit-remaining") === "0" && reset > 0) return [Math.max(reset * 1000 - Date.now(), 1000), "x-ratelimit-reset"];
  // {"message":"try again in 33.373457742s", …}
  const seconds = Number((await res.text().catch(() => "")).match(/try again in ([\d.]+)s/)?.[1]);
  return seconds > 0 ? [seconds * 1000, "message"] : [60_000, "default"];
}

async function api(path, init = {}, { auth = token, patience = 3 * 60_000 } = {}) {
  const giveUp = Date.now() + patience;
  for (;;) {
    const res = await fetch(`https://api.github.com/${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${auth}`,
        "User-Agent": "levimc.org-mods-discover",
        "X-GitHub-Api-Version": "2022-11-28",
        ...init.headers,
      },
    });
    // a 403 is a rate limit only when GitHub says so (it also means "not allowed")
    const limited = res.status === 429 || (res.status === 403 && (res.headers.has("retry-after") || res.headers.get("x-ratelimit-remaining") === "0"));
    if (limited) {
      const left = giveUp - Date.now();
      if (left <= 0) throw new RateLimited(`${init.method ?? "GET"} ${path}: still rate limited (HTTP ${res.status})`);
      // a little later than asked, and not on the second: others wait for the same reset. A wait beyond the patience
      // left is still tried once at its end: the shared limit sometimes frees up sooner than it says.
      const [asked, source] = await retryDelay(res);
      const wait = Math.min(asked + 1000 + Math.random() * 4000, left);
      console.warn(`${path}: HTTP ${res.status} (${source} asks ${Math.ceil(asked / 1000)} s), again in ${Math.ceil(wait / 1000)} s`);
      await new Promise((resolve) => setTimeout(resolve, wait));
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
    const data = await api(`search/code?q=${encodeURIComponent(SEARCH)}&per_page=100&page=${page}`, {}, { auth: searchToken, patience: 10 * 60_000 });
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
let found;
try {
  found = await search();
} catch (error) {
  if (!(error instanceof RateLimited)) throw error;
  // nothing is lost: the next run searches again
  console.log(`::warning::${error.message}; nothing proposed this run${process.env.SEARCH_TOKEN ? "" : " (set the MODS_SEARCH_TOKEN secret to search with a limit of its own)"}`);
  process.exit(0);
}
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
