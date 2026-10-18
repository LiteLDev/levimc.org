// Live data shown on the site (GitHub stars/forks, the latest LeviLamina release, Discord presence).
// Nothing is fetched while prerendering: the first render (server and hydration) shows placeholders and
// the requests start in an effect. Results are kept for the rest of the visit, so client-side navigation
// between pages shows them immediately.
import { useEffect, useState } from 'react';
import { getDiscordInfo, getLatestRelease, getMultipleRepos, getRepoInfo, type DiscordInfo, type RepoInfo } from '../services/githubService';
import { PROJECT_CONFIGS } from '../data/projects';

const DISCORD_SERVER_ID = '849252980430864384';

function cached<T>(load: () => Promise<T>) {
  let promise: Promise<T> | null = null;
  let value: { v: T } | null = null;
  return {
    peek: () => value,
    get: () =>
      (promise ??= load().then((v) => {
        value = { v };
        return v;
      })),
  };
}

const repos = cached(() => getMultipleRepos(PROJECT_CONFIGS.map((p) => ({ owner: p.owner, repo: p.repo }))));
const discord = cached(() => getDiscordInfo(DISCORD_SERVER_ID));
const release = cached(() => getLatestRelease('LiteLDev', 'LeviLamina'));
const leviLamina = cached(() => getRepoInfo('LiteLDev', 'LeviLamina'));

let hydrationDone = false;

function useCached<T>(source: ReturnType<typeof cached<T>>): T | undefined {
  // During hydration the first render must match the prerendered placeholders.
  const [state, setState] = useState<{ v: T } | null>(() => (hydrationDone ? source.peek() : null));
  useEffect(() => {
    let alive = true;
    source.get().then((v) => {
      if (alive) setState({ v });
    });
    return () => {
      alive = false;
    };
  }, [source]);
  return state?.v;
}

/** Called once the app has hydrated (see App). Later mounts may start from cached data. */
export function markHydrated() {
  hydrationDone = true;
}

export function useRepoData(): { repoData: Map<string, RepoInfo> | undefined; loading: boolean } {
  const repoData = useCached(repos);
  return { repoData, loading: repoData === undefined };
}

export function useDiscordInfo(): DiscordInfo | undefined {
  return useCached(discord);
}

export function useLeviLaminaStats(): { version: string | null; stats: { stars: number; forks: number } | null } {
  const rel = useCached(release);
  const info = useCached(leviLamina);
  return {
    version: rel ? rel.tagName : null,
    stats: info ? { stars: info.stars, forks: info.forks } : null,
  };
}
