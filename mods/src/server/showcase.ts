// A mod's gallery: `docs/showcase/showcase.json` on its repository's default
// branch, and the files it lists. The build copies the files into the site
// (`/mods/showcase/<owner>/<repo>/<file>`), so videos and SVGs are served with
// the right types and the gallery never depends on another host at view time.
// The gallery is not tied to a version: it shows the mod as it is today.
//
// The manifest is third-party input: anything that does not match the shape
// below, is too large, is not the file type it claims, or is an SVG that could
// run script when opened on its own is left out (and the build log says why).
import type { LocalizedText, ShowcaseItem } from "../types";
import { BASE } from "../base-path.ts";

const GITHUB_REPO = /^https:\/\/github\.com\/([^/]+\/[^/]+?)\/?$/i;
const TIMEOUT = 20_000;
const MAX_ITEMS = 24;
const MAX_FILE = 8 * 1024 * 1024;
const MAX_TOTAL = 30 * 1024 * 1024;
const FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

function ascii(b: Uint8Array, from: number, to: number): string {
  return String.fromCharCode(...b.subarray(from, to));
}

/**
 * The site serves these files from levimc.org itself, and an SVG opened on
 * its own runs as a page there: only plain drawings and their animations pass.
 */
export function safeSvg(text: string): boolean {
  if (!/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(text)) return false;
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) return false;
  if (/<\s*(script|foreignObject|iframe|object|embed|a|handler|listener)[\s/>]/i.test(text)) return false;
  if (/\son[a-z]+\s*=/i.test(text)) return false;
  // embedded sprites (`<image href="data:image/png;base64,…">`) and in-document references are fine; nothing else may point anywhere
  const rest = text
    .replace(/xmlns(:\w+)?="[^"]*"/g, "")
    .replace(/(href|xlink:href)="data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/=\s]*"/g, "")
    .replace(/(href|xlink:href)="#[\w.-]+"/g, "");
  if (/(href|xlink:href)\s*=/i.test(rest) || /(javascript|data|https?):/i.test(rest)) return false;
  if (/@import|url\(\s*['"]?(?!#)/i.test(rest)) return false;
  return true;
}

const TYPES: Record<string, { mime: string; check: (b: Uint8Array) => boolean }> = {
  webp: { mime: "image/webp", check: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP" },
  png: { mime: "image/png", check: (b) => b[0] === 0x89 && ascii(b, 1, 4) === "PNG" },
  jpg: { mime: "image/jpeg", check: (b) => b[0] === 0xff && b[1] === 0xd8 },
  jpeg: { mime: "image/jpeg", check: (b) => b[0] === 0xff && b[1] === 0xd8 },
  mp4: { mime: "video/mp4", check: (b) => ascii(b, 4, 8) === "ftyp" },
  webm: { mime: "video/webm", check: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3 },
  svg: { mime: "image/svg+xml", check: (b) => safeSvg(new TextDecoder().decode(b)) },
};
const KIND_EXT: Record<ShowcaseItem["kind"], string[]> = {
  image: ["webp", "png", "jpg", "jpeg"],
  video: ["mp4", "webm"],
  svg: ["svg"],
};

function localized(value: unknown): LocalizedText | null {
  if (typeof value === "string" && value.trim()) return { en: value.trim().slice(0, 300) };
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.en !== "string" || !v.en.trim()) return null;
  const out: LocalizedText = { en: v.en.trim().slice(0, 300) };
  for (const key of ["zh-CN", "zh-HK"] as const) {
    const s = v[key];
    if (typeof s === "string" && s.trim()) out[key] = s.trim().slice(0, 300);
  }
  return out;
}

function dimension(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 8192 ? value : null;
}

async function fetchBytes(url: string, limit: number): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT), headers: { "User-Agent": "levimc.org-mods-build" } });
    if (!res.ok || Number(res.headers.get("content-length") ?? 0) > limit) {
      await res.body?.cancel();
      return null;
    }
    const body = new Uint8Array(await res.arrayBuffer());
    return body.byteLength > 0 && body.byteLength <= limit ? body : null;
  } catch {
    return null;
  }
}

/** Files of every gallery the build loaded: path under BASE → body and type. */
const files = new Map<string, { body: Uint8Array; type: string }>();
const galleries = new Map<string, Promise<ShowcaseItem[]>>();

/** The gallery files, for prerender.mjs to write into dist/ and the dev server to serve. */
export function showcaseFiles(): ReadonlyMap<string, { body: Uint8Array; type: string }> {
  return files;
}

/** A mod's gallery (empty when it has none, or none of it is usable). Loaded once per repository. */
export function loadShowcase(repository: string): Promise<ShowcaseItem[]> {
  let gallery = galleries.get(repository);
  if (!gallery) {
    gallery = load(repository);
    galleries.set(repository, gallery);
  }
  return gallery;
}

async function load(repository: string): Promise<ShowcaseItem[]> {
  const repo = GITHUB_REPO.exec(repository)?.[1];
  if (!repo) return [];
  const raw = `https://raw.githubusercontent.com/${repo}/HEAD/docs/showcase/`;
  const manifest = await fetchBytes(`${raw}showcase.json`, 256 * 1024);
  if (!manifest) return [];

  const log = (why: string) => console.log(`showcase: ${repo}: ${why}`);
  let list: unknown;
  try {
    list = (JSON.parse(new TextDecoder().decode(manifest)) as { items?: unknown })?.items;
  } catch {
    log("showcase.json is not JSON");
    return [];
  }
  if (!Array.isArray(list)) {
    log("showcase.json has no items");
    return [];
  }

  const dir = `showcase/${repo}/`;
  let total = 0;
  const fetched = new Map<string, Promise<boolean>>();
  const fetchFile = (name: string, exts: string[]): Promise<boolean> => {
    const ext = name.split(".").at(-1)?.toLowerCase() ?? "";
    if (!FILE_NAME.test(name) || !exts.includes(ext)) return Promise.resolve(false);
    let ok = fetched.get(name);
    if (!ok) {
      ok = fetchBytes(raw + name, MAX_FILE).then((body) => {
        if (!body || !TYPES[ext]!.check(body) || total + body.byteLength > MAX_TOTAL) return false;
        total += body.byteLength;
        files.set(dir + name, { body, type: TYPES[ext]!.mime });
        return true;
      });
      fetched.set(name, ok);
    }
    return ok;
  };

  const items: ShowcaseItem[] = [];
  for (const [i, value] of list.slice(0, MAX_ITEMS).entries()) {
    const v = (value ?? {}) as Record<string, unknown>;
    const kind = v.kind;
    const title = localized(v.title);
    const width = dimension(v.width);
    const height = dimension(v.height);
    if ((kind !== "image" && kind !== "video" && kind !== "svg") || typeof v.src !== "string" || !title || !width || !height) {
      log(`item ${i + 1} does not match the format`);
      continue;
    }
    if (!(await fetchFile(v.src, KIND_EXT[kind]))) {
      log(`${v.src}: missing, too large, or not a usable ${kind}`);
      continue;
    }
    const poster =
      kind === "video" && typeof v.poster === "string" && (await fetchFile(v.poster, KIND_EXT.image))
        ? `${BASE}${dir}${v.poster}`
        : undefined;
    const caption = localized(v.caption);
    items.push({
      kind,
      src: `${BASE}${dir}${v.src}`,
      ...(poster ? { poster } : {}),
      width,
      height,
      title,
      ...(caption ? { caption } : {}),
    });
  }
  log(`${items.length} items, ${(total / 1024 / 1024).toFixed(1)} MB`);
  return items;
}
