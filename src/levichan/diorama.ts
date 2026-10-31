// The page taken apart: each of its components (cards, buttons, headings, text, pictures, the bar...) flies out of
// the page and becomes a block of its own, standing upright in 3D space with real depth. Up the page the blocks
// step back, like a staircase hanging in the sky, so the top of each block is a ledge in front of the one above:
// she walks along those ledges, hops and climbs between them, scales the blocks' faces and carries the small ones
// about. The components stay the page's own elements (links, menus and text work as usual); only inline styles are
// added, and all of them are put back when the space closes. A few loose Minecraft cubes with simple physics live
// here too.
//
// World coordinates (page px): u right (the page's x), v toward the viewer (0: the page's plane), h up from the
// page's bottom. The page's own CSS space (X right, Y down, Z toward the viewer) is X = u, Y = Hp - h, Z = v.

/** A block: u..u+w across, h0..h1 up, its front face at v = z and its back at z - d. */
export interface Block {
  u: number;
  w: number;
  h0: number;
  h1: number;
  z: number;
  d: number;
}

type Kind = 'card' | 'bar' | 'button' | 'media' | 'title' | 'heading' | 'text';

export interface Piece extends Block {
  el: HTMLElement;
  kind: Kind;
  /** its spot on the flat page (layout px) */
  x: number;
  y: number;
  pw: number;
  ph: number;
  /** the box around it: a body panel, back, top, bottom, sides (the element is the front) */
  shell: HTMLElement;
  faces: HTMLElement[];
  /** how far out of the page it is (0: flat, 1: in its 3D spot), and the flight there */
  t: number;
  delay: number;
  axis: [number, number, number];
  spin: number;
  pop: number;
  /** she is carrying it (its spot is set each frame) */
  held: boolean;
  saved: string | null;
  drawn: string;
}

const TEXT_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'PRE', 'TABLE', 'FIGCAPTION', 'LABEL', 'DT', 'DD']);
const MEDIA_TAGS = new Set(['IMG', 'SVG', 'VIDEO', 'CANVAS', 'PICTURE', 'IFRAME']);
/** seconds a block takes to fly out to its spot */
const FLIGHT = 1.35;
const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** an ease that overshoots a little and settles */
const outBack = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2));

function parseColor(c: string): [number, number, number, number] | null {
  const m = /rgba?\(([^)]+)\)/.exec(c);
  if (!m) return null;
  const p = m[1]!.split(/[ ,/]+/).filter(Boolean).map(Number);
  return [p[0]!, p[1]!, p[2]!, p[3] ?? 1];
}
const shade = (c: [number, number, number, number], k: number, a = 1) =>
  `rgba(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)},${a})`;

/** A tiny seeded RNG, so the layout (and the cubes' textures) are the same on every visit. */
export function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** A loose cube: falls, bounces, can be thrown. (u, v) is its centre, h its bottom. */
export interface Cube {
  el: HTMLElement;
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

export class Diorama {
  readonly world: HTMLElement;
  readonly ground: HTMLElement;
  pieces: Piece[] = [];
  cubes: Cube[] = [];
  /** page px per metre of hers (her height is 1.45 m) */
  readonly m: number;
  W = 0;
  Hp = 0;
  /** bumped whenever a block moves for good (her paths are planned again) */
  version = 0;
  /** how far each step of the staircase sets back, and how deep it may get before it starts over */
  readonly step: number;
  readonly zMax: number;
  private readonly ancestors = new Map<HTMLElement, string | null>();
  private readonly hidden: [HTMLElement, string | null][] = [];
  private t0 = 0;
  private leaving = -1;
  /** the page's own background (the body's is the sky while the space is open) */
  private readonly pageBg: [number, number, number, number];

  constructor(
    private readonly root: HTMLElement,
    herPx: number,
  ) {
    this.m = herPx / 1.45;
    this.step = 0.55 * this.m;
    this.zMax = 7 * this.m;
    this.pageBg = parseColor(getComputedStyle(document.documentElement).getPropertyValue('--lc-page-bg')) ?? [247, 243, 232, 1];
    this.world = document.createElement('div');
    this.world.id = 'lc-world';
    this.ground = document.createElement('div');
    this.ground.id = 'lc-ground';
    this.world.appendChild(this.ground);
  }

