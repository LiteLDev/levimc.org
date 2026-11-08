// Mod icons are whatever a manifest's `avatar_url` says, and many of
// those no longer load: template placeholders on example.com, deleted files,
// GitHub pages instead of images. The build tries each one once; a mod
// whose icon does not load as an image shows its owner's GitHub avatar
// instead, so no visitor waits for a request that is bound to fail.
//
// An icon that loads is also scaled down here, since the build has its bytes
// anyway: manifests point at full-size artwork (up to 1 MB for a 72 px
// slot), so the site serves it as WebP at the widths the pages show it at
// (`ICON_WIDTHS`, /mods/icons/<hash>-<width>.webp, see project-icon.tsx).
// Where it cannot be converted (sharp missing, an image it cannot read), the
// page loads the original as before.
import { createHash } from "node:crypto";
import { ICON_WIDTHS } from "../lib/mods";

const TIMEOUT = 10_000;
const MAX_BYTES = 1024 * 1024;
const CONCURRENCY = 8;

/** The scaled icons, by their path under the site (`icons/<hash>-<width>.webp`), for prerender.mjs. */
const files = new Map<string, Buffer>();

export function iconFiles(): ReadonlyMap<string, Buffer> {
  return files;
}

async function download(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { "User-Agent": "levimc.org-mods-build" },
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) {
      await res.body?.cancel();
      return null;
    }
    const body = Buffer.from(await res.arrayBuffer());
    return body.byteLength > 0 && body.byteLength <= MAX_BYTES ? body : null;
  } catch {
    return null;
  }
}

type Sharp = typeof import("sharp");
let sharpModule: Promise<Sharp | null> | undefined;

/** sharp, if it is installed (a devDependency); without it icons are served as published. */
function loadSharp(): Promise<Sharp | null> {
  sharpModule ??= import("sharp").then(
    (m) => (m as unknown as { default: Sharp }).default ?? m,
    () => {
      console.warn("icons: sharp is not available, mod icons are served at their original size");
      return null;
    },
  );
  return sharpModule;
}

/** Writes the icon's scaled files; returns their id (the hash of the original), or undefined if it cannot be read. */
async function scale(body: Buffer): Promise<string | undefined> {
  const sharp = await loadSharp();
  if (!sharp) return undefined;
  const id = createHash("sha256").update(body).digest("hex").slice(0, 16);
  if (files.has(`icons/${id}-${ICON_WIDTHS[0]}.webp`)) return id;
  try {
    const scaled = await Promise.all(
      ICON_WIDTHS.map((width) =>
        sharp(body, { animated: false, limitInputPixels: 64_000_000 })
          // the slots are square and crop with object-fit: cover; a small icon is not enlarged
          .resize(width, width, { fit: "cover", withoutEnlargement: true })
          .webp({ quality: 82, effort: 5 })
          .toBuffer(),
      ),
    );
    ICON_WIDTHS.forEach((width, i) => files.set(`icons/${id}-${width}.webp`, scaled[i]!));
    return id;
  } catch {
    return undefined;
  }
}

export interface IconCheck {
  /** The scaled files' id, when the icon could be converted. */
  id?: string;
}

/** The URLs among `urls` that load as an image (at most 1 MB), each with its scaled files' id when converted. */
export async function checkIcons(urls: Iterable<string>): Promise<Map<string, IconCheck>> {
  const queue = [...new Set(urls)].filter((u) => /^https:\/\//i.test(u));
  const ok = new Map<string, IconCheck>();
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let url = queue.shift(); url; url = queue.shift()) {
        const body = await download(url);
        if (!body) continue;
        const id = await scale(body);
        ok.set(url, id ? { id } : {});
      }
    }),
  );
  const bytes = [...files.values()].reduce((n, b) => n + b.byteLength, 0);
  console.log(`icons: ${[...ok.values()].filter((c) => c.id).length} of ${ok.size} scaled to ${ICON_WIDTHS.join("/")} px WebP (${(bytes / 1024).toFixed(0)} KB in all)`);
  return ok;
}
