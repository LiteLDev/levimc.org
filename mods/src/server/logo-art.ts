// A logo for a mod that has none of its own, drawn at build time (see
// `server/icons.ts` generateLogos, which rasterises it like any other icon).
//
// A 288 px square in the manner of the logos mods ship (isometric blocks,
// game items): a small vector scene of textured blocks under a sky, with an
// emblem for what the mod is about, and the author's GitHub avatar as a round
// badge in the bottom-right corner. No text: the name is next to the logo
// wherever it is shown.
//
// What it is about picks the topic, which gives the emblem's icon (a Lucide
// icon, https://lucide.dev, `lucide-static`: an economy mod gets coins, a
// wallet, a piggy bank…) and the materials that suit it (gold, quartz,
// planks…). Everything else is one choice per dimension, seeded by the mod's
// id, so the same mod always gets the same logo and mods on the same topic
// still differ:
//   - the block that carries the emblem, and what the others are made of;
//   - the layout: one block, two side by side, a tower, steps, a corner, a platform; floating or on the ground;
//   - the emblem: on a plate on the block's face, in a coin floating above it, or as a hologram over it;
//   - the sky: day, dusk, night, a studio light or pastel; and what is in the air (sparkles, motes, small cubes).
// `logoPlan` takes a salt, so a catalogue can draw again a mod whose plan
// another mod already has (see catalogPlans).
import iconNodes from "lucide-static/icon-nodes.json" with { type: "json" };

type IconNode = [tag: string, attrs: Record<string, string | number>][];
const ICONS = iconNodes as unknown as Record<string, IconNode>;

export interface LogoInput {
  /** The mod's id (`github.com/<owner>/<repo>`): seeds every choice. */
  id: string;
  name: string;
  description: string;
  tags: readonly string[];
  owner: string;
  /** The owner's avatar as a `data:` URL; without it the badge shows a person glyph. */
  avatar?: string;
}

export const LOGO_SIZE = 288;

// ---------------------------------------------------------------------------
// Seeded randomness
// ---------------------------------------------------------------------------

/** FNV-1a, 32 bits. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32. */
function random(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(rand: () => number, list: readonly T[]): T => list[Math.floor(rand() * list.length)]!;

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

export interface Topic {
  key: string;
  /** Lucide icon names; one is picked per mod. */
  icons: readonly string[];
  /** The palette's starting hue. */
  hue: number;
  /**
   * What a mod on it says. Latin words match whole words (and their plurals,
   * `-ing`, `-er`, `-ed` forms) of the camelCase-split text, so `tp` does not
   * match "http"; anything else (Chinese) matches anywhere.
   */
  words: readonly string[];
}

export const TOPICS: readonly Topic[] = [
  { key: "economy", hue: 42, icons: ["coins", "wallet", "banknote", "piggy-bank", "hand-coins", "badge-dollar-sign"], words: ["money", "economy", "economic", "shop", "trade", "coin", "bank", "currency", "经济", "货币", "金币", "商店", "交易"] },
  { key: "rank", hue: 48, icons: ["crown", "award", "medal", "trophy", "gem"], words: ["rank", "privilege", "vip", "title", "level", "称号", "等级", "权限"] },
  { key: "teleport", hue: 192, icons: ["compass", "navigation", "map-pin", "route", "locate", "signpost"], words: ["teleport", "tp", "tpa", "rtp", "warp", "home", "waypoint", "navigation", "传送", "导航", "家园"] },
  { key: "map", hue: 160, icons: ["map", "earth", "mountain", "map-pinned"], words: ["map", "world", "terrain", "nether", "dimension", "height", "地图", "世界", "维度"] },
  { key: "structure", hue: 28, icons: ["box", "boxes", "cuboid", "layout-grid", "ruler", "blocks"], words: ["structure", "structural", "schematic", "holo", "hologram", "build", "building", "shift", "投影", "结构", "建筑"] },
  { key: "storage", hue: 215, icons: ["database", "hard-drive", "server", "cylinder"], words: ["storage", "database", "leveldb", "rocksdb", "sql", "sqlite", "mysql", "数据库", "存储"] },
  { key: "inventory", hue: 30, icons: ["backpack", "package", "package-open", "briefcase", "archive"], words: ["inventory", "item", "bag", "checkbag", "shulker", "sort", "loot", "container", "hidden", "物品", "背包", "收纳"] },
  { key: "backup", hue: 205, icons: ["archive-restore", "save", "undo-2", "hard-drive-download", "clock-arrow-down"], words: ["backup", "rollback", "restore", "undo", "snapshot", "备份", "回档"] },
  { key: "mining", hue: 24, icons: ["pickaxe", "hammer", "axe", "drill"], words: ["mine", "miner", "ore", "dig", "breaker", "chop", "采集", "挖掘", "连锁"] },
  { key: "security", hue: 220, icons: ["shield", "shield-check", "shield-alert", "scan-eye", "lock"], words: ["anticheat", "cheat", "protect", "protection", "security", "secure", "反作弊", "保护", "安全"] },
  { key: "moderation", hue: 355, icons: ["gavel", "ban", "user-x", "shield-ban", "octagon-x"], words: ["ban", "blacklist", "whitelist", "moderation", "punish", "kick", "mute", "封禁", "黑名单", "白名单"] },
  { key: "cleaner", hue: 175, icons: ["sparkles", "wind", "trash", "brush-cleaning"], words: ["cleaner", "clean", "cleanup", "clear", "清理", "扫地"] },
  { key: "fire", hue: 14, icons: ["flame", "bomb", "zap"], words: ["fireball", "fire", "explosion", "explode", "tnt", "火球", "爆炸"] },
  { key: "fix", hue: 140, icons: ["bug", "bug-off", "wrench", "bandage"], words: ["fix", "bug", "patch", "bugfix", "exploit", "dupe", "tweak", "tweaks", "修复", "漏洞", "刷物品"] },
  { key: "performance", hue: 265, icons: ["gauge", "zap", "rocket", "timer", "activity"], words: ["performance", "optimization", "optimize", "optimise", "fast", "speed", "lag", "tps", "性能", "优化", "高性能"] },
  { key: "network", hue: 200, icons: ["globe", "network", "radio-tower", "router", "cable", "wifi"], words: ["protocol", "network", "websocket", "ws", "rcon", "bridge", "proxy", "http", "web", "packet", "backend", "handoff", "cross", "crossbind", "国际服", "跨服", "网络", "协议"] },
  { key: "geo", hue: 185, icons: ["earth", "map-pinned", "locate"], words: ["ip", "isp", "address", "region", "geo", "geoip", "地理", "地址"] },
  { key: "script", hue: 250, icons: ["code", "braces", "file-code", "square-terminal", "scroll-text"], words: ["script", "scripting", "engine", "lse", "llse", "quickjs", "js", "javascript", "lua", "python", "nodejs", "脚本", "引擎"] },
  { key: "loader", hue: 280, icons: ["plug-zap", "puzzle", "cpu", "blocks"], words: ["loader", "rust", "abi", "clr", "dotnet", "native", "托管", "加载器"] },
  { key: "library", hue: 230, icons: ["library", "layers", "blocks", "puzzle", "component", "boxes"], words: ["library", "lib", "api", "framework", "sdk", "modapi", "wrapper", "placeholder", "collection", "toolkit", "前置", "框架", "插件集", "开发"] },
  { key: "chat", hue: 205, icons: ["message-circle", "messages-square", "megaphone", "mic"], words: ["chat", "message", "messages", "speech", "voice", "broadcast", "announcement", "notice", "聊天", "语音", "消息", "公告"] },
  { key: "text", hue: 300, icons: ["languages", "type", "tag", "sticker"], words: ["multilingual", "translation", "i18n", "nametag", "name", "text", "命名牌", "多语言"] },
  { key: "ui", hue: 255, icons: ["panel-right", "layout-dashboard", "app-window", "sliders-horizontal"], words: ["sidebar", "ui", "gui", "hud", "oreui", "frontend", "front", "form", "menu", "scoreboard", "界面", "侧边栏", "菜单"] },
  { key: "camera", hue: 320, icons: ["camera", "video", "zoom-in", "focus", "eye", "aperture"], words: ["camera", "freecam", "zoom", "view", "preview", "peek", "perspective", "视角", "相机"] },
  { key: "debug", hue: 160, icons: ["scan-search", "chart-line", "activity", "info"], words: ["debug", "f3", "waila", "inspect", "highlight", "高亮", "调试"] },
  { key: "screen", hue: 235, icons: ["monitor", "columns-2", "gamepad-2"], words: ["split", "screen", "controller", "client", "客户端", "分屏"] },
  { key: "light", hue: 45, icons: ["lightbulb", "flashlight", "lamp", "sun"], words: ["light", "lights", "lighting", "glow", "光源", "照明"] },
  { key: "render", hue: 290, icons: ["palette", "aperture", "paintbrush", "wand-sparkles", "sun"], words: ["shader", "render", "renderdragon", "visual", "visuals", "vibrant", "graphics", "rtx", "渲染", "光影", "画质"] },
  { key: "night", hue: 245, icons: ["moon", "moon-star", "bed"], words: ["night", "sleep", "bed", "夜晚", "睡觉"] },
  { key: "death", hue: 345, icons: ["skull", "heart-pulse", "heart"], words: ["death", "die", "kill", "health", "死亡", "生命"] },
  { key: "player", hue: 330, icons: ["user-round", "users", "id-card", "user-cog"], words: ["player", "players", "account", "profile", "skin", "玩家", "账号", "角色"] },
  { key: "scale", hue: 180, icons: ["scaling", "maximize-2", "move-diagonal", "ruler"], words: ["scale", "size", "resize", "缩放", "大小"] },
  { key: "magic", hue: 275, icons: ["wand-sparkles", "sparkles", "flask-conical", "gem"], words: ["enchant", "enchantment", "magic", "effect", "potion", "buff", "附魔", "药水", "效果"] },
  { key: "farm", hue: 105, icons: ["sprout", "wheat", "leaf", "trees", "tractor", "cherry"], words: ["farm", "farmer", "farming", "crop", "nature", "plant", "tree", "food", "cook", "delight", "农场", "种植", "食物"] },
  { key: "land", hue: 95, icons: ["land-plot", "fence", "flag", "map-pinned"], words: ["land", "pland", "claim", "territory", "residence", "plot", "领地", "领域"] },
  { key: "command", hue: 210, icons: ["terminal", "square-terminal", "command"], words: ["command", "commands", "cmd", "指令", "命令"] },
  { key: "registry", hue: 190, icons: ["tags", "tag", "hash", "list-tree"], words: ["tag", "tags", "registry", "data", "driven", "注册"] },
  { key: "search", hue: 200, icons: ["search", "scan-search", "clipboard-check", "list-checks"], words: ["check", "inspect", "query", "lookup", "search", "find", "查询", "检查"] },
  { key: "log", hue: 35, icons: ["scroll-text", "notebook-pen", "file-clock"], words: ["log", "logger", "record", "history", "日志", "记录"] },
  { key: "music", hue: 315, icons: ["eighth-notes", "keyboard-music", "list-music", "audio-lines"], words: ["music", "song", "songs", "note", "notes", "sound", "audio", "noteblock", "音乐"] },
  { key: "fishing", hue: 195, icons: ["fish", "fish-symbol", "anchor", "sailboat"], words: ["fish", "fishing", "autofish", "钓鱼"] },
  { key: "machine", hue: 30, icons: ["cog", "settings-2", "workflow", "factory", "bot"], words: ["automation", "automatic", "auto", "mechanic", "mechanics", "machine", "machines", "contraption", "rotational", "technology", "bot", "机械", "自动"] },
  { key: "event", hue: 260, icons: ["radio", "ear", "bell-ring", "activity"], words: ["event", "events", "listen", "listener", "hook", "hooks", "事件", "监听"] },
  { key: "power", hue: 0, icons: ["power", "server-cog", "server"], words: ["stop", "shutdown", "restart", "关服", "重启"] },
  { key: "shape", hue: 170, icons: ["shapes", "triangle", "pentagon", "hexagon"], words: ["shape", "shapes", "geometry", "draw", "particle", "particles", "形状"] },
  { key: "crypto", hue: 150, icons: ["lock-keyhole", "key-round", "file-lock"], words: ["encryption", "encrypt", "encrypted", "key", "signature", "verify", "加密", "签名"] },
  { key: "compat", hue: 210, icons: ["arrow-left-right", "repeat", "merge", "unplug"], words: ["compatibility", "compat", "version", "versions", "translate", "translating", "兼容"] },
  { key: "pack", hue: 300, icons: ["package", "file-lock", "layers"], words: ["resource", "resourcepack", "pack", "addon", "资源包"] },
];

/** A mod that says nothing a topic knows: icons that suit anything. */
const GENERAL: Topic = {
  key: "general",
  hue: 0,
  icons: ["sparkles", "gem", "rocket", "puzzle", "hexagon", "star", "atom", "orbit", "feather", "shapes", "box", "sparkle", "telescope", "shell", "snowflake", "clover"],
  words: [],
};

/** Tags every mod has, which say nothing about it. */
const NOISE_TAG = /^(type:(mod|plugin|client)|platform:.*|levilamina|plugin|mod|gmlib)$/i;

/** Lower-case words, with camelCase split (`iListenAttentively` → `i listen attentively`). */
function words(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9一-鿿]+/)
    .filter(Boolean);
}

