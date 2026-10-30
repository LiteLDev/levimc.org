// What LeviChan does, and when. The visitor never picks a motion: each one answers something they did (or
// didn't do) — a pat, a poke, circling her with the cursor, scrolling hard, copying text, coming back to the
// tab, clicking the floor... — and in between she idles, fidgets, and decides for herself whether to watch
// the cursor, glance at the viewer or mind her own business.
import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { HitRegion, Levi } from './levi';
import type { Space } from './space';
import type { LeviChanStrings } from './strings';

/** How much a motion matters: a higher one may cut a lower one, never the reverse. */
const enum Prio {
  Ambient = 1,
  Page = 2,
  Touch = 3,
  Farewell = 4,
}

/** Ambient fidgets and their weights (night adds yawns). */
const AMBIENT: [string, number][] = [
  ['look_around', 3],
  ['stretch', 1.5],
  ['hair_tuck', 2],
  ['heel_rock', 2],
  ['kick_pebble', 1.5],
  ['hum_sway', 2],
  ['check_shoe', 1.2],
  ['yawn', 0.6],
  ['sneeze', 0.25],
];
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

const now = () => performance.now();
/** ?lcdebug=nogaze,... (development switches) */
const DEBUG = Object.fromEntries((new URLSearchParams(location.search).get('lcdebug') ?? '').split(',').filter(Boolean).map((k) => [k, true])) as Record<string, boolean>;
const pick = <T,>(items: [T, number][]) => {
  const total = items.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of items) if ((r -= w) <= 0) return v;
  return items[items.length - 1]![0];
};

export class Brain {
  private prio = 0;
  private last: string | null = null;
  private lastInput = now();
  private nextAmbient = now() + 12000;
  private sat = false;
  private greeted = false;
  private cooldown = new Map<string, number>();
  private disposed = false;

  // attention: 0..1, grows when the cursor moves near her, fades when it doesn't
  private interest = 0.4;
  private glanceUntil = 0;
  private glanceAt: 'viewer' | 'none' = 'none';
  private pointer = { x: -1, y: -1, t: 0, speed: 0 };
  private overFace = 0;
  private lookAtLink: { el: HTMLElement; since: number } | null = null;
  private readingUntil = 0;

  // circling her with the cursor
  private circle = { prev: NaN, sum: 0, t0: 0, tLast: 0 };
  // clicks / presses on her
  private clicks: number[] = [];
  private down: { t: number; x: number; y: number; region: HitRegion } | null = null;
  private clickTimer = 0;
  // floor clicks (mining)
  private floorClicks: number[] = [];
  private keys: string[] = [];
  private hiddenAt = 0;
  private bottomSeen = new Set<string>();
  private readonly tick: () => void;
  private readonly t: LeviChanStrings;

  constructor(
    private readonly space: Space,
    private readonly levi: Levi,
    t: LeviChanStrings,
  ) {
    this.t = t;
    this.tick = () => this.update();
    levi.scene.onBeforeRenderObservable.add(this.tick);
    // the clips she reaches for first; the rest load when first needed
    levi.preload(['wave_hello', 'poke_startle', 'head_pat', 'look_around', 'wave_bye']);
  }

  dispose() {
    this.disposed = true;
    this.levi.scene.onBeforeRenderObservable.removeCallback(this.tick);
  }

  /** Play a motion if nothing more important is playing; cooldown (ms) keeps page reactions from nagging. */
  private act(name: string, prio: Prio, opts: { cooldown?: number; say?: string; mood?: Record<string, number>; moodMs?: number } = {}) {
    if (this.disposed || !this.levi.clips[name]) return false;
    if (!this.space.introDone && prio < Prio.Farewell) return false;
    if (this.levi.current && this.prio > prio) return false;
    if (this.levi.current === name && prio < Prio.Touch) return false;
    const until = this.cooldown.get(name) ?? 0;
    if (opts.cooldown && now() < until) return false;
    if (opts.cooldown) this.cooldown.set(name, now() + opts.cooldown);
    this.prio = prio;
    this.last = name;
    if (opts.say) this.space.say(opts.say);
    if (opts.mood) {
      Object.assign(this.levi.mood, opts.mood);
      const keys = Object.keys(opts.mood);
      setTimeout(() => {
        for (const k of keys) delete this.levi.mood[k];
      }, opts.moodMs ?? 2500);
    }
    void this.levi.play(name).then(() => {
      if (this.levi.current === null) this.prio = 0;
      this.nextAmbient = Math.max(this.nextAmbient, now() + 6000 + Math.random() * 8000);
    });
    return true;
  }

  private input() {
    this.lastInput = now();
    this.sat = false;
  }

