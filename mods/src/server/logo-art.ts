// A logo for a mod that has none of its own, drawn at build time (see
// `server/icons.ts` generateLogos, which rasterises it like any other icon).
//
// A 288 px square: a Lucide icon (https://lucide.dev, `lucide-static`) for
// what the mod is about, on a background coloured for it, and the author's
// GitHub avatar as a round badge in the bottom-right corner. No text: the
// name is next to the logo wherever it is shown.
//
// What it is about picks the topic (an economy mod: coins, wallet, piggy
// bank…; a teleport mod: compass, route, pin…). Everything else is one choice
// per dimension, seeded by the mod's id, so the same mod always gets the same
// logo and mods on the same topic still differ:
//   - which of the topic's icons, and its stroke weight;
//   - the palette: the topic's hue nudged, a second hue beside it, dark or light;
//   - the backdrop: soft colour fields, rings, a diagonal split, a dot grid, waves or a plain glow;
//   - the composition: the icon on its own, on a glass tile, in a disc, or large and tilted.
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
// The plan: one choice per dimension
// ---------------------------------------------------------------------------

export const BACKDROPS = ["fields", "rings", "split", "dots", "waves", "glow"] as const;
export const COMPOSITIONS = ["plain", "tile", "disc", "crop"] as const;

export interface LogoPlan {
  topic: string;
  icon: string;
  stroke: number;
  hue: number;
  /** The second hue's distance from the first. */
  shift: number;
  light: boolean;
  backdrop: (typeof BACKDROPS)[number];
  composition: (typeof COMPOSITIONS)[number];
  /** Seeds the backdrop's and the crop's placement. */
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
  const hue = topic === GENERAL ? Math.floor(rand() * 360) : topic.hue + Math.round((rand() - 0.5) * 40);
  return {
    topic: topic.key,
    icon,
    stroke: pick(rand, [1.5, 1.75, 2, 2.25]),
    hue,
    shift: pick(rand, [-48, -32, 28, 40, 60]),
    light: rand() < 0.22,
    backdrop: pick(rand, BACKDROPS),
    composition: pick(rand, COMPOSITIONS),
    seed: Math.floor(rand() * 2 ** 31),
  };
}

/** Two plans that would look alike: the same icon drawn the same way. */
export const planKey = (p: LogoPlan) => `${p.icon}/${p.composition}/${p.light ? "light" : "dark"}`;

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
  `hsl(${((Math.round(h) % 360) + 360) % 360} ${s}% ${l}%${a < 1 ? ` / ${a}` : ""})`;

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

/** The icon centred on (cx, cy), `size` px across. */
function icon(name: string, cx: number, cy: number, size: number, color: string, stroke: number, extra = ""): string {
  const k = size / 24;
  return (
    `<g transform="translate(${(cx - size / 2).toFixed(1)} ${(cy - size / 2).toFixed(1)}) scale(${k.toFixed(4)})" ${extra}` +
    ` fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${iconBody(name)}</g>`
  );
}