function matches(word: string, text: string, tokens: ReadonlySet<string>): boolean {
  if (/[^a-z0-9]/.test(word)) return text.includes(word);
  return [word, `${word}s`, `${word}es`, `${word}ing`, `${word}er`, `${word}ed`].some((w) => tokens.has(w));
}

/** The topics a mod is about, best first: what the name says weighs most, then the tags, then the description. */
export function topicsOf(input: Pick<LogoInput, "id" | "name" | "description" | "tags">): Topic[] {
  const repo = input.id.split("/").at(-1) ?? "";
  const tags = input.tags.filter((t) => !NOISE_TAG.test(t)).map((t) => t.replace(/^[a-z]+:/i, ""));
  // boilerplate that would match for most mods ("for the LeviLamina mod loader"), and OreUI's "ore"
  const clean = (text: string) => text.replace(/\bmod\s+loader\b/gi, "").replace(/ore\s*ui/gi, "oreui");
  const sources: [text: string, weight: number][] = [
    [clean(`${input.name} ${repo}`), 3],
    [clean(tags.join(" ")), 2],
    [clean(input.description), 1],
  ];
  const scored = TOPICS.map((topic, order) => {
    let score = 0;
    for (const [text, weight] of sources) {
      const lower = text.toLowerCase();
      const tokens = new Set(words(text));
      if (topic.words.some((w) => matches(w, lower, tokens))) score += weight;
    }
    return { topic, score, order };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((s) => s.topic);
}

// ---------------------------------------------------------------------------
// Materials: what a block is made of, each face drawn in its own 100×100 square
// ---------------------------------------------------------------------------

type Face = "top" | "left" | "right";

/** How much lighter (top) or darker (sides) each face is: the light comes from the top left. */
const FACE_LIGHT: Record<Face, number> = { top: 7, left: -3, right: -13 };

interface Paint {
  face: Face;
  /** The material's colour, `dl` lighter, at alpha `a`, on this face. */
  t: (dl?: number, a?: number, ds?: number, dh?: number) => string;
  /** Any colour, on this face. */
  c: (h: number, s: number, l: number, a?: number) => string;
  r: () => number;
  /** The mod's hue, for materials that take it (circuits, crystals, ore). */
  hue: number;
}

interface Material {
  key: string;
  h: number;
  s: number;
  l: number;
  /** The colour of its sides when they differ from its top (grass: dirt). */
  side?: readonly [number, number, number];
  /** Takes the mod's hue instead of its own. */
  tinted?: boolean;
  /** Gives off light: a glow behind the scene. */
  glows?: boolean;
  draw: (p: Paint) => string;
}

const n = (v: number) => (Math.round(v * 10) / 10).toString();

const rect = (x: number, y: number, w: number, h: number, fill: string, rx = 0, extra = "") =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"${rx ? ` rx="${n(rx)}"` : ""} fill="${fill}"${extra ? ` ${extra}` : ""}/>`;

const poly = (points: readonly (readonly [number, number])[], fill: string, extra = "") =>
  `<polygon points="${points.map(([x, y]) => `${n(x)},${n(y)}`).join(" ")}" fill="${fill}"${extra ? ` ${extra}` : ""}/>`;

const line = (d: string, stroke: string, width: number, extra = "") =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${n(width)}" stroke-linecap="round" stroke-linejoin="round"${extra ? ` ${extra}` : ""}/>`;

/** A raised frame `b` wide around the square: lit top and left, shaded bottom and right. */
const bevel = (p: Paint, b: number, hi = 14, lo = -14) =>
  poly([[0, 0], [100, 0], [100 - b, b], [b, b]], p.t(hi)) +
  poly([[0, 0], [b, b], [b, 100 - b], [0, 100]], p.t(hi / 2)) +
  poly([[0, 100], [b, 100 - b], [100 - b, 100 - b], [100, 100]], p.t(lo)) +
  poly([[100, 0], [100, 100], [100 - b, 100 - b], [100 - b, b]], p.t(lo / 2));

/** Four-pointed sparkle. */
const sparkle = (x: number, y: number, r: number, fill: string) =>
  `<path d="M${n(x)} ${n(y - r)}Q${n(x)} ${n(y)} ${n(x + r)} ${n(y)}Q${n(x)} ${n(y)} ${n(x)} ${n(y + r)}Q${n(x)} ${n(y)} ${n(x - r)} ${n(y)}Q${n(x)} ${n(y)} ${n(x)} ${n(y - r)}Z" fill="${fill}"/>`;

/** Stone-like tiles, two by two, each bevelled. */
function tiles(p: Paint, crack = true): string {
  let s = rect(0, 0, 100, 100, p.t(-18));
  for (const [x, y] of [[0, 0], [50, 0], [0, 50], [50, 50]] as const) {
    s += rect(x + 1.5, y + 1.5, 47, 47, p.t(Math.round(p.r() * 8 - 4)), 3);
    s += line(`M${x + 4} ${y + 45}V${y + 4}H${x + 45}`, p.t(12), 2);
    s += line(`M${x + 46} ${y + 5}V${y + 46}H${x + 5}`, p.t(-12), 2);
  }
  if (crack) {
    const x = 10 + p.r() * 60;
    const y = 10 + p.r() * 60;
    s += line(`M${n(x)} ${n(y)}l${n(6 + p.r() * 6)} ${n(4 + p.r() * 6)}l${n(-2 + p.r() * 8)} ${n(6 + p.r() * 6)}`, p.t(-22), 1.6);
  }
  return s;
}

const MATERIALS: readonly Material[] = [
  {
    key: "grass",
    h: 100, s: 52, l: 46,
    side: [28, 38, 38],
    draw: (p) => {
      if (p.face === "top") {
        let s = "";
        for (let i = 0; i < 6; i++) s += `<circle cx="${n(p.r() * 100)}" cy="${n(p.r() * 100)}" r="${n(6 + p.r() * 8)}" fill="${p.t(-6, 0.5)}"/>`;
        for (let i = 0; i < 16; i++) {
          const x = 6 + p.r() * 88;
          const y = 8 + p.r() * 86;
          s += line(`M${n(x)} ${n(y)}l2 -6l2 6`, p.t(14), 1.6);
        }
        for (let i = 0; i < 2; i++) {
          const x = 15 + p.r() * 70;
          const y = 15 + p.r() * 70;
          const petal = pick(p.r, ["#fff6a8", "#ffffff", "#ffa8c2", "#b8d4ff"]);
          s += `<circle cx="${n(x)}" cy="${n(y)}" r="4.5" fill="${petal}"/><circle cx="${n(x)}" cy="${n(y)}" r="1.8" fill="#f5b83d"/>`;
        }
        return s;
      }
      let s = "";
      for (let i = 0; i < 10; i++) {
        const w = 6 + p.r() * 8;
        s += rect(p.r() * (100 - w), 34 + p.r() * 60, w, 4 + p.r() * 4, p.c(28, 30, 38 + (p.r() < 0.5 ? -8 : 9)), 2);
      }
      let d = "M0 0H100V24";
      for (let x = 100; x > 0; x -= 12.5) d += `Q${n(x - 6.25)} ${n(x % 25 === 0 ? 38 : 30)} ${n(x - 12.5)} 24`;
      s += `<path d="${d}Z" fill="${p.c(100, 50, 44)}"/>`;
      s += line("M0 2H100", p.c(100, 55, 60), 3);
      return s;
    },
  },
  { key: "stone", h: 215, s: 6, l: 56, draw: (p) => tiles(p) },
  {
    key: "ore",
    h: 220, s: 6, l: 50,
    tinted: true,
    draw: (p) => {
      let s = tiles(p, false);
      const gem = pick(p.r, [p.hue, 190, 150, 50, 0]);
      for (let k = 0; k < 3; k++) {
        const cx = 16 + p.r() * 68;
        const cy = 16 + p.r() * 68;
        for (let i = 0; i < 3; i++) {
          const x = cx + (p.r() - 0.5) * 16;
          const y = cy + (p.r() - 0.5) * 16;
          const r = 3.5 + p.r() * 3;
          s += poly([[x, y - r], [x + r, y], [x, y + r], [x - r, y]], p.c(gem, 80, 52), `stroke="${p.c(gem, 70, 30)}" stroke-width="1"`);
          s += poly([[x, y - r], [x + r / 2, y - r / 2], [x, y], [x - r / 2, y - r / 2]], p.c(gem, 90, 78));
        }
      }
      return s;
    },
  },
  {
    key: "planks",
    h: 33, s: 52, l: 52,
    draw: (p) => {
      let s = "";
      for (let i = 0; i < 4; i++) {
        const y = i * 25;
        s += rect(0, y, 100, 25, p.t(Math.round(p.r() * 10 - 5)));
        const g = y + 8 + p.r() * 8;
        s += line(`M${n(4 + p.r() * 10)} ${n(g)}q20 ${n(-4 + p.r() * 8)} 40 0t40 0`, p.t(-12, 0.7), 1.3);
        s += line(`M0 ${y + 1.5}H100`, p.t(10), 1.5);
        s += line(`M0 ${y + 24}H100`, p.t(-24), 2);
        if (i % 2) {
          const x = 30 + p.r() * 40;
          s += line(`M${n(x)} ${y + 2}V${y + 23}`, p.t(-24), 2);
        }
        s += `<circle cx="7" cy="${y + 12.5}" r="1.8" fill="${p.t(-28)}"/><circle cx="93" cy="${y + 12.5}" r="1.8" fill="${p.t(-28)}"/>`;
      }
      return s;
    },
  },
  {
    key: "bricks",
    h: 8, s: 52, l: 46,
    draw: (p) => {
      let s = rect(0, 0, 100, 100, p.c(30, 14, 76));
      for (let row = 0; row < 4; row++) {
        const y = row * 25;
        for (let x = row % 2 ? -25 : 0; x < 100; x += 50) {
          s += rect(x + 1.5, y + 1.5, 47, 22, p.t(Math.round(p.r() * 12 - 6), 1, 0, Math.round(p.r() * 8 - 4)), 2.5);
          s += line(`M${n(Math.max(x + 4, 1))} ${y + 4}H${n(Math.min(x + 45, 99))}`, p.t(14, 0.8), 1.5);
        }
      }
      return s;
    },
  },
  {
    key: "gold",
    h: 44, s: 92, l: 54,
    draw: (p) =>
      rect(0, 0, 100, 100, p.t()) +
      bevel(p, 12, 18, -16) +
      rect(20, 20, 60, 60, p.t(4), 4) +
      line("M21 79V21H79", p.t(-10), 1.5) +
      poly([[22, 88], [36, 88], [80, 12], [66, 12]], "#ffffff", 'fill-opacity="0.28"') +
      poly([[42, 88], [47, 88], [88, 18], [88, 26]], "#ffffff", 'fill-opacity="0.2"') +
      sparkle(70, 30, 7, "#fffbe6"),
  },
  {
    key: "crystal",
    h: 190, s: 70, l: 58,
    tinted: true,
    draw: (p) => {
      const cx = 42 + p.r() * 16;
      const cy = 42 + p.r() * 16;
      const ring = [[0, 0], [50, 0], [100, 0], [100, 50], [100, 100], [50, 100], [0, 100], [0, 50]] as const;
      let s = "";
      ring.forEach((a, i) => {
        const b = ring[(i + 1) % ring.length]!;
        s += poly([[cx, cy], a, b], p.t(Math.round(p.r() * 26 - 12)), `stroke="${p.t(22, 0.6)}" stroke-width="0.8"`);
      });
      return s + sparkle(cx + 18, cy - 20, 8, "#ffffff");
    },
  },
  {
    key: "obsidian",
    h: 268, s: 40, l: 15,
    draw: (p) => {
      let s = "";
      for (let i = 0; i < 7; i++) {
        const x = p.r() * 100;
        const y = p.r() * 100;
        s += poly([[x, y], [x + 10 + p.r() * 20, y + p.r() * 12], [x + p.r() * 14, y + 12 + p.r() * 18]], p.t(5 + Math.round(p.r() * 8)));
      }
      for (let i = 0; i < 4; i++) {
        const x = 10 + p.r() * 80;
        const y = 10 + p.r() * 80;
        const r = 2.5 + p.r() * 3;
        s += poly([[x, y - r], [x + r, y], [x, y + r], [x - r, y]], p.c(280, 85, 68));
      }
      return s;
    },
  },
  {
    key: "copper",
    h: 20, s: 62, l: 52,
    draw: (p) => {
      let s = line("M9 9H91V91H9Z", p.t(-14), 2.5) + line("M11 89V11H89", p.t(14, 0.8), 1.5);
      for (let k = 0; k < 2 + Math.floor(p.r() * 2); k++) {
        const x = p.r() < 0.5 ? p.r() * 30 : 70 + p.r() * 30;
        const y = p.r() * 100;
        for (let i = 0; i < 3; i++) s += `<circle cx="${n(x + (p.r() - 0.5) * 22)}" cy="${n(y + (p.r() - 0.5) * 22)}" r="${n(6 + p.r() * 7)}" fill="${p.c(166, 42, 48, 0.9)}"/>`;
      }
      for (const [x, y] of [[16, 16], [84, 16], [16, 84], [84, 84]] as const) {
        s += `<circle cx="${x}" cy="${y}" r="4.5" fill="${p.t(-14)}"/><circle cx="${x - 1}" cy="${y - 1}" r="2" fill="${p.t(20)}"/>`;
      }
      return s;
    },
  },
  {
    key: "ice",
    h: 200, s: 75, l: 80,
    draw: (p) =>
      rect(10, 10, 80, 80, p.t(6), 6) +
      poly([[10, 70], [10, 52], [52, 10], [70, 10]], "#ffffff", 'fill-opacity="0.45"') +
      poly([[30, 90], [40, 90], [90, 40], [90, 30]], "#ffffff", 'fill-opacity="0.35"') +
      line(`M${n(55 + p.r() * 20)} 100l-6 -14l8 -10l-4 -12`, "#ffffff", 1.4, 'stroke-opacity="0.8"') +
      sparkle(26, 26, 6, "#ffffff"),
  },
  {
    key: "charge",
    h: 4, s: 72, l: 50,
    draw: (p) => {
      if (p.face === "top")
        return (
          rect(0, 0, 100, 100, p.c(0, 0, 30)) +
          bevel({ ...p, t: (dl = 0, a = 1) => p.c(0, 0, 30 + dl, a) }, 8) +
          `<circle cx="50" cy="50" r="18" fill="${p.t()}"/><circle cx="50" cy="50" r="9" fill="${p.c(0, 0, 16)}"/>` +
          line("M50 50q8 -12 18 -10", p.c(40, 20, 80), 3)
        );
      let s = "";
      for (const x of [25, 50, 75]) s += line(`M${x} 0V100`, p.t(-12), 1.5);
      return s + rect(0, 34, 100, 32, p.c(40, 22, 92)) + line("M0 35H100M0 65H100", p.c(0, 0, 25), 2);
    },
  },
  {
    key: "quartz",
    h: 38, s: 24, l: 88,
    draw: (p) =>
      p.face === "top"
        ? bevel(p, 8, 8, -10) + line("M22 22H78V78H22Z", p.t(-10), 2) + line("M36 36H64V64H36Z", p.t(-8), 2)
        : bevel(p, 7, 8, -10) +
          rect(30, 7, 8, 86, p.t(-9), 3) +
          rect(62, 7, 8, 86, p.t(-9), 3) +
          line("M31 9V91M63 9V91", p.t(10), 1.2),
  },
  {
    key: "leaves",
    h: 118, s: 40, l: 30,
    draw: (p) => {
      let s = "";
      for (let i = 0; i < 24; i++) {
        const x = p.r() * 100;
        const y = p.r() * 100;
        const a = Math.round(p.r() * 180);
        s += `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(8 + p.r() * 4)}" ry="${n(4 + p.r() * 2)}" transform="rotate(${a} ${n(x)} ${n(y)})" fill="${p.c(104 + p.r() * 30, 46, 34 + p.r() * 22)}"/>`;
      }
      if (p.r() < 0.5) for (let i = 0; i < 3; i++) s += `<circle cx="${n(12 + p.r() * 76)}" cy="${n(12 + p.r() * 76)}" r="3.5" fill="${p.c(352, 80, 56)}"/>`;
      return s;
    },
  },
  {
    key: "iron",
    h: 214, s: 12, l: 74,
    draw: (p) => {
      let s = bevel(p, 5, 10, -14) + line("M5 50H95", p.t(-16), 2) + line("M5 52H95", p.t(10), 1);
      for (let x = 14; x < 100; x += 24) s += `<circle cx="${x}" cy="12" r="2.4" fill="${p.t(-20)}"/><circle cx="${x}" cy="88" r="2.4" fill="${p.t(-20)}"/>`;
      const left = p.r() < 0.5;
      for (let i = 0; i < 3; i++) s += rect(left ? 14 : 56, 60 + i * 8, 30, 4, p.t(-30), 2);
      return s + rect(left ? 56 : 14, 20, 30, 22, p.t(4), 3, `stroke="${p.t(-12)}" stroke-width="1.5"`);
    },
  },
  {
    key: "circuit",
    h: 220, s: 34, l: 16,
    tinted: true,
    draw: (p) => {
      let grid = "";
      for (let x = 12.5; x < 100; x += 12.5) grid += `M${x} 0V100M0 ${x}H100`;
      let traces = "";
      let pads = "";
      for (let i = 0; i < 5; i++) {
        const side = Math.floor(p.r() * 4);
        const at = 15 + Math.floor(p.r() * 6) * 12.5;
        const len = 22 + p.r() * 22;
        const turn = (p.r() < 0.5 ? -1 : 1) * (10 + p.r() * 14);
        const [x0, y0, dx, dy] = ([[at, 0, 0, 1], [100, at, -1, 0], [at, 100, 0, -1], [0, at, 1, 0]] as const)[side]!;
        const x1 = x0 + dx * len;
        const y1 = y0 + dy * len;
        const x2 = x1 + (dx ? turn * 0.6 : turn);
        const y2 = y1 + (dy ? turn * 0.6 : turn);
        traces += `M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`;
        pads += `<circle cx="${n(x2)}" cy="${n(y2)}" r="3.4"/>`;
      }
      const glow = p.c(p.hue, 95, 62);
      return (
        line(grid, p.t(10, 0.5), 0.6) +
        `<g filter="url(#blur2)">${line(traces, glow, 4)}</g>` +
        line(traces, p.c(p.hue, 100, 72), 2) +
        `<g fill="${p.c(p.hue, 100, 80)}">${pads}</g>` +
        rect(36, 36, 28, 28, p.t(8), 4, `stroke="${glow}" stroke-width="2"`)
      );
    },
  },
  {
    key: "magma",
    h: 8, s: 40, l: 17,
    glows: true,
    draw: (p) => {
      let cracks = "";
      for (let i = 0; i < 4; i++) {
        let x = p.r() * 100;
        let y = p.r() * 100;
        cracks += `M${n(x)} ${n(y)}`;
        for (let k = 0; k < 3; k++) {
          x += (p.r() - 0.5) * 40;
          y += (p.r() - 0.5) * 40;
          cracks += `L${n(x)} ${n(y)}`;
        }
      }
      let s = "";
      for (let i = 0; i < 5; i++) s += `<circle cx="${n(p.r() * 100)}" cy="${n(p.r() * 100)}" r="${n(8 + p.r() * 8)}" fill="${p.t(6)}"/>`;
      return s + `<g filter="url(#blur2)">${line(cracks, p.c(22, 100, 55), 7)}</g>` + line(cracks, p.c(38, 100, 64), 3);
    },
  },
  {
    key: "lamp",
    h: 44, s: 88, l: 62,
    glows: true,
    draw: (p) => {
      let s = "";
      for (const [x, y] of [[25, 25], [75, 25], [25, 75], [75, 75]] as const) s += `<circle cx="${x}" cy="${y}" r="17" fill="${p.c(52, 100, 86, 0.85)}"/>`;
      return s + line("M50 4V96M4 50H96", p.t(-26), 5) + line("M3 3H97V97H3Z", p.t(-30), 6) + sparkle(25, 25, 6, "#ffffff");
    },
  },
];

const MATERIAL = new Map(MATERIALS.map((m) => [m.key, m]));
export const MATERIAL_KEYS = MATERIALS.map((m) => m.key);

/** What each topic is built from, best first; a topic not here takes any. */
const TOPIC_MATERIALS: Record<string, readonly string[]> = {
  economy: ["gold", "quartz", "planks"],
  rank: ["gold", "crystal", "quartz"],
  teleport: ["crystal", "obsidian", "stone"],
  map: ["grass", "stone", "leaves"],
  structure: ["planks", "bricks", "stone", "quartz"],
  storage: ["planks", "iron", "copper"],
  inventory: ["planks", "copper", "iron"],
  backup: ["iron", "circuit", "quartz"],
  mining: ["ore", "stone", "planks"],
  security: ["iron", "obsidian", "stone"],
  moderation: ["obsidian", "bricks", "iron"],
  cleaner: ["ice", "quartz", "leaves"],
  fire: ["charge", "magma", "bricks"],
  fix: ["copper", "iron", "planks"],
  performance: ["circuit", "copper", "crystal"],
  network: ["circuit", "copper", "iron"],
  geo: ["grass", "stone", "ore"],
  script: ["circuit", "obsidian", "quartz"],
  loader: ["circuit", "copper", "obsidian"],
  library: ["quartz", "planks", "bricks", "circuit"],
  chat: ["quartz", "planks", "ice"],
  text: ["quartz", "planks"],
  ui: ["circuit", "quartz", "ice"],
  camera: ["iron", "obsidian", "crystal"],
  debug: ["circuit", "iron"],
  screen: ["circuit", "iron"],
  light: ["lamp", "gold", "crystal"],
  render: ["crystal", "ice", "lamp"],
  night: ["obsidian", "ice"],
  death: ["obsidian", "magma", "bricks"],
  player: ["grass", "planks", "quartz"],
  scale: ["crystal", "quartz"],
  magic: ["crystal", "obsidian", "quartz"],
  farm: ["grass", "leaves", "planks"],
  land: ["grass", "stone", "leaves"],
  command: ["circuit", "obsidian", "iron"],
  registry: ["quartz", "circuit"],
  search: ["ice", "crystal", "quartz"],
  log: ["planks", "quartz"],
  music: ["planks", "crystal"],
  fishing: ["ice", "planks", "grass"],
  machine: ["copper", "iron"],
  event: ["circuit", "copper"],
  power: ["magma", "iron", "circuit"],
  shape: ["crystal", "quartz", "ice"],
  crypto: ["obsidian", "iron", "circuit"],
  compat: ["copper", "quartz", "circuit"],
  pack: ["planks", "crystal", "quartz"],
};

/** What the other blocks of a scene are, under or beside the one that carries the emblem. */
const GROUND = ["grass", "stone", "planks", "quartz", "bricks", "leaves"] as const;

// ---------------------------------------------------------------------------
// The plan: one choice per dimension
// ---------------------------------------------------------------------------

/** Blocks as [i, j, k]: i runs to the front right, j to the front left, k up. */
const LAYOUTS = {
  single: [[0, 0, 0]],
  pair: [[0, 0, 0], [1, 0, 0]],
  twin: [[0, 0, 0], [0, 1, 0]],
  tower: [[0, 0, 0], [0, 0, 1]],
  corner: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],
  steps: [[0, 0, 0], [1, 0, 0], [0, 0, 1]],
  platform: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0]],
} as const satisfies Record<string, readonly (readonly [number, number, number])[]>;
export const LAYOUT_KEYS = Object.keys(LAYOUTS) as (keyof typeof LAYOUTS)[];
/** On a block's face, in a coin above it, or as a hologram over it. */
export const EMBLEMS = ["face", "coin", "holo"] as const;
export const SKIES = ["day", "dusk", "night", "studio", "pastel"] as const;
const COINS = ["circle", "hexagon", "squircle", "diamond"] as const;
const EFFECTS = ["none", "sparkles", "motes", "cubes"] as const;

