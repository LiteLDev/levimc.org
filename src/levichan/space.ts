// The 3D space, rendered with three.js: a snapshot of the page is cut into its components, which fly off the page
// and scatter through the sky as blocks (./diorama), seen through a free camera the visitor flies like Minecraft's
// (WASD, Space / Shift, the wheel, a drag to look about). LeviChan lives among them (babylon-mmd, on a canvas over
// the world's, with a camera matched to it), gets about by walking, hopping, climbing (./mover) and plays with what
// she is sent to (./brain). The page itself stays as it was under the space's canvas. Everything here is loaded on
// demand, when the peeking avatar is clicked (./LeviChanPeek).
import css from './levichan.css?inline';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Ray } from '@babylonjs/core/Culling/ray.pure';
import { MeshLambertMaterial, PCFShadowMap, PerspectiveCamera, Raycaster, Vector2, Vector3 as V3, WebGLRenderer, type Intersection, type Material, type MeshBasicMaterial, type Object3D } from 'three';
import { Levi, MMD_SCALE, type HitRegion } from './levi';
import { Brain } from './brain';
import { Diorama, pixelTexture, rng, type Cube, type Piece, type Spot } from './diorama';
import { Mover, type Goal } from './mover';
import { Story } from './story/story';
import type { LeviChanStrings } from './strings';

export interface EnterOptions {
  strings: LeviChanStrings;
  /** asset folder (with clips.json, model/, motions/) */
  base?: string;
  /** skip the fly-out (a reload while the space was open) */
  instant?: boolean;
  onExit?: () => void;
}

export type LookMode = 'auto' | 'always' | 'never';

/** A click on a block: where (world), whether on its top, which way the face hit looks, and the link under it. */
export interface PieceHit {
  u: number;
  v: number;
  h: number;
  top: boolean;
  nu: number;
  nv: number;
  spot: Spot | null;
}

const STORE = 'levichan';
const FOV = 50;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEG = Math.PI / 180;
/** keys that fly the camera */
const FLY: Record<string, [number, number, number]> = {
  KeyW: [0, 0, 1],
  ArrowUp: [0, 0, 1],
  KeyS: [0, 0, -1],
  ArrowDown: [0, 0, -1],
  KeyA: [-1, 0, 0],
  ArrowLeft: [-1, 0, 0],
  KeyD: [1, 0, 0],
  ArrowRight: [1, 0, 0],
  Space: [0, 1, 0],
  KeyE: [0, 1, 0],
  ShiftLeft: [0, -1, 0],
  ShiftRight: [0, -1, 0],
  KeyQ: [0, -1, 0],
};

/** The camera: where it is, its turn about the vertical (0: looking into the scene, -z) and its pitch. */
interface Pose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
}
const mixPose = (a: Pose, b: Pose, k: number): Pose => ({
  x: lerp(a.x, b.x, k),
  y: lerp(a.y, b.y, k),
  z: lerp(a.z, b.z, k),
  yaw: lerp(a.yaw, b.yaw, k),
  pitch: lerp(a.pitch, b.pitch, k),
});

class Space {
  private readonly t: LeviChanStrings;
  private readonly base: string;
  private readonly root: HTMLElement;
  private readonly html = document.documentElement;
  private readonly els: HTMLElement[] = [];
  private style!: HTMLStyleElement;
  private view!: HTMLCanvasElement;
  canvas!: HTMLCanvasElement;
  private loadEl!: HTMLElement;
  private menu!: HTMLElement;
  private fab!: HTMLButtonElement;
  private renderer: WebGLRenderer | null = null;
  readonly camera = new PerspectiveCamera(FOV, 1, 0.05, 400);
  levi: Levi | null = null;
  brain: Brain | null = null;
  story: Story | null = null;
  world!: Diorama;
  mover: Mover | null = null;
  private savedScroll = 0;
  private raf = 0;
  private alive = true;
  private readonly onExit?: () => void;
  W = 0;
  H = 0;

