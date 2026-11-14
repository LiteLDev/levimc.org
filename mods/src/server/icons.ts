// Mod icons are whatever a manifest's `avatar_url` says, and many of
// those no longer load: template placeholders on example.com, deleted files,
// GitHub pages instead of images. The build tries each one once; a mod
// whose icon does not load as an image gets a generated one instead (see
// `generateLogos` and `server/logo-art.ts`), so no visitor waits for a
// request that is bound to fail.
//
// An icon that loads is also scaled down here, since the build has its bytes
// anyway: manifests point at full-size artwork (up to 1 MB for a 72 px
// slot), so the site serves it as WebP at the widths the pages show it at
// (`ICON_WIDTHS`, /mods/icons/<hash>-<width>.webp, see project-icon.tsx).
// Where it cannot be converted (sharp missing, an image it cannot read), the
// page loads the original as before.
import { createHash } from "node:crypto";
import { ICON_WIDTHS, ownerAvatar } from "../lib/mods";
import { catalogPlans, logoSvg, type LogoInput } from "./logo-art";

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

const AVATAR_SIZE = 152;

/** The owner's GitHub avatar as a PNG `data:` URL, for the badge of a generated logo; undefined when it does not load. */
async function avatarDataUrl(sharp: Sharp, owner: string): Promise<string | undefined> {
  const body = await download(ownerAvatar(owner, AVATAR_SIZE));
  if (!body) return undefined;
  try {
    const png = await sharp(body, { animated: false }).resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return undefined;
  }
}

/**
 * Logos for the mods that have none that loads (`server/logo-art.ts`),
 * scaled like any other icon: each mod's key → its scaled files' id. Empty
 * without sharp (the pages then show the pixel chest). The owner's avatar,
 * on the logo's badge, is downloaded here, once per owner.
 */
export async function generateLogos(mods: ReadonlyMap<string, Omit<LogoInput, "avatar">>): Promise<Map<string, string>> {
  const sharp = await loadSharp();
  const ids = new Map<string, string>();
  if (!sharp || mods.size === 0) return ids;
  const avatars = new Map<string, Promise<string | undefined>>();
  const avatar = (owner: string) => {
    const key = owner.toLowerCase();
    if (!avatars.has(key)) avatars.set(key, avatarDataUrl(sharp, owner));
    return avatars.get(key)!;
  };
  // each mod's choices, unlike every other's where they can be
  const plans = catalogPlans([...mods.values()]);
  const queue = [...mods];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        const [key, mod] = next;
        try {
          const svg = logoSvg({ ...mod, avatar: await avatar(mod.owner) }, plans.get(mod.id));
          const png = await sharp(Buffer.from(svg)).png().toBuffer();
          const id = await scale(png);
          if (id) ids.set(key, id);
        } catch (error) {
          console.warn(`icons: no logo generated for ${key}: ${String(error)}`);
        }
      }
    }),
  );
  console.log(`icons: ${ids.size} of ${mods.size} logos generated (${[...avatars.values()].length} avatars)`);
  return ids;
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
