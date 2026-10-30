// The 3D space: the page lies down as the ground of a diorama (./diorama) whose components rise out of it as blocks,
// seen by a tilted camera; LeviChan lives on it (WebGL, with a camera matched to the CSS perspective), walks, climbs
// and hides among the blocks (./mover), and a small brain (./brain) turns what the visitor does into what she does.
// Everything here is loaded on demand, when the peeking avatar is clicked (./LeviChanPeek).
import css from './levichan.css?inline';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Ray } from '@babylonjs/core/Culling/ray.pure';
import { Levi, MMD_SCALE, type HitRegion } from './levi';
import { Brain } from './brain';
import { Diorama, type Cube } from './diorama';
import { Mover } from './mover';
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

/** A tiny seeded RNG, so the cubes' pixel textures are the same on every visit. */
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}
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

/** The camera over the page: the page point it looks at, the tilt of the page away from the screen, a turn about
 * the page's normal, and how far back it sits. All zero (and the target at the viewport's centre): the flat page. */
interface Cam {
  tu: number;
  tv: number;
  tilt: number;
  turn: number;
  back: number;
  drop: number;
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
  /** her height on the page (px) */
  herPx = 240;

  // the camera: where it is, where it goes, and what the visitor adds (drag, pointer parallax, reading)
  private cam: Cam = { tu: 0, tv: 0, tilt: 0, turn: 0, back: 0, drop: 0 };
  private scrollTarget = 0;
  private orbitTurn = 0;
  private orbitTilt = 0;
  private mx = 0;
  private parallax = 0;
  /** reading focus: the page tilts toward the viewer while they read */
  private read = 0;
  private readTarget = 0;
  private overPanelSince = 0;
  private offPanelSince = 0;
  flat = false;
  look: LookMode = 'auto';
  quiet = false;
  private intro = 0;
  private introStart = 0;
  private introDur = 3000;
  private outro = -1;
  private leviReveal = 0;
  private leviRevealStart = -1;
  private PV = Matrix.Identity();
  private PVinv = Matrix.Identity();
  private lastFrame = performance.now();
  private origin = { u: 0, v: 0 };

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
    this.herPx = Math.round(Math.min(420, Math.max(160, Math.min(this.H * 0.42, this.W * 0.5))));
    this.savedScroll = window.scrollY;
    const peek = document.querySelector('.lc-peek-head')?.getBoundingClientRect();
    this.origin = peek ? { u: peek.left + peek.width / 2, v: peek.top + window.scrollY + peek.height } : { u: this.W * 0.7, v: this.savedScroll + this.H * 0.5 };

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

    // the page becomes the diorama's ground: a fixed box as tall as the page, centred on the viewport
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
    this.makeCubes();

    this.cam = { tu: this.W / 2, tv: this.savedScroll + this.H / 2, tilt: 0, turn: 0, back: 0, drop: 0 };
    this.scrollTarget = this.cam.tv;
    this.introStart = performance.now();
    if (instant || reduced()) this.introDur = 1;
    this.world.rise(this.introStart + (instant ? -1e5 : 0));

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
    this.mover = new Mover(this.world, this.levi);
    // she arrives on the ground in front of where her head was peeking, facing the viewer
    const spawn = this.freeSpot(Math.max(this.W * 0.25, Math.min(this.W * 0.75, this.origin.u)), this.origin.v + this.herPx * 0.6);
    this.mover.place(spawn.u, spawn.v);
    this.leviRevealStart = performance.now() + Math.max(0, this.introDur - (performance.now() - this.introStart)) * 0.55;
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

