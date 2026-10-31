// The story's hidden state: 71 numbers (0..1) that everything the visitor does to her and to the world moves a
// little, and that the story reads to pick her words and, at the end, one of ten endings. Kept in localStorage, so a
// reload (or coming back days later) carries on where it was.

export const DIMS = [
  // how she feels
  'affection', 'trust', 'fear', 'joy', 'sadness', 'anger', 'shyness', 'curiosity', 'loneliness', 'energy', 'boredom', 'calm',
  // who she is turning into
  'playful', 'brave', 'tidy', 'studious', 'idol', 'miner', 'explorer', 'homebody',
  // the keystones she remembers
  'shard_title', 'shard_bar', 'shard_button', 'shard_media', 'shard_card', 'shard_heading', 'shard_text', 'shard_self',
  // how she likes each kind of block
  'aff_card', 'aff_bar', 'aff_button', 'aff_media', 'aff_title', 'aff_heading', 'aff_text',
  // what the visitor has done (saturating counts)
  'pats', 'pokes', 'kisses', 'longpress', 'pickups', 'drops_hard', 'dizzy', 'cube_throws', 'cube_hits_her', 'mines',
  'carries', 'block_plays', 'ground_walks', 'unreachable', 'camera_far', 'camera_close', 'focus_uses', 'follow_on',
  'idle_time', 'away_time',
  // the visits
  'night_visits', 'visits', 'time_played', 'konami', 'lang_changes', 'theme_changes', 'menu_opens', 'exit_attempts',
  'stares', 'cleansed',
  // how the visitor treats her, as the story reads it
  'honesty', 'promise', 'patience', 'harshness', 'gentleness', 'attention',
] as const;
export type Dim = (typeof DIMS)[number];
export type Effects = Partial<Record<Dim, number>>;

/** What the visitor does, as the story hears it. */
export type StoryEvent =
  | 'pat' | 'poke' | 'kiss' | 'press' | 'pickup' | 'land' | 'dizzy' | 'throw' | 'cubeHit' | 'ground' | 'mine'
  | 'piece' | 'play' | 'carry' | 'unreach' | 'dance' | 'hidden' | 'visible' | 'cam' | 'camMove' | 'camWheel' | 'camLook'
  | 'focus' | 'follow' | 'menu' | 'exit' | 'lang' | 'theme' | 'stare' | 'idle' | 'line' | 'choice' | 'cubeNear'
  | 'whack' | 'found';

export interface EventData {
  kind?: string;
  speed?: number;
  far?: boolean;
  ms?: number;
  piece?: unknown;
}

/** How each thing the visitor does moves her. A positive number moves a dim toward 1 by that share of what is left;
 * a negative one toward 0. */