export interface LogoPlan {
  topic: string;
  icon: string;
  /** The block that carries the emblem. */
  material: string;
  /** The other blocks. */
  ground: string;
  layout: keyof typeof LAYOUTS;
  emblem: (typeof EMBLEMS)[number];
  coin: (typeof COINS)[number];
  /** The scene floats, with rock hanging under it. */
  island: boolean;
  sky: (typeof SKIES)[number];
  effect: (typeof EFFECTS)[number];
  hue: number;
  /** The second hue's distance from the first. */
  shift: number;
  /** Seeds the textures' and the effects' placement. */
  seed: number;
}

/** What `input` is drawn with; another `salt` gives another plan on the same topic. */
export function logoPlan(input: Pick<LogoInput, "id" | "name" | "description" | "tags">, salt = 0): LogoPlan {
  const seed = hash(`${input.id.toLowerCase()}#${salt}`);
  const rand = random(seed);
  const topics = topicsOf(input);
  // a mod about two things may show the second when its first plan is taken
  const topic = topics.length > 1 && salt % 2 === 1 ? topics[1]! : (topics[0] ?? GENERAL);
  const icon = pick(rand, topic.icons.filter((name) => ICONS[name]));
  const hue = topic === GENERAL ? Math.floor(rand() * 360) : topic.hue + Math.round((rand() - 0.5) * 30);
  const fits = TOPIC_MATERIALS[topic.key] ?? MATERIAL_KEYS;
  // mostly the topic's first material, now and then another of its
  const material = rand() < 0.55 ? fits[0]! : pick(rand, fits);
  const layout = pick(rand, LAYOUT_KEYS);
  const ground = pick(rand, GROUND.filter((g) => g !== material));
  return {
    topic: topic.key,
    icon,
    material,
    ground,
    layout,
    emblem: layout === "platform" ? pick(rand, ["coin", "holo"] as const) : pick(rand, EMBLEMS),
    coin: pick(rand, COINS),
    island: ["single", "pair", "twin", "platform"].includes(layout) && rand() < 0.35,
    sky: pick(rand, SKIES),
    effect: pick(rand, EFFECTS),
    hue,
    shift: pick(rand, [-48, -32, 28, 40, 60]),
    seed: Math.floor(rand() * 2 ** 31),
  };
}

