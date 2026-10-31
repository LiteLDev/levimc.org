// The page taken apart, in three.js: each of its components (cards, buttons, headings, text, pictures, the bar...)
// is snapshotted and becomes a block of its own with real depth, scattered through the sky in
// no particular order: some stand upright, some lie flat like platforms, some turn sideways, some sit on others or
// hang in the air a hop away from a neighbour. She lives on them (./mover). The page itself is only hidden while
// the space is open; nothing in it is changed.
//
// World coordinates are metres: u right (three's x), h up (y), v toward the viewer (z). The flat page hangs as a
// wall in front of the scattered blocks, where the camera first sees it; the blocks fly out of it.
import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  NearestFilter,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  Vector3,
  type Material,
  type Texture,
} from 'three';
import { domToCanvas } from 'modern-screenshot';

/** A block's box: u..u+w across, h0..h1 up, z-d..z deep (its side toward the viewer at v = z). */
export interface Block {
  u: number;
  w: number;
  h0: number;
  h1: number;
  z: number;
  d: number;
}

export type Kind = 'card' | 'bar' | 'button' | 'media' | 'title' | 'heading' | 'text';
/** Which way a block's content faces: the viewer (+z), up (lying flat), or sideways. */
export type Facing = 'z' | 'up' | '+x' | '-x';
/** A short animation of a block (when she plays with it, or lands on it). */
export type Fx = 'press' | 'bounce' | 'spin' | 'flip' | 'wobble' | 'glow' | 'dip';

/** A link or control inside a component (page px, relative to the component). */
export interface Spot {
  el: HTMLElement;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Piece extends Block {
  el: HTMLElement;
  kind: Kind;
  /** the component on the page (px): its size, and where it showed on screen (document px) */
  pw: number;
  ph: number;
  hx: number;
  hy: number;
  /** its content's size (m) and the block's depth behind it */
  cw: number;
  ch: number;
  depth: number;
  facing: Facing;
  mesh: Mesh;
  front: MeshBasicMaterial;
  sides: MeshLambertMaterial;
  spots: Spot[];
  /** how far out of the page it is (0: flat, 1: in its spot), and the flight there */
  t: number;
  delay: number;
  axis: Vector3;
  spin: number;
  pop: number;
  /** she is carrying it (its spot is set each frame) */
  held: boolean;
  fx: { kind: Fx; t0: number; dur: number } | null;
  /** a glow it keeps (the story's awakened keystones), under its animations */
  tint: Color;
  flash: { mesh: Mesh; t0: number } | null;
}

/** A loose cube: falls, bounces, can be thrown. (u, v) is its centre, h its bottom. */
export interface Cube {
  mesh: Mesh;
  s: number;
  u: number;
  v: number;
  h: number;
  vu: number;
  vv: number;
  vh: number;
  spin: number;
  rot: number;
  held: boolean;
  /** last time it hit something hard, and when it was last thrown (for her reactions) */
  hitAt: number;
  thrownAt: number;
}

const TEXT_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'PRE', 'TABLE', 'FIGCAPTION', 'LABEL', 'DT', 'DD']);
const MEDIA_TAGS = new Set(['IMG', 'SVG', 'VIDEO', 'CANVAS', 'PICTURE', 'IFRAME']);
const SPOTS = 'a[href], button, summary, [role="tab"], [role="button"], input, select';
/** seconds a block takes to fly out to its spot */
const FLIGHT = 1.5;
/** the most components taken apart */
const MAX_PIECES = 160;
const FX_DUR: Record<Fx, number> = { press: 0.45, bounce: 1.1, spin: 1.4, flip: 1.3, wobble: 1.0, glow: 1.6, dip: 0.5 };
const UP = new Vector3(0, 1, 0);
const RIGHT = new Vector3(1, 0, 0);

export const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

