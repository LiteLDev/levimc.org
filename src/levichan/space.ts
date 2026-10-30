// The 3D space: the site folds into a panel standing in a CSS 3D scene, LeviChan stands beside it (WebGL,
// with a camera matched to the CSS perspective), and a small brain (./brain) turns what the visitor does
// into what she does. Everything here is loaded on demand, from the avatar's menu (./LeviChanPeek).
import css from './levichan.css?inline';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Ray } from '@babylonjs/core/Culling/ray.pure';
import { Levi, type HitRegion } from './levi';
import { Brain } from './brain';
import type { LeviChanStrings } from './strings';

export interface EnterOptions {
  strings: LeviChanStrings;
  /** asset folder (with clips.json, model/, motions/) */
  base?: string;
  /** skip the fold-in (a reload while the space was open) */
  instant?: boolean;
  onExit?: () => void;
}

export type LookMode = 'auto' | 'always' | 'never';

const STORE = 'levichan';
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEG = Math.PI / 180;

/** CSS matrix3d of a Babylon matrix built in CSS space (x right, y down, z toward the viewer): Babylon's row-vector
 * layout is CSS's column-major one. */
const m3d = (m: Matrix) => `matrix3d(${Array.from(m.m, (v) => +v.toFixed(6)).join(',')})`;

interface Layout {
  W: number;
  H: number;
  P: number;
  panel: { w: number; h: number; x: number; y: number; z: number; yaw: number; yawRead: number; zRead: number };
  floorY: number;
  levi: { x: number; z: number; h: number };
}

function layoutFor(W: number, H: number): Layout {
  const P = Math.max(900, Math.hypot(W, H) * 0.9);
  if (W >= 900) {
    const w = Math.min(Math.round(W * 0.66), 1200);
    const h = Math.round(H * 0.84);
    const x = -W / 2 + W * 0.035 + w / 2;
    return {
      W, H, P,
      panel: { w, h, x, y: -H * 0.035, z: -110, yaw: 9 * DEG, yawRead: 2 * DEG, zRead: -40 },
      floorY: H * 0.385,
      levi: { x: Math.min(W / 2 - W * 0.14, x + w / 2 + W * 0.12), z: 120, h: H * 0.6 },
    };
  }
  const w = Math.round(W * 0.94);
  const h = Math.round(H * 0.64);
  return {
    W, H, P,
    panel: { w, h, x: 0, y: -H * 0.16, z: -60, yaw: 3 * DEG, yawRead: 0, zRead: -20 },
    floorY: H * 0.4,
    levi: { x: W * 0.26, z: 140, h: H * 0.33 },
  };
}

