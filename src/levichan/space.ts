// The 3D space: the page comes apart into blocks hanging in the sky as a staircase (./diorama), seen by a camera at
// her eye level that keeps her in view; LeviChan lives on it (WebGL, with a camera matched to the CSS perspective),
// walks the ledges, hops, climbs, scales the blocks and carries them about (./mover), and a small brain (./brain)
// turns what the visitor does into what she does. Everything here is loaded on demand, when the peeking avatar is
// clicked (./LeviChanPeek).
import css from './levichan.css?inline';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Ray } from '@babylonjs/core/Culling/ray.pure';
import { Levi, MMD_SCALE, type HitRegion } from './levi';
import { Brain } from './brain';
import { Diorama, rng, type Cube, type Piece } from './diorama';
import { Mover, type Goal } from './mover';
import type { LeviChanStrings } from './strings';

export interface EnterOptions {
  strings: LeviChanStrings;
  /** asset folder (with clips.json, model/, motions/) */
  base?: string;
  /** skip the rise (a reload while the space was open) */
  instant?: boolean;
  onExit?: () => void;
}

export type LookMode = 'auto' | 'always' | 'never';

const STORE = 'levichan';
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEG = Math.PI / 180;
/** what on the page answers a click itself (a click anywhere else is a click on the ground) */
const INTERACTIVE = 'a, button, input, select, textarea, summary, label, details, [role="button"], [role="tab"], [contenteditable], [tabindex]:not([tabindex="-1"])';

/** CSS matrix3d of a Babylon matrix built in CSS space (x right, y down, z toward the viewer): Babylon's row-vector
 * layout is CSS's column-major one. */
const m3d = (m: Matrix) => `matrix3d(${Array.from(m.m, (v) => +v.toFixed(6)).join(',')})`;

function pixelTexture(kind: 'grass' | 'dirt' | 'leaf' | 'log' | 'stone' | 'side', seed: number) {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d')!;
  const r = rng(seed);
  const pal: Record<string, string[]> = {
    grass: ['#5fa94a', '#6dbb55', '#4f9640', '#7cc65f'],
    dirt: ['#8a5a3b', '#7a4e33', '#98674a', '#6c442c'],
    side: ['#8a5a3b', '#7a4e33', '#98674a', '#6c442c'],
    leaf: ['#3f8f3a', '#4ea446', '#357a31', '#5cb553'],
    log: ['#6e5133', '#7d5c3a', '#5e452b', '#8a6842'],
    stone: ['#8d8d8d', '#7e7e7e', '#9b9b9b', '#727272'],
  };
  const p = pal[kind]!;
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      g.fillStyle = p[Math.floor(r() * p.length)]!;
      g.fillRect(x, y, 1, 1);
    }
  if (kind === 'side') {
    // a grass block's side: a grass fringe along the top
    for (let x = 0; x < 16; x++) {
      const d = 3 + Math.floor(r() * 2);
      for (let y = 0; y < d; y++) {
        g.fillStyle = pal.grass![Math.floor(r() * 4)]!;
        g.fillRect(x, y, 1, 1);
      }
    }
  }
  return c.toDataURL();
}

/** The camera: the point it looks at (the page's CSS space: X right, Y down, Z toward the viewer), its turn about
 * the vertical and its pitch (negative: looking down), and how far back it sits. Looking at the viewport's centre
 * with all else zero: the flat page. */
interface Cam {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  back: number;
}
/** a hit of a ray on the world: the point, and the block (null: the ground) */
interface Hit {
  u: number;
  v: number;
  h: number;
  block: Piece | null;
}

class Space {
  private readonly t: LeviChanStrings;
  private readonly base: string;
  private readonly root: HTMLElement;
  private readonly html = document.documentElement;
  private readonly els: HTMLElement[] = [];
  private style!: HTMLStyleElement;
  private sky!: HTMLElement;
  private ring!: HTMLElement;
  private shadow!: HTMLElement;
  private ripple!: HTMLElement;
  canvas!: HTMLCanvasElement;
  private loadEl!: HTMLElement;
  private menu!: HTMLElement;
  private fab!: HTMLButtonElement;
  levi: Levi | null = null;
  brain: Brain | null = null;
  world!: Diorama;
  mover: Mover | null = null;
  private savedRootStyle: string | null = null;
  private savedScroll = 0;
  private raf = 0;
  private alive = true;
  private readonly onExit?: () => void;
  W = 0;
  H = 0;
  P = 1000;
  /** her height on screen (px), and so the world's scale */
  herPx = 240;