/** Two plans that would look alike: the same icon on the same material, shown the same way. */
export const planKey = (p: LogoPlan) => `${p.icon}/${p.material}/${p.emblem}`;

/**
 * The plans of a catalogue's mods, each unlike the others where it can be:
 * a mod whose plan an earlier one (by id) already has is planned again with
 * another salt.
 */
export function catalogPlans(mods: readonly Pick<LogoInput, "id" | "name" | "description" | "tags">[]): Map<string, LogoPlan> {
  const plans = new Map<string, LogoPlan>();
  const taken = new Set<string>();
  for (const mod of [...mods].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
    let plan = logoPlan(mod);
    for (let salt = 1; taken.has(planKey(plan)) && salt < 12; salt++) plan = logoPlan(mod, salt);
    taken.add(planKey(plan));
    plans.set(mod.id, plan);
  }
  return plans;
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

const hsl = (h: number, s: number, l: number, a = 1) =>
  `hsl(${((Math.round(h) % 360) + 360) % 360} ${Math.max(0, Math.min(100, Math.round(s)))}% ${Math.max(0, Math.min(100, Math.round(l)))}%${a < 1 ? ` / ${a}` : ""})`;

const escapeAttr = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A Lucide icon (24×24, stroked) as SVG elements. */
function iconBody(name: string): string {
  return (ICONS[name] ?? [])
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .filter(([k]) => k !== "key")
        .map(([k, v]) => `${k}="${escapeAttr(String(v))}"`)
        .join(" ");
      return `<${tag} ${a}/>`;
    })
    .join("");
}