  // ------------------------------------------------------------------ every frame
  private update() {
    const tNow = now();
    if (!this.greeted && this.space.introDone) {
      this.greeted = true;
      this.glance('viewer', 2600);
      const night = this.isNight();
      this.act('wave_hello', Prio.Page, { say: night ? this.t.say.yawn : this.t.say.hello });
    }
    // the cursor's speed decays when it stops
    if (tNow - this.pointer.t > 120) this.pointer.speed *= 0.9;
    this.interest = Math.max(0, this.interest - 0.06 / 60);

    // left alone: she sits down for a rest; otherwise fidgets now and then
    if (!this.space.quiet && !this.levi.current && this.greeted) {
      if (!this.sat && tNow - this.lastInput > 45000) {
        this.sat = this.act('sit_rest', Prio.Ambient);
      } else if (tNow > this.nextAmbient) {
        const pool = AMBIENT.filter(([n]) => n !== this.last).map(([n, w]) => [n, n === 'yawn' && this.isNight() ? w * 5 : w] as [string, number]);
        this.act(pick(pool), Prio.Ambient);
        this.nextAmbient = tNow + 9000 + Math.random() * 13000;
      }
    }

    // lingering on a link: she points at it (and Support gets a heart)
    const ln = this.lookAtLink;
    if (ln && tNow - ln.since > 1500 && !this.levi.current) {
      const href = (ln.el as HTMLAnchorElement).href || '';
      if (/\/support\/?$/.test(new URL(href || location.href, location.href).pathname) && href) {
        this.act('heart', Prio.Page, { cooldown: 30000, mood: { にこり: 0.8 } });
      } else {
        const r = ln.el.getBoundingClientRect();
        const me = this.space.headScreen();
        if (me) this.act(r.left + r.width / 2 < me.x ? 'point_right' : 'point_left', Prio.Page, { cooldown: 14000 });
      }
      ln.since = Infinity;
    }

    // her cursor face-time: a few seconds of hovering her face makes her shy
    if (this.overFace && tNow - this.overFace > 3000) {
      this.overFace = 0;
      this.act('shy_cover', Prio.Touch, { cooldown: 15000, mood: { 照れ: 1 }, moodMs: 4500 });
    }
    this.updateGaze(tNow);
  }

  private isNight() {
    const h = new Date().getHours();
    return h >= 22 || h < 6;
  }

  private glance(at: 'viewer' | 'none', ms: number) {
    this.glanceAt = at;
    this.glanceUntil = now() + ms;
  }

  /** Where she looks: the visitor sets the policy (auto / always / never); in auto she decides. */
  private updateGaze(tNow: number) {
    const levi = this.levi;
    const mode = this.space.look;
    let target: Vector3 | null = null;
    let w = 0;
    const cursor = this.pointer.x >= 0 ? this.space.cursorPoint(this.pointer.x, this.pointer.y) : null;
    const cur = levi.current;
    if (mode === 'never') {
      target = null;
    } else if (cur === 'wave_hello' || cur === 'wave_bye' || cur === 'welcome_back' || cur === 'bow' || cur === 'curtsy') {
      target = this.space.cameraPos();
      w = 0.9;
    } else if ((cur === 'point_left' || cur === 'point_right') && this.lookAtLink) {
      const r = this.lookAtLink.el.getBoundingClientRect();
      target = this.space.screenPoint(r.left + r.width / 2, r.top + r.height / 2);
      w = 0.8;
    } else if (mode === 'always') {
      target = cursor;
      w = 1;
    } else {
      // auto: a moving cursor nearby catches her eye; a still one loses it; sometimes she glances at the viewer,
      // and while the visitor scrolls the page she reads along
      if (tNow < this.readingUntil && cursor) {
        target = cursor;
        w = 0.55;
      } else if (this.interest > 0.35 && cursor) {
        target = cursor;
        w = Math.min(1, 0.4 + this.interest);
      } else if (tNow < this.glanceUntil && this.glanceAt === 'viewer') {
        target = this.space.cameraPos();
        w = 0.7;
      } else if (tNow > this.glanceUntil && Math.random() < 1 / (60 * 7)) {
        this.glance(Math.random() < 0.6 ? 'viewer' : 'none', 1500 + Math.random() * 2000);
      }
    }
    if (DEBUG.nogaze) target = null;
    levi.gazeTarget = target;
    levi.gazeWeight = target ? w : 0;
  }