  /** A free spot on the ground near a page point (not inside a block), preferring the side toward the camera. */
  freeSpot(u: number, v: number) {
    const r = this.herPx * 0.16;
    const order = [2, 1, 3, 0, 4, 7, 5, 6];
    for (let ring = 0; ring < 16; ring++) {
      for (const a of order) {
        const ang = (a / 8) * Math.PI * 2;
        const pu = u + Math.cos(ang) * ring * r;
        const pv = v + Math.sin(ang) * ring * r;
        if (pu < r || pu > this.W - r || pv < r || pv > this.world.Hp - r) continue;
        if (this.world.supportAt(pu, pv, Infinity, r).h < 2) return { u: pu, v: pv };
      }
    }
    return { u, v };
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
    // fewer of them on a narrow screen
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
      // they fall in from above, spread over the view
      const u = this.W * (0.12 + 0.76 * r());
      const v = this.savedScroll + this.H * (0.25 + 0.6 * r());
      const spot = this.world.supportAt(u, v);
      const c = this.world.addCube(el, size, u, v, spot.h + 900 + i * 260);
      c.spin = (r() - 0.5) * 220;
      el.style.opacity = '0';
    });
  }

  // ------------------------------------------------------------------ the camera
  /** Page-local (u, v, h) -> CSS view space (x right, y down, z toward the viewer, origin at the viewport centre). */
  private viewMatrix(c: Cam) {
    return Matrix.Translation(-c.tu, -c.tv, 0)
      .multiply(Matrix.RotationZ(c.turn))
      .multiply(Matrix.RotationX(c.tilt))
      .multiply(Matrix.Translation(0, c.drop, -c.back));
  }

  /** The page point under a screen point, on the plane at height h. */
  pagePoint(x: number, y: number, h = 0): { u: number; v: number } | null {
    const O = Vector3.TransformCoordinates(new Vector3(0, 0, this.P), this.PVinv);
    const Q = Vector3.TransformCoordinates(new Vector3(x - this.W / 2, y - this.H / 2, 0), this.PVinv);
    const D = Q.subtract(O);
    if (Math.abs(D.z) < 1e-6) return null;
    const t = (h - O.z) / D.z;
    if (t <= 0) return null;
    return { u: O.x + D.x * t, v: O.y + D.y * t };
  }
  /** Screen point of a page point. */
  screenOf(u: number, v: number, h = 0) {
    const p = Vector3.TransformCoordinates(new Vector3(u, v, h), this.PV);
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

    // the camera's travel: flat page (k = 0) -> the diorama (k = 1); the outro runs it back once she is gone
    let k = easeInOut(clamp01(this.intro * 1.15));
    if (this.outro >= 0) {
      const o = clamp01((now - this.outro - 500) / 1500);
      k = 1 - easeInOut(o);
      if (o >= 1 && this.world.flat) {
        this.teardown();
        return;
      }
    }

    // reading focus: flatter after the pointer has rested on the page a moment, back after it left a while
    if (this.flat) this.readTarget = 1;
    else if (this.overPanelSince && now - this.overPanelSince > 900) this.readTarget = 1;
    else if (this.offPanelSince && now - this.offPanelSince > 1200) this.readTarget = 0;
    this.read += (this.readTarget - this.read) * Math.min(1, dt * 2.5);
    this.parallax += (this.mx * 3 * DEG - this.parallax) * Math.min(1, dt * 2);
    if (!this.dragging) {
      this.orbitTurn *= 1 - Math.min(1, dt * 0.35);
      this.orbitTilt *= 1 - Math.min(1, dt * 0.35);
    }
    // scrolling glides; leaving, the camera comes back to a scroll position the flat page can show
    const maxV = Math.max(this.H / 2, this.world.Hp - this.H * 0.35);
    this.scrollTarget = Math.max(this.H * 0.35, Math.min(maxV, this.scrollTarget));
    const tv = this.outro >= 0 ? Math.max(this.H / 2, Math.min(this.world.Hp - this.H / 2, this.scrollTarget)) : this.scrollTarget;

    const c = this.cam;
    c.tv += (tv - c.tv) * Math.min(1, dt * 6);
    c.tu = this.W / 2;
    // on the way in (and out) the camera swoops: it swings round and pulls back further, then settles
    const swoop = Math.sin(Math.PI * k);
    c.tilt = (lerp(40, 20, this.read) * DEG + this.orbitTilt) * k + swoop * 10 * DEG;
    c.turn = (this.parallax * (1 - this.read * 0.7) + this.orbitTurn) * k - swoop * 24 * DEG;
    c.back = lerp(this.herPx * 1.1, this.herPx * 0.5, this.read) * k + swoop * this.herPx * 1.2;
    c.drop = this.H * 0.06 * k;
    this.PV = this.viewMatrix(c);
    this.PVinv = this.PV.clone().invert();
    this.root.style.transform = `perspective(${this.P}px) ` + m3d(Matrix.Translation(this.W / 2, this.world.Hp / 2, 0).multiply(this.PV));

    this.sky.style.opacity = String(clamp01(k * 1.4));
    this.world.ground.style.opacity = String(clamp01(k * 2));
    this.world.update(now, dt);
    this.mover?.update(dt, this.world.cubes);
    const cubesIn = clamp01((now - this.introStart - 900) / 300);
    for (const cube of this.world.cubes) cube.el.style.opacity = String(this.outro >= 0 ? k : cubesIn);

    // the first ripple: a ring of light spreading over the ground from where she was peeking
    const rp = clamp01((now - this.introStart - 150) / 1600);
    const R = rp * Math.max(this.W, this.H) * 1.6;
    const rs = this.ripple.style;
    rs.width = rs.height = `${R * 2}px`;
    rs.left = `${this.origin.u - R}px`;
    rs.top = `${this.origin.v - R}px`;
    rs.opacity = String(this.outro >= 0 ? 0 : (1 - rp) * 0.9);

    // her ring (spawn portal) and contact shadow
    const reveal = this.leviRevealStart < 0 ? 0 : clamp01((now - this.leviRevealStart) / 1100);
    this.leviReveal = this.outro >= 0 ? Math.min(this.leviReveal, 1 - clamp01((now - this.outro) / 600)) : reveal;
    const mv = this.mover;
    if (mv) {
      const sup = this.world.supportAt(mv.u, mv.v, mv.h + 2);
      const above = mv.h - sup.h;
      const size = this.herPx * 0.5 * (1 + above / this.herPx);
      for (const [el, sz, op, h] of [
        [this.ring, this.herPx * 0.8, Math.sin(Math.PI * clamp01(this.leviReveal * 1.1)) * 0.9, sup.h + 0.6],
        [this.shadow, size, this.leviReveal * k * Math.max(0.25, 1 - above / this.herPx), sup.h + 0.4],
      ] as const) {
        el.style.width = el.style.height = `${sz}px`;
        el.style.transform = `translate3d(${(mv.u - sz / 2).toFixed(1)}px, ${(mv.v - sz / 2).toFixed(1)}px, ${h.toFixed(1)}px)`;
        el.style.opacity = String(op);
      }
    }
    if (this.levi) {
      const rv = easeInOut(this.leviReveal);
      this.canvas.style.opacity = rv > 0 ? '1' : '0';
      this.canvas.style.clipPath = rv >= 1 ? '' : `inset(${(1 - rv) * 100}% 0 0 0)`;
    }
  };

  /** Her model (MMD units: x her left, y up, z away from the viewer) -> page-local: B2P lays it on the page, then
   * her heading and spot. */
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
    const toView = this.herToPage.multiply(this.PV);
    // the WebGL camera: the CSS viewer at (0, 0, P) looking down -z, carried into her space
    const S = Matrix.Scaling(1 / k, -1 / k, -1 / k);
    const Vb = toView.multiply(S);
    const camWorld = Matrix.Translation(0, 0, -this.P / k).multiply(Vb.clone().invert());
    levi.setCamera(camWorld, 2 * Math.atan(this.H / 2 / this.P));
    // the blocks (and cubes) in front of her hide her
    const inv = this.herToPage.clone().invert();
    const occ: Matrix[] = [];
    for (const b of this.world.boxes(3)) occ.push(Matrix.Scaling(b.w, b.d, b.h).multiply(Matrix.Translation(b.u + b.w / 2, b.v + b.d / 2, b.h / 2)).multiply(inv));
    for (const c of this.world.cubes) occ.push(Matrix.Scaling(c.s, c.s, c.s).multiply(Matrix.Translation(c.u, c.v, c.h + c.s / 2)).multiply(inv));
    levi.setOccluders(occ);
  }
  /** A page point in her Babylon space (for gaze). */
  toBabylon(u: number, v: number, h: number) {
    return Vector3.TransformCoordinates(new Vector3(u, v, h), this.herToPage.clone().invert());
  }

  // ------------------------------------------------------------------ leaving
  exit() {
    if (this.outro >= 0) return;
    this.outro = performance.now();
    this.brain?.farewell();
    this.menu.hidden = true;
    setTimeout(() => this.world.sink(performance.now()), 450);
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
    const scroll = this.cam.tv - this.H / 2;
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

  /** Rebuild the diorama for a new page (a route change), keeping her on it. */
  private rebuild() {
    const cubes = this.world.cubes;
    this.world.restore();
    const s = this.root.style;
    s.height = 'auto';
    const Hp = Math.max(this.root.scrollHeight, this.H);
    s.height = `${Hp}px`;
    s.top = `${(this.H - Hp) / 2}px`;
    this.world = new Diorama(this.root, this.herPx);
    this.world.build({ u: this.W / 2, v: this.H * 0.4 });
    this.world.world.append(this.ring, this.shadow, this.ripple);
    for (const c of cubes) {
      c.v = Math.min(c.v, Hp - c.s);
      c.h += 300;
      this.world.cubes.push(c);
      this.world.world.appendChild(c.el);
    }
    this.world.rise(performance.now());
    this.scrollTarget = this.H / 2;
    if (this.mover && this.levi) {
      const old = this.mover;
      this.mover = new Mover(this.world, this.levi);
      const spot = this.freeSpot(Math.min(old.u, this.W - 40), Math.min(old.v, Hp - 40));
      this.mover.place(spot.u, spot.v);
      this.mover.heading = old.heading;
      this.mover.onLand = old.onLand;
      this.brain?.setMover(this.mover);
    }
  }

  // ------------------------------------------------------------------ input
  private dragging = false;
  private dragStart: { x: number; y: number; turn: number; tilt: number } | null = null;
  private held: { cube: Cube; last: { u: number; v: number; t: number }; vu: number; vv: number } | null = null;
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
  /** Is an event target part of the page (not the ground, cubes or our UI)? */
  overPanel(target: EventTarget | null) {
    return target instanceof Node && this.root.contains(target) && !this.world.world.contains(target);
  }
  private onGround(target: EventTarget | null) {
    return target === this.sky || target === this.world.ground || (target as HTMLElement)?.id === 'lc-stars';
  }

  private bindEvents() {
    this.on(window, 'resize', () => {
      this.W = document.documentElement.clientWidth;
      this.H = innerHeight;
      this.root.style.width = `${this.W}px`;
      this.levi?.engine.resize();
      this.rebuild();
    });
    this.on(window, 'pointermove', (e: PointerEvent) => {
      this.mx = (e.clientX / innerWidth) * 2 - 1;
      const onPanel = this.overPanel(e.target);
      const now = performance.now();
      if (onPanel) {
        if (!this.overPanelSince) this.overPanelSince = now;
        this.offPanelSince = 0;
      } else {
        if (!this.offPanelSince) this.offPanelSince = now;
        this.overPanelSince = 0;
      }
      if (this.held) {
        const c = this.held.cube;
        const p = this.pagePoint(e.clientX, e.clientY, c.s * 1.2);
        if (p) {
          const t = performance.now();
          const dtt = Math.max(1, t - this.held.last.t) / 1000;
          this.held.vu = this.held.vu * 0.5 + ((p.u - this.held.last.u) / dtt) * 0.5;
          this.held.vv = this.held.vv * 0.5 + ((p.v - this.held.last.v) / dtt) * 0.5;
          this.held.last = { ...p, t };
          c.u = p.u;
          c.v = p.v;
          c.h = this.world.supportAt(p.u, p.v).h + c.s * 1.2;
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
          // she hangs from the cursor by her head: her feet are about her height below it on screen
          const p = this.pagePoint(e.clientX, e.clientY + this.herPx * 0.6, 0);
          if (p) this.mover.carryTo(p.u, p.v);
          return;
        }
      }
      if (this.dragging && this.dragStart) {
        this.orbitTurn = Math.max(-40 * DEG, Math.min(40 * DEG, this.dragStart.turn + ((e.clientX - this.dragStart.x) / innerWidth) * 90 * DEG));
        this.orbitTilt = Math.max(-25 * DEG, Math.min(25 * DEG, this.dragStart.tilt + ((e.clientY - this.dragStart.y) / innerHeight) * 50 * DEG));
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
        this.held = { cube, last: { u: cube.u, v: cube.v, t: performance.now() }, vu: 0, vv: 0 };
        return;
      }
      if (this.onGround(e.target)) {
        this.dragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY, turn: this.orbitTurn, tilt: this.orbitTilt };
      } else if (this.overPanel(e.target) && !(e.target as HTMLElement).closest?.(INTERACTIVE)) {
        // the page itself is the ground too: a plain click on it (not a link, a button, a field) sends her there
        this.pageDown = { x: e.clientX, y: e.clientY };
      }
    });
    this.on(window, 'pointerup', (e: PointerEvent) => {
      if (this.held) {
        const { cube, vu, vv } = this.held;
        cube.held = false;
        // a throw: the cursor's speed, capped, and a little loft
        const sp = Math.hypot(vu, vv);
        const cap = 9 * this.world.m;
        const f = sp > cap ? cap / sp : 1;
        cube.vu = vu * f;
        cube.vv = vv * f;
        cube.vh = Math.min(sp * f * 0.25, 3 * this.world.m);
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
      const fromGround = this.dragging || (!!pd && Math.hypot(e.clientX - pd.x, e.clientY - pd.y) < 6 && !String(getSelection() ?? '').trim());
      this.dragging = false;
      const hit = this.hitAt(e.clientX, e.clientY);
      this.brain?.pointerUp(e, hit, !!wasDrag);
      if (fromGround && !wasDrag && !hit) {
        const p = this.pagePoint(e.clientX, e.clientY, 0);
        if (p) this.brain?.groundClick(p.u, p.v, e.clientX, e.clientY);
      }
    });
    this.on(this.canvas, 'dblclick', (e: MouseEvent) => {
      const hit = this.hitAt(e.clientX, e.clientY);
      if (hit) this.brain?.doubleClick(hit);
    });
    this.on(this.canvas, 'contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      this.toggleMenu(e.clientX, e.clientY, 'below');
    });
    // the page scrolls by moving the camera along it
    let lastV = performance.now();
    this.on(window, 'wheel', (e: WheelEvent) => {
      if (this.menu.contains(e.target as Node)) return;
      const inner = (e.target as HTMLElement)?.closest?.('.kit-menu-panel, pre');
      if (inner && inner.scrollHeight > inner.clientHeight) return;
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * this.H : e.deltaY;
      this.scrollTarget += dy;
      const now = performance.now();
      const v = dy / Math.max(8, now - lastV);
      lastV = now;
      this.brain?.scrolled(v, this.scrollTarget >= this.world.Hp - this.H * 0.4);
    }, { passive: false });
    this.on(window, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !this.menu.hidden) this.menu.hidden = true;
      const t = e.target as HTMLElement;
      const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (!typing) {
        const page = this.H * 0.8;
        const d = ({ PageDown: page, PageUp: -page, ' ': e.shiftKey ? -page : page, Home: -1e9, End: 1e9 } as Record<string, number>)[e.key];
        if (d !== undefined) {
          this.scrollTarget += d;
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
    // route changes (react-router pushes history entries): a new page rises, and she is told
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
  /** A screen point pushed back onto the page (for looking at links): the page point under it. */
  screenPoint(x: number, y: number): Vector3 | null {
    const p = this.pagePoint(x, y, 0);
    return p ? this.toBabylon(p.u, p.v, 0) : null;
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
  /** Is a page spot on screen (with a margin)? */
  inView(u: number, v: number, margin = 60) {
    const s = this.screenOf(u, v, 0);
    return s.x > margin && s.x < this.W - margin && s.y > margin * 2 && s.y < this.H - margin;
  }
  /** A page point near the middle of the view. */
  viewCentre() {
    return this.pagePoint(this.W / 2, this.H * 0.62, 0) ?? { u: this.W / 2, v: this.cam.tv };
  }
  /** Kick the block she stands on (a stomp). */
  bump(v: number) {
    const mv = this.mover;
    if (mv?.on) this.world.bump(mv.on, -v * 40);
  }
  get introDone() {
    return this.intro >= 1 && this.leviReveal >= 1;
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
      if (!this.flat) this.readTarget = 0;
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