/** The icon centred on (cx, cy), `size` across. */
function icon(name: string, cx: number, cy: number, size: number, color: string, stroke: number, extra = ""): string {
  const k = size / 24;
  return (
    `<g transform="translate(${n(cx - size / 2)} ${n(cy - size / 2)}) scale(${k.toFixed(4)})"${extra ? ` ${extra}` : ""}` +
    ` fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${iconBody(name)}</g>`
  );
}

/** The icon as a thick, extruded glyph: `depth` darker copies under the face. */
function chunky(name: string, cx: number, cy: number, size: number, face: string, side: string, depth: number): string {
  let s = "";
  const step = Math.max(depth / 4, 0.5);
  for (let d = depth; d > 0; d -= step) s += icon(name, cx, cy + d, size, side, 2.6);
  return s + icon(name, cx, cy, size, face, 2.6);
}

type Pt = readonly [number, number];
const C30 = Math.cos(Math.PI / 6);
const plus = (...ps: Pt[]): Pt => [ps.reduce((s, p) => s + p[0], 0), ps.reduce((s, p) => s + p[1], 0)];
const times = (p: Pt, k: number): Pt => [p[0] * k, p[1] * k];

/** A cube's corners: its top vertex `o`, and the edges `u` (front right), `v` (front left), `w` (down). */
function cube(o: Pt, a: number) {
  const u: Pt = [C30 * a, a / 2];
  const v: Pt = [-C30 * a, a / 2];
  const w: Pt = [0, a];
  return { o, a, u, v, w, front: plus(o, u, v), top: plus(o, times(plus(u, v), 0.5)) };
}
type Cube = ReturnType<typeof cube>;