function parseColor(c: string): [number, number, number, number] | null {
  const m = /rgba?\(([^)]+)\)/.exec(c);
  if (!m) return null;
  const p = m[1]!.split(/[ ,/]+/).filter(Boolean).map(Number);
  return [p[0]!, p[1]!, p[2]!, p[3] ?? 1];
}
const css = (c: [number, number, number, number], a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/** A tiny seeded RNG, so the layout (and the cubes' textures) are the same on every visit. */
export function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** A 16 px Minecraft-ish texture. */
export function pixelTexture(kind: 'grass' | 'dirt' | 'leaf' | 'log' | 'stone' | 'side', seed: number) {
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
  const t = new CanvasTexture(c);
  t.magFilter = NearestFilter;
  t.minFilter = NearestFilter;
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** A soft round spot (her shadow) or a glowing ring (where she appears). */
function roundTexture(ring: boolean) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  if (ring) {
    grad.addColorStop(0.55, 'rgba(127,212,164,0)');
    grad.addColorStop(0.8, 'rgba(127,212,164,0.9)');
    grad.addColorStop(1, 'rgba(127,212,164,0)');
  } else {
    grad.addColorStop(0, 'rgba(10,30,20,0.45)');
    grad.addColorStop(1, 'rgba(10,30,20,0)');
  }
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** The rotation that turns a block's content (facing +z, upright) the way it faces. */
const FACING: Record<Facing, Quaternion> = {
  z: new Quaternion(),
  up: new Quaternion().setFromAxisAngle(RIGHT, -Math.PI / 2),
  '+x': new Quaternion().setFromAxisAngle(UP, Math.PI / 2),
  '-x': new Quaternion().setFromAxisAngle(UP, -Math.PI / 2),
};
/** The box a block takes in the world (across, up, deep) for its content size and depth. */
function extent(cw: number, ch: number, depth: number, f: Facing): [number, number, number] {
  if (f === 'up') return [cw, depth, ch];
  if (f === '+x' || f === '-x') return [depth, ch, cw];
  return [cw, ch, depth];
}
/** The way a block's content faces (world). */
export function facingNormal(f: Facing) {
  return new Vector3(0, 0, 1).applyQuaternion(FACING[f]);
}

export class Diorama {
  readonly scene = new Scene();
  pieces: Piece[] = [];
  cubes: Cube[] = [];
  /** page px per metre */
  readonly m: number;
  /** the scattered blocks' half-size (m) */
  R = 8;
  /** the page's wall: the height its viewport's centre hangs at, and how far in front */
  readonly wall = { y: 1.6, z: 0 };
  /** bumped whenever a block moves for good (her paths are planned again) */
  version = 0;
  readonly ground: Mesh;
  readonly blob: Mesh;
  readonly ring: Mesh;
  private backdrop: Mesh | null = null;
  private readonly box = new BoxGeometry(1, 1, 1);
  private readonly sun: DirectionalLight;
  private readonly hemi: HemisphereLight;
  private readonly sky: [CanvasTexture, CanvasTexture];
  private readonly fogDay: Color;
  private night = 0;
  private t0 = 0;
  private leaving = -1;
  private readonly W: number;
  private readonly H: number;
  private readonly scroll: number;
  private readonly pageBg: [number, number, number, number];

  constructor(
    private readonly root: HTMLElement,
    viewport: { W: number; H: number; scroll: number },
  ) {
    this.W = viewport.W;
    this.H = viewport.H;
    this.scroll = viewport.scroll;
    this.m = clamp(this.W / 7, 130, 230);
    const dark = document.documentElement.classList.contains('dark');
    const bg = parseColor(getComputedStyle(document.body).backgroundColor);
    this.pageBg = bg && bg[3] > 0.5 ? bg : dark ? [12, 22, 30, 1] : [247, 243, 232, 1];
    const sky = dark ? ['#08131c', '#13324a'] : ['#cfe6dc', '#f6f1e4'];
    const gradient = (top: string, bottom: string, stars: boolean) => {
      const sc = document.createElement('canvas');
      sc.width = stars ? 512 : 2;
      sc.height = 256;
      const sg = sc.getContext('2d')!;
      const grad = sg.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, top);
      grad.addColorStop(0.7, bottom);
      grad.addColorStop(1, bottom);
      sg.fillStyle = grad;
      sg.fillRect(0, 0, sc.width, 256);
      if (stars) {
        const r = rng(3);
        for (let i = 0; i < 160; i++) {
          sg.fillStyle = `rgba(255,255,240,${0.3 + r() * 0.7})`;
          sg.fillRect(r() * 512, r() * 150, r() < 0.15 ? 2 : 1, 1);
        }
      }
      const t = new CanvasTexture(sc);
      t.colorSpace = SRGBColorSpace;
      return t;
    };
    this.sky = [gradient(sky[0]!, sky[1]!, false), gradient('#050b16', '#1b2a44', true)];
    this.scene.background = this.sky[0];
    this.fogDay = new Color(sky[1]!);
    this.scene.fog = new Fog(this.fogDay.clone(), 35, 110);
    this.hemi = new HemisphereLight(dark ? 0x9fb8d0 : 0xffffff, dark ? 0x1d2a33 : 0x8a9a8a, dark ? 1.6 : 2.2);
    this.scene.add(this.hemi);
    this.sun = new DirectionalLight(0xffffff, dark ? 1.2 : 1.8);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0008;
    this.scene.add(this.sun, this.sun.target);

    // the ground: a lit grid far and wide
    const gc = document.createElement('canvas');
    gc.width = gc.height = 64;
    const gg = gc.getContext('2d')!;
    gg.fillStyle = dark ? '#0e1e28' : '#ecf4ec';
    gg.fillRect(0, 0, 64, 64);
    gg.fillStyle = dark ? 'rgba(127,212,164,0.28)' : 'rgba(54,120,86,0.3)';
    gg.fillRect(0, 0, 64, 2);
    gg.fillRect(0, 0, 2, 64);
    const gt = new CanvasTexture(gc);
    gt.colorSpace = SRGBColorSpace;
    gt.wrapS = gt.wrapT = RepeatWrapping;
    gt.anisotropy = 8;
    this.ground = new Mesh(new PlaneGeometry(1, 1), new MeshLambertMaterial({ map: gt, transparent: true, opacity: 0 }));
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    this.blob = new Mesh(new CircleGeometry(0.5, 32), new MeshBasicMaterial({ map: roundTexture(false), transparent: true, depthWrite: false, opacity: 0 }));
    this.ring = new Mesh(new CircleGeometry(0.5, 48), new MeshBasicMaterial({ map: roundTexture(true), transparent: true, depthWrite: false, blending: AdditiveBlending, opacity: 0 }));
    for (const s of [this.blob, this.ring]) {
      s.rotation.x = -Math.PI / 2;
      s.renderOrder = 2;
      this.scene.add(s);
    }
  }

  /** Choose the page's components, snapshot each, and scatter them (all still flat on the page's wall until
   * explode()). `progress` gets the share done. */
  async build(progress?: (k: number) => void) {
    const picked: [HTMLElement, Kind][] = [];
    this.pick(this.root, picked);
    picked.splice(MAX_PIECES);
    // pictures still waiting to load lazily (off screen) are loaded now, or the snapshots wait for them in vain
    const lazy = Array.from(this.root.querySelectorAll<HTMLImageElement>('img[loading="lazy"]'));
    for (const img of lazy) img.loading = 'eager';
    await Promise.race([Promise.all(lazy.map((img) => img.decode().catch(() => {}))), new Promise((r) => setTimeout(r, 2500))]);
    const shots = new Array<HTMLCanvasElement | null>(picked.length).fill(null);
    let next = 0;
    let done = 0;
    const t0 = performance.now();
    // a few at a time; past a time limit the rest are drawn plainly
    const worker = async () => {
      while (next < picked.length) {
        const i = next++;
        if (performance.now() - t0 < 20000) shots[i] = await this.snapshot(picked[i]![0]);
        progress?.(++done / picked.length);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    for (const img of lazy) img.loading = 'lazy';
    picked.forEach(([el, kind], i) => this.addPiece(el, kind, shots[i]!));
    this.addBackdrop();
    this.layout();
  }

  /** A component as a picture (null if the browser can't). */
  private async snapshot(el: HTMLElement): Promise<HTMLCanvasElement | null> {
    const r = el.getBoundingClientRect();
    const scale = Math.min(Math.min(devicePixelRatio || 1, 1.5), 2048 / Math.max(r.width, r.height, 1));
    try {
      return await domToCanvas(el, {
        scale,
        filter: (n) => !(n instanceof Element) || !n.matches('.lc-peek, [id^="lc-"]'),
        timeout: 3000,
      });
    } catch (e) {
      console.warn('LeviChan: snapshot failed', e);
      return null;
    }
  }

  /** Walk the page and choose its components: boxes with a visible surface, media, text blocks and controls. */
  private pick(el: HTMLElement, out: [HTMLElement, Kind][]) {
    for (const c of Array.from(el.children) as HTMLElement[]) {
      if (c.id?.startsWith('lc-')) continue;
      if (c.closest('.lc-peek, .kit-backdrop, .kit-skip-link, [hidden], .kit-menu-panel, script, style')) continue;
      const cs = getComputedStyle(c);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      const r = c.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      const kind = this.kindOf(c, cs, r);
      if (kind) {
        out.push([c, kind]);
        continue;
      }
      // decorative layers stay in the snapshot
      if ((cs.position === 'absolute' || cs.position === 'fixed') && !c.querySelector('a, button, h1, h2, h3, p')) continue;
      this.pick(c, out);
    }
  }

  private kindOf(el: HTMLElement, cs: CSSStyleDeclaration, r: DOMRect): Kind | null {
    const tag = el.tagName;
    const area = r.width * r.height;
    if (el.classList.contains('kit-gbar')) return 'bar';
    if (tag === 'H1') return 'title';
    if (tag === 'H2') return 'heading';
    if (MEDIA_TAGS.has(tag.toUpperCase())) return area > 900 ? 'media' : null;
    const bg = parseColor(cs.backgroundColor);
    const surface = (bg && bg[3] > 0.04) || parseFloat(cs.borderTopWidth) >= 1 || cs.boxShadow !== 'none' || cs.backgroundImage !== 'none';
    const control = tag === 'BUTTON' || tag === 'SUMMARY' || (tag === 'A' && /\bmc-btn\b/.test(el.className)) || el.getAttribute('role') === 'tab';
    if (control) return 'button';
    if (surface && area < innerWidth * innerHeight * 0.45 && r.width < innerWidth * 0.9) return area > 12000 ? 'card' : 'button';
    if (TEXT_TAGS.has(tag)) return /^H[3-6]$/.test(tag) ? 'heading' : 'text';
    if (!el.firstElementChild && (el.textContent ?? '').trim()) return 'text';
    return null;
  }

  /** A component's picture: its snapshot over its background, or drawn plainly (its colour and its words). */
  private texture(el: HTMLElement, r: { w: number; h: number }, shot: HTMLCanvasElement | null, bg: [number, number, number, number]): Texture {
    const c = document.createElement('canvas');
    const k = shot ? shot.width / Math.max(1, r.w) : Math.min(1.5, 2048 / Math.max(r.w, r.h));
    c.width = Math.max(2, Math.round(r.w * k));
    c.height = Math.max(2, Math.round(r.h * k));
    const g = c.getContext('2d')!;
    g.fillStyle = css(bg);
    g.fillRect(0, 0, c.width, c.height);
    if (shot) {
      g.drawImage(shot, 0, 0, c.width, c.height);
    } else {
      const cs = getComputedStyle(el);
      g.fillStyle = cs.color;
      const fs = Math.min(parseFloat(cs.fontSize) || 16, r.h * 0.8) * k;
      g.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
      g.textBaseline = 'top';
      const words = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().split(' ');
      const pad = 8 * k;
      let line = '';
      let y = pad;
      for (const w of words) {
        if (g.measureText(line + w).width > c.width - 2 * pad && line) {
          g.fillText(line, pad, y);
          y += fs * 1.35;
          line = '';
          if (y > c.height) break;
        }
        line += w + ' ';
      }
      g.fillText(line, pad, y);
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.minFilter = LinearFilter;
    t.anisotropy = 4;
    return t;
  }

  private addPiece(el: HTMLElement, kind: Kind, shot: HTMLCanvasElement | null) {
    // its size as laid out (a transform doesn't change it), and where it shows on screen now
    const cr = el.getBoundingClientRect();
    const r = { w: el.offsetWidth || cr.width, h: el.offsetHeight || cr.height };
    if (r.w < 4 || r.h < 4) return;
    const cs = getComputedStyle(el);
    const own = parseColor(cs.backgroundColor);
    const bg = own && own[3] > 0.3 ? own : this.pageBg;
    const front = new MeshBasicMaterial({ map: this.texture(el, r, shot, bg) });
    const sides = new MeshLambertMaterial({ color: new Color().setRGB(bg[0] / 255, bg[1] / 255, bg[2] / 255, SRGBColorSpace).multiplyScalar(0.92) });
    const back = new MeshLambertMaterial({ color: sides.color.clone().multiplyScalar(0.75) });
    // box faces: +x, -x, +y, -y, +z (the component), -z
    const mesh = new Mesh(this.box, [sides, sides, sides, sides, front, back] as Material[]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.matrixAutoUpdate = false;
    const spots: Spot[] = [];
    for (const a of [el, ...Array.from(el.querySelectorAll<HTMLElement>(SPOTS))]) {
      if (!a.matches(SPOTS)) continue;
      const ar = a.getBoundingClientRect();
      if (ar.width < 4 || ar.height < 4) continue;
      spots.push({ el: a, x: ar.left - cr.left, y: ar.top - cr.top, w: ar.width, h: ar.height });
    }
    const p: Piece = {
      el,
      kind,
      pw: r.w,
      ph: r.h,
      hx: cr.left,
      hy: cr.top + this.scroll,
      cw: r.w / this.m,
      ch: r.h / this.m,
      depth: 0.5,
      facing: 'z',
      u: 0,
      w: 0,
      h0: 0,
      h1: 0,
      z: 0,
      d: 0,
      mesh,
      front,
      sides,
      spots,
      t: 0,
      delay: 0,
      axis: new Vector3(0, 1, 0),
      spin: 0,
      pop: 0,
      held: false,
      fx: null,
      tint: new Color(0, 0, 0),
      flash: null,
    };
    mesh.userData.piece = p;
    this.scene.add(mesh);
    this.pieces.push(p);
  }

  /** The page's own colour behind its components on the wall: it fades away as they fly out. */
  private addBackdrop() {
    this.backdrop = new Mesh(new PlaneGeometry(this.W / this.m, this.H / this.m), new MeshBasicMaterial({ color: new Color().setRGB(this.pageBg[0] / 255, this.pageBg[1] / 255, this.pageBg[2] / 255, SRGBColorSpace), transparent: true, depthWrite: false }));
    this.backdrop.renderOrder = -1;
    this.scene.add(this.backdrop);
  }

  /** A page point (document px) on the wall. */
  onWall(x: number, y: number, out = new Vector3()) {
    return out.set((x - this.W / 2) / this.m, this.wall.y + (this.scroll + this.H / 2 - y) / this.m, this.wall.z);
  }

  /** Scatter the blocks: each tries spots beside a block already placed (a gap she can hop, a top within reach),
   * on top of one, or on the ground, and takes the best that is clear of the rest. */
  private layout() {
    const r = rng(11);
    let area = 0;
    for (const p of this.pieces) {
      const k = p.kind;
      if (k === 'bar') p.facing = 'up';
      else if (k === 'card' || k === 'media') p.facing = r() < (p.ch > 1.3 ? 0.55 : 0.35) ? 'up' : 'z';
      else if (k === 'button') p.facing = r() < 0.3 ? 'up' : 'z';
      else if (k !== 'title' && r() < 0.2) p.facing = r() < 0.5 ? '+x' : '-x';
      else p.facing = 'z';
      p.depth = { card: 0.8, media: 0.5, bar: 0.5, title: 1.0, heading: 0.8, text: 0.75, button: 0.6 }[k];
      if (p.facing === 'up') p.depth = Math.min(p.depth, 0.4);
      const [sx, , sz] = extent(p.cw, p.ch, p.depth, p.facing);
      area += (sx + 1) * (sz + 1);
    }
    const R = clamp(Math.sqrt(area) * 1.05, 7, 26);
    this.R = R;
    this.wall.z = R * 0.55 + 2.2;
    const placed: Piece[] = [];
    const clear = (u: number, w: number, h0: number, h1: number, z: number, d: number, on: Piece | null) =>
      Math.abs(u + w / 2) + w / 2 <= R &&
      z <= R * 0.55 &&
      z - d >= -R &&
      // clear of the rest, and never hanging over another's top (or under its own) closer than her height: every
      // top keeps room for her
      !placed.some((b) => b !== on && b.u < u + w + 0.35 && b.u + b.w > u - 0.35 && b.z - b.d < z + 0.35 && b.z > z - d - 0.35 && b.h0 < h1 + 1.7 && b.h1 > h0 - 1.7);
    const order = [...this.pieces].sort((a, b) => b.cw * b.ch - a.cw * a.ch);
    for (const p of order) {
      const [sx, sy, sz] = extent(p.cw, p.ch, p.depth, p.facing);
      let best: { u: number; h0: number; z: number } | null = null;
      let bs = -Infinity;
      for (let i = 0; i < 60; i++) {
        let u: number;
        let z: number;
        let h0 = 0;
        let on: Piece | null = null;
        if (!placed.length || r() < 0.35) {
          u = (r() * 2 - 1) * R - sx / 2;
          z = -R + sz + r() * (1.55 * R - sz);
        } else {
          const a = placed[Math.floor(r() * placed.length)]!;
          const spareW = a.w - sx;
          const spareD = a.d - sz;
          if (r() < 0.2 && (spareW >= 0.6 || spareD >= 0.6) && spareW >= 0 && spareD >= 0 && a.h1 + sy < 8) {
            // on top of it, to one end: a strip of its top is left to climb up from
            on = a;
            const end = r() < 0.5;
            u = spareW >= 0.6 ? (end ? a.u : a.u + spareW) : a.u + r() * spareW;
            z = spareW >= 0.6 ? a.z - r() * spareD : end ? a.z : a.z - spareD;
            h0 = a.h1;
          } else {
            // beside it, a hop away, its top a little above or below
            const gap = 0.2 + r() * 0.6;
            const top = a.h1 - 1.2 + r() * 2.0;
            h0 = Math.max(0, top - sy);
            if (h0 < 0.35) h0 = 0;
            const side = Math.floor(r() * 4);
            const ou = a.u + (a.w - sx) / 2 + (r() - 0.5) * (a.w + sx) * 0.8;
            const oz = a.z - (a.d - sz) / 2 + (r() - 0.5) * (a.d + sz) * 0.8;
            if (side === 0) [u, z] = [a.u + a.w + gap, oz];
            else if (side === 1) [u, z] = [a.u - gap - sx, oz];
            else if (side === 2) [u, z] = [ou, a.z + gap + sz];
            else [u, z] = [ou, a.z - a.d - gap];
          }
        }
        if (h0 + sy > 9 || !clear(u, sx, h0, h0 + sy, z, sz, on)) continue;
        // room around it (scattered, not piled up), not too high, not too far out, some luck
        let room = 3;
        for (const b of placed) {
          if (b === on) continue;
          const gx = Math.max(b.u - (u + sx), u - (b.u + b.w), 0);
          const gz = Math.max(b.z - b.d - z, z - sz - b.z, 0);
          const gy = Math.max(b.h0 - (h0 + sy), h0 - b.h1, 0);
          room = Math.min(room, Math.hypot(gx, gz, gy));
        }
        const score = Math.min(room, 2.2) * 0.5 - (Math.hypot(u + sx / 2, z - sz / 2) / R) * 0.35 - Math.max(0, h0 + sy - 3.5) * 0.15 + r() * 0.5;
        if (score > bs) {
          bs = score;
          best = { u, h0, z };
        }
      }
      if (!best) {
        // anywhere on the ground that is free
        for (let i = 0; i < 400 && !best; i++) {
          const u = (r() * 2 - 1) * (R + i * 0.02) - sx / 2;
          const z = -R + sz + r() * 1.55 * R;
          if (clear(u, sx, 0, sy, z, sz, null) || i === 399) best = { u, h0: 0, z };
        }
      }
      p.u = best!.u;
      p.w = sx;
      p.h0 = best!.h0;
      p.h1 = best!.h0 + sy;
      p.z = best!.z;
      p.d = sz;
      placed.push(p);
    }
    // the flight: later the further from the middle of the screen, a tumble, a leap toward the viewer
    const cx = this.W / 2;
    const cy = this.scroll + this.H / 2;
    let far = 1;
    for (const p of this.pieces) far = Math.max(far, Math.hypot(p.hx + p.pw / 2 - cx, p.hy + p.ph / 2 - cy));
    for (const p of this.pieces) {
      const dist = Math.hypot(p.hx + p.pw / 2 - cx, p.hy + p.ph / 2 - cy) / far;
      p.delay = 0.2 + dist * 1.1 + r() * 0.15;
      p.axis.set(r() - 0.5, r() - 0.5, (r() - 0.5) * 0.4).normalize();
      p.spin = (r() < 0.5 ? -1 : 1) * (2.5 + r() * 3);
      p.pop = 1 + r() * 2.5;
    }
    // the ground and the sun's shadows cover the lot
    const G = (R + 40) * 2;
    this.ground.scale.set(G, G, 1);
    (this.ground.material as MeshLambertMaterial).map!.repeat.set(G, G);
    this.sun.position.set(-R * 0.6, R + 10, R * 0.8);
    const sc = this.sun.shadow.camera;
    sc.left = sc.bottom = -R - 4;
    sc.right = sc.top = R + 4;
    sc.near = 1;
    sc.far = R * 4 + 30;
    sc.updateProjectionMatrix();
    if (this.backdrop) this.onWall(this.W / 2, this.scroll + this.H / 2, this.backdrop.position);
  }

  /** Day (0) to night (1): a starry sky, dim light, a dark haze. */
  setNight(k: number) {
    if (Math.abs(k - this.night) < 0.001) return;
    this.night = k;
    this.scene.background = this.sky[k > 0.5 ? 1 : 0];
    (this.scene.fog as Fog).color.copy(this.fogDay).lerp(new Color('#1b2a44'), k);
    this.hemi.intensity = (this.hemi.userData.base ??= this.hemi.intensity) * (1 - 0.65 * k);
    this.sun.intensity = (this.sun.userData.base ??= this.sun.intensity) * (1 - 0.8 * k);
  }

  /** Start the flight out of the page (at `now`; long ago: already there). */
  explode(now: number) {
    this.t0 = now;
    this.leaving = -1;
  }
  /** Back into the page (the far ones first). */
  implode(now: number) {
    this.leaving = now;
    const maxDelay = Math.max(...this.pieces.map((p) => p.delay), 0);
    for (const p of this.pieces) p.delay = (maxDelay - p.delay) * 0.5;
  }
  /** All back in the page? */
  get flat() {
    return this.leaving >= 0 && this.pieces.every((p) => p.t <= 0);
  }

  /** Play a short animation on a block (and light up a spot on it). */
  play(p: Piece, kind: Fx, spot?: Spot | null) {
    p.fx = { kind, t0: performance.now(), dur: FX_DUR[kind] * 1000 };
    if (spot) {
      if (p.flash) p.mesh.remove(p.flash.mesh);
      const f = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ color: 0x7fd4a4, transparent: true, blending: AdditiveBlending, depthWrite: false }));
      f.scale.set(spot.w / p.pw + 0.04, spot.h / p.ph + 0.08, 1);
      f.position.set((spot.x + spot.w / 2) / p.pw - 0.5, 0.5 - (spot.y + spot.h / 2) / p.ph, 0.51);
      p.mesh.add(f);
      p.flash = { mesh: f, t0: performance.now() };
    }
  }

  private readonly _q = new Quaternion();
  private readonly _q2 = new Quaternion();
  private readonly _c = new Vector3();
  private readonly _home = new Vector3();
  private readonly _s = new Vector3();
  private readonly _n = new Vector3();

  /** Advance the flights, the animations and the cubes. */
  update(now: number, dt: number) {
    const s = (now - (this.leaving >= 0 ? this.leaving : this.t0)) / 1000;
    let most = 0;
    for (const p of this.pieces) {
      const k = clamp((s - p.delay) / FLIGHT, 0, 1);
      p.t = this.leaving >= 0 ? Math.min(p.t, 1 - k) : k;
      most = Math.max(most, p.t);
      this.draw(p, now);
    }
    if (this.backdrop) {
      // fades as the first blocks leave; back as the last come home
      const mat = this.backdrop.material as MeshBasicMaterial;
      mat.opacity = this.leaving >= 0 ? smooth((0.4 - most) / 0.4) : 1 - smooth(s / 1.6);
      this.backdrop.visible = mat.opacity > 0.01;
    }
    this.stepCubes(dt, now);
  }

  private draw(p: Piece, now: number) {
    const t = p.t;
    const sm = smooth(t);
    const c = this._c.set(p.u + p.w / 2, (p.h0 + p.h1) / 2, p.z - p.d / 2);
    const pos = this.onWall(p.hx + p.pw / 2, p.hy + p.ph / 2, this._home);
    pos.z += 0.005;
    const q = this._q.identity().slerp(FACING[p.facing], sm);
    // on the way: a leap toward the viewer, a tumble that unwinds as it lands
    pos.lerp(c, sm);
    pos.z += p.pop * Math.sin(Math.PI * Math.min(1, t * 1.1));
    const spin = p.spin * (1 - smooth(Math.min(1, t * 1.2)));
    if (spin) q.premultiply(this._q2.setFromAxisAngle(p.axis, spin));
    const scale = this._s.set(p.cw, p.ch, Math.max(0.01, p.depth * smooth(t * 1.6)));
    // her play with it
    const fx = p.fx;
    if (fx) {
      const k = (now - fx.t0) / fx.dur;
      if (k >= 1) {
        p.fx = null;
        p.front.color.setScalar(1);
        p.sides.emissive.copy(p.tint);
      } else {
        const env = Math.sin(Math.PI * k);
        const n = this._n.set(0, 0, 1).applyQuaternion(FACING[p.facing]);
        if (fx.kind === 'press') pos.addScaledVector(n, -0.08 * env);
        else if (fx.kind === 'bounce') {
          pos.y += 0.3 * Math.abs(Math.sin(2 * Math.PI * k)) * (1 - k);
          scale.multiplyScalar(1 + 0.05 * Math.sin(4 * Math.PI * k) * (1 - k));
        } else if (fx.kind === 'spin') q.premultiply(this._q2.setFromAxisAngle(UP, 2 * Math.PI * smooth(k)));
        else if (fx.kind === 'flip') q.multiply(this._q2.setFromAxisAngle(RIGHT, 2 * Math.PI * smooth(k)));
        else if (fx.kind === 'wobble') {
          scale.x *= 1 + 0.06 * Math.sin(18 * k) * (1 - k);
          scale.y *= 1 - 0.06 * Math.sin(18 * k) * (1 - k);
        } else if (fx.kind === 'dip') pos.y -= 0.05 * env;
        const glow = fx.kind === 'glow' ? env : fx.kind === 'press' ? env * 0.6 : env * 0.25;
        p.front.color.setScalar(1 + glow * 0.45);
        p.sides.emissive.setRGB(0.5, 0.83, 0.64).multiplyScalar(glow * 0.35);
      }
    }
    if (p.flash) {
      const k = (now - p.flash.t0) / 1400;
      const mat = p.flash.mesh.material as MeshBasicMaterial;
      if (k >= 1) {
        p.mesh.remove(p.flash.mesh);
        mat.dispose();
        p.flash = null;
      } else mat.opacity = 0.9 * Math.sin(Math.PI * Math.min(1, k * 2.2)) * (1 - k * 0.5);
    }
    p.mesh.matrix.compose(pos, q, scale);
    p.mesh.matrixWorldNeedsUpdate = true;
  }

  /** The blocks (for paths, landing and her occluders); a block she carries is not one. */
  blocks(): Piece[] {
    return this.pieces.filter((p) => p.t > 0.5 && !p.held);
  }
  /** The highest top under a point at or below `maxH` (the ground: 0), within `margin` of a block's edge. */
  supportAt(u: number, v: number, maxH = Infinity, margin = 0): { h: number; block: Piece | null } {
    let best: { h: number; block: Piece | null } = { h: 0, block: null };
    for (const b of this.pieces) {
      if (b.held || b.t < 0.9 || b.h1 <= best.h || b.h1 > maxH) continue;
      if (u >= b.u - margin && u <= b.u + b.w + margin && v <= b.z + margin && v >= b.z - b.d - margin) best = { h: b.h1, block: b };
    }
    return best;
  }
  /** Is a box free of the blocks (but `except`)? */
  free(u: number, w: number, h0: number, h1: number, z: number, d: number, except?: Piece | null) {
    return !this.pieces.some(
      (b) => b !== except && !b.held && b.t > 0.5 && b.u < u + w && b.u + b.w > u && b.h0 < h1 && b.h1 > h0 && b.z - b.d < z && b.z > z - d,
    );
  }
  /** Set a block down for good somewhere else (its side toward the viewer at z). */
  moveTo(p: Piece, u: number, h0: number, z: number) {
    this.hold(p, u, h0, z);
    this.version++;
  }
  /** Hold a block somewhere (she carries it): no flight, straight there. */
  hold(p: Piece, u: number, h0: number, z: number) {
    p.h1 = h0 + (p.h1 - p.h0);
    p.h0 = h0;
    p.u = u;
    p.z = z;
  }

  // ------------------------------------------------------------------ loose cubes
  addCube(mats: Material[], s: number, u: number, v: number, h: number) {
    const mesh = new Mesh(this.box, mats);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.scale.setScalar(s);
    this.scene.add(mesh);
    const c: Cube = { mesh, s, u, v, h, vu: 0, vv: 0, vh: 0, spin: (Math.random() - 0.5) * 2, rot: Math.random() * 6, held: false, hitAt: 0, thrownAt: 0 };
    mesh.userData.cube = c;
    this.cubes.push(c);
    return c;
  }

  private stepCubes(dt: number, now: number) {
    const g = 9.8;
    // an impact is a fall faster than a few frames of gravity (a cube at rest gains g * dt every frame)
    const hard = Math.max(0.4, g * dt * 3);
    const lim = this.R + 6;
    for (const c of this.cubes) {
      if (!c.held) {
        const prevH = c.h;
        c.vh -= g * dt;
        c.u += c.vu * dt;
        c.v += c.vv * dt;
        c.h += c.vh * dt;
        const half = c.s / 2;
        let grounded = false;
        for (const b of this.pieces) {
          if (b.held || b.t < 0.9) continue;
          const inU = c.u + half > b.u && c.u - half < b.u + b.w;
          const inV = c.v + half > b.z - b.d && c.v - half < b.z;
          if (!inU || !inV || c.h >= b.h1 || c.h + c.s <= b.h0) continue;
          if (prevH >= b.h1 - 0.01) {
            // onto its top
            c.h = b.h1;
            if (c.vh < -hard) c.hitAt = now;
            c.vh = c.vh < -hard ? -c.vh * 0.35 : 0;
            grounded = true;
          } else if (prevH + c.s <= b.h0 + 0.01) {
            // its underside
            c.h = b.h0 - c.s;
            c.vh = Math.min(0, -c.vh * 0.3);
          } else {
            // pushed out along the shallower axis
            const du = Math.min(c.u + half - b.u, b.u + b.w - (c.u - half));
            const dv = Math.min(c.v + half - (b.z - b.d), b.z - (c.v - half));
            if (du < dv) {
              c.u += c.u < b.u + b.w / 2 ? -du : du;
              c.vu = -c.vu * 0.4;
            } else {
              c.v += c.v < b.z - b.d / 2 ? -dv : dv;
              c.vv = -c.vv * 0.4;
            }
            if (Math.hypot(c.vu, c.vv) > 0.8) c.hitAt = now;
          }
        }
        if (c.h <= 0) {
          c.h = 0;
          if (c.vh < -hard) c.hitAt = now;
          c.vh = c.vh < -hard ? -c.vh * 0.35 : 0;
          grounded = true;
        }
        if (grounded) {
          const f = Math.max(0, 1 - dt * 4);
          c.vu *= f;
          c.vv *= f;
        }
        c.spin *= Math.max(0, 1 - dt * (grounded ? 3 : 0.3));
        c.rot += c.spin * dt;
        c.u = clamp(c.u, -lim, lim);
        c.v = clamp(c.v, -lim, lim);
      }
      // cube vs cube: push apart
      for (const o of this.cubes) {
        if (o === c || c.held) continue;
        const du = c.u - o.u;
        const dv = c.v - o.v;
        const l = (c.s + o.s) / 2;
        if (Math.abs(du) < l && Math.abs(dv) < l && Math.abs(c.h - o.h) < l) {
          const d = Math.hypot(du, dv) || 1;
          const push = (l - d) * 0.5;
          c.u += (du / d) * push;
          c.v += (dv / d) * push;
        }
      }
      c.mesh.position.set(c.u, c.h + c.s / 2, c.v);
      c.mesh.rotation.set(0, c.rot, 0);
    }
  }

  dispose() {
    this.scene.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      for (const m of ([] as Material[]).concat(mesh.material)) {
        for (const v of Object.values(m)) if (v && (v as Texture).isTexture) (v as Texture).dispose();
        m.dispose();
      }
    });
    for (const t of this.sky) t.dispose();
  }
}