  // the camera
  private pose: Pose = { x: 0, y: 1.6, z: 10, yaw: 0, pitch: 0 };
  private flatPose: Pose = { ...this.pose };
  private outroFrom: Pose | null = null;
  private vel = new V3();
  private dolly = 0;
  private keys = new Set<string>();
  private focusFrom: { pose: Pose; t0: number } | null = null;
  private lastCamMove = 0;
  private shake = 0;
  follow = false;
  look: LookMode = 'auto';
  quiet = false;
  private intro = 0;
  private introStart = 0;
  private introDur = 3400;
  private outro = -1;
  private leviReveal = 0;
  private leviRevealStart = -1;
  /** she is placed once the blocks have landed */
  private placed = false;
  private building = false;
  private lastFrame = performance.now();
  private lastCamNote = 0;
  /** where she lands at first: on the ground in front of the blocks */
  private home = { u: 0, v: 0 };

  constructor(opts: EnterOptions) {
    this.t = opts.strings;
    this.base = opts.base ?? '/levichan/';
    this.root = document.getElementById('root')!;
    this.onExit = opts.onExit;
    this.restorePrefs();
  }

  private restorePrefs() {
    try {
      const p = JSON.parse(localStorage.getItem(STORE + ':prefs') || '{}') as { look?: LookMode; quiet?: boolean; follow?: boolean };
      if (p.look) this.look = p.look;
      this.quiet = !!p.quiet;
      this.follow = !!p.follow;
    } catch {
      /* private mode: defaults */
    }
  }
  savePrefs() {
    try {
      localStorage.setItem(STORE + ':prefs', JSON.stringify({ look: this.look, quiet: this.quiet, follow: this.follow }));
    } catch {
      /* ignore */
    }
  }