  /** Measure the page, pick its components, work out where each goes and build their boxes (all flat until
   * explode()). `origin` (page px) is where the flight starts. */
  build(origin: { x: number; y: number }) {
    this.W = this.root.clientWidth;
    this.Hp = this.root.scrollHeight;
    this.world.style.width = `${this.W}px`;
    this.world.style.height = `${this.Hp}px`;
    this.root.appendChild(this.world);
    // the ground: far down at the page's bottom, from behind the staircase out toward the viewer
    const g = this.ground.style;
    g.width = `${this.W * 3}px`;
    g.height = `${this.zMax + 8 * this.m}px`;
    g.transform = `translate3d(${-this.W}px, ${this.Hp}px, ${(-this.zMax - 2 * this.m).toFixed(0)}px) rotateX(90deg)`;
    // the page's own fixed backdrop would ride along as a band at the top
    for (const el of this.root.querySelectorAll<HTMLElement>('.kit-backdrop, .kit-skip-link, .lc-peek')) {
      this.hidden.push([el, el.getAttribute('style')]);
      el.style.visibility = 'hidden';
    }
    const picked: [HTMLElement, Kind][] = [];
    this.pick(this.root, picked);
    for (const [el, kind] of picked) this.addPiece(el, kind);
    this.layout(origin);
  }

  /** Layout rect of an element in page px (offset chain: transforms don't change it). */
  rect(el: HTMLElement): { x: number; y: number; w: number; h: number } {
    if (!(el instanceof HTMLElement) || el.offsetParent === null) {
      const r = (el as Element).getBoundingClientRect();
      const rr = this.root.getBoundingClientRect();
      return { x: r.left - rr.left, y: r.top - rr.top, w: r.width, h: r.height };
    }
    let x = 0;
    let y = 0;
    let e: HTMLElement | null = el;
    while (e && e !== this.root) {
      x += e.offsetLeft;
      y += e.offsetTop;
      const p = e.offsetParent as HTMLElement | null;
      // the parent's border sits between the two offsets
      if (p && p !== this.root) {
        const cs = getComputedStyle(p);
        x += parseFloat(cs.borderLeftWidth) || 0;
        y += parseFloat(cs.borderTopWidth) || 0;
      }
      e = p;
    }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }

  /** Walk the page and choose its components: boxes with a visible surface, media, text blocks and controls.
   * An element that would flatten its children in 3D (clipping, filters...) is taken whole. */
  private pick(el: HTMLElement, out: [HTMLElement, Kind][]) {
    for (const c of Array.from(el.children) as HTMLElement[]) {
      if (c === this.world || c.id?.startsWith('lc-')) continue;
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
      // decorative absolute layers (the hero's painting) fade away with the page's backgrounds
      if ((cs.position === 'absolute' || cs.position === 'fixed') && !c.querySelector('a, button, h1, h2, h3, p')) {
        this.hidden.push([c, c.getAttribute('style')]);
        c.style.transition = 'opacity 0.8s';
        c.style.opacity = '0';
        continue;
      }
      if (this.flattens(cs)) {
        out.push([c, 'card']);
        continue;
      }
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
    if (surface && area < innerWidth * innerHeight * 0.45 && r.width < innerWidth * 0.9) {
      return area > 12000 ? 'card' : 'button';
    }
    if (TEXT_TAGS.has(tag)) return /^H[3-6]$/.test(tag) ? 'heading' : 'text';
    // a leaf with text (no element children of size)
    if (!el.firstElementChild && (el.textContent ?? '').trim()) return 'text';
    return null;
  }

  private flattens(cs: CSSStyleDeclaration) {
    return cs.filter !== 'none' || cs.clipPath !== 'none' || (cs.maskImage && cs.maskImage !== 'none') || cs.mixBlendMode !== 'normal';
  }

  /** Let a component's ancestors carry 3D (preserve-3d, nothing that flattens) and drop their backgrounds: the
   * sections dissolve and only the components are left, in the sky. */
  private open3d(el: HTMLElement) {
    for (let a = el.parentElement; a && a !== this.root.parentElement; a = a.parentElement) {
      if (this.ancestors.has(a)) continue;
      this.ancestors.set(a, a.getAttribute('style'));
      a.style.transformStyle = 'preserve-3d';
      const cs = getComputedStyle(a);
      if (cs.overflow !== 'visible') a.style.overflow = 'visible';
      if (+cs.opacity < 1) a.style.opacity = '1';
      if (cs.contain !== 'none') a.style.contain = 'none';
      if (cs.isolation === 'isolate') a.style.isolation = 'auto';
      if (cs.position === 'sticky' || cs.position === 'fixed') a.style.position = 'relative';
      // the sections stay on the page's plane, in front of every block set back from it: clicks go through them
      a.style.pointerEvents = 'none';
      if (a !== this.root) {
        a.style.transition = 'background-color 0.9s, border-color 0.9s, box-shadow 0.9s';
        a.style.backgroundColor = 'transparent';
        a.style.backgroundImage = 'none';
        a.style.borderColor = 'transparent';
        a.style.boxShadow = 'none';
      }
    }
  }

  private addPiece(el: HTMLElement, kind: Kind) {
    const saved = el.getAttribute('style');
    this.open3d(el);
    // a sticky element measures where it is stuck: unstick it first
    const pos = getComputedStyle(el).position;
    if (pos === 'sticky' || pos === 'fixed') el.style.position = 'relative';
    const r = this.rect(el);
    const cs = getComputedStyle(el);
    el.style.willChange = 'transform';
    el.style.transformOrigin = '50% 50%';
    el.style.pointerEvents = 'auto';
    const own = parseColor(cs.backgroundColor);
    const bg = own && own[3] > 0.3 ? own : this.pageBg;
    const radius = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, r.w / 2, r.h / 2);
    // the box, in a shell that moves with the element: a body panel just behind it (a see-through component gets a
    // body), the back, top, bottom and sides
    const shell = document.createElement('div');
    shell.className = 'lc-shell';
    const s = shell.style;
    s.left = `${r.x}px`;
    s.top = `${r.y}px`;
    s.width = `${r.w}px`;
    s.height = `${r.h}px`;
    s.display = 'none';
    const faces: HTMLElement[] = [];
    const face = (cls: string, color: string) => {
      const f = document.createElement('i');
      f.className = cls;
      f.style.background = color;
      shell.appendChild(f);
      faces.push(f);
      return f;
    };
    const glass = kind === 'text' || kind === 'heading' || kind === 'title';
    const panel = face('lc-panel', shade(bg, 1, glass ? 0.9 : 1));
    const back = face('lc-back', shade(bg, 0.62));
    if (radius) panel.style.borderRadius = back.style.borderRadius = `${radius}px`;
    face('lc-top', `linear-gradient(${shade(bg, 0.84)}, ${shade(bg, 0.98)})`);
    face('lc-bottom', shade(bg, 0.5));
    face('lc-left', `linear-gradient(90deg, ${shade(bg, 0.6)}, ${shade(bg, 0.74)})`);
    face('lc-right', `linear-gradient(90deg, ${shade(bg, 0.74)}, ${shade(bg, 0.6)})`);
    this.world.appendChild(shell);
    this.pieces.push({
      el,
      kind,
      x: r.x,
      y: r.y,
      pw: r.w,
      ph: r.h,
      u: r.x,
      w: r.w,
      h0: this.Hp - r.y - r.h,
      h1: this.Hp - r.y,
      z: 0,
      d: 0,
      shell,
      faces,
      t: 0,
      delay: 0,
      axis: [0, 1, 0],
      spin: 0,
      pop: 0,
      held: false,
      saved,
      drawn: '',
    });
  }

