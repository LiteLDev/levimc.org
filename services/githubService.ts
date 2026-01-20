// GitHub data service
// Uses multiple fallback sources to avoid rate limits:
// 1. Shields.io JSON API (has caching, more stable)
// 2. GitHub API as fallback
// 3. Static fallback values

export interface RepoInfo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  url: string;
  archived: boolean;
}

export interface ReleaseInfo {
  tagName: string;
  name: string;
  publishedAt: string;
  url: string;
}

export interface DiscordInfo {
  name: string;
  memberCount: number;
  onlineCount: number;
  inviteUrl: string;
}

// Cache with longer duration to reduce API calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Static fallback data for when all APIs fail
const FALLBACK_DATA: Record<string, Partial<RepoInfo>> = {
  'levilamina': { stars: 1475, forks: 120, language: 'C++' },
  'legacyscriptengine': { stars: 87, forks: 14, language: 'C++' },
  'levilaunchroid': { stars: 188, forks: 36, language: 'Java' },
  'levilauncher': { stars: 131, forks: 6, language: 'TypeScript' },
  'levioptimize': { stars: 56, forks: 2, language: 'C++' },
  'levianticheat': { stars: 41, forks: 0, language: 'C++' },
  'moredimensions': { stars: 21, forks: 1, language: 'C++' },
};

async function fetchWithCache<T>(url: string, timeout = 5000): Promise<T | null> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    cache.set(url, { data, timestamp: Date.now() });
    return data as T;
  } catch {
    return null;
  }
}

// Use Shields.io JSON API for stars (has caching, no rate limit issues)
async function getStarsFromShields(owner: string, repo: string): Promise<number | null> {
  const url = `https://img.shields.io/github/stars/${owner}/${repo}.json`;
  const data = await fetchWithCache<{ value: string }>(url);

  if (!data?.value) return null;

  // Parse "1.4k" or "1475" format
  const value = data.value.toLowerCase();
  if (value.endsWith('k')) {
    return Math.round(parseFloat(value) * 1000);
  }
  return parseInt(value, 10) || null;
}

// Use Shields.io for forks
async function getForksFromShields(owner: string, repo: string): Promise<number | null> {
  const url = `https://img.shields.io/github/forks/${owner}/${repo}.json`;
  const data = await fetchWithCache<{ value: string }>(url);

  if (!data?.value) return null;

  const value = data.value.toLowerCase();
  if (value.endsWith('k')) {
    return Math.round(parseFloat(value) * 1000);
  }
  return parseInt(value, 10) || null;
}

// Get version from Shields.io
async function getVersionFromShields(owner: string, repo: string): Promise<string | null> {
  const url = `https://img.shields.io/github/v/release/${owner}/${repo}.json`;
  const data = await fetchWithCache<{ value: string }>(url);
  return data?.value || null;
}

export async function getRepoInfo(owner: string, repo: string): Promise<RepoInfo | null> {
  const repoKey = repo.toLowerCase();
  const fallback = FALLBACK_DATA[repoKey];

  // Try Shields.io first (parallel requests)
  const [stars, forks] = await Promise.all([
    getStarsFromShields(owner, repo),
    getForksFromShields(owner, repo),
  ]);

  // If Shields.io works, use that data
  if (stars !== null) {
    return {
      name: repo,
      description: '',
      stars: stars,
      forks: forks || fallback?.forks || 0,
      language: fallback?.language || '',
      topics: [],
      url: `https://github.com/${owner}/${repo}`,
      archived: false,
    };
  }

  // Try GitHub API as fallback
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const data = await fetchWithCache<any>(url);

  if (data) {
    return {
      name: data.name,
      description: data.description || '',
      stars: data.stargazers_count,
      forks: data.forks_count,
      language: data.language || '',
      topics: data.topics || [],
      url: data.html_url,
      archived: data.archived || false,
    };
  }

  // Use static fallback if all else fails
  if (fallback) {
    return {
      name: repo,
      description: '',
      stars: fallback.stars || 0,
      forks: fallback.forks || 0,
      language: fallback.language || '',
      topics: [],
      url: `https://github.com/${owner}/${repo}`,
      archived: false,
    };
  }

  return null;
}

export async function getLatestRelease(owner: string, repo: string): Promise<ReleaseInfo | null> {
  // Try Shields.io first for version
  const version = await getVersionFromShields(owner, repo);

  if (version) {
    return {
      tagName: version,
      name: version,
      publishedAt: '',
      url: `https://github.com/${owner}/${repo}/releases/latest`,
    };
  }

  // Fallback to GitHub API
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  const data = await fetchWithCache<any>(url);

  if (!data) return null;

  return {
    tagName: data.tag_name,
    name: data.name || data.tag_name,
    publishedAt: data.published_at,
    url: data.html_url,
  };
}

// Discord fallback data
const DISCORD_FALLBACK: DiscordInfo = {
  name: 'LiteLDev',
  memberCount: 3500, // Widget API doesn't provide total members, only online count
  onlineCount: 200,
  inviteUrl: 'https://discord.gg/v5R5P4vRZk',
};

// Fetch Discord server info using Widget API (supports CORS)
// Note: Widget API only provides online count (presence_count), not total member count
export async function getDiscordInfo(serverId: string = '849252980430864384'): Promise<DiscordInfo> {
  const widgetUrl = `https://discord.com/api/guilds/${serverId}/widget.json`;

  try {
    const data = await fetchWithCache<any>(widgetUrl, 3000);

    if (data && data.name) {
      return {
        name: data.name,
        // Widget API doesn't have total member count, use fallback
        memberCount: DISCORD_FALLBACK.memberCount,
        // presence_count is the online member count
        onlineCount: data.presence_count || DISCORD_FALLBACK.onlineCount,
        inviteUrl: data.instant_invite || DISCORD_FALLBACK.inviteUrl,
      };
    }
  } catch {
    // Widget might be disabled, use fallback
  }

  return DISCORD_FALLBACK;
}

// Fetch multiple repos in parallel
export async function getMultipleRepos(repos: { owner: string; repo: string }[]): Promise<Map<string, RepoInfo>> {
  const results = new Map<string, RepoInfo>();

  const promises = repos.map(async ({ owner, repo }) => {
    const info = await getRepoInfo(owner, repo);
    if (info) {
      results.set(repo.toLowerCase(), info);
    }
  });

  await Promise.all(promises);
  return results;
}

// Format star count (e.g., 1475 -> "1.5k")
export function formatStarCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

// Format date to relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