  async start(instant: boolean) {
    this.W = document.documentElement.clientWidth;
    this.H = innerHeight;
    this.savedScroll = window.scrollY;

    this.style = document.createElement('style');
    this.style.textContent = css;
    document.head.appendChild(this.style);
    this.view = this.add('canvas', 'lc-three') as HTMLCanvasElement;
    this.canvas = this.add('canvas', 'lc-canvas') as HTMLCanvasElement;
    this.canvas.tabIndex = -1;
    for (const c of [this.view, this.canvas]) c.setAttribute('aria-hidden', 'true');
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
    try {
      sessionStorage.setItem(STORE, '1');
    } catch {
      /* ignore */
    }

    if (new URLSearchParams(location.search).has('lcdebug')) (window as unknown as { __levichan: unknown }).__levichan = this;
    // her model downloads while the page is cut up
    const bar = this.loadEl.querySelector('span') as HTMLElement;
    const leviP = Levi.load({
      base: this.base,
      canvas: this.canvas,
      onProgress: (r, total) => (bar.style.width = `${Math.min(100, (100 * r) / Math.max(1, total))}%`),
    });
    leviP.catch(() => {});
    await this.buildWorld(instant);
    if (!this.alive) return;
    this.bindEvents();
    this.loop();

    try {
      this.levi = await leviP;
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
    this.story = new Story(this, this.brain);
    this.levi.engine.runRenderLoop(() => {
      if (this.levi && this.mover) this.syncLevi();
      this.levi?.scene.render();
    });
  }

  /** Cut the page up and start the fly-out (the first time, and again on a new page). */
  private async buildWorld(instant: boolean) {
    this.building = true;
    const world = new Diorama(this.root, { W: this.W, H: this.H, scroll: window.scrollY });
    await world.build();
    if (!this.alive) return world.dispose();
    const old = this.world;
    this.world = world;
    if (!this.renderer) {
      this.renderer = new WebGLRenderer({ canvas: this.view, antialias: true });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
      this.renderer.setSize(this.W, this.H, false);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = PCFShadowMap;
      this.html.classList.add('lc-3d');
    }
    // the camera starts where it shows the page exactly as it was, and ends looking over the scattered blocks
    const D = this.H / world.m / 2 / Math.tan((FOV / 2) * DEG);
    this.flatPose = { x: 0, y: world.wall.y, z: world.wall.z + D, yaw: 0, pitch: 0 };
    this.home = { u: 0, v: world.R * 0.55 + 1.1 };
    this.pose = { ...this.flatPose };
    this.introStart = performance.now();
    this.introDur = instant || reduced() ? 1 : 3400;
    world.explode(this.introStart + (instant ? -1e5 : 0));
    if (old) {
      old.dispose();
      for (const c of old.cubes) c.mesh.removeFromParent();
    }
    this.placed = false;
    this.leviRevealStart = -1;
    this.leviReveal = 0;
    this.building = false;
    if (this.mover && this.levi) {
      const prev = this.mover;
      this.mover = new Mover(this.world, this.levi);
      this.mover.heading = prev.heading;
      this.brain?.setMover(this.mover);
    }
  }
  /** The free camera's first view: over her spot, from in front. */
  private startPose(): Pose {
    return { x: this.home.u, y: 2.4, z: this.home.v + 5.2, yaw: 0, pitch: -12 * DEG };
  }

  private add(tag: string, id: string, cls?: string) {
    const el = document.createElement(tag);
    el.id = id;
    if (cls) el.className = cls;
    document.body.appendChild(el);
    this.els.push(el);
    return el;
  }

  /** Once the blocks have landed: she drops in from above her spot, and so do the cubes. */
  private placeHer() {
    this.mover!.dropFrom(this.home.u, this.home.v, 4.5);
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
    const tops = this.world.blocks().filter((b) => b.w > 0.6 && b.d > 0.6 && b.h1 < 4);
    kinds.slice(0, this.W < 700 ? 3 : kinds.length).forEach(([top, side], i) => {
      const tex = (k: string, j: number) => new MeshLambertMaterial({ map: pixelTexture(k as 'grass', 100 + i * 10 + j) });
      const s = tex(side, 1);
      // +x, -x, +y (top), -y, +z, -z
      const mats: Material[] = [s, s, tex(top, 0), tex(side === 'side' ? 'dirt' : side, 5), s, s];
      const b = tops.length ? tops[Math.floor(r() * tops.length)]! : null;
      const u = b ? b.u + b.w * (0.2 + 0.6 * r()) : this.home.u + (r() - 0.5) * 4;
      const v = b ? b.z - b.d * (0.2 + 0.6 * r()) : this.home.v - r() * 2;
      const c = this.world.addCube(mats, 0.32, u, v, (b?.h1 ?? 0) + 5 + i * 1.2);
      c.spin = (r() - 0.5) * 4;
    });
  }

  // ------------------------------------------------------------------ the camera
  private forward(p: Pose, flat = false) {
    const c = flat ? 1 : Math.cos(p.pitch);
    return new V3(-Math.sin(p.yaw) * c, flat ? 0 : Math.sin(p.pitch), -Math.cos(p.yaw) * c);
  }
  /** A pose looking at a point from `dist` away, keeping the camera's turn. */
  private poseAt(u: number, h: number, v: number, dist: number, yaw = this.pose.yaw): Pose {
    const pitch = -14 * DEG;
    const f = this.forward({ ...this.pose, yaw, pitch });
    return { x: u - f.x * dist, y: Math.max(0.4, h - f.y * dist), z: v - f.z * dist, yaw, pitch };
  }
  /** Fly over to her. */
  focus() {
    const mv = this.mover;
    if (!mv) return;
    this.story?.note('focus');
    this.focusFrom = { pose: { ...this.pose }, t0: performance.now() };
  }

  private updateCamera(now: number, dt: number) {
    const mv = this.placed ? this.mover : null;
    if (this.outro >= 0) {
      // back to the flat page
      this.outroFrom ??= { ...this.pose };
      const k = easeInOut(clamp01((now - this.outro - 300) / 1800));
      this.pose = mixPose(this.outroFrom, this.flatPose, k);
      this.pose.yaw = lerp(this.outroFrom.yaw, Math.round(this.outroFrom.yaw / (2 * Math.PI)) * 2 * Math.PI, k);
    } else if (this.intro < 1) {
      // from the page, a swoop back and round, down to her spot
      const k = easeInOut(this.intro);
      const swoop = Math.sin(Math.PI * k);
      this.pose = mixPose(this.flatPose, this.startPose(), k);
      this.pose.y += swoop * 2.5;
      this.pose.z += swoop * 3;
      this.pose.yaw += swoop * 18 * DEG;
      this.pose.pitch -= swoop * 10 * DEG;
    } else {
      const p = this.pose;
      // flying: WASD on the level, Space / Shift up and down, faster with Ctrl
      const want = new V3();
      for (const k of this.keys) {
        const d = FLY[k];
        if (d) want.add(new V3(d[0], d[1], d[2]));
      }
      const fast = this.keys.has('ControlLeft') || this.keys.has('ControlRight') ? 2.6 : 1;
      const fwd = this.forward(p, true);
      const right = new V3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
      const target = new V3()
        .addScaledVector(fwd, want.z)
        .addScaledVector(right, want.x)
        .add(new V3(0, want.y, 0));
      if (target.lengthSq() > 0) {
        target.normalize().multiplyScalar(5.5 * fast);
        this.moved();
        this.story?.note('camMove');
        this.focusFrom = null;
      }
      this.vel.lerp(target, Math.min(1, dt * 10));
      p.x += this.vel.x * dt;
      p.y += this.vel.y * dt;
      p.z += this.vel.z * dt;
      // the wheel: toward where it looks
      if (this.dolly) {
        const step = this.dolly * Math.min(1, dt * 10);
        this.dolly -= step;
        if (Math.abs(this.dolly) < 0.002) this.dolly = 0;
        const f = this.forward(p);
        p.x += f.x * step;
        p.y += f.y * step;
        p.z += f.z * step;
      }
      if (mv && this.focusFrom) {
        const k = easeInOut(clamp01((now - this.focusFrom.t0) / 900));
        const to = this.poseAt(mv.u, mv.h + 0.9, mv.v, 4.2);
        const yaw = this.focusFrom.pose.yaw;
        Object.assign(p, mixPose(this.focusFrom.pose, { ...to, yaw }, k));
        if (k >= 1) this.focusFrom = null;
      } else if (mv && this.follow && now - this.lastCamMove > 2500) {
        // following her: she stays in the middle at a few metres
        const to = this.poseAt(mv.u, mv.h + 0.9, mv.v, 4.6);
        const e = Math.min(1, dt * 1.6);
        p.x += (to.x - p.x) * e;
        p.y += (to.y - p.y) * e;
        p.z += (to.z - p.z) * e;
        p.pitch += (to.pitch - p.pitch) * e;
      }
      const L = this.world.R + 40;
      p.x = clamp(p.x, -L, L);
      p.z = clamp(p.z, -L, L);
      p.y = clamp(p.y, 0.25, 40);
    }
    this.shake *= Math.max(0, 1 - dt * 8);
    const c = this.camera;
    c.position.set(this.pose.x, this.pose.y + Math.sin(now / 30) * this.shake, this.pose.z);
    c.rotation.order = 'YXZ';
    c.rotation.set(this.pose.pitch, this.pose.yaw, 0);
    c.aspect = this.W / this.H;
    c.updateProjectionMatrix();
    c.updateMatrixWorld();
  }
  private moved() {
    this.lastCamMove = performance.now();
    this.brain?.cameraMoved();
  }

  // ------------------------------------------------------------------ picking
  private readonly raycaster = new Raycaster();
  private ndc(x: number, y: number) {
    return new Vector2((x / this.W) * 2 - 1, -(y / this.H) * 2 + 1);
  }
  /** What a screen point's ray meets first: a block (with where on it), a cube, or the ground. */
  pick(x: number, y: number): { piece?: Piece; cube?: Cube; hit: PieceHit } | null {
    this.raycaster.setFromCamera(this.ndc(x, y), this.camera);
    const objs: Object3D[] = [...this.world.blocks().map((p) => p.mesh), ...this.world.cubes.map((c) => c.mesh), this.world.ground];
    const hits = this.raycaster.intersectObjects(objs, false);
    const h = hits[0] as Intersection | undefined;
    if (!h) return null;
    const pt = h.point;
    const base: PieceHit = { u: pt.x, v: pt.z, h: pt.y, top: true, nu: 0, nv: 0, spot: null };
    const cube = h.object.userData.cube as Cube | undefined;
    if (cube) return { cube, hit: base };
    const piece = h.object.userData.piece as Piece | undefined;
    if (!piece) return { hit: { ...base, h: 0 } };
    const n = h.face!.normal.clone().transformDirection(h.object.matrixWorld);
    base.top = n.y > 0.7;
    base.nu = n.x;
    base.nv = n.z;
    // the content's own face: which link or control is under the point
    if (h.face!.materialIndex === 4 && h.uv) {
      const px = h.uv.x * piece.pw;
      const py = (1 - h.uv.y) * piece.ph;
      base.spot = piece.spots.find((s) => px >= s.x && px <= s.x + s.w && py >= s.y && py <= s.y + s.h) ?? null;
    }
    return { piece, hit: base };
  }
  /** Where a screen point's ray meets a vertical plane through a world point, facing the camera. */
  private onPlane(x: number, y: number, at: V3) {
    this.raycaster.setFromCamera(this.ndc(x, y), this.camera);
    const n = this.forward(this.pose, true);
    const r = this.raycaster.ray;
    const denom = r.direction.dot(n);
    if (Math.abs(denom) < 1e-6) return null;
    const t = at.clone().sub(r.origin).dot(n) / denom;
    if (t <= 0) return null;
    const p = r.origin.clone().addScaledVector(r.direction, t);
    return { u: p.x, v: p.z, h: p.y };
  }
  /** Screen point of a world point (behind the camera: null). */
  screenOf(u: number, v: number, h = 0) {
    const p = new V3(u, h, v).project(this.camera);
    if (p.z > 1) return null;
    return { x: ((p.x + 1) / 2) * this.W, y: ((1 - p.y) / 2) * this.H };
  }
  /** Is a world spot on screen (with a margin)? */
  inView(u: number, v: number, h: number, margin = 60) {
    const s = this.screenOf(u, v, h);
    return !!s && s.x > margin && s.x < this.W - margin && s.y > margin && s.y < this.H - margin;
  }
  /** A block's top near the middle of the view (where she goes when the visitor looks elsewhere). */
  viewGoal(): Goal | null {
    for (const [fx, fy] of [[0.5, 0.62], [0.35, 0.6], [0.65, 0.6], [0.5, 0.75], [0.5, 0.45]] as const) {
      const p = this.pick(this.W * fx, this.H * fy);
      if (p && !p.cube && (p.hit.top || !p.piece)) return { u: p.hit.u, v: p.hit.v, block: p.piece ?? null };
    }
    return null;
  }
  /** A random top in view (somewhere for her to go). */
  randomGoal(): Goal | null {
    for (let i = 0; i < 10; i++) {
      const p = this.pick(this.W * (0.1 + Math.random() * 0.8), this.H * (0.2 + Math.random() * 0.7));
      if (p?.piece && p.hit.top && p.piece !== this.mover?.on) return { u: p.hit.u, v: p.hit.v, block: p.piece };
    }
    return null;
  }

  // ------------------------------------------------------------------ the frame
  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    if (this.building) return;
    this.intro = clamp01((now - this.introStart) / this.introDur);
    if (this.outro >= 0 && now - this.outro > 2300 && this.world.flat) {
      this.teardown();
      return;
    }
    if (this.mover && !this.placed && this.outro < 0 && this.world.pieces.every((p) => p.t >= 1)) this.placeHer();
    this.updateCamera(now, dt);
    const k = this.outro >= 0 ? 1 - clamp01((now - this.outro - 600) / 1400) : clamp01(this.intro * 1.6 - 0.2);
    (this.world.ground.material as MeshLambertMaterial).opacity = k;
    this.world.update(now, dt);
    this.mover?.update(dt, this.world.cubes);
    if (this.story && this.mover && this.placed) {
      this.story.update(now);
      if (now - this.lastCamNote > 5000) {
        this.lastCamNote = now;
        const mv = this.mover;
        this.story.note('cam', { far: Math.hypot(this.pose.x - mv.u, this.pose.y - mv.h, this.pose.z - mv.v) > 12 });
      }
    }

    // her ring (where she appears) and contact shadow, flat on what is under her
    const reveal = this.leviRevealStart < 0 ? 0 : clamp01((now - this.leviRevealStart) / 700);
    this.leviReveal = this.outro >= 0 ? Math.min(this.leviReveal, 1 - clamp01((now - this.outro) / 600)) : reveal;
    const mv = this.placed ? this.mover : null;
    const { blob, ring } = this.world;
    blob.visible = ring.visible = !!mv;
    if (mv) {
      const sup = this.world.supportAt(mv.u, mv.v, mv.h + 0.02, 0.12);
      const above = mv.h - sup.h;
      blob.position.set(mv.u, sup.h + 0.012, mv.v);
      blob.scale.setScalar(0.75 * (1 + above * 0.4));
      (blob.material as MeshBasicMaterial).opacity = this.leviReveal * Math.max(0.25, 1 - above / 3);
      ring.position.set(mv.u, sup.h + 0.015, mv.v);
      ring.scale.setScalar(1.4);
      (ring.material as MeshBasicMaterial).opacity = Math.sin(Math.PI * clamp01(this.leviReveal * 1.1)) * 0.9;
    }
    this.renderer!.render(this.world.scene, this.camera);
    if (this.levi) this.canvas.style.opacity = this.leviReveal > 0 ? String(Math.min(1, this.leviReveal * 3)) : '0';
  };