  /** Where each block goes: up the page they step back, each a ledge's depth behind any block it hangs over
   * (closer than her height above it), so she has room on every ledge; a staircase that gets too deep starts over. */
  private layout(origin: { x: number; y: number }) {
    const r = rng(11);
    const S = this.step;
    const room = 1.6 * this.m;
    const order = [...this.pieces].sort((a, b) => a.h0 - b.h0);
    const done: Piece[] = [];
    let far = 1;
    for (const p of this.pieces) far = Math.max(far, Math.hypot(p.x + p.pw / 2 - origin.x, p.y + p.ph / 2 - origin.y));
    for (const b of order) {
      let z = (r() - 0.5) * 0.18 * this.m;
      for (const a of done) {
        const over = Math.min(a.u + a.w, b.u + b.w) - Math.max(a.u, b.u);
        if (a.h1 <= b.h0 + 6 && b.h0 - a.h1 < room && over > -0.25 * this.m) z = Math.min(z, a.z - S);
      }
      if (z < -this.zMax) z = (r() - 0.5) * 0.18 * this.m;
      b.z = Math.round(z);
      b.d = Math.round(S * (b.kind === 'text' || b.kind === 'heading' ? 1.15 : 1.3));
      // the flight: later the further from where it starts, a tumble about a random axis, a leap toward the viewer
      const dist = Math.hypot(b.x + b.pw / 2 - origin.x, b.y + b.ph / 2 - origin.y) / far;
      b.delay = 0.15 + dist * 1.0 + r() * 0.12;
      const ax = r() - 0.5;
      const ay = r() - 0.5;
      const n = Math.hypot(ax, ay, 0.2) || 1;
      b.axis = [+(ax / n).toFixed(3), +(ay / n).toFixed(3), +(0.2 / n).toFixed(3)];
      b.spin = (r() < 0.5 ? -1 : 1) * (200 + r() * 200);
      b.pop = (0.8 + r() * 1.4) * this.m;
      done.push(b);
    }
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

  /** Advance the flights and draw; blocks nearer than `nearV` (too close to the camera, or past it) are hidden. */
  update(now: number, dt: number, nearV = Infinity) {
    const s = (now - (this.leaving >= 0 ? this.leaving : this.t0)) / 1000;
    for (const p of this.pieces) {
      const k = Math.max(0, Math.min(1, (s - p.delay) / FLIGHT));
      p.t = this.leaving >= 0 ? Math.min(p.t, 1 - k) : k;
      this.draw(p, p.z > nearV && !p.held);
    }
    this.stepCubes(dt, now);
  }

  private draw(p: Piece, culled: boolean) {
    const t = p.t;
    const e = outBack(t);
    const sm = smooth(t);
    // home (flat) -> its spot; on the way a leap toward the viewer and a tumble that unwinds as it lands
    const dx = (p.u - p.x) * sm;
    const dy = (this.Hp - p.h1 - p.y) * sm;
    const z = p.z * e + p.pop * Math.sin(Math.PI * Math.min(1, t * 1.15));
    const spin = p.spin * (1 - smooth(Math.min(1, t * 1.25)));
    const tf = t <= 0 ? '' : `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, ${z.toFixed(1)}px)` + (spin ? ` rotate3d(${p.axis.join(',')}, ${spin.toFixed(1)}deg)` : '');
    const d = Math.round(p.d * smooth(t * 1.6));
    const key = tf + '|' + d + (culled ? '|c' : '');
    if (key === p.drawn) return;
    p.drawn = key;
    p.el.style.transform = tf;
    p.el.style.visibility = culled ? 'hidden' : '';
    p.shell.style.transform = tf;
    p.shell.style.display = t <= 0 || culled ? 'none' : '';
    const [panel, back, top, bottom, left, right] = p.faces as [HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement, HTMLElement];
    back.style.transform = `translateZ(${-d}px)`;
    panel.style.transform = 'translateZ(-1.5px)';
    top.style.height = bottom.style.height = `${d}px`;
    left.style.width = right.style.width = `${d}px`;
  }

  /** The blocks (for paths, landing and her occluders); a block she carries is not one. */
  blocks(): Piece[] {
    return this.pieces.filter((p) => p.t > 0.5 && !p.held);
  }
  pieceOf(el: Element | null): Piece | null {
    if (!el) return null;
    const shell = el.closest('.lc-shell');
    return this.pieces.find((p) => (shell ? p.shell === shell : p.el === el || p.el.contains(el))) ?? null;
  }
  /** The highest top under a point at or below `maxH` (the ground: 0). */
  supportAt(u: number, v: number, maxH = Infinity, margin = 0): { h: number; block: Piece | null } {
    let best: { h: number; block: Piece | null } = { h: 0, block: null };
    for (const b of this.pieces) {
      if (b.held || b.t < 0.9 || b.h1 <= best.h || b.h1 > maxH) continue;
      if (u >= b.u - margin && u <= b.u + b.w + margin && v <= b.z + margin && v >= b.z - b.d - margin) best = { h: b.h1, block: b };
    }
    return best;
  }
  /** Is a box free of the blocks (but `except`)? */
  free(u: number, w: number, h0: number, h1: number, z: number, d: number, except?: Piece) {
    return !this.pieces.some(
      (b) => b !== except && !b.held && b.t > 0.5 && b.u < u + w && b.u + b.w > u && b.h0 < h1 && b.h1 > h0 && b.z - b.d < z && b.z > z - d,
    );
  }
  /** Set a block down for good somewhere else (front face at z). */
  moveTo(p: Piece, u: number, h0: number, z: number) {
    p.h1 = h0 + (p.h1 - p.h0);
    p.h0 = h0;
    p.u = u;
    p.z = z;
    p.drawn = '';
    this.version++;
  }
  /** Hold a block somewhere (she carries it): no flight, straight there. */
  hold(p: Piece, u: number, h0: number, z: number) {
    p.h1 = h0 + (p.h1 - p.h0);
    p.h0 = h0;
    p.u = u;
    p.z = z;
    p.drawn = '';
  }

  // ------------------------------------------------------------------ loose cubes
  addCube(el: HTMLElement, s: number, u: number, v: number, h: number) {
    this.world.appendChild(el);
    const c: Cube = { el, s, u, v, h, vu: 0, vv: 0, vh: 0, spin: (Math.random() - 0.5) * 40, rot: Math.random() * 360, held: false, hitAt: 0, thrownAt: 0 };
    this.cubes.push(c);
    return c;
  }

  private stepCubes(dt: number, now: number) {
    const g = 9.8 * this.m;
    // an impact is a fall faster than a few frames of gravity (a cube at rest gains g * dt every frame)
    const hard = Math.max(80, g * dt * 3);
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
          if (prevH >= b.h1 - 1) {
            // onto its top
            c.h = b.h1;
            if (c.vh < -hard) c.hitAt = now;
            c.vh = c.vh < -hard ? -c.vh * 0.35 : 0;
            grounded = true;
          } else if (prevH + c.s <= b.h0 + 1) {
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
            if (Math.hypot(c.vu, c.vv) > 150) c.hitAt = now;
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
        c.u = Math.max(half, Math.min(this.W - half, c.u));
        c.v = Math.max(-this.zMax - 1.5 * this.m, Math.min(3 * this.m, c.v));
      }
      // cube vs cube: push apart
      for (const o of this.cubes) {
        if (o === c || c.held) continue;
        const du = c.u - o.u;
        const dv = c.v - o.v;
        const lim = (c.s + o.s) / 2;
        if (Math.abs(du) < lim && Math.abs(dv) < lim && Math.abs(c.h - o.h) < lim) {
          const d = Math.hypot(du, dv) || 1;
          const push = (lim - d) * 0.5;
          c.u += (du / d) * push;
          c.v += (dv / d) * push;
        }
      }
      // the cube's own +Z is its top: stand it up in the page's space (Y down)
      c.el.style.transform = `translate3d(${(c.u - c.s / 2).toFixed(1)}px, ${(this.Hp - c.h - c.s).toFixed(1)}px, ${c.v.toFixed(1)}px) rotateX(90deg) rotateZ(${c.rot.toFixed(1)}deg)`;
    }
  }

  /** Put the page back exactly as it was. */
  restore() {
    for (const p of this.pieces) {
      if (p.saved === null) p.el.removeAttribute('style');
      else p.el.setAttribute('style', p.saved);
    }
    for (const [a, s] of this.ancestors) {
      if (s === null) a.removeAttribute('style');
      else a.setAttribute('style', s);
    }
    for (const [el, s] of this.hidden) {
      if (s === null) el.removeAttribute('style');
      else el.setAttribute('style', s);
    }
    this.ancestors.clear();
    this.hidden.length = 0;
    this.pieces = [];
    this.world.remove();
  }
}

export { smooth };
