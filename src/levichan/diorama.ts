// The page as a diorama: the live page lies down as the ground of the 3D space and each of its components (cards,
// buttons, headings, pictures, the bar...) rises out of it as a block with real sides, on its own spring. The
// components stay the page's own elements (links, menus and text work as usual); only inline styles are added,
// and all of them are put back when the space closes. Blocks she can stand on, climb and hide behind, and a few
// loose Minecraft cubes with simple physics, live here too.
//
// Page-local coordinates: u right and v down the page (layout px from the page's top-left), h up from it.

export interface Box {
  u: number;
  v: number;
  w: number;
  d: number;
  h: number;
}

type Kind = 'card' | 'bar' | 'button' | 'media' | 'title' | 'heading' | 'text';

interface Comp extends Box {
  el: HTMLElement;
  kind: Kind;
  /** the height it rises to */
  target: number;
  vel: number;
  /** seconds after the start of the rise when it starts */
  delay: number;
  sides: HTMLElement[];
  shadow: HTMLElement | null;
  saved: string | null;
}

/** Heights (page px per metre of hers: see Diorama.m) */
const HEIGHT_M: Record<Kind, number> = {
  card: 0.36,
  bar: 0.16,
  button: 0.12,
  media: 0.16,
  title: 0.22,
  heading: 0.14,
  text: 0.06,
};
const TEXT_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE', 'PRE', 'TABLE', 'FIGCAPTION', 'LABEL', 'DT', 'DD']);
const MEDIA_TAGS = new Set(['IMG', 'SVG', 'VIDEO', 'CANVAS', 'PICTURE', 'IFRAME']);
const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

function parseColor(c: string): [number, number, number, number] | null {
  const m = /rgba?\(([^)]+)\)/.exec(c);
  if (!m) return null;
  const p = m[1]!.split(/[ ,/]+/).filter(Boolean).map(Number);
  return [p[0]!, p[1]!, p[2]!, p[3] ?? 1];
}
const shade = (c: [number, number, number, number], k: number, a = 1) =>
  `rgba(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)},${a})`;