  // ------------------------------------------------------------------ pointer
  pointerMove(e: PointerEvent, hit: { region: HitRegion } | null, onPanel: boolean) {
    this.input();
    const tNow = now();
    const p = this.pointer;
    if (p.x >= 0) {
      const d = Math.hypot(e.clientX - p.x, e.clientY - p.y);
      p.speed = (d / Math.max(1, tNow - p.t)) * 1000;
    }
    p.x = e.clientX;
    p.y = e.clientY;
    p.t = tNow;
    // interest: movement near her (in screen terms) catches her attention; over the page, less
    const me = this.space.headScreen();
    if (me) {
      const dist = Math.hypot(e.clientX - me.x, e.clientY - me.y);
      const near = Math.max(0, 1 - dist / (innerHeight * 0.6));
      this.interest = Math.min(1, this.interest + Math.min(p.speed, 2500) / 2500 * (onPanel ? 0.01 : 0.03 + 0.05 * near));
      this.trackCircle(e.clientX, e.clientY, tNow);
    }
    const face = hit?.region === 'face' || hit?.region === 'head';
    if (face && !this.overFace) this.overFace = tNow;
    if (!face) this.overFace = 0;
    if (hit) this.interest = 1;
  }

  /** Two full turns of the cursor around her (within 4 s) make her dizzy. */
  private trackCircle(x: number, y: number, tNow: number) {
    const head = this.space.headScreen();
    const feet = this.space.feetScreen();
    if (!head || !feet) return;
    const cx = (head.x + feet.x) / 2;
    const cy = (head.y + feet.y) / 2;
    const r = Math.hypot(x - cx, y - cy);
    const c = this.circle;
    const span = Math.abs(feet.y - head.y);
    if (r < span * 0.12 || r > span * 1.1 || tNow - c.tLast > 600) {
      c.prev = NaN;
      c.sum = 0;
      c.t0 = tNow;
    }
    c.tLast = tNow;
    const a = Math.atan2(y - cy, x - cx);
    if (!Number.isNaN(c.prev)) {
      let d = a - c.prev;
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      c.sum += d;
      if (tNow - c.t0 > 4000) {
        c.sum *= 0.5;
        c.t0 = tNow;
      }
      if (Math.abs(c.sum) > 4 * Math.PI) {
        c.sum = 0;
        this.act('dizzy', Prio.Touch, { cooldown: 12000, say: this.t.say.dizzy, mood: { はぅ: 0.8, 汗: 1 }, moodMs: 5000 });
      }
    }
    c.prev = a;
  }

  pointerDown(e: PointerEvent, hit: { region: HitRegion }) {
    this.input();
    this.down = { t: now(), x: e.clientX, y: e.clientY, region: hit.region };
    // charging up while held
    this.levi.mood['キリッ'] = 0;
    setTimeout(() => {
      if (this.down && now() - this.down.t > 550) this.levi.mood['キリッ'] = 0.7;
    }, 600);
  }

  pointerUp(e: PointerEvent, hit: { region: HitRegion } | null, wasDrag: boolean) {
    const d = this.down;
    this.down = null;
    delete this.levi.mood['キリッ'];
    if (!d || wasDrag) return;
    const held = now() - d.t;
    const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
    if (!hit && moved > 30) return;
    if (held > 600) {
      // a long press: crouch, spring, jump
      this.act('jump_happy', Prio.Touch, { mood: { 笑い: 0.9 }, moodMs: 2600 });
      return;
    }
    // every click counts toward "enough!"; a single click's reaction waits a beat, in case it is a double click
    const tNow = now();
    this.clicks = this.clicks.filter((c) => tNow - c < 3000);
    this.clicks.push(tNow);
    clearTimeout(this.clickTimer);
    if (this.clicks.length >= 5) {
      this.clicks = [];
      this.act('annoyed_stomp', Prio.Touch, { say: this.t.say.stop, mood: { 怒り: 0.9, じと目: 0.6 }, moodMs: 4500 });
      this.space.bump(1.2);
      return;
    }
    const region = d.region;
    this.clickTimer = window.setTimeout(() => this.clicked(region), 260);
  }

  private clicked(region: HitRegion) {
    if (this.levi.current === 'annoyed_stomp') return;
    if (region === 'head') {
      this.act('head_pat', Prio.Touch, { cooldown: 1500, say: this.t.say.pat, mood: { 照れ: 1, にこり: 0.6 }, moodMs: 4000 });
    } else {
      this.act('poke_startle', Prio.Touch, { cooldown: 900, mood: { びっくり: 1, 瞳小: 0.6 }, moodMs: 1200 });
    }
  }

  doubleClick(hit: { region: HitRegion }) {
    clearTimeout(this.clickTimer);
    if (this.clicks.length > 2 || this.levi.current === 'annoyed_stomp') return; // mashing, not a double click
    this.input();
    if (hit.region === 'skirt' || hit.region === 'leg' || hit.region === 'body') this.act('twirl', Prio.Touch, { mood: { 笑い: 0.8 }, moodMs: 3000 });
    else this.act('head_pat', Prio.Touch, { mood: { 照れ: 1 }, moodMs: 3000 });
  }