  // the camera: where it is, and what the visitor adds (drag, pointer parallax, scrolling)
  private cam: Cam = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, back: 0 };
  /** the height the camera looks at (world h) while the visitor scrolls; it follows her otherwise */
  private lookH = 0;
  private follow = { x: 0, z: 0 };
  private manualUntil = 0;
  private orbitYaw = 0;
  private orbitPitch = 0;
  private mx = 0;
  private parallax = 0;
  private shake = 0;
  flat = false;
  look: LookMode = 'auto';
  quiet = false;
  private intro = 0;
  private introStart = 0;
  private introDur = 3200;
  private outro = -1;
  private leviReveal = 0;
  private leviRevealStart = -1;
  /** she is placed once the blocks have landed */
  private placed = false;
  private PV = Matrix.Identity();
  private PVinv = Matrix.Identity();
  private lastFrame = performance.now();
  private origin = { x: 0, y: 0 };

  constructor(opts: EnterOptions) {
    this.t = opts.strings;
    this.base = opts.base ?? '/levichan/';
    this.root = document.getElementById('root')!;
    this.onExit = opts.onExit;
    this.restorePrefs();
  }

  private restorePrefs() {
    try {
      const p = JSON.parse(localStorage.getItem(STORE + ':prefs') || '{}') as { look?: LookMode; quiet?: boolean; flat?: boolean };
      if (p.look) this.look = p.look;
      this.quiet = !!p.quiet;
      this.flat = !!p.flat;
    } catch {
      /* private mode: defaults */
    }
  }
  savePrefs() {
    try {
      localStorage.setItem(STORE + ':prefs', JSON.stringify({ look: this.look, quiet: this.quiet, flat: this.flat }));
    } catch {
      /* ignore */
    }
  }

  async start(instant: boolean) {
    // measure the flat page first (before anything changes the layout)
    this.W = document.documentElement.clientWidth;
    this.H = innerHeight;
    this.P = Math.max(1200, Math.hypot(this.W, this.H) * 1.15);
    this.herPx = Math.round(Math.min(380, Math.max(160, Math.min(this.H * 0.4, this.W * 0.5))));
    this.savedScroll = window.scrollY;
    const peek = document.querySelector('.lc-peek-head')?.getBoundingClientRect();
    this.origin = peek ? { x: peek.left + peek.width / 2, y: peek.top + window.scrollY + peek.height } : { x: this.W * 0.7, y: this.savedScroll + this.H * 0.5 };

    this.style = document.createElement('style');
    this.style.textContent = css;
    document.head.appendChild(this.style);
    this.sky = this.add('div', 'lc-sky');
    this.sky.innerHTML = '<div id="lc-stars"></div>';
    this.canvas = this.add('canvas', 'lc-canvas') as HTMLCanvasElement;
    this.canvas.tabIndex = -1;
    this.canvas.setAttribute('aria-hidden', 'true');
    this.loadEl = this.add('div', 'lc-load', 'lc-ui');
    this.loadEl.innerHTML = `${this.t.loading} <b><span></span></b>`;
    this.fab = this.add('button', 'lc-fab', 'lc-ui') as HTMLButtonElement;
    this.fab.type = 'button';
    this.fab.title = this.t.menuTitle;
    this.fab.setAttribute('aria-label', this.t.menuTitle);
    this.fab.innerHTML = `<img src="${this.base}avatar.png" alt="" draggable="false">`;
    this.fab.addEventListener('click', (e) => {
      e.stopPropagation();
      const r = this.fab.getBoundingClientRect();
      this.toggleMenu(r.left, r.top - 8, 'above');
    });
    this.menu = this.add('div', 'lc-menu', 'lc-ui');
    this.menu.hidden = true;
    this.menu.setAttribute('role', 'dialog');
    this.menu.setAttribute('aria-label', this.t.menuTitle);

    // the page becomes a fixed box as tall as itself, centred on the viewport; its components come apart from there
    this.world = new Diorama(this.root, this.herPx);
    this.savedRootStyle = this.root.getAttribute('style');
    const Hp = Math.max(this.root.scrollHeight, document.documentElement.scrollHeight);
    this.html.classList.add('lc-3d');
    this.html.style.setProperty('--lc-page-bg', getComputedStyle(document.body).backgroundColor);
    const s = this.root.style;
    s.width = `${this.W}px`;
    s.height = `${Hp}px`;
    s.left = '0px';
    s.top = `${(this.H - Hp) / 2}px`;
    this.world.build(this.origin);
    this.ring = this.addWorld('lc-ring');
    this.shadow = this.addWorld('lc-shadow');
    this.ripple = this.addWorld('lc-ripple');

    this.cam = { x: this.W / 2, y: this.savedScroll + this.H / 2, z: 0, yaw: 0, pitch: 0, back: 0 };
    this.lookH = this.world.Hp - this.cam.y;
    this.follow = { x: this.W / 2, z: 0 };
    this.introStart = performance.now();
    if (instant || reduced()) this.introDur = 1;
    this.world.explode(this.introStart + (instant ? -1e5 : 0));

    this.bindEvents();
    this.loop();
    try {
      sessionStorage.setItem(STORE, '1');
    } catch {
      /* ignore */
    }

    const bar = this.loadEl.querySelector('span') as HTMLElement;
    try {
      this.levi = await Levi.load({
        base: this.base,
        canvas: this.canvas,
        onProgress: (r, total) => (bar.style.width = `${Math.min(100, (100 * r) / Math.max(1, total))}%`),
      });
    } catch (e) {
      this.loadEl.textContent = this.t.loadFailed;
      console.error('LeviChan:', e);
      return;
    }
    if (!this.alive) {
      this.levi.dispose();
      return;
    }
    this.loadEl.style.opacity = '0';
    setTimeout(() => this.loadEl.remove(), 500);
    this.levi.engine.setHardwareScalingLevel(1 / Math.min(devicePixelRatio || 1, 1.5));
    this.levi.preload(['hop', 'climb_up', 'wall_climb', 'lift_up', 'carry_idle', 'carry_walk', 'put_down', 'fall_land']);
    this.mover = new Mover(this.world, this.levi);
    this.brain = new Brain(this, this.levi, this.mover, this.t);
    if (new URLSearchParams(location.search).has('lcdebug')) (window as unknown as { __levichan: unknown }).__levichan = this;
    this.levi.engine.runRenderLoop(() => {
      if (this.levi && this.mover) this.syncLevi();
      this.levi?.scene.render();
    });
  }

  private add(tag: string, id: string, cls?: string) {
    const el = document.createElement(tag);
    el.id = id;
    if (cls) el.className = cls;
    document.body.appendChild(el);
    this.els.push(el);
    return el;
  }
  private addWorld(id: string) {
    const el = document.createElement('div');
    el.id = id;
    this.world.world.appendChild(el);
    return el;
  }

  /** The ledge nearest a page point (page px), to set her down on. */
  private spotNear(x: number, y: number) {
    const mv = this.mover!;
    const h = this.world.Hp - y;
    let best: { u: number; v: number; h: number; block: Piece | null } | null = null;
    let bd = Infinity;
    for (const l of mv.lanes()) {
      if (l.b - l.a < mv.r) continue;
      const u = Math.max(l.a, Math.min(l.b, x));
      // below the point rather than above it; on a block rather than the ground far down
      const d = Math.abs(u - x) + Math.abs(l.h - h) * (l.h > h ? 2.5 : 1) + (l.block ? 0 : this.H);
      if (d < bd) {
        bd = d;
        best = { u, v: l.v, h: l.h, block: l.block };
      }
    }
    return best ?? { u: x, v: 0.55 * this.world.m, h: 0, block: null };
  }

  /** Once the blocks have landed: set her down on a ledge where her head was peeking, and drop the cubes in. */
  private placeHer() {
    const mv = this.mover!;
    const spot = this.spotNear(Math.max(this.W * 0.2, Math.min(this.W * 0.8, this.origin.x)), this.origin.y);
    mv.place(spot.u, spot.v, spot.h, spot.block);
    this.lookH = spot.h + 0.8 * this.world.m;
    this.leviRevealStart = performance.now();
    this.placed = true;
    this.makeCubes();
  }

  private makeCubes() {
    const kinds: [string, string][] = [
      ['grass', 'side'],
      ['leaf', 'leaf'],
      ['log', 'log'],
      ['stone', 'stone'],
      ['grass', 'side'],
    ];
    const r = rng(7);
    const size = Math.round(this.herPx * 0.2);
    const mv = this.mover!;
    // onto the ledges in view
    const lanes = mv.lanes().filter((l) => l.block && l.b - l.a > size && this.inView((l.a + l.b) / 2, l.v, l.h, 40));
    kinds.slice(0, this.W < 700 ? 3 : kinds.length).forEach(([top, side], i) => {
      const el = document.createElement('div');
      el.className = 'lc-cube';
      el.style.width = el.style.height = `${size}px`;
      const tex = (k: string, j: number) => pixelTexture(k as 'grass', 100 + i * 10 + j);
      const half = size / 2;
      const faces: [string, string][] = [
        [`translateZ(${half}px)`, tex(top, 0)],
        [`rotateX(180deg) translateZ(${half}px)`, tex(side === 'side' ? 'dirt' : side, 5)],
        [`rotateX(90deg) translateZ(${half}px) rotateZ(180deg)`, tex(side, 1)],
        [`rotateX(-90deg) translateZ(${half}px)`, tex(side, 2)],
        [`rotateY(90deg) translateZ(${half}px) rotateZ(90deg)`, tex(side, 3)],
        [`rotateY(-90deg) translateZ(${half}px) rotateZ(-90deg)`, tex(side, 4)],
      ];
      el.innerHTML = faces.map(([f, u]) => `<i style="transform:${f};background-image:url(${u})"></i>`).join('');
      const l = lanes.length ? lanes[Math.floor(r() * lanes.length)]! : null;
      const u = l ? l.a + (l.b - l.a) * r() : this.W * (0.15 + 0.7 * r());
      const v = l ? l.v + (r() - 0.5) * 0.2 * this.world.m : 0.55 * this.world.m;
      const c = this.world.addCube(el, size, u, v, (l?.h ?? 0) + this.H * 0.9 + i * 220);
      c.spin = (r() - 0.5) * 220;
    });
  }

  // ------------------------------------------------------------------ the camera
  /** The page's CSS space -> view space (x right, y down, z toward the viewer, origin at the viewport centre). */
  private viewMatrix(c: Cam) {
    return Matrix.Translation(-c.x, -c.y, -c.z)
      .multiply(Matrix.RotationY(c.yaw))
      .multiply(Matrix.RotationX(c.pitch))
      .multiply(Matrix.Translation(0, 0, -c.back));
  }
  /** world (u, v, h) -> the page's CSS space */
  private get W2C() {
    return Matrix.FromValues(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, this.world.Hp, 0, 1);
  }

  /** The ray through a screen point, in world coordinates. */
  rayWorld(x: number, y: number) {
    const O = Vector3.TransformCoordinates(new Vector3(0, 0, this.P), this.PVinv);
    const Q = Vector3.TransformCoordinates(new Vector3(x - this.W / 2, y - this.H / 2, 0), this.PVinv);
    const Hp = this.world.Hp;
    const o = { u: O.x, v: O.z, h: Hp - O.y };
    const q = { u: Q.x, v: Q.z, h: Hp - Q.y };
    return { o, d: { u: q.u - o.u, v: q.v - o.v, h: q.h - o.h } };
  }
  /** Where a screen point's ray meets the vertical plane v (facing the viewer). */
  onPlaneV(x: number, y: number, v: number) {
    const { o, d } = this.rayWorld(x, y);
    if (Math.abs(d.v) < 1e-6) return null;
    const t = (v - o.v) / d.v;
    return t > 0 ? { u: o.u + d.u * t, h: o.h + d.h * t } : null;
  }
  /** The first block (or the ground) a screen point's ray meets. */
  pick(x: number, y: number): Hit | null {
    const { o, d } = this.rayWorld(x, y);
    let best: Hit | null = null;
    let bt = Infinity;
    for (const b of this.world.blocks()) {
      // slabs: u, v, h
      let t0 = 0;
      let t1 = Infinity;
      const slab = (o0: number, d0: number, lo: number, hi: number) => {
        if (Math.abs(d0) < 1e-9) return o0 >= lo && o0 <= hi;
        let a = (lo - o0) / d0;
        let c = (hi - o0) / d0;
        if (a > c) [a, c] = [c, a];
        t0 = Math.max(t0, a);
        t1 = Math.min(t1, c);
        return t0 <= t1;
      };
      if (!slab(o.u, d.u, b.u, b.u + b.w) || !slab(o.v, d.v, b.z - b.d, b.z) || !slab(o.h, d.h, b.h0, b.h1)) continue;
      if (t0 < bt) {
        bt = t0;
        best = { u: o.u + d.u * t0, v: o.v + d.v * t0, h: o.h + d.h * t0, block: b };
      }
    }
    if (d.h < 0) {
      const t = -o.h / d.h;
      if (t < bt) best = { u: o.u + d.u * t, v: o.v + d.v * t, h: 0, block: null };
    }
    return best;
  }
  /** Screen point of a world point. */
  screenOf(u: number, v: number, h = 0) {
    const p = Vector3.TransformCoordinates(new Vector3(u, this.world.Hp - h, v), this.PV);
    const k = this.P / Math.max(1, this.P - p.z);
    return { x: this.W / 2 + p.x * k, y: this.H / 2 + p.y * k };
  }

  // ------------------------------------------------------------------ the frame
  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.intro = clamp01((now - this.introStart) / this.introDur);
    const m = this.world.m;

    // the camera's travel: the flat page (k = 0) -> at her eye level (k = 1); the outro runs it back once she is gone
    let k = easeInOut(clamp01(this.intro * 1.1));
    if (this.outro >= 0) {
      const o = clamp01((now - this.outro - 500) / 1700);
      k = 1 - easeInOut(o);
      if (o >= 1 && this.world.flat) {
        this.teardown();
        return;
      }
    }
    if (this.mover && !this.placed && this.world.pieces.every((p) => p.t >= 1) && this.outro < 0) this.placeHer();

    this.parallax += (this.mx * 5 * DEG - this.parallax) * Math.min(1, dt * 2);
    if (!this.dragging) {
      this.orbitYaw *= 1 - Math.min(1, dt * 0.35);
      this.orbitPitch *= 1 - Math.min(1, dt * 0.35);
    }
    // what it looks at: her (a little ahead of her, toward the page's middle), or where the visitor scrolled to
    const mv = this.placed ? this.mover : null;
    const Hp = this.world.Hp;
    if (mv && now > this.manualUntil) this.lookH += (mv.h + 0.8 * m - this.lookH) * Math.min(1, dt * 2.5);
    this.lookH = Math.max(this.H * 0.3, Math.min(Hp - this.H * 0.3, this.lookH));
    const tx = mv ? lerp(this.W / 2, mv.u, 0.55) : this.W / 2;
    const tz = mv ? mv.v : 0;
    const c = this.cam;
    const ease = Math.min(1, dt * 3);
    this.follow.x += (tx - this.follow.x) * ease;
    this.follow.z += (tz - this.follow.z) * ease;
    const flatY = this.outro >= 0 ? Math.max(this.H / 2, Math.min(Hp - this.H / 2, Hp - this.lookH)) : this.savedScroll + this.H / 2;
    c.x = lerp(this.W / 2, this.follow.x, k);
    c.y = lerp(flatY, Hp - this.lookH, k);
    c.z = this.follow.z * k;
    // on the way in (and out) the camera swoops round and pulls back, then settles at her eye level
    const swoop = Math.sin(Math.PI * k);
    const read = this.flat ? 1 : 0;
    c.yaw = ((-12 * (1 - read)) * DEG + this.parallax + this.orbitYaw) * k + swoop * 26 * DEG;
    c.pitch = ((-7 * (1 - read)) * DEG + this.orbitPitch) * k - swoop * 8 * DEG;
    c.back = this.herPx * 0.5 * k + swoop * this.herPx * 1.6;
    this.shake *= Math.max(0, 1 - dt * 8);
    this.PV = this.viewMatrix(c).multiply(Matrix.Translation(0, Math.sin(now / 30) * this.shake, 0));
    this.PVinv = this.PV.clone().invert();
    this.root.style.transform = `perspective(${this.P}px) ` + m3d(Matrix.Translation(this.W / 2, Hp / 2, 0).multiply(this.PV));

    this.sky.style.opacity = String(clamp01(k * 1.4));
    this.world.ground.style.opacity = String(clamp01(k * 2));
    // what comes within a third of the perspective distance of the camera is hidden (CSS 3D breaks up past it)
    this.world.update(now, dt, k > 0.5 ? c.z + c.back + this.P * 0.6 : Infinity);
    this.mover?.update(dt, this.world.cubes);

    // the first ripple: a ring of light spreading over the page from where she was peeking, as it comes apart
    const rp = clamp01((now - this.introStart - 100) / 1400);
    const R = rp * Math.max(this.W, this.H) * 1.6;
    const rs = this.ripple.style;
    rs.width = rs.height = `${R * 2}px`;
    rs.transform = `translate3d(${(this.origin.x - R).toFixed(1)}px, ${(this.origin.y - R).toFixed(1)}px, 2px)`;
    rs.opacity = String(this.outro >= 0 ? 0 : (1 - rp) * 0.9);

    // her ring (where she appears) and contact shadow, flat on what is under her
    const reveal = this.leviRevealStart < 0 ? 0 : clamp01((now - this.leviRevealStart) / 1100);
    this.leviReveal = this.outro >= 0 ? Math.min(this.leviReveal, 1 - clamp01((now - this.outro) / 600)) : reveal;
    if (mv) {
      const sup = this.world.supportAt(mv.u, mv.v, mv.h + 2);
      const above = mv.h - sup.h;
      const size = this.herPx * 0.45 * (1 + above / this.herPx);
      for (const [el, sz, op, h] of [
        [this.ring, this.herPx * 0.8, Math.sin(Math.PI * clamp01(this.leviReveal * 1.1)) * 0.9, sup.h + 1.5],
        [this.shadow, size, this.leviReveal * k * Math.max(0.25, 1 - above / this.herPx), sup.h + 1],
      ] as const) {
        el.style.width = el.style.height = `${sz}px`;
        el.style.transform = `translate3d(${(mv.u - sz / 2).toFixed(1)}px, ${(Hp - h - sz / 2).toFixed(1)}px, ${mv.v.toFixed(1)}px) rotateX(90deg)`;
        el.style.opacity = String(op);
      }
    }
    if (this.levi) {
      const rv = easeInOut(this.leviReveal);
      this.canvas.style.opacity = rv > 0 ? '1' : '0';
      this.canvas.style.clipPath = rv >= 1 ? '' : `inset(${(1 - rv) * 100}% 0 0 0)`;
    }
  };

  /** Her model (MMD units: x her left, y up, z away from the viewer) -> world: B2P stands her up in the world's
   * axes, then her heading and spot. */
  private herToPage = Matrix.Identity();
  private get k() {
    return this.world.m / MMD_SCALE;
  }
  private syncLevi() {
    const levi = this.levi!;
    const mv = this.mover!;
    const k = this.k;
    const B2P = Matrix.FromValues(k, 0, 0, 0, 0, 0, k, 0, 0, -k, 0, 0, 0, 0, 0, 1);
    this.herToPage = B2P.multiply(Matrix.RotationZ(-mv.heading)).multiply(Matrix.Translation(mv.u, mv.v, mv.h));
    const toView = this.herToPage.multiply(this.W2C).multiply(this.PV);
    // the WebGL camera: the CSS viewer at (0, 0, P) looking down -z, carried into her space
    const S = Matrix.Scaling(1 / k, -1 / k, -1 / k);
    const Vb = toView.multiply(S);
    const camWorld = Matrix.Translation(0, 0, -this.P / k).multiply(Vb.clone().invert());
    levi.setCamera(camWorld, 2 * Math.atan(this.H / 2 / this.P));
    // the blocks (and cubes) in front of her hide her
    const inv = this.herToPage.clone().invert();
    const occ: Matrix[] = [];
    const box = (u: number, w: number, v: number, d: number, h: number, hh: number) =>
      occ.push(Matrix.Scaling(w, d, hh).multiply(Matrix.Translation(u + w / 2, v - d / 2, h + hh / 2)).multiply(inv));
    for (const b of this.world.blocks()) box(b.u, b.w, b.z, b.d, b.h0, b.h1 - b.h0);
    const held = mv.carrying;
    if (held) box(held.u, held.w, held.z, held.d, held.h0, held.h1 - held.h0);
    for (const c of this.world.cubes) box(c.u - c.s / 2, c.s, c.v + c.s / 2, c.s, c.h, c.s);
    levi.setOccluders(occ);
  }
  /** A world point in her Babylon space (for gaze). */
  toBabylon(u: number, v: number, h: number) {
    return Vector3.TransformCoordinates(new Vector3(u, v, h), this.herToPage.clone().invert());
  }

  // ------------------------------------------------------------------ leaving
  exit() {
    if (this.outro >= 0) return;
    this.outro = performance.now();
    this.brain?.farewell();
    this.menu.hidden = true;
    setTimeout(() => this.world.implode(performance.now()), 450);
    try {
      sessionStorage.removeItem(STORE);
    } catch {
      /* ignore */
    }
  }

  private teardown() {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    this.unbind();
    this.brain?.dispose();
    this.levi?.dispose();
    this.levi = null;
    for (const el of this.els) el.remove();
    const scroll = this.cam.y - this.H / 2;
    this.world.restore();
    this.style.remove();
    this.html.classList.remove('lc-3d');
    this.html.style.removeProperty('--lc-page-bg');
    if (this.savedRootStyle === null) this.root.removeAttribute('style');
    else this.root.setAttribute('style', this.savedRootStyle);
    window.scrollTo(0, scroll);
    active = null;
    this.onExit?.();
  }

  /** Take a new page apart (a route change, a resize); she lands on it again. */
  private rebuild() {
    const cubes = this.world.cubes;
    this.world.restore();
    const s = this.root.style;
    s.height = 'auto';
    const Hp = Math.max(this.root.scrollHeight, this.H);
    s.height = `${Hp}px`;
    s.top = `${(this.H - Hp) / 2}px`;
    this.world = new Diorama(this.root, this.herPx);
    this.world.build({ x: this.W / 2, y: this.H * 0.4 });
    this.world.world.append(this.ring, this.shadow, this.ripple);
    for (const c of cubes) c.el.remove();
    this.world.explode(performance.now());
    this.lookH = Hp - this.H / 2;
    this.manualUntil = 0;
    this.introStart = performance.now() - this.introDur;
    if (this.mover && this.levi) {
      const old = this.mover;
      this.mover = new Mover(this.world, this.levi);
      this.mover.place(old.u, 0.55 * this.world.m, Hp + this.H, null);
      this.mover.heading = old.heading;
      this.mover.onLand = old.onLand;
      this.brain?.setMover(this.mover);
      this.leviRevealStart = -1;
      this.leviReveal = 0;
      this.placed = false;
    }
  }

  // ------------------------------------------------------------------ input
  private dragging = false;
  private dragStart: { x: number; y: number; yaw: number; pitch: number } | null = null;
  private held: { cube: Cube; last: { u: number; h: number; t: number }; vu: number; vh: number } | null = null;
  private carrying: { x: number; y: number; started: boolean } | null = null;
  private pageDown: { x: number; y: number } | null = null;
  private unbinders: (() => void)[] = [];
  private on<K extends keyof WindowEventMap>(target: Window | Document | HTMLElement, type: K | string, fn: (e: never) => void, opts?: AddEventListenerOptions) {
    target.addEventListener(type, fn as EventListener, opts);
    this.unbinders.push(() => target.removeEventListener(type, fn as EventListener, opts));
  }
  private unbind() {
    for (const u of this.unbinders) u();
    this.unbinders = [];
  }

  /** A world ray (Babylon) through a screen point. */
  ray(x: number, y: number): Ray | null {
    const l = this.levi;
    if (!l) return null;
    const s = l.engine.getHardwareScalingLevel();
    return l.scene.createPickingRay(x / s, y / s, Matrix.Identity(), l.camera);
  }
  hitAt(x: number, y: number): { region: HitRegion; point: Vector3 } | null {
    const r = this.ray(x, y);
    return r && this.levi && this.leviReveal > 0.9 ? this.levi.hit(r) : null;
  }
  /** Is an event target part of the page (not the sky, ground, cubes or our UI)? */
  overPanel(target: EventTarget | null) {
    return target instanceof Node && this.root.contains(target) && !this.world.world.contains(target);
  }
  private onSky(target: EventTarget | null) {
    return target === this.sky || target === this.world.ground || (target as HTMLElement)?.id === 'lc-stars' || target === document.body || target === this.html;
  }

  private bindEvents() {
    this.on(window, 'resize', () => {
      this.W = document.documentElement.clientWidth;
      this.H = innerHeight;
      this.P = Math.max(1200, Math.hypot(this.W, this.H) * 1.15);
      this.herPx = Math.round(Math.min(380, Math.max(160, Math.min(this.H * 0.4, this.W * 0.5))));
      this.root.style.width = `${this.W}px`;
      this.levi?.engine.resize();
      this.rebuild();
    });
    this.on(window, 'pointermove', (e: PointerEvent) => {
      this.mx = (e.clientX / innerWidth) * 2 - 1;
      const onPanel = this.overPanel(e.target);
      if (this.held) {
        const c = this.held.cube;
        const p = this.onPlaneV(e.clientX, e.clientY, c.v);
        if (p) {
          const t = performance.now();
          const dtt = Math.max(1, t - this.held.last.t) / 1000;
          this.held.vu = this.held.vu * 0.5 + ((p.u - this.held.last.u) / dtt) * 0.5;
          this.held.vh = this.held.vh * 0.5 + ((p.h - this.held.last.h) / dtt) * 0.5;
          this.held.last = { ...p, t };
          c.u = p.u;
          c.h = Math.max(this.world.supportAt(p.u, c.v).h, p.h - c.s / 2);
        }
        return;
      }
      if (this.carrying && this.mover) {
        if (!this.carrying.started && Math.hypot(e.clientX - this.carrying.x, e.clientY - this.carrying.y) > 10) {
          this.carrying.started = true;
          this.mover.pickUp();
          this.brain?.pickedUp();
        }
        if (this.carrying.started) {
          // she hangs from the cursor by her head: her feet are most of her height below it
          const p = this.onPlaneV(e.clientX, e.clientY, this.mover.v);
          if (p) this.mover.carryTo(p.u, p.h - 1.3 * this.world.m);
          return;
        }
      }
      if (this.dragging && this.dragStart) {
        this.orbitYaw = Math.max(-45 * DEG, Math.min(45 * DEG, this.dragStart.yaw + ((e.clientX - this.dragStart.x) / innerWidth) * 90 * DEG));
        this.orbitPitch = Math.max(-25 * DEG, Math.min(20 * DEG, this.dragStart.pitch - ((e.clientY - this.dragStart.y) / innerHeight) * 50 * DEG));
      }
      const hit = this.hitAt(e.clientX, e.clientY);
      this.canvas.classList.toggle('lc-hot', !!hit && this.outro < 0);
      this.canvas.classList.toggle('lc-face', hit?.region === 'head' || hit?.region === 'face');
      this.brain?.pointerMove(e, hit, onPanel);
    }, { passive: true });
    this.on(window, 'pointerdown', (e: PointerEvent) => {
      if (!this.menu.hidden && !this.menu.contains(e.target as Node) && e.target !== this.fab && !this.fab.contains(e.target as Node)) this.menu.hidden = true;
      const hit = this.hitAt(e.clientX, e.clientY);
      if (hit) {
        this.carrying = { x: e.clientX, y: e.clientY, started: false };
        this.brain?.pointerDown(e, hit);
        return;
      }
      const cubeEl = (e.target as HTMLElement)?.closest?.('.lc-cube') as HTMLElement | null;
      const cube = cubeEl && this.world.cubes.find((c) => c.el === cubeEl);
      if (cube) {
        cube.held = true;
        cube.vu = cube.vv = cube.vh = 0;
        this.held = { cube, last: { u: cube.u, h: cube.h, t: performance.now() }, vu: 0, vh: 0 };
        return;
      }
      const t = e.target as HTMLElement;
      if (this.onSky(t)) {
        this.dragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY, yaw: this.orbitYaw, pitch: this.orbitPitch };
      } else if ((this.overPanel(t) || t?.closest?.('.lc-shell')) && !t.closest?.(INTERACTIVE)) {
        // a plain click on a component (not a link, a button, a field) sends her onto it
        this.pageDown = { x: e.clientX, y: e.clientY };
      }
    });
    this.on(window, 'pointerup', (e: PointerEvent) => {
      if (this.held) {
        const { cube, vu, vh } = this.held;
        cube.held = false;
        // a throw: the cursor's speed, capped, and a little toss toward the page
        const sp = Math.hypot(vu, vh);
        const cap = 9 * this.world.m;
        const f = sp > cap ? cap / sp : 1;
        cube.vu = vu * f;
        cube.vh = vh * f;
        cube.vv = -Math.min(sp * f * 0.15, 1.5 * this.world.m);
        cube.spin = (Math.random() - 0.5) * sp * 0.4;
        cube.thrownAt = performance.now();
        cube.hitAt = 0;
        this.held = null;
        this.brain?.cubeThrown(cube);
        return;
      }
      if (this.carrying) {
        const was = this.carrying.started;
        this.carrying = null;
        if (was) {
          this.mover?.drop();
          return;
        }
      }
      const wasDrag = this.dragging && this.dragStart && Math.hypot(e.clientX - this.dragStart.x, e.clientY - this.dragStart.y) > 6;
      const pd = this.pageDown;
      this.pageDown = null;
      const clicked = (this.dragging && !wasDrag) || (!!pd && Math.hypot(e.clientX - pd.x, e.clientY - pd.y) < 6 && !String(getSelection() ?? '').trim());
      this.dragging = false;
      const hit = this.hitAt(e.clientX, e.clientY);
      this.brain?.pointerUp(e, hit, !!wasDrag);
      if (clicked && !hit) {
        const p = this.pick(e.clientX, e.clientY);
        if (p) this.brain?.groundClick({ u: p.u, block: p.block }, e.clientX, e.clientY, p.h);
      }
    });
    this.on(window, 'dblclick', (e: MouseEvent) => {
      const hit = this.hitAt(e.clientX, e.clientY);
      if (hit) return this.brain?.doubleClick(hit);
      const t = e.target as HTMLElement;
      if (t?.closest?.(INTERACTIVE) || !(this.overPanel(t) || t?.closest?.('.lc-shell'))) return;
      // a double click on a component: she fetches it and moves it somewhere else
      const p = this.pick(e.clientX, e.clientY)?.block ?? this.world.pieceOf(t);
      if (p) {
        getSelection()?.removeAllRanges();
        this.brain?.fetchBlock(p);
      }
    });
    this.on(this.canvas, 'contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      this.toggleMenu(e.clientX, e.clientY, 'below');
    });
    // scrolling moves the camera up and down the staircase (back to her a while after)
    let lastV = performance.now();
    this.on(window, 'wheel', (e: WheelEvent) => {
      if (this.menu.contains(e.target as Node)) return;
      const inner = (e.target as HTMLElement)?.closest?.('.kit-menu-panel, pre');
      if (inner && inner.scrollHeight > inner.clientHeight) return;
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * this.H : e.deltaY;
      this.scrollBy(dy);
      const now = performance.now();
      const v = dy / Math.max(8, now - lastV);
      lastV = now;
      this.brain?.scrolled(v, this.lookH <= this.H * 0.31);
    }, { passive: false });
    this.on(window, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !this.menu.hidden) this.menu.hidden = true;
      const t = e.target as HTMLElement;
      const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (!typing) {
        const page = this.H * 0.8;
        const d = ({ PageDown: page, PageUp: -page, ' ': e.shiftKey ? -page : page, Home: -1e9, End: 1e9 } as Record<string, number>)[e.key];
        if (d !== undefined) {
          this.scrollBy(d);
          if (e.key === ' ') e.preventDefault();
        }
      }
      this.brain?.key(e);
    });
    this.on(document, 'copy', () => this.brain?.copied());
    this.on(document, 'visibilitychange', () => this.brain?.visibility(document.visibilityState === 'visible'));
    // links the visitor lingers on (she points at them), route changes, language and theme
    this.on(this.root, 'pointerover', (e: PointerEvent) => {
      const a = (e.target as HTMLElement)?.closest?.('a, button');
      this.brain?.hoverLink(a as HTMLElement | null);
    }, { passive: true });
    this.on(this.root, 'click', (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest?.('a');
      if (a) this.brain?.clickedLink(a as HTMLAnchorElement);
    });
    const mo = new MutationObserver((recs) => {
      for (const r of recs) {
        if (r.attributeName === 'lang') this.brain?.languageChanged();
        if (r.attributeName === 'class') this.brain?.themeChanged(this.html.classList.contains('dark'));
      }
    });
    mo.observe(this.html, { attributes: true, attributeFilter: ['lang', 'class'] });
    this.unbinders.push(() => mo.disconnect());
    // route changes (react-router pushes history entries): the new page comes apart, and she is told
    let path = location.pathname;
    const iv = setInterval(() => {
      if (location.pathname !== path && this.outro < 0) {
        path = location.pathname;
        // let the new page render first
        setTimeout(() => this.alive && this.rebuild(), 80);
        this.brain?.navigated(path);
      }
    }, 250);
    this.unbinders.push(() => clearInterval(iv));
  }

  private scrollBy(dy: number) {
    this.lookH = Math.max(this.H * 0.3, Math.min(this.world.Hp - this.H * 0.3, this.lookH - dy));
    this.manualUntil = performance.now() + 7000;
  }
  /** The visitor is looking somewhere else than at her (they scrolled away). */
  get lookingAway() {
    return performance.now() < this.manualUntil;
  }

  /** The point the cursor is at, on a plane through her head facing the camera (Babylon). */
  cursorPoint(x: number, y: number): Vector3 | null {
    const r = this.ray(x, y);
    const head = this.levi?.bonePos('頭');
    if (!r || !head) return null;
    // the plane goes through her head, pulled a hair toward the viewer (a cursor on her face then means "looking
    // at me"). Further out, the camera's offset to her side would shift every point toward it, and a cursor beside
    // her head would read as straight ahead.
    const n = this.levi!.camera.getDirection(Vector3.Forward());
    const denom = Vector3.Dot(r.direction, n);
    if (Math.abs(denom) < 1e-6) return null;
    const plane = head.subtract(n.scale(1.5));
    const t = Vector3.Dot(plane.subtract(r.origin), n) / denom;
    return r.origin.add(r.direction.scale(Math.max(1, t)));
  }
  /** A screen point pushed back onto the world (for looking at links): what is under it. */
  screenPoint(x: number, y: number): Vector3 | null {
    const p = this.pick(x, y);
    return p ? this.toBabylon(p.u, p.v, p.h) : null;
  }
  cameraPos() {
    return this.levi?.camera.position.clone() ?? null;
  }
  /** Her head on screen (CSS px), for speech bubbles and gestures around her. */
  headScreen() {
    const p = this.levi?.bonePos('頭');
    return p && this.levi ? this.levi.project(p.add(new Vector3(0, 2.6, 0))) : null;
  }
  feetScreen() {
    const mv = this.mover;
    return mv ? this.screenOf(mv.u, mv.v, mv.h) : null;
  }
  /** Is a world spot on screen (with a margin)? */
  inView(u: number, v: number, h: number, margin = 60) {
    const s = this.screenOf(u, v, h);
    return s.x > margin && s.x < this.W - margin && s.y > margin * 2 && s.y < this.H - margin;
  }
  /** A ledge near the middle of the view (where she goes when the visitor looks elsewhere). */
  viewGoal(): Goal | null {
    for (const [fx, fy] of [[0.5, 0.62], [0.35, 0.6], [0.65, 0.6], [0.5, 0.45], [0.5, 0.8]] as const) {
      const p = this.pick(this.W * fx, this.H * fy);
      if (p?.block) return { u: p.u, block: p.block };
    }
    return null;
  }
  /** A random ledge in view (somewhere for her to go). */
  randomGoal(): Goal | null {
    for (let i = 0; i < 8; i++) {
      const p = this.pick(this.W * (0.1 + Math.random() * 0.8), this.H * (0.2 + Math.random() * 0.7));
      if (p?.block && p.block !== this.mover?.on) return { u: p.u, block: p.block };
    }
    return null;
  }
  /** A little jolt (a stomp). */
  bump(v: number) {
    this.shake = Math.max(this.shake, v * 3);
  }
  get introDone() {
    return this.placed && this.leviReveal >= 1;
  }

  /** Little pixel bits flying from a screen point (mining, landing). */
  burst(x: number, y: number, colors: string[], n = 10) {
    for (let i = 0; i < n; i++) {
      const b = document.createElement('div');
      b.className = 'lc-bit';
      b.style.background = colors[i % colors.length]!;
      b.style.left = `${x}px`;
      b.style.top = `${y}px`;
      document.body.appendChild(b);
      const ang = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 120;
      b.animate(
        [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * sp}px, ${Math.sin(ang) * sp * 0.5 - 40}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(ang) * sp * 1.2}px, ${Math.sin(ang) * sp * 0.5 + 60}px) rotate(${Math.random() * 540}deg)`, opacity: 0 },
        ],
        { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.4,1)' },
      ).onfinish = () => b.remove();
    }
  }

  /** A short speech bubble over her head. */
  say(text: string, ms = 1800) {
    const h = this.headScreen();
    if (!h) return;
    const b = document.createElement('div');
    b.className = 'lc-ui lc-bubble';
    b.textContent = text;
    b.style.left = `${h.x}px`;
    b.style.top = `${h.y}px`;
    document.body.appendChild(b);
    this.els.push(b);
    setTimeout(() => (b.style.opacity = '0'), ms);
    setTimeout(() => b.remove(), ms + 400);
  }

  // ------------------------------------------------------------------ menu
  toggleMenu(x: number, y: number, where: 'above' | 'below') {
    if (!this.menu.hidden) {
      this.menu.hidden = true;
      return;
    }
    this.renderMenu();
    this.menu.hidden = false;
    const r = this.menu.getBoundingClientRect();
    const left = Math.max(8, Math.min(innerWidth - r.width - 8, x));
    const top = where === 'above' ? Math.max(8, y - r.height) : Math.min(innerHeight - r.height - 8, y);
    this.menu.style.left = `${left}px`;
    this.menu.style.top = `${top}px`;
    (this.menu.querySelector('button') as HTMLButtonElement | null)?.focus({ preventScroll: true });
  }
  private renderMenu() {
    const t = this.t;
    const seg = (['auto', 'always', 'never'] as LookMode[])
      .map((m) => `<button type="button" data-look="${m}" aria-pressed="${this.look === m}">${t.look[m]}</button>`)
      .join('');
    this.menu.innerHTML = `
      <h4>LeviChan</h4>
      <p>${t.hint}</p>
      <div class="lc-row"><span>${t.lookLabel}</span><span class="lc-seg">${seg}</span></div>
      <label class="lc-row"><span>${t.quiet}</span><input type="checkbox" data-quiet ${this.quiet ? 'checked' : ''}></label>
      <label class="lc-row"><span>${t.flat}</span><input type="checkbox" data-flat ${this.flat ? 'checked' : ''}></label>
      <button type="button" class="lc-item" data-exit>${t.exit}</button>`;
    this.menu.querySelectorAll<HTMLButtonElement>('[data-look]').forEach((b) =>
      b.addEventListener('click', () => {
        this.look = b.dataset.look as LookMode;
        this.savePrefs();
        this.renderMenu();
      }),
    );
    this.menu.querySelector<HTMLInputElement>('[data-quiet]')!.addEventListener('change', (e) => {
      this.quiet = (e.target as HTMLInputElement).checked;
      this.savePrefs();
    });
    this.menu.querySelector<HTMLInputElement>('[data-flat]')!.addEventListener('change', (e) => {
      this.flat = (e.target as HTMLInputElement).checked;
      this.savePrefs();
    });
    this.menu.querySelector<HTMLButtonElement>('[data-exit]')!.addEventListener('click', () => this.exit());
  }
}

let active: Space | null = null;

/** Open the 3D space (idempotent). */
export async function enter(opts: EnterOptions): Promise<void> {
  if (active) return;
  active = new Space(opts);
  await active.start(!!opts.instant);
}
export function exit() {
  active?.exit();
}
export function isActive() {
  return !!active;
}
export type { Space };
