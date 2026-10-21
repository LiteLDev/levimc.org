// What a package is, for the listing's filters: its categories, platforms and
// environments. Categories and platforms come from lipr's tags alone (through
// the tag map in src/data/categories.ts), environments from the latest
// manifest. Nothing is curated by hand.
import { CATEGORIES, CATEGORY_BY_ID, type EnvId, type PlatformId } from "../data/categories.ts";
import type { ManifestVariant } from "../types";

export interface Facets {
  categories: string[];
  platforms: PlatformId[];
  lang?: string;
  env: EnvId[];
}

const TAG_CATEGORY = new Map<string, string>();
for (const c of CATEGORIES) for (const tag of c.tags) TAG_CATEGORY.set(tag, c.id);

const LSE_TAGS = new Set(["lse", "legacyscriptengine", "quickjs", "nodejs"]);

/** Categories from `category:<id>` tags (lipr's future convention), which win over everything else. */
function upstreamCategories(tags: readonly string[]): string[] {
  return tags
    .filter((t) => t.startsWith("category:"))
    .map((t) => t.slice("category:".length).toLowerCase())
    .filter((id) => CATEGORY_BY_ID.has(id));
}

/**
 * Where a package runs, from its manifest: files placed under `plugins/` are
 * for the dedicated server, under `mods/` for the LeviLamina client; a
 * `#client` dependency or a `client…` variant also means the client. Without a
 * manifest, the variant labels decide: `client…` → client, anything else →
 * server.
 */
export function deriveEnv(variants: readonly ManifestVariant[] | null, labels: readonly string[]): EnvId[] {
  const env = new Set<EnvId>();
  if (variants) {
    for (const v of variants) {
      if (v.label.toLowerCase().startsWith("client")) env.add("client");
      for (const dep of Object.keys(v.dependencies ?? {})) {
        if (dep.toLowerCase().endsWith("#client")) env.add("client");
      }
      for (const asset of v.assets ?? []) {
        for (const p of asset.placements ?? []) {
          const dest = (p.dest ?? "").replace(/^\.?\/+/, "").toLowerCase();
          if (dest.startsWith("plugins/")) env.add("server");
          else if (dest.startsWith("mods/")) env.add("client");
        }
      }
    }
  } else {
    for (const label of labels) env.add(label.toLowerCase().startsWith("client") ? "client" : "server");
  }
  return (["server", "client"] as const).filter((e) => env.has(e));
}

/** Platforms from raw tags. */
function tagPlatforms(tags: readonly string[]): { platforms: PlatformId[]; lang?: string } {
  const set = new Set(tags.map((t) => t.toLowerCase()));
  const platforms: PlatformId[] = [];
  let lang: string | undefined;
  if ([...set].some((t) => LSE_TAGS.has(t))) {
    platforms.push("lse");
    lang = set.has("nodejs") ? "nodejs" : "js";
  } else if (set.has("lualoader")) {
    platforms.push("other");
  } else {
    platforms.push("levilamina");
  }
  if (set.has("platform:endstone")) platforms.push("endstone");
  return { platforms, lang };
}

/**
 * The facets of one package. `category:` tags win over the tag map;
 * platforms come from the tags; environments from the manifest (see
 * {@link deriveEnv}).
 */
export function deriveFacets(input: {
  tags: readonly string[];
  manifestVariants: readonly ManifestVariant[] | null;
  labels: readonly string[];
}): Facets {
  const { tags } = input;
  let categories = upstreamCategories(tags);
  if (!categories.length) {
    categories = [...new Set(tags.map((t) => TAG_CATEGORY.get(t.toLowerCase())).filter((c): c is string => !!c))];
  }
  const { platforms, lang } = tagPlatforms(tags);
  const env = deriveEnv(input.manifestVariants, input.labels);
  return { categories, platforms, ...(lang && platforms.includes("lse") ? { lang } : {}), env };
}