/** A loose cube on the page: falls, bounces, can be thrown. */
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
  comps: Comp[] = [];
  cubes: Cube[] = [];
  /** page px per metre of hers (her height is 1.45 m) */
  readonly m: number;
  W = 0;
  Hp = 0;
  private readonly ancestors = new Map<HTMLElement, string | null>();
  private readonly hidden: [HTMLElement, string | null][] = [];
  private t0 = 0;
  private sinking = -1;
  /** the page's own background (the body's is the sky while the space is open) */
  private readonly pageBg: [number, number, number, number];

  constructor(
    private readonly root: HTMLElement,
    herPx: number,
  ) {
    this.m = herPx / 1.45;
    this.pageBg = parseColor(getComputedStyle(document.documentElement).getPropertyValue('--lc-page-bg')) ?? [247, 243, 232, 1];
    this.world = document.createElement('div');
    this.world.id = 'lc-world';
    this.ground = document.createElement('div');
    this.ground.id = 'lc-ground';
    this.world.appendChild(this.ground);
  }

  /** Measure the page, pick its components and build the blocks (all flat until rise()). */
  build(origin: { u: number; v: number }) {
    this.W = this.root.clientWidth;
    this.Hp = this.root.scrollHeight;
    this.world.style.width = `${this.W}px`;
    this.world.style.height = `${this.Hp}px`;
    this.root.appendChild(this.world);
    // the page's own fixed backdrop would ride along as a band at the top: our ground replaces it
    for (const el of this.root.querySelectorAll<HTMLElement>('.kit-backdrop, .kit-skip-link')) {
      this.hidden.push([el, el.getAttribute('style')]);
      el.style.visibility = 'hidden';
    }
    const picked: [HTMLElement, Kind][] = [];
    this.pick(this.root, picked);
    let maxD = 1;
    for (const [el] of picked) {
      const r = this.rect(el);
      maxD = Math.max(maxD, Math.hypot(r.u + r.w / 2 - origin.u, r.v + r.d / 2 - origin.v));
    }
    for (const [el, kind] of picked) this.addComp(el, kind, origin, maxD);
  }

  /** Layout rect of an element in page-local px (offset chain: transforms don't change it). */
  rect(el: HTMLElement): { u: number; v: number; w: number; d: number } {
    let u = 0;
    let v = 0;
    let e: HTMLElement | null = el;
    while (e && e !== this.root) {
      u += e.offsetLeft;
      v += e.offsetTop;
      const p = e.offsetParent as HTMLElement | null;
      // the parent's border sits between the two offsets
      if (p && p !== this.root) {
        const cs = getComputedStyle(p);
        u += parseFloat(cs.borderLeftWidth) || 0;
        v += parseFloat(cs.borderTopWidth) || 0;
      }
      e = p;
    }
    // SVG and other non-HTML elements have no offset*: fall back on their box relative to their parent
    if (!(el instanceof HTMLElement) || el.offsetParent === null) {
      const r = (el as Element).getBoundingClientRect();
      const rr = this.root.getBoundingClientRect();
      return { u: r.left - rr.left, v: r.top - rr.top, w: r.width, d: r.height };
    }
    return { u, v, w: el.offsetWidth, d: el.offsetHeight };
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
      // decorative absolute layers (the hero's painting) stay on the ground as they are
      if ((cs.position === 'absolute' || cs.position === 'fixed') && !c.querySelector('a, button, h1, h2, h3, p')) continue;
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

  /** Let a component's ancestors carry 3D (preserve-3d, nothing that flattens). */
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
    }
  }

  private addComp(el: HTMLElement, kind: Kind, origin: { u: number; v: number }, maxD: number) {
    const saved = el.getAttribute('style');
    this.open3d(el);
    // a sticky element measures where it is stuck: unstick it first
    const pos = getComputedStyle(el).position;
    if (pos === 'sticky' || pos === 'fixed') el.style.position = 'relative';
    const r = this.rect(el);
    // the big cards (the hero's showcase, the community cards) stand 0.5 m: something to climb and to hide behind
    const target = Math.round(kind === 'card' && r.w * r.d > 80000 ? 0.5 * this.m : HEIGHT_M[kind] * this.m);
    const dist = Math.hypot(r.u + r.w / 2 - origin.u, r.v + r.d / 2 - origin.v) / maxD;
    const c: Comp = { el, kind, ...r, h: 0, target, vel: 0, delay: 0.25 + dist * 1.1 + Math.random() * 0.08, sides: [], shadow: null, saved };
    const cs = getComputedStyle(el);
    el.style.transformStyle = 'flat';
    el.style.willChange = 'transform';
    let bg = parseColor(cs.backgroundColor);
    if (!bg || bg[3] < 0.3) bg = this.pageBg;
    const radius = parseFloat(cs.borderTopLeftRadius) || 0;
    const solid = kind === 'card' || kind === 'bar' || kind === 'button' || kind === 'media';
    if (solid) {
      // a block needs a lid: a see-through card would show its own inner walls
      const own = parseColor(cs.backgroundColor);
      if (kind !== 'media' && (!own || own[3] < 0.6)) el.style.backgroundColor = shade(bg, 1, 1);
      // four sides, standing on the ground along the edges (sized each frame while rising)
      const tones = [0.8, 0.6, 0.7, 0.7];
      for (let i = 0; i < 4; i++) {
        const s = document.createElement('div');
        s.className = 'lc-side';
        s.style.background = `linear-gradient(${i < 2 ? 0 : 90}deg, ${shade(bg, tones[i]! * 0.84)}, ${shade(bg, tones[i]!)})`;
        if (radius) s.style.borderRadius = `${Math.min(radius, 6)}px`;
        this.world.appendChild(s);
        c.sides.push(s);
      }
      const sh = document.createElement('div');
      sh.className = 'lc-cast';
      if (radius) sh.style.borderRadius = `${radius}px`;
      this.world.appendChild(sh);
      c.shadow = sh;
    }
    this.comps.push(c);
  }

  /** Start the rise (each block after its delay, from the origin outward). */
  rise(now: number) {
    this.t0 = now;
    this.sinking = -1;
  }
  /** Sink everything back into the page (the far ones first). */
  sink(now: number) {
    this.sinking = now;
    const maxDelay = Math.max(...this.comps.map((c) => c.delay), 0);
    for (const c of this.comps) c.delay = (maxDelay - c.delay) * 0.45;
  }
  /** Flat again (sinking done)? */
  get flat() {
    return this.sinking >= 0 && this.comps.every((c) => c.h < 0.5 && Math.abs(c.vel) < 5);
  }

  /** Give a block a kick (she landed on it, a cube hit it). */
  bump(c: Box, v: number) {
    const cc = c as Comp;
    if (this.comps.includes(cc)) cc.vel += v;
  }

  update(now: number, dt: number) {
    const t = (now - (this.sinking >= 0 ? this.sinking : this.t0)) / 1000;
    for (const c of this.comps) {
      const goal = this.sinking >= 0 ? (t > c.delay ? 0 : c.target) : t > c.delay ? c.target : 0;
      // a lively spring: a little overshoot on the way up, settles quickly
      const k = this.sinking >= 0 ? 160 : 120;
      const damp = this.sinking >= 0 ? 22 : 11;
      c.vel += (k * (goal - c.h) - damp * c.vel) * dt;
      c.h += c.vel * dt;
      if (this.sinking >= 0 && goal === 0 && c.h < 0) {
        c.h = 0;
        c.vel = 0;
      }
      this.draw(c, now);
    }
    this.stepCubes(dt, now);
  }

  private draw(c: Comp, now: number) {
    const h = Math.max(0, c.h);
    const lift = c.target ? h / c.target : 0;
    // a small tilt while it is moving fast, to sell the spring
    const wob = Math.max(-4, Math.min(4, c.vel * 0.012));
    const wx = Math.sin(c.u * 0.01) * wob;
    c.el.style.transform = h > 0.05 || wob ? `translateZ(${h.toFixed(2)}px) rotateX(${wx.toFixed(2)}deg)` : '';
    // floating text casts a soft shadow of its own letters (the ground is too far for a real one)
    if (!c.sides.length && c.kind !== 'text') c.el.style.filter = h > 1 ? `drop-shadow(0 ${(h * 0.45).toFixed(1)}px ${(h * 0.22).toFixed(1)}px rgba(20, 40, 30, ${(0.28 * lift).toFixed(3)}))` : '';
    const [s0, s1, s2, s3] = c.sides;
    if (s0 && s1 && s2 && s3) {
      const vis = h > 0.5 ? '' : 'none';
      // near (bottom edge), far (top edge), left, right
      place(s0, c.u, c.v + c.d, c.w, h, `rotateX(90deg)`, 'top', vis);
      place(s1, c.u, c.v, c.w, h, `rotateX(90deg)`, 'top', vis);
      place(s2, c.u, c.v, h, c.d, `rotateY(-90deg)`, 'left', vis);
      place(s3, c.u + c.w, c.v, h, c.d, `rotateY(-90deg)`, 'left', vis);
    }
    if (c.shadow) {
      const s = c.shadow.style;
      const spread = 4 + h * 0.35;
      s.left = `${c.u - spread}px`;
      s.top = `${c.v - spread * 0.4}px`;
      s.width = `${c.w + spread * 2}px`;
      s.height = `${c.d + spread * 1.6}px`;
      s.opacity = String(Math.min(0.55, lift * 0.55));
      s.transform = `translate3d(${(h * 0.12).toFixed(1)}px, ${(h * 0.25).toFixed(1)}px, 0.5px)`;
      s.filter = `blur(${(3 + h * 0.18).toFixed(1)}px)`;
    }
  }

  /** The blocks (for walking, climbing, hiding and her occluders). */
  boxes(minH = 0): (Box & { kind: Kind })[] {
    return this.comps.filter((c) => c.h > minH && c.kind !== 'text');
  }
  /** The top under a point at or below `maxH` (0: the ground). */
  supportAt(u: number, v: number, maxH = Infinity, margin = 0): { h: number; box: Box | null } {
    let best: { h: number; box: Box | null } = { h: 0, box: null };
    for (const c of this.comps) {
      if (c.kind === 'text' || c.h <= best.h || c.h > maxH) continue;
      if (u >= c.u - margin && u <= c.u + c.w + margin && v >= c.v - margin && v <= c.v + c.d + margin) best = { h: c.h, box: c };
    }
    return best;
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
        c.vh -= g * dt;
        c.u += c.vu * dt;
        c.v += c.vv * dt;
        c.h += c.vh * dt;
        const half = c.s / 2;
        // the blocks: land on top, or bounce off a side
        for (const b of this.comps) {
          if (b.kind === 'text' || b.h < 2) continue;
          const inU = c.u + half > b.u && c.u - half < b.u + b.w;
          const inV = c.v + half > b.v && c.v - half < b.v + b.d;
          if (!inU || !inV || c.h >= b.h) continue;
          const prevH = c.h - c.vh * dt;
          if (prevH >= b.h - 1) {
            c.h = b.h;
            if (c.vh < -hard) {
              this.bump(b, c.vh * 0.08);
              c.hitAt = now;
            }
            c.vh = c.vh < -hard ? -c.vh * 0.35 : 0;
            c.vu *= 0.9;
            c.vv *= 0.9;
          } else {
            // pushed out along the shallower axis
            const du = Math.min(c.u + half - b.u, b.u + b.w - (c.u - half));
            const dv = Math.min(c.v + half - b.v, b.v + b.d - (c.v - half));
            if (du < dv) {
              c.u += c.u < b.u + b.w / 2 ? -du : du;
              c.vu = -c.vu * 0.4;
            } else {
              c.v += c.v < b.v + b.d / 2 ? -dv : dv;
              c.vv = -c.vv * 0.4;
            }
            if (Math.hypot(c.vu, c.vv) > 150) c.hitAt = now;
          }
        }
        if (c.h <= 0) {
          c.h = 0;
          if (c.vh < -hard) c.hitAt = now;
          c.vh = c.vh < -hard ? -c.vh * 0.35 : 0;
          // ground friction
          const f = Math.max(0, 1 - dt * 4);
          c.vu *= f;
          c.vv *= f;
        }
        c.spin *= Math.max(0, 1 - dt * (c.h <= 0 ? 3 : 0.3));
        c.rot += c.spin * dt;
        // keep them on the page
        c.u = Math.max(half, Math.min(this.W - half, c.u));
        c.v = Math.max(half, Math.min(this.Hp - half, c.v));
      }
      // cube vs cube: push apart
      for (const o of this.cubes) {
        if (o === c) continue;
        const du = c.u - o.u;
        const dv = c.v - o.v;
        const lim = (c.s + o.s) / 2;
        if (Math.abs(du) < lim && Math.abs(dv) < lim && Math.abs(c.h - o.h) < lim) {
          const d = Math.hypot(du, dv) || 1;
          const push = (lim - d) * 0.5;
          if (!c.held) {
            c.u += (du / d) * push;
            c.v += (dv / d) * push;
          }
        }
      }
      c.el.style.transform = `translate3d(${(c.u - c.s / 2).toFixed(1)}px, ${(c.v - c.s / 2).toFixed(1)}px, ${(c.h + c.s / 2).toFixed(1)}px) rotateZ(${c.rot.toFixed(1)}deg)`;
    }
  }

  /** Put the page back exactly as it was. */
  restore() {
    for (const c of this.comps) {
      if (c.saved === null) c.el.removeAttribute('style');
      else c.el.setAttribute('style', c.saved);
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
    this.comps = [];
    this.world.remove();
  }
}

/** A side face: an element on the page at (u, v), size w x h, stood up about its `origin` edge. */
function place(el: HTMLElement, u: number, v: number, w: number, h: number, rot: string, origin: 'top' | 'left', display: string) {
  const s = el.style;
  s.display = display;
  if (display === 'none') return;
  s.left = `${u}px`;
  s.top = `${v}px`;
  s.width = `${Math.max(0, w)}px`;
  s.height = `${Math.max(0, h)}px`;
  s.transformOrigin = origin === 'top' ? '50% 0' : '0 50%';
  s.transform = rot;
}

export { smooth };