/** The transform that maps a face's 100×100 square onto the cube. */
function faceMatrix(c: Cube, face: Face): string {
  const k = 1 / 100;
  const [ax, ay, bx, by, ox, oy] =
    face === "top"
      ? [c.u[0] * k, c.u[1] * k, c.v[0] * k, c.v[1] * k, c.o[0], c.o[1]]
      : face === "left"
        ? [c.u[0] * k, c.u[1] * k, 0, c.a * k, ...plus(c.o, c.v)]
        : [-c.v[0] * k, -c.v[1] * k, 0, c.a * k, ...plus(c.o, c.u, c.v)];
  return `matrix(${[ax, ay, bx, by, ox, oy].map((x) => x.toFixed(4)).join(" ")})`;
}

const SHADE: Record<Face, string> = { top: "url(#shTop)", left: "url(#shLeft)", right: "url(#shRight)" };

function drawCube(c: Cube, m: Material, hue: number, rand: () => number, plate?: { face: Face; icon: string }): string {
  const base = m.tinted ? { h: m.key === "ore" ? m.h : hue, s: m.s, l: m.l } : m;
  let s = "";
  for (const face of ["top", "left", "right"] as const) {
    const fl = FACE_LIGHT[face];
    const [h, sat, l] = face !== "top" && m.side ? m.side : [base.h, base.s, base.l];
    const p: Paint = {
      face,
      t: (dl = 0, a = 1, ds = 0, dh = 0) => hsl(h + dh, sat + ds, l + fl + dl, a),
      c: (hh, ss, ll, a = 1) => hsl(hh, ss, ll + fl, a),
      r: rand,
      hue,
    };
    let body = rect(0, 0, 100, 100, p.t()) + m.draw(p) + rect(0, 0, 100, 100, SHADE[face]);
    if (plate?.face === face) {
      body +=
        rect(10, 13, 80, 80, "#000", 15, 'fill-opacity="0.3"') +
        rect(10, 9, 80, 80, "url(#plate)", 15) +
        rect(13, 12, 74, 74, "none", 12, 'stroke="#fff" stroke-opacity="0.35" stroke-width="2"') +
        chunky(plate.icon, 50, 47, 58, "#ffffff", hsl(hue, 70, 26), 3);
    }
    s += `<g transform="${faceMatrix(c, face)}"><g clip-path="url(#unit)">${body}</g></g>`;
  }
  const { o, u, v, w, front } = c;
  const lw = c.a * 0.022;
  // the silhouette, then the lit edges
  s += poly([o, plus(o, u), plus(o, u, w), plus(front, w), plus(o, v, w), plus(o, v)], "none", `stroke="${hsl(base.h, 30, 10)}" stroke-opacity="0.5" stroke-width="${n(lw * 1.4)}" stroke-linejoin="round"`);
  s += line(`M${n(plus(o, v)[0])} ${n(plus(o, v)[1])}L${n(front[0])} ${n(front[1])}L${n(plus(o, u)[0])} ${n(plus(o, u)[1])}`, "#ffffff", lw, 'stroke-opacity="0.5"');
  s += line(`M${n(front[0])} ${n(front[1])}V${n(front[1] + c.a)}`, "#ffffff", lw, 'stroke-opacity="0.18"');
  return s;
}