  /** Clicks on the empty floor: three quick ones and she mines it. */
  floorDown(e: PointerEvent) {
    this.input();
    const tNow = now();
    this.floorClicks = this.floorClicks.filter((c) => tNow - c < 2500);
    this.floorClicks.push(tNow);
    const dark = document.documentElement.classList.contains('dark');
    this.space.burst(e.clientX, e.clientY, dark ? ['#4f9640', '#6c442c', '#7fd4a4'] : ['#5fa94a', '#8a5a3b', '#98674a'], 6);
    if (this.floorClicks.length >= 3) {
      this.floorClicks = [];
      if (this.act('mining_swing', Prio.Page, { cooldown: 6000, mood: { キリッ: 0.8 }, moodMs: 4000 })) {
        const f = this.space.feetScreen();
        // the blocks she breaks: bits at her feet on each swing
        if (f) for (const ms of [1300, 2500, 3700]) setTimeout(() => this.space.burst(f.x - 40, f.y, ['#7e7e7e', '#9b9b9b', '#5fa94a', '#8a5a3b'], 12), ms);
        setTimeout(() => this.space.say(this.t.say.mined), 4200);
      }
    }
  }

  zoomed(f: number) {
    this.input();
    if (f > 0.8) this.act('shy_cover', Prio.Touch, { cooldown: 20000, mood: { 照れ: 1 }, moodMs: 4500 });
  }

  // ------------------------------------------------------------------ the page
  scrolled(v: number, atEnd: boolean) {
    this.input();
    this.readingUntil = now() + 1500;
    if (Math.abs(v) > 6) this.act('balance_wobble', Prio.Page, { cooldown: 15000, mood: { 汗: 0.8, はぅ: 0.5 }, moodMs: 3000 });
    if (atEnd && !this.bottomSeen.has(location.pathname)) {
      this.bottomSeen.add(location.pathname);
      this.glance('viewer', 3000);
      this.act('wave_bye', Prio.Page, { cooldown: 20000, say: this.t.say.bye, mood: { にこり: 0.8 } });
    }
  }

  hoverLink(el: HTMLElement | null) {
    if (!el) {
      this.lookAtLink = null;
      return;
    }
    if (this.lookAtLink?.el !== el) this.lookAtLink = { el, since: now() };
  }

  clickedLink(a: HTMLAnchorElement) {
    const href = a.getAttribute('href') || '';
    if (/\/support\/?$/.test(href)) this.act('heart', Prio.Page, { cooldown: 20000, mood: { にこり: 1 } });
    else if (a.closest('.lm-grid-4') || /github\.com\/LiteLDev\/?$/.test(href)) this.act('clap_cheer', Prio.Page, { cooldown: 8000, mood: { 笑い: 0.9 } });
  }

  navigated(path: string) {
    if (/^\/(about|support)\//.test(path)) this.act('curtsy', Prio.Page, { cooldown: 10000, mood: { にこり: 0.8 } });
    else this.act('look_around', Prio.Page, { cooldown: 10000 });
  }

  copied() {
    this.input();
    this.act('thumbs_up', Prio.Page, { cooldown: 5000, say: this.t.say.copied, mood: { ウィンク: 1, にこり: 0.6 }, moodMs: 1800 });
  }

  languageChanged() {
    this.act('bow', Prio.Page, { cooldown: 4000, mood: { にこり: 0.7 } });
  }

  themeChanged(dark: boolean) {
    if (dark) this.act('yawn', Prio.Page, { cooldown: 5000, say: this.t.say.yawn });
    else this.act('stretch', Prio.Page, { cooldown: 5000, mood: { にこり: 0.5 } });
  }

  visibility(visible: boolean) {
    if (!visible) {
      this.hiddenAt = now();
      return;
    }
    if (this.hiddenAt && now() - this.hiddenAt > 30000) {
      this.glance('viewer', 3000);
      this.act('welcome_back', Prio.Page, { say: this.t.say.welcomeBack, mood: { 笑い: 1 } });
    }
    this.hiddenAt = 0;
    this.input();
  }

  key(e: KeyboardEvent) {
    this.input();
    const target = e.target as HTMLElement | null;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
    this.keys.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    if (this.keys.length > 10) this.keys.shift();
    const typed = this.keys.filter((k) => k.length === 1).join('');
    const konami = KONAMI.every((k, i) => this.keys[i] === k);
    if (konami || typed.endsWith('levi')) {
      this.keys = [];
      this.glance('viewer', 4000);
      this.act('idol_dance', Prio.Touch, { mood: { 笑い: 0.8 }, moodMs: 9000 });
    }
  }

  /** The space is closing: a big goodbye. */
  farewell() {
    this.glance('viewer', 3000);
    this.act('wave_bye', Prio.Farewell, { say: this.t.say.bye, mood: { にこり: 1 } });
  }
}