export function logoSvg(input: LogoInput, plan: LogoPlan = logoPlan(input)): string {
  const S = LOGO_SIZE;
  const rand = random(plan.seed);
  const { hue, shift, light } = plan;
  const h2 = hue + shift;
  const defs: string[] = [];
  const out: string[] = [];

  // colours: a rich gradient with a white icon, or a pale one with a deep icon
  const bgA = light ? hsl(hue, 70, 94) : hsl(hue, 62, 46);
  const bgB = light ? hsl(h2, 66, 84) : hsl(h2, 58, 22);
  const ink = light ? hsl(hue, 62, 32) : "#ffffff";
  const accent = light ? hsl(h2, 75, 62) : hsl(h2, 90, 72);
  const angle = rand() * Math.PI * 2;
  const gx = Math.cos(angle) / 2;
  const gy = Math.sin(angle) / 2;
  defs.push(
    `<linearGradient id="bg" x1="${(0.5 - gx).toFixed(3)}" y1="${(0.5 - gy).toFixed(3)}" x2="${(0.5 + gx).toFixed(3)}" y2="${(0.5 + gy).toFixed(3)}"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient>`,
    `<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>`,
    `<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>`,
  );
  out.push(`<rect width="${S}" height="${S}" fill="url(#bg)"/>`);

  // where the icon goes: a little up and left of centre, clear of the badge
  let cx = 134;
  let cy = 132;
  let size = 132;
  if (plan.composition === "crop") {
    // larger, tilted, running towards the top-left corner, still clear of the badge
    size = 196 + Math.floor(rand() * 20);
    cx = 104 + Math.floor(rand() * 14);
    cy = 100 + Math.floor(rand() * 14);
  }

  // the backdrop: one treatment
  const line = light ? hsl(hue, 50, 30, 0.12) : "hsl(0 0% 100% / 0.12)";
  switch (plan.backdrop) {
    case "fields": {
      const blobs = [
        [rand() * S, rand() * S * 0.5, 90 + rand() * 50, accent, 0.55],
        [rand() * S, S * 0.5 + rand() * S * 0.5, 80 + rand() * 60, light ? hsl(hue + 180, 70, 85) : hsl(hue - shift / 2, 80, 55), 0.45],
        [rand() * S, rand() * S, 60 + rand() * 40, light ? "#fff" : hsl(hue, 70, 60), 0.4],
      ] as const;
      out.push(`<g filter="url(#soft)">${blobs.map(([x, y, r, c, o]) => `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(0)}" fill="${c}" fill-opacity="${o}"/>`).join("")}</g>`);
      break;
    }
    case "rings": {
      const corner = pick(rand, [[0, 0], [S, 0], [0, S], [cx, cy]] as const);
      const step = 26 + Math.floor(rand() * 14);
      let rings = "";
      for (let r = step; r < S * 1.5; r += step) rings += `<circle cx="${corner[0]}" cy="${corner[1]}" r="${r}"/>`;
      out.push(`<g fill="none" stroke="${line}" stroke-width="2">${rings}</g>`);
      break;
    }
    case "split": {
      const t = 0.3 + rand() * 0.4;
      const [y0, y1] = rand() < 0.5 ? [S * (t + 0.35), S * (t - 0.35)] : [S * (t - 0.35), S * (t + 0.35)];
      out.push(`<path d="M0 ${y0.toFixed(0)}L${S} ${y1.toFixed(0)}V${S}H0z" fill="${light ? "#fff" : "#000"}" fill-opacity="${light ? 0.35 : 0.16}"/>`);
      break;
    }
    case "dots": {
      const gap = 18 + Math.floor(rand() * 8);
      defs.push(
        `<radialGradient id="fade" cx="${(cx / S).toFixed(2)}" cy="${(cy / S).toFixed(2)}" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`,
        `<mask id="dotmask"><rect width="${S}" height="${S}" fill="url(#fade)"/></mask>`,
      );
      let dots = "";
      for (let y = gap / 2; y < S; y += gap) for (let x = gap / 2; x < S; x += gap) dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2"/>`;
      out.push(`<g mask="url(#dotmask)" fill="${light ? hsl(hue, 50, 30, 0.22) : "hsl(0 0% 100% / 0.22)"}">${dots}</g>`);
      break;
    }
    case "waves": {
      let waves = "";
      const amp = 14 + rand() * 14;
      const phase = rand() * S;
      for (let i = 0; i < 3; i++) {
        const base = S * (0.62 + i * 0.13);
        let d = `M0 ${base.toFixed(1)}`;
        for (let x = 0; x <= S; x += 12) d += `L${x} ${(base + Math.sin((x + phase + i * 40) / 46) * amp).toFixed(1)}`;
        waves += `<path d="${d}V${S}H0z" fill="${light ? "#fff" : hsl(h2, 60, 14)}" fill-opacity="${light ? 0.25 : 0.22}"/>`;
      }
      out.push(waves);
      break;
    }
    case "glow":
      break;
  }
  // a glow behind the icon
  defs.push(
    `<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${light ? "#fff" : accent}" stop-opacity="${light ? 0.9 : 0.45}"/><stop offset="1" stop-color="${light ? "#fff" : accent}" stop-opacity="0"/></radialGradient>`,
  );
  if (plan.composition !== "crop") out.push(`<circle cx="${cx}" cy="${cy}" r="${size}" fill="url(#glow)"/>`);

  // the composition
  const stroke = plan.stroke;
  switch (plan.composition) {
    case "plain":
      out.push(icon(plan.icon, cx + 3, cy + 5, size, light ? hsl(hue, 50, 30, 0.18) : "rgb(0 0 0 / 0.22)", stroke, 'filter="url(#shadow)"'));
      out.push(icon(plan.icon, cx, cy, size, ink, stroke));
      break;
    case "tile": {
      const t = 164;
      const x = cx - t / 2;
      const y = cy - t / 2;
      out.push(
        `<rect x="${x + 4}" y="${y + 10}" width="${t}" height="${t}" rx="44" fill="#000" fill-opacity="${light ? 0.08 : 0.25}" filter="url(#shadow)"/>`,
        `<rect x="${x}" y="${y}" width="${t}" height="${t}" rx="44" fill="#fff" fill-opacity="${light ? 0.7 : 0.14}" stroke="#fff" stroke-opacity="${light ? 0.9 : 0.35}" stroke-width="2"/>`,
      );
      out.push(icon(plan.icon, cx, cy, 104, ink, stroke));
      break;
    }
    case "disc": {
      const r = 84;
      out.push(
        `<circle cx="${cx + 3}" cy="${cy + 9}" r="${r}" fill="#000" fill-opacity="${light ? 0.1 : 0.28}" filter="url(#shadow)"/>`,
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${light ? hsl(hue, 62, 34) : "#fff"}"/>`,
      );
      out.push(icon(plan.icon, cx, cy, 100, light ? "#fff" : hsl(hue, 62, 34), stroke));
      break;
    }
    case "crop": {
      const tilt = (rand() < 0.5 ? -1 : 1) * (8 + Math.floor(rand() * 8));
      const rotate = `transform="rotate(${tilt} ${cx} ${cy})"`;
      out.push(`<g ${rotate}>${icon(plan.icon, cx + 4, cy + 8, size, light ? hsl(hue, 50, 30, 0.16) : "rgb(0 0 0 / 0.25)", stroke * 0.8, 'filter="url(#shadow)"')}</g>`);
      out.push(`<g ${rotate}>${icon(plan.icon, cx, cy, size, light ? hsl(hue, 62, 32) : "#ffffff", stroke * 0.8)}</g>`);
      break;
    }
  }

  // the author's badge
  const br = 40;
  const bx = S - br - 18;
  const by = S - br - 18;
  defs.push(`<clipPath id="avatar"><circle cx="${bx}" cy="${by}" r="${br - 5}"/></clipPath>`);
  out.push(
    `<circle cx="${bx + 2}" cy="${by + 6}" r="${br}" fill="#000" fill-opacity="0.3" filter="url(#shadow)"/>`,
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