  /** Her model (MMD units: x her left, y up, z away from the viewer) -> the world (metres, three's axes): her
   * heading and spot. Babylon matrices are row-vector ones, laid out as three's column-major arrays. */
  private herToWorld = Matrix.Identity();
  private syncLevi() {
    const levi = this.levi!;
    const mv = this.mover!;
    const k = 1 / MMD_SCALE;
    this.herToWorld = Matrix.Scaling(k, k, -k).multiply(Matrix.RotationY(mv.heading)).multiply(Matrix.Translation(mv.u, mv.h, mv.v));
    const V = Matrix.FromArray(this.camera.matrixWorldInverse.elements);
    // the WebGL camera: three's (at the origin of view space, looking down -z) carried into her space
    const Vb = this.herToWorld.multiply(V).multiply(Matrix.Scaling(1 / k, 1 / k, -1 / k));
    levi.setCamera(Vb.clone().invert(), FOV * DEG);
    // the blocks (and cubes) in front of her hide her
    const inv = this.herToWorld.clone().invert();
    const occ: Matrix[] = [];
    const box = (u: number, w: number, z: number, d: number, h: number, hh: number) =>
      occ.push(Matrix.Scaling(w, hh, d).multiply(Matrix.Translation(u + w / 2, h + hh / 2, z - d / 2)).multiply(inv));
    for (const b of this.world.blocks()) box(b.u, b.w, b.z, b.d, b.h0, b.h1 - b.h0);
    const held = mv.carrying;
    if (held) box(held.u, held.w, held.z, held.d, held.h0, held.h1 - held.h0);
    for (const c of this.world.cubes) box(c.u - c.s / 2, c.s, c.v + c.s / 2, c.s, c.h, c.s);
    levi.setOccluders(occ);
  }
  /** A world point in her Babylon space (for gaze). */
  toBabylon(u: number, v: number, h: number) {
    return Vector3.TransformCoordinates(new Vector3(u, h, v), this.herToWorld.clone().invert());
  }

