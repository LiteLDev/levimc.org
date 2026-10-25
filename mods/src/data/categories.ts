// Facet vocabularies: categories, platforms and environments, with their labels
// in the site's languages and the kit sprite each one is drawn with. The ids are
// the values of the listing's `cat=`, `platform=` and `env=` query parameters.
import type { Locale } from "../locales.ts";

/** A kit sprite that `styles.css` provides as a CSS background (`.mods-sprite-<name>`). */
export type SpriteName =
  | "apps"
  | "pickaxe"
  | "diamond"
  | "map"
  | "bookQuill"
  | "hash"
  | "torch"
  | "quote"
  | "bug"
  | "potion"
  | "tnt"
  | "compass"
  | "globe"
  | "emerald"
  | "grass"
  | "paper"
  | "chest"
  | "menu"
  | "monitor"
  | "clock"
  | "heart"
  | "history"
  | "moon";

type Labels = Record<Locale, string>;

export interface CategoryDef {
  id: string;
  label: Labels;
  icon: SpriteName;
  /** Raw lipr tags (lower case) that put a mod in this category. */
  tags: string[];
}

/** In the sidebar's default order; the sidebar sorts by count. */
export const CATEGORIES: readonly CategoryDef[] = [
  {
    id: "management",
    label: { en: "Server management", "zh-CN": "服务器管理", "zh-Hant": "伺服器管理" },
    icon: "apps",
    tags: ["backup", "easybackuper", "ezbackuper", "whitelist", "ban", "login", "command", "stop", "checkbag", "land", "addon"],
  },
  {
    id: "utility",
    label: { en: "Utility", "zh-CN": "实用工具", "zh-Hant": "實用工具" },
    icon: "pickaxe",
    tags: ["tools", "inventory", "essential", "tp", "levitpsystem", "waila", "info-display", "collection", "custommap", "building", "nbs", "noteblock", "music"],
  },
  {
    id: "game-mechanics",
    label: { en: "Game mechanics", "zh-CN": "游戏机制", "zh-Hant": "遊戲機制" },
    icon: "diamond",
    tags: ["achievement", "netherheight", "mine2"],
  },
  {
    id: "visual",
    label: { en: "Visual & HUD", "zh-CN": "视觉与界面", "zh-Hant": "視覺與介面" },
    icon: "map",
    tags: ["sidebar", "hud", "replay", "recording", "camera-editor", "video-export"],
  },
  {
    id: "library",
    label: { en: "Library / API", "zh-CN": "前置库", "zh-Hant": "前置庫" },
    icon: "bookQuill",
    tags: ["type:library", "library", "pland:library", "modapi", "event", "nativeapi", "export", "form"],
  },
  {
    id: "developer",
    label: { en: "Developer tools", "zh-CN": "开发工具", "zh-Hant": "開發工具" },
    icon: "hash",
    tags: ["contentlog"],
  },
  {
    id: "technology",
    label: { en: "Technical & redstone", "zh-CN": "技术与红石", "zh-Hant": "技術與紅石" },
    icon: "torch",
    tags: ["redstone", "piston"],
  },
  {
    id: "social",
    label: { en: "Chat & social", "zh-CN": "社交", "zh-Hant": "社交" },
    icon: "quote",
    tags: ["welcome"],
  },
  {
    id: "bugfix",
    label: { en: "Bug fixes", "zh-CN": "漏洞修复", "zh-Hant": "漏洞修復" },
    icon: "bug",
    tags: ["fix"],
  },
  {
    id: "optimization",
    label: { en: "Optimization", "zh-CN": "性能优化", "zh-Hant": "效能優化" },
    icon: "potion",
    tags: ["cleaner"],
  },
  {
    id: "anticheat",
    label: { en: "Anti-cheat", "zh-CN": "反作弊", "zh-Hant": "反作弊" },
    icon: "tnt",
    tags: ["anticheat", "antixray"],
  },
  {
    id: "adventure",
    label: { en: "Content & adventure", "zh-CN": "内容与冒险", "zh-Hant": "內容與冒險" },
    icon: "compass",
    tags: ["worldgen", "terrain"],
  },
  {
    id: "protocol",
    label: { en: "Protocol & multi-version", "zh-CN": "协议与多版本", "zh-Hant": "協議與多版本" },
    icon: "globe",
    tags: ["protocol", "multiversion"],
  },
  {
    id: "economy",
    label: { en: "Economy", "zh-CN": "经济", "zh-Hant": "經濟" },
    icon: "emerald",
    tags: ["economy", "money"],
  },
];

export type PlatformId = "levilamina" | "lse" | "endstone" | "other";
export type BadgeTone = "grass" | "gold" | "enchant" | "stone";

export interface PlatformDef {
  id: PlatformId;
  label: Labels;
  /** Short chip label. */
  short: string;
  tone: BadgeTone;
  icon: SpriteName;
}

export const PLATFORMS: readonly PlatformDef[] = [
  {
    id: "levilamina",
    label: { en: "LeviLamina", "zh-CN": "LeviLamina", "zh-Hant": "LeviLamina" },
    short: "LeviLamina",
    tone: "grass",
    icon: "grass",
  },
  {
    id: "lse",
    label: { en: "LegacyScriptEngine", "zh-CN": "LegacyScriptEngine", "zh-Hant": "LegacyScriptEngine" },
    short: "LSE",
    tone: "gold",
    icon: "paper",
  },
  {
    id: "endstone",
    label: { en: "Endstone", "zh-CN": "Endstone", "zh-Hant": "Endstone" },
    short: "Endstone",
    tone: "enchant",
    icon: "moon",
  },
  {
    id: "other",
    label: { en: "Other loaders", "zh-CN": "其他加载器", "zh-Hant": "其他載入器" },
    short: "Other",
    tone: "stone",
    icon: "chest",
  },
];

export type EnvId = "server" | "client";

export interface EnvDef {
  id: EnvId;
  label: Labels;
  icon: SpriteName;
}

export const ENVIRONMENTS: readonly EnvDef[] = [
  { id: "server", label: { en: "Server", "zh-CN": "服务端", "zh-Hant": "伺服器端" }, icon: "menu" },
  { id: "client", label: { en: "Client", "zh-CN": "客户端", "zh-Hant": "用戶端" }, icon: "monitor" },
];

/** The language an LSE plugin is written for, shown as "LSE · Node.js". */
export const LSE_LANGUAGES: Record<string, string> = { js: "JS", nodejs: "Node.js" };

export const CATEGORY_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));
export const PLATFORM_BY_ID = new Map(PLATFORMS.map((p) => [p.id, p]));
export const ENV_BY_ID = new Map(ENVIRONMENTS.map((e) => [e.id, e]));