/** A coin, gem or badge outline of radius `r` around (0, 0). */
function coinPath(shape: LogoPlan["coin"], r: number): string {
  switch (shape) {
    case "circle":
      return `M${-r} 0a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
    case "hexagon": {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = Math.PI / 3 * i - Math.PI / 2;
        return `${n(Math.cos(a) * r)} ${n(Math.sin(a) * r)}`;
      });
      return `M${pts.join("L")}Z`;
    }
    case "squircle": {
      const h = r * 0.86;
      const k = r * 0.36;
      return `M${n(-h + k)} ${n(-h)}H${n(h - k)}Q${n(h)} ${n(-h)} ${n(h)} ${n(-h + k)}V${n(h - k)}Q${n(h)} ${n(h)} ${n(h - k)} ${n(h)}H${n(-h + k)}Q${n(-h)} ${n(h)} ${n(-h)} ${n(h - k)}V${n(-h + k)}Q${n(-h)} ${n(-h)} ${n(-h + k)} ${n(-h)}Z`;
    }
    case "diamond": {
      const k = r * 0.16;
      return `M${n(-k)} ${n(-r + k)}Q0 ${n(-r)} ${n(k)} ${n(-r + k)}L${n(r - k)} ${n(-k)}Q${n(r)} 0 ${n(r - k)} ${n(k)}L${n(k)} ${n(r - k)}Q0 ${n(r)} ${n(-k)} ${n(r - k)}L${n(-r + k)} ${n(k)}Q${n(-r)} 0 ${n(-r + k)} ${n(-k)}Z`;
    }
  }
}

export function logoSvg(input: LogoInput, plan: LogoPlan = logoPlan(input)): string {
  const S = LOGO_SIZE;
  const rand = random(plan.seed);
  const { hue, shift } = plan;
  const h2 = hue + shift;
  const defs: string[] = [];
  const back: string[] = [];

  // --- the scene, in its own units (a block is 60 across), fitted afterwards
  const A = 60;
  const blocks = [...LAYOUTS[plan.layout]].sort((p, q) => p[0] + p[1] - (q[0] + q[1]) || p[2] - q[2]);
  const at = ([i, j, k]: readonly number[]) => cube(plus(times([C30 * A, A / 2], i!), times([-C30 * A, A / 2], j!), [0, -A * k!]), A);
  const has = (i: number, j: number, k: number) => blocks.some((b) => b[0] === i && b[1] === j && b[2] === k);
  // the block that carries the emblem: the highest, then the frontmost
  const hero = [...blocks].sort((p, q) => q[2] - p[2] || q[0] + q[1] - (p[0] + p[1]))[0]!;
  const heroCube = at(hero);
  const faces: Face[] = [];
  if (!has(hero[0], hero[1] + 1, hero[2])) faces.push("left");
  if (!has(hero[0] + 1, hero[1], hero[2])) faces.push("right");
  const emblem = plan.emblem === "face" && faces.length === 0 ? "coin" : plan.emblem;
  const plateFace = emblem === "face" ? pick(rand, faces) : undefined;

  const main = MATERIAL.get(plan.material) ?? MATERIALS[0]!;
  const ground = MATERIAL.get(plan.ground) ?? MATERIALS[0]!;
  const scene: string[] = [];
  const bounds: Pt[] = [];

  // rock hanging under a floating scene, else a soft shadow on the ground
  const floor = blocks.filter((b) => b[2] === 0).map(at);
  if (plan.island) {
    let rock = "";
    for (const c of floor) {
      const bl = plus(c.o, c.v, c.w);
      const bf = plus(c.front, c.w);
      const br = plus(c.o, c.u, c.w);
      const tip: Pt = [bf[0] + (rand() - 0.5) * A * 0.3, bf[1] + A * (0.6 + rand() * 0.3)];
      const kneeL: Pt = [bl[0] + A * 0.2, bl[1] + A * 0.35];
      const kneeR: Pt = [br[0] - A * 0.18, br[1] + A * 0.3];
      rock += poly([bl, bf, tip, kneeL], hsl(25, 22, 34)) + poly([bf, br, kneeR, tip], hsl(25, 24, 24));
      rock += line(`M${n(kneeL[0])} ${n(kneeL[1])}L${n((bf[0] + tip[0]) / 2)} ${n((bf[1] + tip[1]) / 2)}`, hsl(25, 20, 20), 1.2, 'stroke-opacity="0.6"');
      bounds.push(tip, kneeL, kneeR);
    }
    scene.push(rock);
  } else {
    let shadow = "";
    for (const c of floor) {
      const d: Pt = [A * 0.12, A * 0.14];
      shadow += poly([plus(c.o, c.w, d), plus(c.o, c.u, c.w, d), plus(c.front, c.w, d), plus(c.o, c.v, c.w, d)], "#000");
    }
    scene.push(`<g filter="url(#blur6)" fill-opacity="0.32">${shadow}</g>`);
  }

  for (const b of blocks) {
    const c = at(b);
    const isHero = b === hero;
    const m = isHero || plan.layout === "single" ? main : ground;
    scene.push(drawCube(c, m, hue, rand, isHero && plateFace ? { face: plateFace, icon: plan.icon } : undefined));
    bounds.push(c.o, plus(c.o, c.u), plus(c.o, c.v), plus(c.front, c.w), plus(c.o, c.u, c.w), plus(c.o, c.v, c.w));
  }

  const accent = hsl(hue, 80, 60);
  // the more blocks, the smaller each is once fitted: the emblem grows to stay readable
  const grow = 1 + Math.min(blocks.length - 1, 3) * 0.14;
  if (emblem === "coin") {
    const R = A * 0.68 * grow;
    const cx = heroCube.top[0];
    const cy = heroCube.o[1] - A * 0.62 * grow;
    defs.push(
      `<radialGradient id="coin" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="${hsl(hue, 85, 70)}"/><stop offset="1" stop-color="${hsl(hue, 75, 42)}"/></radialGradient>`,
      `<clipPath id="coinClip"><path d="${coinPath(plan.coin, R)}" transform="translate(${n(cx)} ${n(cy)})"/></clipPath>`,
    );
    const shape = (dy: number, fill: string, extra = "") => `<path d="${coinPath(plan.coin, R)}" transform="translate(${n(cx)} ${n(cy + dy)})" fill="${fill}"${extra ? ` ${extra}` : ""}/>`;
    scene.push(
      `<ellipse cx="${n(heroCube.top[0])}" cy="${n(heroCube.top[1])}" rx="${n(A * 0.42)}" ry="${n(A * 0.21)}" fill="#000" fill-opacity="0.3" filter="url(#blur3)"/>`,
      `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(R * 1.5)}" fill="${accent}" fill-opacity="0.35" filter="url(#blur6)"/>`,
      shape(R * 0.16, hsl(hue, 70, 28)),
      shape(0, "url(#coin)"),
      `<path d="${coinPath(plan.coin, R * 0.82)}" transform="translate(${n(cx)} ${n(cy)})" fill="none" stroke="#fff" stroke-opacity="0.4" stroke-width="${n(R * 0.05)}"/>`,
      `<ellipse cx="${n(cx - R * 0.15)}" cy="${n(cy - R * 0.75)}" rx="${n(R * 0.9)}" ry="${n(R * 0.45)}" fill="#fff" fill-opacity="0.18" clip-path="url(#coinClip)"/>`,
      chunky(plan.icon, cx, cy - R * 0.03, R * 1.06, "#ffffff", hsl(hue, 72, 30), R * 0.07),
    );
    bounds.push([cx - R * 1.1, cy - R * 1.1], [cx + R * 1.1, cy + R]);
  } else if (emblem === "holo") {
    const size = A * 1.4 * grow;
    const cx = heroCube.top[0];
    const cy = heroCube.o[1] - A * 0.82 * grow;
    const t = heroCube.top;
    defs.push(
      `<linearGradient id="beam" gradientUnits="userSpaceOnUse" x1="0" y1="${n(t[1])}" x2="0" y2="${n(cy - size / 2)}"><stop offset="0" stop-color="${hsl(hue, 100, 70)}" stop-opacity="0.55"/><stop offset="1" stop-color="${hsl(hue, 100, 70)}" stop-opacity="0"/></linearGradient>`,
    );
    const left = plus(heroCube.o, times(heroCube.v, 0.7), times(heroCube.u, 0.3));
    const right = plus(heroCube.o, times(heroCube.u, 0.7), times(heroCube.v, 0.3));
    scene.push(
      `<ellipse cx="${n(t[0])}" cy="${n(t[1])}" rx="${n(A * 0.5)}" ry="${n(A * 0.25)}" fill="none" stroke="${hsl(hue, 100, 72)}" stroke-width="${n(A * 0.03)}" stroke-opacity="0.8"/>`,
      `<ellipse cx="${n(t[0])}" cy="${n(t[1])}" rx="${n(A * 0.3)}" ry="${n(A * 0.15)}" fill="${hsl(hue, 100, 80)}" fill-opacity="0.6"/>`,
      poly([left, [cx - size * 0.62, cy], [cx + size * 0.62, cy], right], "url(#beam)"),
      `<g filter="url(#blur3)">${icon(plan.icon, cx, cy, size, hsl(hue, 100, 62), 3.4)}</g>`,
      icon(plan.icon, cx, cy, size, hsl(hue, 100, 88), 2.1),
    );
    bounds.push([cx - size * 0.62, cy - size * 0.55], [cx + size * 0.62, cy]);
  }

  // --- fit the scene into the square, a little up and left of the badge
  const xs = bounds.map((p) => p[0]);
  const ys = bounds.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = Math.min(200 / (x1 - x0), 204 / (y1 - y0), 2.6);
  const tx = 134 - ((x0 + x1) / 2) * k;
  const ty = 132 - ((y0 + y1) / 2) * k;
  const fitted = (p: Pt): Pt => [p[0] * k + tx, p[1] * k + ty];
  const box = { x0: x0 * k + tx, x1: x1 * k + tx, y0: y0 * k + ty, y1: y1 * k + ty };

  // --- the sky
  const light = plan.sky === "day" || plan.sky === "pastel";
  switch (plan.sky) {
    case "day": {
      defs.push(`<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hsl(hue, 70, 72)}"/><stop offset="1" stop-color="${hsl(h2, 60, 90)}"/></linearGradient>`);
      back.push(`<rect width="${S}" height="${S}" fill="url(#sky)"/>`);
      const sx = rand() < 0.5 ? 50 : 236;
      back.push(`<circle cx="${sx}" cy="54" r="56" fill="#fff8d6" fill-opacity="0.5" filter="url(#blur12)"/><circle cx="${sx}" cy="54" r="22" fill="#fffbe8"/>`);
      for (let i = 0; i < 2 + Math.floor(rand() * 2); i++) {
        const x = rand() * S;
        const y = 30 + rand() * 150;
        const w = 50 + rand() * 40;
        back.push(
          `<g fill="#fff" fill-opacity="0.85">${rect(x - w / 2, y, w, 16, "#fff", 8)}<circle cx="${n(x - w * 0.1)}" cy="${n(y)}" r="${n(w * 0.22)}"/><circle cx="${n(x + w * 0.16)}" cy="${n(y + 2)}" r="${n(w * 0.16)}"/></g>`,
        );
      }
      break;
    }
    case "dusk": {
      defs.push(`<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hsl(h2, 55, 22)}"/><stop offset="0.65" stop-color="${hsl(hue, 70, 52)}"/><stop offset="1" stop-color="${hsl(hue + 25, 90, 72)}"/></linearGradient>`);
      back.push(`<rect width="${S}" height="${S}" fill="url(#sky)"/>`);
      const sx = 60 + rand() * 170;
      defs.push(`<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset="1" stop-color="${hsl(hue + 30, 100, 66)}"/></linearGradient>`);
      let stripes = "";
      for (let y = 150; y < 230; y += 14) stripes += rect(0, y, S, 4 + (y - 150) / 12, "#000");
      defs.push(`<mask id="stripes"><rect width="${S}" height="${S}" fill="#fff"/>${stripes}</mask>`);
      back.push(`<circle cx="${n(sx)}" cy="150" r="84" fill="url(#sun)" mask="url(#stripes)" fill-opacity="0.9"/>`);
      break;
    }
    case "night": {
      defs.push(`<linearGradient id="sky" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${hsl(hue, 55, 12)}"/><stop offset="1" stop-color="${hsl(h2, 50, 28)}"/></linearGradient>`);
      back.push(`<rect width="${S}" height="${S}" fill="url(#sky)"/>`);
      let stars = "";
      for (let i = 0; i < 34; i++) stars += `<circle cx="${n(rand() * S)}" cy="${n(rand() * S)}" r="${n(0.6 + rand() * 1.4)}" fill-opacity="${n(0.4 + rand() * 0.6)}"/>`;
      back.push(`<g fill="#fff">${stars}</g>`);
      const mx = rand() < 0.5 ? 48 : 238;
      back.push(`<circle cx="${mx}" cy="50" r="40" fill="${hsl(h2, 80, 70)}" fill-opacity="0.35" filter="url(#blur12)"/><circle cx="${mx}" cy="50" r="18" fill="#f4f1ff"/><circle cx="${mx + 8}" cy="44" r="16" fill="${hsl(hue, 55, 14)}"/>`);
      break;
    }
    case "studio": {
      defs.push(`<radialGradient id="sky" cx="0.48" cy="0.45" r="0.75"><stop offset="0" stop-color="${hsl(hue, 55, 52)}"/><stop offset="1" stop-color="${hsl(h2, 60, 14)}"/></radialGradient>`);
      back.push(`<rect width="${S}" height="${S}" fill="url(#sky)"/>`);
      let rays = "";
      const turn = rand() * 30;
      for (let i = 0; i < 12; i++) {
        const a0 = ((i * 30 + turn) * Math.PI) / 180;
        const a1 = a0 + (10 * Math.PI) / 180;
        rays += poly([[138, 132], [138 + Math.cos(a0) * 300, 132 + Math.sin(a0) * 300], [138 + Math.cos(a1) * 300, 132 + Math.sin(a1) * 300]], "#fff");
      }
      back.push(`<g fill-opacity="0.06">${rays}</g>`);
      break;
    }
    case "pastel": {
      defs.push(`<linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hsl(hue, 70, 93)}"/><stop offset="1" stop-color="${hsl(h2, 65, 82)}"/></linearGradient>`);
      back.push(`<rect width="${S}" height="${S}" fill="url(#sky)"/>`);
      back.push(
        `<g filter="url(#blur24)"><circle cx="${n(rand() * S)}" cy="${n(rand() * 120)}" r="90" fill="${hsl(h2, 85, 72)}" fill-opacity="0.55"/><circle cx="${n(rand() * S)}" cy="${n(160 + rand() * 120)}" r="80" fill="${hsl(hue + 180, 70, 82)}" fill-opacity="0.5"/></g>`,
      );
      break;
    }
  }
  if (main.glows) back.push(`<circle cx="${n(fitted(heroCube.top)[0])}" cy="${n(fitted(heroCube.top)[1] + A * k * 0.4)}" r="${n(A * k * 1.1)}" fill="${hsl(main.h, 100, 60)}" fill-opacity="0.45" filter="url(#blur24)"/>`);

  // --- a few things in the air around it
  const fx: string[] = [];
  const spots = (count: number) =>
    Array.from({ length: count }, () => {
      for (;;) {
        const x = 16 + rand() * (S - 32);
        const y = 16 + rand() * (S - 32);
        const inside = x > box.x0 + 8 && x < box.x1 - 8 && y > box.y0 + 8 && y < box.y1 - 8;
        if (!inside && !(x > 180 && y > 180)) return [x, y] as const;
      }
    });
  switch (plan.effect) {
    case "sparkles":
      for (const [x, y] of spots(4)) fx.push(sparkle(x, y, 5 + rand() * 7, light ? hsl(hue, 80, 52) : "#ffffff"));
      break;
    case "motes":
      for (const [x, y] of spots(9)) fx.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(1.5 + rand() * 3)}" fill="${light ? hsl(hue, 70, 55) : hsl(hue, 100, 82)}" fill-opacity="${n(0.5 + rand() * 0.5)}"/>`);
      break;
    case "cubes":
      for (const [x, y] of spots(3)) {
        const c = cube([x, y - 8], 9 + rand() * 6);
        fx.push(
          poly([c.o, plus(c.o, c.u), c.front, plus(c.o, c.v)], hsl(hue, 70, 72)) +
            poly([plus(c.o, c.v), c.front, plus(c.front, c.w), plus(c.o, c.v, c.w)], hsl(hue, 65, 55)) +
            poly([c.front, plus(c.o, c.u), plus(c.o, c.u, c.w), plus(c.front, c.w)], hsl(hue, 65, 42)),
        );
      }
      break;
    case "none":
      break;
  }

  // --- filters and face shading
  defs.push(
    `<clipPath id="unit"><rect width="100" height="100"/></clipPath>`,
    `<filter id="blur2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter>`,
    `<filter id="blur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>`,
    `<filter id="blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>`,
    `<filter id="blur12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>`,
    `<filter id="blur24" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24"/></filter>`,
    `<linearGradient id="shTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`,
    `<linearGradient id="shLeft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.16"/></linearGradient>`,
    `<linearGradient id="shRight" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.06"/><stop offset="1" stop-color="#000" stop-opacity="0.26"/></linearGradient>`,
    `<linearGradient id="plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hsl(hue, 72, 58)}"/><stop offset="1" stop-color="${hsl(hue, 72, 40)}"/></linearGradient>`,
  );

  // --- the author's badge
  const out: string[] = [...back, `<g transform="translate(${n(tx)} ${n(ty)}) scale(${k.toFixed(4)})">${scene.join("")}</g>`, ...fx];
  const br = 40;
  const bx = S - br - 18;
  const by = S - br - 18;
  defs.push(`<clipPath id="avatar"><circle cx="${bx}" cy="${by}" r="${br - 5}"/></clipPath>`);
  out.push(
    `<circle cx="${bx + 2}" cy="${by + 6}" r="${br}" fill="#000" fill-opacity="0.3" filter="url(#blur6)"/>`,
    `<circle cx="${bx}" cy="${by}" r="${br}" fill="#fff"/>`,
  );
  if (input.avatar) {
    out.push(`<image x="${bx - br + 5}" y="${by - br + 5}" width="${(br - 5) * 2}" height="${(br - 5) * 2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar)" href="${escapeAttr(input.avatar)}"/>`);
  } else {
    out.push(`<circle cx="${bx}" cy="${by}" r="${br - 5}" fill="${hsl(hue, 30, 88)}"/>`, icon("user-round", bx, by, 44, hsl(hue, 40, 35), 2));
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">` +
    `<title>${escapeAttr(input.name)}</title><defs>${defs.join("")}</defs>${out.join("")}</svg>`
  );
}
