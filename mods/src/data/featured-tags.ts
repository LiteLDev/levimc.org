// Tags as the listing shows and filters them (the shared contract's A4: the
// launchers mirror these tables and functions). The JSON carries a mod's tags
// as its manifest has them; only frontends normalise them, hide the loader and
// kind tags, and group a few common ones under the featured tags, each drawn
// with a sprite and a localised name.
import type { Labels, SpriteName } from "./sprites.ts";

export interface FeaturedTag {
  /** The tag itself, and the value of `tags=` that selects the group. */
  id: string;
  /** Other (normalised) tags that count as this one. */
  aliases: readonly string[];
  label: Labels;
  /** Its kit sprite (`kit/assets/sprites.mjs` key). */
  icon: SpriteName;
}

/** In the order filters and chips list them. */
export const FEATURED_TAGS: readonly FeaturedTag[] = [
  {
    id: "library",
    aliases: ["api", "modapi", "nativeapi", "event", "export", "form", "pland:library"],
    label: { en: "Library / API", "zh-CN": "前置库 / API", "zh-Hant": "前置庫 / API" },
    icon: "bookQuill",
  },
  {
    id: "utility",
    aliases: ["tools", "essential", "inventory", "waila", "info-display", "tooltip", "recipe-viewer", "item-list"],
    label: { en: "Utility", "zh-CN": "实用工具", "zh-Hant": "實用工具" },
    icon: "pickaxe",
  },
  {
    id: "management",
    aliases: ["backup", "ban", "whitelist", "login", "command", "land", "checkbag"],
    label: { en: "Server management", "zh-CN": "服务器管理", "zh-Hant": "伺服器管理" },
    icon: "apps",
  },
  {
    id: "game-mechanics",
    aliases: ["gameplay", "vanilla-plus", "achievement"],
    label: { en: "Game mechanics", "zh-CN": "游戏机制", "zh-Hant": "遊戲機制" },
    icon: "diamond",
  },
  {
    id: "adventure",
    aliases: ["worldgen", "terrain", "biome"],
    label: { en: "Content & adventure", "zh-CN": "内容与冒险", "zh-Hant": "內容與冒險" },
    icon: "compass",
  },
  {
    id: "visual",
    aliases: ["hud", "sidebar", "shader", "replay", "recording"],
    label: { en: "Visual & HUD", "zh-CN": "视觉与界面", "zh-Hant": "視覺與介面" },
    icon: "map",
  },
  {
    id: "economy",
    aliases: ["money"],
    label: { en: "Economy", "zh-CN": "经济", "zh-Hant": "經濟" },
    icon: "emerald",
  },
  {
    id: "teleport",
    aliases: ["tp", "waystones"],
    label: { en: "Teleport", "zh-CN": "传送", "zh-Hant": "傳送" },
    icon: "arrowRight",
  },
  {
    id: "anticheat",
    aliases: ["antixray"],
    label: { en: "Anti-cheat", "zh-CN": "反作弊", "zh-Hant": "反作弊" },
    icon: "tnt",
  },
  {
    id: "optimization",
    aliases: ["performance", "cleaner"],
    label: { en: "Optimization", "zh-CN": "性能优化", "zh-Hant": "效能優化" },
    icon: "potion",
  },
  {
    id: "bugfix",
    aliases: ["fix"],
    label: { en: "Bug fixes", "zh-CN": "错误修复", "zh-Hant": "錯誤修復" },
    icon: "bug",
  },
  {
    id: "technology",
    aliases: ["redstone", "piston", "automation"],
    label: { en: "Technical & redstone", "zh-CN": "技术与红石", "zh-Hant": "技術與紅石" },
    icon: "torch",
  },
  {
    id: "protocol",
    aliases: ["multiversion"],
    label: { en: "Protocol & multi-version", "zh-CN": "协议与多版本", "zh-Hant": "協議與多版本" },
    icon: "globe",
  },
];

export const FEATURED_BY_ID = new Map(FEATURED_TAGS.map((f) => [f.id, f]));

/** Featured id and alias → the featured tag. */
const GROUP = new Map<string, FeaturedTag>();
for (const f of FEATURED_TAGS) for (const tag of [f.id, ...f.aliases]) GROUP.set(tag, f);

/**
 * Tags nearly every mod carries, or that say what the side and the platform
 * already do (loader, kind, side): never shown or offered. `lse`, `quickjs`
 * and `nodejs` stay, as LSE plugins rarely declare their dependency on LSE.
 */
const HIDDEN = new Set(["levilamina", "ll", "mod", "plugin", "native", "client", "server", "minecraft-bedrock"]);
const HIDDEN_PREFIXES = ["platform:", "type:"];

/** A tag as the listing knows it: lower case, without a `category:` prefix (`category:Utility` → `utility`). */
export function normalizeTag(tag: string): string {
  const lower = tag.trim().toLowerCase();
  return lower.startsWith("category:") ? lower.slice("category:".length) : lower;
}

/** A normalised tag the listing never shows (see {@link HIDDEN}); an empty one too. */
export const isHiddenTag = (tag: string): boolean =>
  !tag || HIDDEN.has(tag) || HIDDEN_PREFIXES.some((prefix) => tag.startsWith(prefix));

/** A mod's tags as the listing shows them: normalised, hidden ones dropped, each once, in the manifest's order. */
export function visibleTags(tags: readonly string[]): string[] {
  return [...new Set(tags.map(normalizeTag))].filter((tag) => !isHiddenTag(tag));
}

/** The featured tag a tag (normalised or not) is or is an alias of. */
export const featuredOf = (tag: string): FeaturedTag | undefined => GROUP.get(normalizeTag(tag));

/**
 * The value a tag filters by: its featured tag's id when it is in a featured
 * group (`money` → `economy`), else the normalised tag; `null` for a hidden one.
 */
export function tagKey(tag: string): string | null {
  const normalized = normalizeTag(tag);
  if (isHiddenTag(normalized)) return null;
  return GROUP.get(normalized)?.id ?? normalized;
}

/** The filter values a mod's tags give (see {@link tagKey}), each once, in the manifest's order. */
export function tagKeys(tags: readonly string[]): string[] {
  return [...new Set(tags.map(tagKey).filter((key): key is string => key !== null))];
}

/**
 * The featured tags of a mod, in the table's order, each with the raw tags
 * that put it there (shown in grey beside its name: `Teleport [tp]`).
 */
export function featuredTagsOf(tags: readonly string[]): { tag: FeaturedTag; raw: string[] }[] {
  const raw = new Map<FeaturedTag, string[]>();
  for (const tag of visibleTags(tags)) {
    const f = GROUP.get(tag);
    if (f) raw.set(f, [...(raw.get(f) ?? []), tag]);
  }
  return FEATURED_TAGS.filter((f) => raw.has(f)).map((f) => ({ tag: f, raw: raw.get(f)! }));
}

/** A mod's visible tags that are in no featured group, in the manifest's order. */
export const plainTagsOf = (tags: readonly string[]): string[] => visibleTags(tags).filter((tag) => !GROUP.has(tag));

/** The mod has a featured tag (a covariate of the default order, see `lib/ranking.ts`). */
export const hasFeaturedTag = (tags: readonly string[]): boolean => tags.some((tag) => GROUP.has(normalizeTag(tag)));