  // ------------------------------------------------------------------ leaving
  exit() {
    if (this.outro >= 0) return;
    this.story?.note('exit');
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
    this.story?.dispose();
    this.story = null;
    this.brain?.dispose();
    this.levi?.dispose();
    this.levi = null;
    this.world.dispose();
    this.renderer?.dispose();
    for (const el of this.els) el.remove();
    this.style.remove();
    this.html.classList.remove('lc-3d');
    window.scrollTo(0, this.savedScroll);
    active = null;
    this.onExit?.();
  }

  // ------------------------------------------------------------------ input
  private drag: { x: number; y: number; yaw: number; pitch: number; moved: boolean } | null = null;
  private held: { cube: Cube; last: { u: number; v: number; h: number; t: number }; vel: V3 } | null = null;
  private carrying: { x: number; y: number; started: boolean } | null = null;
  private clickTimer = 0;
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
  /** Over the space (not our menu or button)? */
  private inSpace(e: Event) {
    const t = e.target as Node | null;
    return t === this.view || t === this.canvas || t === document.body || t === this.html;
  }

  private bindEvents() {
    this.on(window, 'resize', () => {
      this.W = document.documentElement.clientWidth;
      this.H = innerHeight;
      this.renderer?.setSize(this.W, this.H, false);
      this.levi?.engine.resize();
    });
    this.on(window, 'blur', () => this.keys.clear());
    this.on(window, 'pointermove', (e: PointerEvent) => {
      if (this.held) {
        const c = this.held.cube;
        const p = this.onPlane(e.clientX, e.clientY, new V3(c.u, c.h, c.v));
        if (p) {
          const t = performance.now();
          const dtt = Math.max(1, t - this.held.last.t) / 1000;
          const v = new V3((p.u - this.held.last.u) / dtt, (p.h - this.held.last.h) / dtt, (p.v - this.held.last.v) / dtt);
          this.held.vel.lerp(v, 0.5);
          this.held.last = { ...p, t };
          c.u = p.u;
          c.v = p.v;
          c.h = Math.max(this.world.supportAt(p.u, p.v).h, p.h - c.s / 2);
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
          const mv = this.mover;
          const p = this.onPlane(e.clientX, e.clientY, new V3(mv.u, mv.h + 1.3, mv.v));
          if (p) mv.carryTo(p.u, p.v, p.h - 1.3);
          return;
        }
      }
      if (this.drag) {
        const dx = e.clientX - this.drag.x;
        const dy = e.clientY - this.drag.y;
        if (!this.drag.moved && Math.hypot(dx, dy) > 5) this.drag.moved = true;
        if (this.drag.moved && this.intro >= 1 && this.outro < 0) {
          // looking about: a drag across the screen turns the camera about 160 degrees
          this.pose.yaw = this.drag.yaw - (dx / this.W) * 2.8;
          this.pose.pitch = clamp(this.drag.pitch - (dy / this.H) * 1.6, -85 * DEG, 85 * DEG);
          this.focusFrom = null;
          this.moved();
          this.story?.note('camLook');
        }
        return;
      }
      const hit = this.hitAt(e.clientX, e.clientY);
      this.canvas.classList.toggle('lc-hot', !!hit && this.outro < 0);
      this.canvas.classList.toggle('lc-face', hit?.region === 'head' || hit?.region === 'face');
      // links and controls under the cursor
      const p = !hit && this.inSpace(e) && this.intro >= 1 ? this.pick(e.clientX, e.clientY) : null;
      const spot = p?.hit.spot ?? null;
      this.view.style.cursor = spot ? 'pointer' : p?.cube ? 'grab' : p?.piece ? 'cell' : '';
      this.brain?.hoverLink(spot?.el ?? null, p && spot ? p.hit : null);
      this.brain?.pointerMove(e, hit, !!p?.piece);
    }, { passive: true });
    this.on(window, 'pointerdown', (e: PointerEvent) => {
      if (!this.menu.hidden && !this.menu.contains(e.target as Node) && e.target !== this.fab && !this.fab.contains(e.target as Node)) this.menu.hidden = true;
      if (!this.inSpace(e) || e.button !== 0) return;
      const hit = this.hitAt(e.clientX, e.clientY);
      if (hit) {
        this.carrying = { x: e.clientX, y: e.clientY, started: false };
        this.brain?.pointerDown(e, hit);
        return;
      }
      const p = this.intro >= 1 ? this.pick(e.clientX, e.clientY) : null;
      if (p?.cube) {
        const cube = p.cube;
        cube.held = true;
        cube.vu = cube.vv = cube.vh = 0;
        this.held = { cube, last: { u: cube.u, v: cube.v, h: cube.h, t: performance.now() }, vel: new V3() };
        return;
      }
      this.drag = { x: e.clientX, y: e.clientY, yaw: this.pose.yaw, pitch: this.pose.pitch, moved: false };
    });
    this.on(window, 'pointerup', (e: PointerEvent) => {
      if (this.held) {
        const { cube, vel } = this.held;
        cube.held = false;
        // a throw: the cursor's speed, capped
        const sp = vel.length();
        const f = sp > 9 ? 9 / sp : 1;
        cube.vu = vel.x * f;
        cube.vh = vel.y * f;
        cube.vv = vel.z * f;
        cube.spin = (Math.random() - 0.5) * sp * 2;
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
      const drag = this.drag;
      this.drag = null;
      const hit = this.hitAt(e.clientX, e.clientY);
      this.brain?.pointerUp(e, hit, !!drag?.moved);
      if (!drag || drag.moved || hit || this.intro < 1 || this.outro >= 0) return;
      const p = this.pick(e.clientX, e.clientY);
      if (!p || p.cube) return;
      const x = e.clientX;
      const y = e.clientY;
      if (!p.piece) return this.brain?.groundClick({ u: p.hit.u, v: p.hit.v, block: null }, x, y);
      // a click on a block waits a moment, in case it is a double click
      const piece = p.piece;
      clearTimeout(this.clickTimer);
      this.clickTimer = window.setTimeout(() => this.brain?.pieceClick(piece, p.hit, x, y), 240);
    });
    this.on(window, 'dblclick', (e: MouseEvent) => {
      if (!this.inSpace(e)) return;
      const hit = this.hitAt(e.clientX, e.clientY);
      if (hit) return this.brain?.doubleClick(hit);
      const p = this.pick(e.clientX, e.clientY);
      if (p?.piece) {
        // a double click on a block: she fetches it and moves it somewhere else
        clearTimeout(this.clickTimer);
        this.brain?.fetchBlock(p.piece);
      }
    });
    this.on(this.canvas, 'contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      this.toggleMenu(e.clientX, e.clientY, 'below');
    });
    this.on(window, 'wheel', (e: WheelEvent) => {
      if (this.menu.contains(e.target as Node)) return;
      e.preventDefault();
      if (this.intro < 1 || this.outro >= 0) return;
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * this.H : e.deltaY;
      this.dolly = clamp(this.dolly - dy * 0.006, -12, 12);
      this.focusFrom = null;
      this.moved();
      this.story?.note('camWheel');
    }, { passive: false });
    this.on(window, 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !this.menu.hidden) this.menu.hidden = true;
      if (this.story?.key(e)) {
        e.preventDefault();
        return;
      }
      const t = e.target as HTMLElement;
      const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      const inMenu = this.menu.contains(t);
      if (!typing && !e.metaKey && !e.altKey && !(inMenu && (e.code === 'Space' || e.code === 'Enter'))) {
        if (FLY[e.code] || e.code.startsWith('Control')) {
          this.keys.add(e.code);
          e.preventDefault();
        }
        if (e.code === 'KeyF' && !e.ctrlKey) this.focus();
      }
      this.brain?.key(e);
    });
    this.on(window, 'keyup', (e: KeyboardEvent) => this.keys.delete(e.code));
    this.on(document, 'visibilitychange', () => this.brain?.visibility(document.visibilityState === 'visible'));
    const mo = new MutationObserver((recs) => {
      for (const r of recs) {
        if (r.attributeName === 'lang') this.brain?.languageChanged();
        if (r.attributeName === 'class') this.brain?.themeChanged(this.html.classList.contains('dark'));
      }
    });
    mo.observe(this.html, { attributes: true, attributeFilter: ['lang', 'class'] });
    this.unbinders.push(() => mo.disconnect());
    // the browser's back and forward: the new page comes apart too
    let path = location.pathname;
    const iv = setInterval(() => {
      if (location.pathname !== path && this.outro < 0 && !this.building) {
        path = location.pathname;
        setTimeout(() => {
          if (!this.alive) return;
          void this.buildWorld(false);
          this.brain?.navigated(path);
        }, 120);
      }
    }, 250);
    this.unbinders.push(() => clearInterval(iv));
  }

  /** The visitor has been moving the camera about (looking elsewhere than at her). */
  get lookingAway() {
    return performance.now() - this.lastCamMove < 8000;
  }

  /** The point the cursor is at, on a plane through her head facing the camera (Babylon). */
  cursorPoint(x: number, y: number): Vector3 | null {
    const r = this.ray(x, y);
    const head = this.levi?.bonePos('頭');
    if (!r || !head) return null;
    // the plane goes through her head, pulled a hair toward the viewer (a cursor on her face then means "looking
    // at me")
    const n = this.levi!.camera.getDirection(Vector3.Forward());
    const denom = Vector3.Dot(r.direction, n);
    if (Math.abs(denom) < 1e-6) return null;
    const plane = head.subtract(n.scale(1.5));
    const t = Vector3.Dot(plane.subtract(r.origin), n) / denom;
    return r.origin.add(r.direction.scale(Math.max(1, t)));
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
  /** A little jolt (a stomp). */
  bump(v: number) {
    this.shake = Math.max(this.shake, v * 0.02);
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
    this.story?.note('menu');
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
      <label class="lc-row"><span>${t.follow}</span><input type="checkbox" data-follow ${this.follow ? 'checked' : ''}></label>
      <button type="button" class="lc-item" data-focus>${t.focus}</button>
      ${this.story ? `<div class="lc-row lc-story-row"><span>${this.story.chapterTitle}</span><small>${this.story.endingsSeen}/${this.story.endingsTotal}</small></div><button type="button" class="lc-item" data-story-reset>${document.documentElement.lang.startsWith('zh') ? '重新开始故事' : 'Start the story over'}</button>` : ''}
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
    this.menu.querySelector<HTMLInputElement>('[data-follow]')!.addEventListener('change', (e) => {
      this.follow = (e.target as HTMLInputElement).checked;
      this.savePrefs();
      if (this.follow) this.story?.note('follow');
    });
    this.menu.querySelector<HTMLButtonElement>('[data-story-reset]')?.addEventListener('click', () => {
      this.menu.hidden = true;
      this.story?.reset();
    });
    this.menu.querySelector<HTMLButtonElement>('[data-focus]')!.addEventListener('click', () => {
      this.menu.hidden = true;
      this.focus();
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