/** A tiny seeded RNG, so the cubes' pixel textures are the same on every visit. */
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function pixelTexture(kind: 'grass' | 'dirt' | 'leaf' | 'log' | 'stone', seed: number) {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d')!;
  const r = rng(seed);
  const pal: Record<string, string[]> = {
    grass: ['#5fa94a', '#6dbb55', '#4f9640', '#7cc65f'],
    dirt: ['#8a5a3b', '#7a4e33', '#98674a', '#6c442c'],
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
  if (kind === 'dirt') {
    // a grass block's side: grass fringe on top
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

class Space {
  private readonly t: LeviChanStrings;
  private readonly base: string;
  private readonly root: HTMLElement;
  private readonly html = document.documentElement;
  private readonly els: HTMLElement[] = [];
  private style!: HTMLStyleElement;
  private sky!: HTMLElement;
  private floor!: HTMLElement;
  private ring!: HTMLElement;
  private shadow!: HTMLElement;
  private cubes: { el: HTMLElement; pos: Vector3; size: number; spin: number; phase: number }[] = [];
  canvas!: HTMLCanvasElement;
  private loadEl!: HTMLElement;
  private menu!: HTMLElement;
  private fab!: HTMLButtonElement;
  levi: Levi | null = null;
  brain: Brain | null = null;
  L!: Layout;
  private savedRootStyle = '';
  private savedScroll = 0;
  private raf = 0;
  private alive = true;
  private readonly onExit?: () => void;

  // camera rig: parallax from the pointer, orbit from drags, dolly from the wheel
  private yaw = 0;
  private pitch = 0;
  private orbitYaw = 0;
  private orbitPitch = 0;
  private dolly = 0;
  private dollyTarget = 0;
  private mx = 0;
  private my = 0;
  private parallaxYaw = 0;
  private parallaxPitch = 0;
  /** reading focus: the panel turns toward the viewer while they read */
  private read = 0;
  private readTarget = 0;
  private overPanelSince = 0;
  private offPanelSince = 0;
  flat = false;
  look: LookMode = 'auto';
  quiet = false;
  private kick = 0;
  private kickV = 0;
  private intro = 0; // 0..1 fold-in progress
  private introStart = 0;
  private introDur = 2300;
  private outro = -1;
  private leviReveal = 0;
  private leviRevealStart = -1;
  private V = Matrix.Identity();
  private lastFrame = performance.now();

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
    this.style = document.createElement('style');
    this.style.textContent = css;
    document.head.appendChild(this.style);
    const bg = getComputedStyle(document.body).backgroundColor;
    this.savedScroll = window.scrollY;
    this.savedRootStyle = this.root.getAttribute('style') ?? '';

    this.sky = this.add('div', 'lc-sky');
    this.sky.innerHTML = '<div id="lc-stars"></div>';
    this.floor = this.add('div', 'lc-floor', 'lc-layer');
    this.ring = this.add('div', 'lc-ring', 'lc-layer');
    this.shadow = this.add('div', 'lc-shadow', 'lc-layer');
    this.makeCubes();
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

    this.html.classList.add('lc-3d');
    this.html.style.setProperty('--lc-page-bg', bg);
    this.L = layoutFor(innerWidth, innerHeight);
    this.placeRoot();
    this.root.scrollTop = this.savedScroll;

    this.introStart = performance.now();
    if (instant || reduced()) this.introDur = 1;
    else this.foldClones();

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
    this.placeLevi();
    this.leviRevealStart = performance.now() + Math.max(0, this.introDur - (performance.now() - this.introStart)) * 0.6;
    this.brain = new Brain(this, this.levi, this.t);
    if (new URLSearchParams(location.search).has('lcdebug')) (window as unknown as { __levichan: unknown }).__levichan = this;
    this.levi.engine.runRenderLoop(() => this.levi?.scene.render());
  }

  private add(tag: string, id: string, cls?: string) {
    const el = document.createElement(tag);
    el.id = id;
    if (cls) el.className = cls;
    document.body.appendChild(el);
    this.els.push(el);
    return el;
  }

  private makeCubes() {
    const kinds: [string, string, string][] = [
      ['grass', 'dirt', 'dirt'],
      ['leaf', 'leaf', 'leaf'],
      ['log', 'log', 'log'],
      ['stone', 'stone', 'stone'],
      ['grass', 'dirt', 'dirt'],
      ['leaf', 'leaf', 'leaf'],
    ];
    const r = rng(7);
    kinds.forEach(([top, side, bottom], i) => {
      const el = this.add('div', `lc-cube-${i}`, 'lc-layer lc-cube');
      const size = 40 + Math.round(r() * 50);
      el.style.width = el.style.height = `${size}px`;
      const urls = [top, side, side, side, side, bottom === 'dirt' ? 'dirt' : bottom].map((k, j) =>
        pixelTexture((k === 'dirt' && j === 5 ? 'dirt' : k) as 'grass', 100 + i * 10 + j),
      );
      const faces = [
        `rotateX(90deg) translateZ(${size / 2}px)`,
        `translateZ(${size / 2}px)`,
        `rotateY(90deg) translateZ(${size / 2}px)`,
        `rotateY(180deg) translateZ(${size / 2}px)`,
        `rotateY(-90deg) translateZ(${size / 2}px)`,
        `rotateX(-90deg) translateZ(${size / 2}px)`,
      ];
      el.innerHTML = faces.map((f, j) => `<i style="transform:${f};background-image:url(${urls[j]})"></i>`).join('');
      this.cubes.push({ el, pos: new Vector3(0, 0, 0), size, spin: (r() - 0.5) * 12, phase: r() * Math.PI * 2 });
    });
  }

  private placeRoot() {
    const { W, H, panel } = this.L;
    const s = this.root.style;
    s.left = `${(W - panel.w) / 2}px`;
    s.top = `${(H - panel.h) / 2}px`;
    s.width = `${panel.w}px`;
    s.height = `${panel.h}px`;
    // cubes float behind and around the panel
    const spots = [
      [-0.48, -0.32, -900], [0.42, -0.36, -700], [0.2, -0.08, -1300], [-0.35, 0.18, -600], [0.47, 0.05, -400], [-0.05, -0.42, -1100],
    ];
    this.cubes.forEach((c, i) => {
      const [x, y, z] = spots[i]!;
      c.pos.set(x! * W, y! * H, z!);
    });
  }

  /** Where she stands: feet on the floor at her layout spot, turned a little toward the panel; 1 MMD unit = k
   * CSS px. Her model stays at the Babylon origin (moving an MMD model's root under running physics flings the
   * hair and skirt): the placement goes into the mapping between the two spaces instead (this.toCss). */
  private k = 30;
  private toCss = Matrix.Identity();
  private placeLevi() {
    const { levi, floorY } = this.L;
    this.k = levi.h / 18.3;
    // Babylon (MMD units, y up, z away) -> CSS (px, y down, z toward the viewer), then her spot
    this.toCss = Matrix.RotationY(-14 * DEG)
      .multiply(Matrix.Scaling(this.k, -this.k, -this.k))
      .multiply(Matrix.Translation(levi.x, floorY, levi.z));
  }

  // ------------------------------------------------------------------ fold-in / fold-out
  private clones: HTMLElement | null = null;
  private halves: HTMLElement[] = [];
  /** Two snapshots of the page as it is (top and bottom halves) fold and fly; the live page takes over after. */
  private foldClones() {
    const { W, H } = { W: innerWidth, H: innerHeight };
    const wrap = document.createElement('div');
    wrap.className = 'lc-clone';
    wrap.style.width = `${W}px`;
    wrap.style.height = `${H}px`;
    const mk = (top: boolean) => {
      const half = document.createElement('div');
      half.className = 'lc-clone-half';
      half.style.top = top ? '0' : `${H / 2}px`;
      half.style.height = `${H / 2}px`;
      half.style.transformOrigin = top ? '50% 100%' : '50% 0%';
      const page = this.root.cloneNode(true) as HTMLElement;
      page.removeAttribute('id');
      page.setAttribute('aria-hidden', 'true');
      page.setAttribute('inert', '');
      page.style.cssText = `position:absolute;left:0;width:${W}px;top:${-this.savedScroll - (top ? 0 : H / 2)}px;`;
      half.appendChild(page);
      const back = document.createElement('div');
      back.className = 'lc-clone-back';
      back.style.top = top ? '0' : `${H / 2}px`;
      back.style.height = `${H / 2}px`;
      back.style.transformOrigin = top ? '50% 100%' : '50% 0%';
      wrap.appendChild(half);
      wrap.appendChild(back);
      return [half, back] as const;
    };
    const [, ] = mk(true);
    const [bottom, bottomBack] = mk(false);
    this.halves = [bottom, bottomBack];
    document.body.appendChild(wrap);
    this.clones = wrap;
    this.root.style.opacity = '0';
  }

  exit() {
    if (this.outro >= 0) return;
    this.outro = performance.now();
    this.brain?.farewell();
    this.menu.hidden = true;
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
    this.clones?.remove();
    // (read before the styles go: without them #root no longer scrolls)
    const scroll = this.root.scrollTop;
    this.style.remove();
    this.html.classList.remove('lc-3d');
    this.html.style.removeProperty('--lc-page-bg');
    this.root.setAttribute('style', this.savedRootStyle);
    if (!this.savedRootStyle) this.root.removeAttribute('style');
    window.scrollTo(0, scroll);
    active = null;
    this.onExit?.();
  }

  // ------------------------------------------------------------------ the frame
  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.intro = clamp01((now - this.introStart) / this.introDur);

    // outro: the reverse of the intro, then back to the flat page
    let k = easeInOut(this.intro);
    if (this.outro >= 0) {
      const o = clamp01((now - this.outro - 900) / 1100);
      k = 1 - easeInOut(o);
      if (o >= 1) {
        this.teardown();
        return;
      }
    }

    // reading focus: flatten after the pointer has rested on the panel a moment; back after it left a while
    if (this.flat) this.readTarget = 1;
    else if (this.overPanelSince && now - this.overPanelSince > 700) this.readTarget = 1;
    else if (this.offPanelSince && now - this.offPanelSince > 1400) this.readTarget = 0;
    this.read += (this.readTarget - this.read) * Math.min(1, dt * 3);
    // parallax and orbit ease
    this.parallaxYaw += (this.mx * 3 * DEG - this.parallaxYaw) * Math.min(1, dt * 3);
    this.parallaxPitch += (-this.my * 1.6 * DEG - this.parallaxPitch) * Math.min(1, dt * 3);
    if (!this.dragging) {
      this.orbitYaw *= 1 - Math.min(1, dt * 0.25);
      this.orbitPitch *= 1 - Math.min(1, dt * 0.25);
    }
    this.dolly += (this.dollyTarget - this.dolly) * Math.min(1, dt * 5);
    // the panel's spring after a fast scroll
    this.kickV += (-120 * this.kick - 14 * this.kickV) * dt;
    this.kick += this.kickV * dt;

    this.yaw = (this.parallaxYaw + this.orbitYaw) * (1 - this.read * 0.6);
    this.pitch = (this.parallaxPitch + this.orbitPitch) * (1 - this.read * 0.6);
    this.render(k, now);
  };

  private render(k: number, now: number) {
    const { W, H, P, panel, floorY, levi } = this.L;
    // view: dolly toward the pivot (between the panel and her), then orbit about it
    const pivot = new Vector3(lerp(0, levi.x * 0.35, 1), floorY * 0.25, 0);
    const V = Matrix.Translation(-pivot.x, -pivot.y, -pivot.z)
      .multiply(Matrix.RotationY(this.yaw))
      .multiply(Matrix.RotationX(this.pitch))
      .multiply(Matrix.Translation(pivot.x, pivot.y, pivot.z + this.dolly));
    // the whole scene comes in with the intro (k: 0 flat page -> 1 the space)
    this.V = V;
    const persp = `perspective(${P}px) `;
    const sceneK = clamp01((k - 0.25) / 0.6);
    this.sky.style.opacity = String(clamp01(k * 1.6));

    // the floor: a big plane at floorY, laid down from upright as the scene arrives
    const F = 5000;
    this.floor.style.width = this.floor.style.height = `${F}px`;
    this.floor.style.left = `${(W - F) / 2}px`;
    this.floor.style.top = `${(H - F) / 2}px`;
    this.floor.style.opacity = String(sceneK);
    this.floor.style.transform =
      persp + m3d(Matrix.RotationX(lerp(30, 90, easeOut(sceneK)) * DEG).multiply(Matrix.Translation(0, floorY + lerp(H, 0, easeOut(sceneK)), -600)).multiply(this.V));

    // her ring (spawn portal) and contact shadow, on the floor at her feet
    const reveal = this.leviRevealStart < 0 ? 0 : clamp01((now - this.leviRevealStart) / 1200);
    this.leviReveal = this.outro >= 0 ? Math.min(this.leviReveal, 1 - clamp01((now - this.outro) / 700)) : reveal;
    const feet = this.feetCss();
    const R = levi.h * 0.32;
    for (const [el, size, op] of [
      [this.ring, R * 2, Math.sin(Math.PI * clamp01(this.leviReveal * 1.1)) * 0.9],
      [this.shadow, R * 1.1, this.leviReveal * sceneK],
    ] as const) {
      el.style.width = el.style.height = `${size}px`;
      el.style.left = `${(W - size) / 2}px`;
      el.style.top = `${(H - size) / 2}px`;
      el.style.opacity = String(op);
      el.style.transform = persp + m3d(Matrix.RotationX(90 * DEG).multiply(Matrix.Translation(feet.x, floorY - 1, feet.z)).multiply(this.V));
    }

    // cubes bob and turn slowly
    const t = now / 1000;
    for (const c of this.cubes) {
      c.el.style.left = `${(W - c.size) / 2}px`;
      c.el.style.top = `${(H - c.size) / 2}px`;
      c.el.style.opacity = String(sceneK);
      const M = Matrix.RotationY((c.spin * t + c.phase * 30) * DEG)
        .multiply(Matrix.RotationX(12 * DEG))
        .multiply(Matrix.Translation(c.pos.x, c.pos.y + Math.sin(t * 0.7 + c.phase) * 14, c.pos.z));
      c.el.style.transform = persp + m3d(M.multiply(this.V));
    }

    // the page panel: from flat (k = 0) to its place; the fold clones carry the first part of the intro
    const yaw = lerp(panel.yaw, panel.yawRead, this.read) + this.kick * 6 * DEG;
    const pitch = this.kick * 2 * DEG;
    const z = lerp(panel.z, panel.zRead, this.read);
    const placed = Matrix.RotationX(pitch).multiply(Matrix.RotationY(yaw)).multiply(Matrix.Translation(panel.x, panel.y, z));
    // fold-in: scale the full-viewport page down to the panel while it travels
    const flatToPanel = (kk: number) => {
      const sx = lerp(W / panel.w, 1, kk);
      const sy = lerp(H / panel.h, 1, kk);
      const M = Matrix.Scaling(sx, sy, 1)
        .multiply(Matrix.RotationX(pitch * kk))
        .multiply(Matrix.RotationY(yaw * kk))
        .multiply(Matrix.Translation(panel.x * kk, panel.y * kk, z * kk));
      return M.multiply(kk >= 1 ? this.V : Matrix.Translation(0, 0, 0).multiply(this.V));
    };
    const live = this.outro >= 0 ? flatToPanel(k) : placed.multiply(this.V);
    this.root.style.transform = persp + m3d(live);
    if (this.clones) this.animateClones(k, persp);

    // the WebGL camera: the CSS viewer at (0, 0, P) looking down -z, carried into the world by V^-1
    if (this.levi) {
      const kk = this.k;
      // Babylon world -> CSS world -> CSS view -> Babylon view (S: CSS -> MMD units, y up, z away)
      const S = Matrix.Scaling(1 / kk, -1 / kk, -1 / kk);
      const Vb = this.toCss.multiply(this.V).multiply(S);
      const camLocal = Matrix.Translation(0, 0, -P / kk);
      const camWorld = camLocal.multiply(Vb.clone().invert());
      this.levi.setCamera(camWorld, 2 * Math.atan(H / 2 / P));
      // she arrives with a scan from the feet up, and leaves the same way
      const rv = easeInOut(this.leviReveal);
      this.canvas.style.opacity = rv > 0 ? '1' : '0';
      this.canvas.style.clipPath = rv >= 1 ? '' : `inset(${(1 - rv) * 100}% 0 0 0)`;
    }
  }

  /** The intro's first half folds the bottom half of the page up over the top (k 0..0.45), the folded page flies
   * into place (0.3..0.75) and unfolds (0.6..1); then the live page shows. */
  private animateClones(k: number, persp: string) {
    const { W, H, panel } = this.L;
    const wrap = this.clones!;
    const fold = k < 0.45 ? easeInOut(clamp01(k / 0.45)) : 1 - easeInOut(clamp01((k - 0.6) / 0.4));
    const fly = easeInOut(clamp01((k - 0.15) / 0.65));
    const yaw = lerp(0, panel.yaw, fly);
    const sx = lerp(1, panel.w / W, fly);
    const sy = lerp(1, panel.h / H, fly);
    const M = Matrix.Scaling(sx * lerp(1, 0.92, Math.sin(Math.PI * fly)), sy * lerp(1, 0.92, Math.sin(Math.PI * fly)), 1)
      .multiply(Matrix.RotationY(yaw))
      .multiply(Matrix.Translation(panel.x * fly, panel.y * fly + (fold * H) / 4 * (1 - fly), panel.z * fly))
      .multiply(this.V);
    wrap.style.transform = persp + m3d(M);
    wrap.style.transformStyle = 'preserve-3d';
    const ang = -fold * 178;
    for (const h of this.halves) h.style.transform = `rotateX(${ang}deg)`;
    if (this.halves[1]) this.halves[1].style.transform = `rotateX(${ang}deg) rotateY(180deg) rotateZ(180deg)`;
    // hand over to the live page at the end
    if (k >= 0.98) {
      this.root.style.opacity = '';
      wrap.style.opacity = String(clamp01((1 - k) * 50));
      if (k >= 1) {
        wrap.remove();
        this.clones = null;
      }
    }
  }

  /** Her feet (centre of the root) in CSS world space. */
  private feetCss() {
    const p = this.levi?.bonePos('センター');
    if (p) {
      const c = Vector3.TransformCoordinates(p, this.toCss);
      return new Vector3(c.x, this.L.floorY, c.z);
    }
    return new Vector3(this.L.levi.x, this.L.floorY, this.L.levi.z);
  }

  // ------------------------------------------------------------------ input
  private dragging = false;
  private dragStart: { x: number; y: number; yaw: number; pitch: number } | null = null;
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
  /** Is a screen point on the page panel? */
  overPanel(target: EventTarget | null) {
    return target instanceof Node && this.root.contains(target);
  }

  private bindEvents() {
    this.on(window, 'resize', () => {
      this.L = layoutFor(innerWidth, innerHeight);
      this.placeRoot();
      if (this.levi) {
        this.levi.engine.resize();
        this.placeLevi();
      }
    });
    this.on(window, 'pointermove', (e: PointerEvent) => {
      this.mx = (e.clientX / innerWidth) * 2 - 1;
      this.my = (e.clientY / innerHeight) * 2 - 1;
      const onPanel = this.overPanel(e.target);
      const now = performance.now();
      if (onPanel) {
        if (!this.overPanelSince) this.overPanelSince = now;
        this.offPanelSince = 0;
      } else {
        if (!this.offPanelSince) this.offPanelSince = now;
        this.overPanelSince = 0;
      }
      if (this.dragging && this.dragStart) {
        this.orbitYaw = Math.max(-35 * DEG, Math.min(35 * DEG, this.dragStart.yaw + ((e.clientX - this.dragStart.x) / innerWidth) * 80 * DEG));
        this.orbitPitch = Math.max(-8 * DEG, Math.min(18 * DEG, this.dragStart.pitch - ((e.clientY - this.dragStart.y) / innerHeight) * 40 * DEG));
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
        this.brain?.pointerDown(e, hit);
        return;
      }
      // drag the empty space (sky / floor) to look around
      if (e.target === this.sky || e.target === this.floor || (e.target as HTMLElement)?.id === 'lc-stars') {
        this.dragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY, yaw: this.orbitYaw, pitch: this.orbitPitch };
        this.brain?.floorDown(e);
      }
    });
    this.on(window, 'pointerup', (e: PointerEvent) => {
      const wasDrag = this.dragging && this.dragStart && Math.hypot(e.clientX - this.dragStart.x, e.clientY - this.dragStart.y) > 6;
      this.dragging = false;
      const hit = this.hitAt(e.clientX, e.clientY);
      this.brain?.pointerUp(e, hit, !!wasDrag);
    });
    this.on(this.canvas, 'dblclick', (e: MouseEvent) => {
      const hit = this.hitAt(e.clientX, e.clientY);
      if (hit) this.brain?.doubleClick(hit);
    });
    this.on(this.canvas, 'contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      this.toggleMenu(e.clientX, e.clientY, 'below');
    });
    this.on(window, 'wheel', (e: WheelEvent) => {
      if (this.overPanel(e.target)) return; // the page scrolls as usual
      if (e.target === this.canvas || e.target === this.sky || e.target === this.floor || (e.target as HTMLElement)?.id === 'lc-stars') {
        e.preventDefault();
        this.dollyTarget = Math.max(-500, Math.min(this.L.P * 0.55, this.dollyTarget - e.deltaY * 0.8));
        this.brain?.zoomed(this.dollyTarget / (this.L.P * 0.55));
      }
    }, { passive: false });
    let lastTop = this.root.scrollTop;
    let lastT = performance.now();
    this.on(this.root, 'scroll', () => {
      const now = performance.now();
      const v = (this.root.scrollTop - lastTop) / Math.max(1, now - lastT); // px / ms
      lastTop = this.root.scrollTop;
      lastT = now;
      if (Math.abs(v) > 4) this.kickV += Math.sign(v) * Math.min(3, Math.abs(v) * 0.25);
      const atEnd = this.root.scrollTop + this.root.clientHeight >= this.root.scrollHeight - 8;
      this.brain?.scrolled(v, atEnd);
    }, { passive: true });
    this.on(window, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !this.menu.hidden) this.menu.hidden = true;
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
    let wasDark = this.html.classList.contains('dark');
    mo.observe(this.html, { attributes: true, attributeFilter: ['lang', 'class'] });
    this.unbinders.push(() => mo.disconnect());
    // route changes (react-router pushes history entries): back to the top of the new page, and tell her
    let path = location.pathname;
    const iv = setInterval(() => {
      if (location.pathname !== path) {
        path = location.pathname;
        if (!location.hash) this.root.scrollTop = 0;
        this.brain?.navigated(path);
      }
      const dark = this.html.classList.contains('dark');
      if (dark !== wasDark) wasDark = dark;
    }, 250);
    this.unbinders.push(() => clearInterval(iv));
  }

  /** The point the cursor is at, on a plane through her head facing the camera (Babylon world). */
  cursorPoint(x: number, y: number): Vector3 | null {
    const r = this.ray(x, y);
    const head = this.levi?.bonePos('頭');
    if (!r || !head) return null;
    // the cursor lives on a plane a little in front of her face (toward the viewer): a cursor on her face then
    // means "looking at me", and the direction never degenerates
    const n = this.levi!.camera.getDirection(Vector3.Forward());
    const denom = Vector3.Dot(r.direction, n);
    if (Math.abs(denom) < 1e-6) return null;
    const plane = head.subtract(n.scale(9));
    const t = Vector3.Dot(plane.subtract(r.origin), n) / denom;
    return r.origin.add(r.direction.scale(Math.max(1, t)));
  }
  /** A screen point pushed back onto the page panel's depth (for looking at links). */
  screenPoint(x: number, y: number): Vector3 | null {
    const r = this.ray(x, y);
    if (!r) return null;
    const head = this.levi?.bonePos('頭');
    const d = head ? Vector3.Distance(r.origin, head) * 1.15 : 40;
    return r.origin.add(r.direction.scale(d));
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
    const p = this.levi?.bonePos('センター');
    return p && this.levi ? this.levi.project(new Vector3(p.x, this.levi.bonePos('左足首')?.y ?? p.y - 9, p.z)) : null;
  }
  /** Kick the panel (a fast scroll, a stomp). */
  bump(v: number) {
    this.kickV += v;
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
