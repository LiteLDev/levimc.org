// Package icons are whatever a manifest's `avatar_url` says, and many of
// those no longer load: template placeholders on example.com, deleted files,
// GitHub pages instead of images. The build tries each one once; a package
// whose icon does not load as an image shows its owner's GitHub avatar
// instead, so no visitor waits for a request that is bound to fail.
const TIMEOUT = 10_000;
const MAX_BYTES = 1024 * 1024;
const CONCURRENCY = 8;

async function loads(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { "User-Agent": "pkg.levimc.org-build" },
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) {
      await res.body?.cancel();
      return false;
    }
    const body = await res.arrayBuffer();
    return body.byteLength > 0 && body.byteLength <= MAX_BYTES;
  } catch {
    return false;
  }
}

/** The URLs among `urls` that load as an image (at most 1 MB). */
export async function checkIcons(urls: Iterable<string>): Promise<Set<string>> {
  const queue = [...new Set(urls)].filter((u) => /^https:\/\//i.test(u));
  const ok = new Set<string>();
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let url = queue.shift(); url; url = queue.shift()) {
        if (await loads(url)) ok.add(url);
      }
    }),
  );
  return ok;
}