export function effectsOf(ev: StoryEvent, d: EventData): Effects {
  switch (ev) {
    case 'pat':
      return { affection: 0.03, joy: 0.03, calm: 0.02, shyness: 0.01, gentleness: 0.03, pats: 0.05, loneliness: -0.03, anger: -0.03 };
    case 'poke':
      return { anger: 0.02, fear: 0.01, pokes: 0.05, harshness: 0.012, playful: 0.01, calm: -0.02 };
    case 'kiss':
      return { shyness: 0.05, affection: 0.02, kisses: 0.06, joy: 0.02 };
    case 'press':
      return { playful: 0.02, longpress: 0.08, energy: -0.01 };
    case 'pickup':
      return { fear: 0.03, pickups: 0.05, brave: 0.01, calm: -0.03 };
    case 'land':
      return (d.speed ?? 0) > 2.5 ? { harshness: 0.06, fear: 0.06, drops_hard: 0.1, trust: -0.04, joy: -0.03 } : { brave: 0.01 };
    case 'dizzy':
      return { dizzy: 0.1, anger: 0.03, harshness: 0.02, playful: 0.02 };
    case 'throw':
      return { cube_throws: 0.05, playful: 0.02, miner: 0.01 };
    case 'cubeHit':
      return { cube_hits_her: 0.1, fear: 0.04, harshness: 0.04, trust: -0.03 };
    case 'ground':
      return { ground_walks: 0.03, curiosity: 0.01, boredom: -0.03 };
    case 'mine':
      return { mines: 0.12, miner: 0.06, energy: -0.02 };
    case 'whack':
      return { miner: 0.02, brave: 0.02, cleansed: 0.04 };
    case 'piece': {
      const k = d.kind ?? 'card';
      return { [`aff_${k}`]: 0.05, block_plays: 0.03, curiosity: 0.01, boredom: -0.03 } as Effects;
    }
    case 'play': {
      const by: Record<string, Effects> = {
        title: { idol: 0.04 },
        bar: { explorer: 0.03 },
        button: { playful: 0.03 },
        text: { studious: 0.04 },
        heading: { studious: 0.03 },
        media: { curiosity: 0.03 },
        card: { homebody: 0.04 },
      };
      return { joy: 0.02, energy: -0.01, ...(by[d.kind ?? ''] ?? {}) };
    }
    case 'carry':
      return { carries: 0.1, tidy: 0.06, energy: -0.02 };
    case 'unreach':
      return { unreachable: 0.05, sadness: 0.01, trust: -0.01 };
    case 'dance':
      return { konami: 0.25, idol: 0.08, joy: 0.05 };
    case 'visible': {
      const min = (d.ms ?? 0) / 60000;
      return min > 0.5 ? { away_time: Math.min(0.3, min / 120), loneliness: Math.min(0.2, min / 60) } : {};
    }
    case 'camMove':
    case 'camLook':
    case 'camWheel':
      return {};
    case 'cam':
      return d.far ? { camera_far: 0.01, explorer: 0.004, attention: -0.003 } : { camera_close: 0.01, attention: 0.004 };
    case 'focus':
      return { focus_uses: 0.05, attention: 0.03, loneliness: -0.01 };
    case 'follow':
      return { follow_on: 0.2, attention: 0.03 };
    case 'menu':
      return { menu_opens: 0.05 };
    case 'exit':
      return { exit_attempts: 0.2, loneliness: 0.05, sadness: 0.03 };
    case 'lang':
      return { lang_changes: 0.2, curiosity: 0.02 };
    case 'theme':
      return { theme_changes: 0.2 };
    case 'stare':
      return { stares: 0.1, shyness: 0.04, attention: 0.02 };
    case 'idle':
      return { idle_time: 0.04, boredom: 0.04, loneliness: 0.02 };
    case 'line':
      return { attention: 0.002 };
    case 'cubeNear':
      return { playful: 0.01 };
    default:
      return {};
  }
}

export interface Saved {
  v: 1;
  d: Record<string, number>;
  node: string;
  phase: 'lines' | 'choices' | 'tasks' | 'wait' | 'done';
  line: number;
  tasks: Record<string, number>;
  waitUntil: number;
  flags: Record<string, string | number | boolean>;
  interactions: number;
  startedAt: number;
  lastSeen: number;
  playedMs: number;
  ending: string | null;
}

const KEY = 'levichan:story';
const GALLERY = 'levichan:endings';

export function fresh(): Saved {
  const d: Record<string, number> = {};
  for (const k of DIMS) d[k] = 0;
  Object.assign(d, { affection: 0.3, trust: 0.3, energy: 0.8, calm: 0.5, curiosity: 0.4 });
  return { v: 1, d, node: 'p0', phase: 'lines', line: 0, tasks: {}, waitUntil: 0, flags: {}, interactions: 0, startedAt: Date.now(), lastSeen: Date.now(), playedMs: 0, ending: null };
}

export function load(): Saved {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null') as Saved | null;
    if (s && s.v === 1 && s.d) {
      // dims added later start at 0
      for (const k of DIMS) s.d[k] ??= 0;
      return s;
    }
  } catch {
    /* private mode or a broken save: start over */
  }
  return fresh();
}
export function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
export function gallery(): string[] {
  try {
    return JSON.parse(localStorage.getItem(GALLERY) || '[]') as string[];
  } catch {
    return [];
  }
}
export function addToGallery(id: string) {
  const g = gallery();
  if (!g.includes(id)) g.push(id);
  try {
    localStorage.setItem(GALLERY, JSON.stringify(g));
  } catch {
    /* ignore */
  }
}

/** Move the state: each effect pulls its dim toward 1 (or 0) by that share. */
export function apply(d: Record<string, number>, fx: Effects) {
  for (const [k, v] of Object.entries(fx)) {
    if (!v) continue;
    const x = d[k] ?? 0;
    d[k] = v > 0 ? x + (1 - x) * Math.min(1, v) : x * (1 + Math.max(-1, v));
  }
}
/** Moods settle back over time (a minute at a time). */
export function settle(d: Record<string, number>, minutes: number) {
  const k = Math.pow(0.9, minutes);
  for (const m of ['joy', 'anger', 'fear', 'dizzy', 'boredom'] as const) d[m] = d[m]! * k;
  d.energy = 1 - (1 - d.energy!) * k;
  // about two thirds after an hour
  d.time_played = 1 - (1 - d.time_played!) * Math.pow(0.983, minutes);
}
