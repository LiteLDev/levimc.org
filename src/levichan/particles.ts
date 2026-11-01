// Things in the space come into being out of light: motes swirl in where something is about to be, then pull
// together onto its shape, flash, and it is there. One Points draw for all of them (a fixed pool, additive), so a
// cloud of a thousand costs about what one block does.
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, NormalBlending, Points, ShaderMaterial } from 'three';

export interface Box3D {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
}
/** A point to gather onto, with a radius of spread around it. */
export interface Target {
  x: number;
  y: number;
  z: number;
  r: number;
}

const MAX = 6000;
const dark = () => document.documentElement.classList.contains('dark');
/** light on a dark sky; on a light one, deeper colours (light added to near-white would not show) */
const PALETTE = () => (dark() ? ['#7fd4a4', '#bff2d4', '#ffffff', '#ffd36b', '#9ad8ff'] : ['#2f9a63', '#4fbf86', '#e0a020', '#3f9fd8', '#7fd4a4']).map((c) => new Color(c));

/** A cloud of motes: swirling in its box until it forms (onto targets, or the box's faces), then gone. */
export class Group {
  /** motes a second while it gathers, and how many at most */
  rate = 120;
  max = 300;
  /** 0: swirl about, 1: forming */
  state: 0 | 1 = 0;
  formT0 = 0;
  formDur = 0.8;
  targets: Target[] | null = null;
  done: (() => void) | null = null;
  dead = false;
  /** spawn carry-over (fractions of a mote) */
  acc = 0;
  /** motes alive in it */
  count = 0;
  /** its motes have their forming targets */
  aimed = false;
  constructor(
    public box: () => Box3D | null,
    public colors: Color[] = PALETTE(),
    /** how far out (m) the motes start, around the box */
    public reach = 1.6,
    public swirl = 1.8,
  ) {}
  /** Pull together (onto `targets`, or the box's surface) over `dur` seconds; `done` runs as they meet. */
  form(dur = 0.8, targets: Target[] | null = null, done: (() => void) | null = null) {
    if (this.state === 1) return;
    this.state = 1;
    this.formT0 = performance.now();
    this.formDur = dur;
    this.targets = targets;
    this.done = done;
  }
  /** Let go: what is left drifts off and fades (when what it was for is gone). */
  release() {
    this.dead = true;
  }
}

export class Particles {
  readonly points: Points;
  private readonly geo = new BufferGeometry();
  private readonly pos = new Float32Array(MAX * 3);
  private readonly col = new Float32Array(MAX * 4);
  private readonly size = new Float32Array(MAX);
  // per mote: velocity, target, age, life, group, base size, colour
  private readonly vel = new Float32Array(MAX * 3);
  private readonly tgt = new Float32Array(MAX * 3);
  private readonly age = new Float32Array(MAX);
  private readonly life = new Float32Array(MAX);
  private readonly base = new Float32Array(MAX);
  private readonly rgb = new Float32Array(MAX * 3);
  private readonly grp: (Group | null)[] = new Array(MAX).fill(null);
  private n = 0;
  readonly groups = new Set<Group>();
  private readonly mat: ShaderMaterial;

  /** `ortho`: positions are screen pixels (y down) and sizes pixels; otherwise metres in the world. */
  private readonly palette = PALETTE();
  constructor(ortho = false) {
    this.geo.setAttribute('position', new BufferAttribute(this.pos, 3));
    this.geo.setAttribute('col', new BufferAttribute(this.col, 4));
    this.geo.setAttribute('size', new BufferAttribute(this.size, 1));
    this.geo.setDrawRange(0, 0);
    this.mat = new ShaderMaterial({
      uniforms: { uScale: { value: 600 }, uOrtho: { value: ortho ? 1 : 0 } },
      vertexShader: `
        attribute vec4 col;
        attribute float size;
        uniform float uScale;
        uniform float uOrtho;
        varying vec4 vCol;
        void main() {
          vCol = col;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uOrtho > 0.5 ? size * uScale : size * uScale / max(0.05, -mv.z);
        }`,
      fragmentShader: `
        varying vec4 vCol;
        void main() {
          vec2 q = abs(gl_PointCoord - 0.5);
          // a square pixel of light with a soft glow round it
          float core = step(max(q.x, q.y), 0.17);
          float halo = smoothstep(0.5, 0.0, length(q)) * 0.55;
          float a = vCol.a * max(core, halo);
          if (a < 0.004) discard;
          gl_FragColor = vec4(vCol.rgb * a, a);
        }`,
      transparent: true,
      depthWrite: false,
      blending: dark() ? AdditiveBlending : NormalBlending,
      premultipliedAlpha: true,
    });
    this.points = new Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
  }

  /** Pixels per unit at distance 1 (perspective) or per pixel (ortho): the renderer's height and fov. */
  setScale(s: number) {
    this.mat.uniforms.uScale!.value = s;
  }

  get active() {
    return this.n > 0 || this.groups.size > 0;
  }

  group(g: Group) {
    this.groups.add(g);
    return g;
  }

  /** Loose motes: from (x, y, z) with a velocity, living `life` seconds. */
  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, color?: Color, g: Group | null = null) {
    if (this.n >= MAX) return -1;
    const i = this.n++;
    this.pos.set([x, y, z], i * 3);
    this.vel.set([vx, vy, vz], i * 3);
    this.tgt.set([x, y, z], i * 3);
    this.age[i] = 0;
    this.life[i] = life;
    this.base[i] = size;
    const c = color ?? this.palette[(Math.random() * this.palette.length) | 0]!;
    this.rgb.set([c.r, c.g, c.b], i * 3);
    this.grp[i] = g;
    if (g) g.count++;
    return i;
  }

  /** A burst outward from a point (a flash when something forms). */
  burst(x: number, y: number, z: number, n: number, speed = 1.5, size = 0.05) {
    for (let k = 0; k < n; k++) {
      const [dx, dy, dz] = sphere();
      this.emit(x, y, z, dx * speed * (0.4 + Math.random()), dy * speed * (0.4 + Math.random()) + 0.4, dz * speed * (0.4 + Math.random()), 0.6 + Math.random() * 0.6, size);
    }
  }

  private kill(i: number) {
    const last = --this.n;
    const g = this.grp[i];
    if (g) g.count--;
    if (i !== last) {
      this.pos.copyWithin(i * 3, last * 3, last * 3 + 3);
      this.vel.copyWithin(i * 3, last * 3, last * 3 + 3);
      this.tgt.copyWithin(i * 3, last * 3, last * 3 + 3);
      this.rgb.copyWithin(i * 3, last * 3, last * 3 + 3);
      this.age[i] = this.age[last]!;
      this.life[i] = this.life[last]!;
      this.base[i] = this.base[last]!;
      this.grp[i] = this.grp[last]!;
    }
    this.grp[last] = null;
  }

  /** A point for a mote of `g` to aim for: on a target, or on the box's surface (forming), or inside it. */
  private aim(g: Group, b: Box3D, i: number, surface: boolean) {
    let x: number, y: number, z: number;
    if (g.targets?.length) {
      const t = g.targets[(Math.random() * g.targets.length) | 0]!;
      const [dx, dy, dz] = sphere();
      const r = t.r * Math.cbrt(Math.random());
      x = t.x + dx * r;
      y = t.y + dy * r;
      z = t.z + dz * r;
    } else {
      x = b.x0 + Math.random() * (b.x1 - b.x0);
      y = b.y0 + Math.random() * (b.y1 - b.y0);
      z = b.z0 + Math.random() * (b.z1 - b.z0);
      if (surface) {
        // snap to the nearest face
        const d = [x - b.x0, b.x1 - x, y - b.y0, b.y1 - y, z - b.z0, b.z1 - z];
        const k = d.indexOf(Math.min(...d));
        if (k === 0) x = b.x0;
        else if (k === 1) x = b.x1;
        else if (k === 2) y = b.y0;
        else if (k === 3) y = b.y1;
        else if (k === 4) z = b.z0;
        else z = b.z1;
      }
    }
    this.tgt.set([x, y, z], i * 3);
  }

  update(dt: number, now: number) {
    // groups: spawn while gathering, aim while forming, end when formed
    for (const g of this.groups) {
      const b = g.box();
      if (!b || g.dead) {
        g.dead = true;
        if (g.count === 0) this.groups.delete(g);
        continue;
      }
      const cx = (b.x0 + b.x1) / 2;
      const cz = (b.z0 + b.z1) / 2;
      if (g.state === 0) {
        const want = Math.min(g.max - g.count, Math.floor(g.acc + g.rate * dt));
        g.acc = (g.acc + g.rate * dt) % 1;
        for (let k = 0; k < want; k++) {
          // from all around (and a little below), drawn in
          const a = Math.random() * Math.PI * 2;
          const r = Math.max(b.x1 - b.x0, b.z1 - b.z0) / 2 + g.reach * (0.4 + Math.random() * 0.6);
          const y = b.y0 + (b.y1 - b.y0) * Math.random() - 0.3;
          const i = this.emit(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r, 0, 0.2, 0, 1e9, 0.03 + Math.random() * 0.035, g.colors[(Math.random() * g.colors.length) | 0], g);
          if (i < 0) break;
          this.age[i] = -Math.random() * 0.4;
          this.aim(g, b, i, false);
        }
      } else {
        const k = (now - g.formT0) / 1000 / g.formDur;
        if (!g.aimed) {
          g.aimed = true;
          for (let i = 0; i < this.n; i++) if (this.grp[i] === g) this.aim(g, b, i, !g.targets);
        }
        if (k >= 1 && g.done) {
          const d = g.done;
          g.done = null;
          d();
          // the flash as it forms: every mote of it lets go
          for (let i = 0; i < this.n; i++)
            if (this.grp[i] === g) {
              this.life[i] = this.age[i]! + 0.35 + Math.random() * 0.35;
              this.vel.set([(Math.random() - 0.5) * 0.8, 0.3 + Math.random() * 0.6, (Math.random() - 0.5) * 0.8], i * 3);
              this.grp[i] = null;
              g.count--;
            }
          this.groups.delete(g);
        }
      }
    }

    // motes
    for (let i = this.n - 1; i >= 0; i--) {
      const a = (this.age[i]! += dt);
      if (a >= this.life[i]!) {
        this.kill(i);
        continue;
      }
      const o = i * 3;
      const g = this.grp[i];
      const p = this.pos;
      const v = this.vel;
      let alpha = 1;
      let size = this.base[i]!;
      if (a < 0) {
        alpha = 0;
      } else if (g && !g.dead) {
        const b = g.box();
        const t = this.tgt;
        if (g.state === 0 && b) {
          // swirl about the box's axis, pulled toward its spot inside, and now and then a new spot
          const cx = (b.x0 + b.x1) / 2;
          const cz = (b.z0 + b.z1) / 2;
          const rx = p[o]! - cx;
          const rz = p[o + 2]! - cz;
          const pull = 2.2;
          v[o] = v[o]! * 0.9 + ((t[o]! - p[o]!) * pull - rz * g.swirl) * dt * 4;
          v[o + 1] = v[o + 1]! * 0.9 + (t[o + 1]! - p[o + 1]!) * pull * dt * 4;
          v[o + 2] = v[o + 2]! * 0.9 + ((t[o + 2]! - p[o + 2]!) * pull + rx * g.swirl) * dt * 4;
          if (Math.random() < dt * 0.8) this.aim(g, b, i, false);
          alpha = Math.min(1, a * 2.5) * (0.55 + 0.45 * Math.sin(a * 9 + i));
        } else {
          // forming: home in, faster and faster, and brighten
          const k = Math.min(1, (performance.now() - g.formT0) / 1000 / g.formDur);
          const s = Math.min(1, dt * (4 + k * 22));
          p[o] = p[o]! + (t[o]! - p[o]!) * s;
          p[o + 1] = p[o + 1]! + (t[o + 1]! - p[o + 1]!) * s;
          p[o + 2] = p[o + 2]! + (t[o + 2]! - p[o + 2]!) * s;
          v[o] = v[o + 1] = v[o + 2] = 0;
          alpha = 0.7 + k * 0.6;
          size *= 1 + k * 0.6;
        }
      } else {
        // loose: drift, slow down, fade
        v[o] = v[o]! * (1 - dt * 1.5);
        v[o + 1] = v[o + 1]! * (1 - dt * 1.5) + dt * 0.25;
        v[o + 2] = v[o + 2]! * (1 - dt * 1.5);
        const left = this.life[i]! - a;
        alpha = Math.min(1, left * 2.5, a * 8);
        if (g?.dead) {
          this.grp[i] = null;
          g.count--;
          this.life[i] = a + 0.6;
        }
      }
      p[o] = p[o]! + v[o]! * dt;
      p[o + 1] = p[o + 1]! + v[o + 1]! * dt;
      p[o + 2] = p[o + 2]! + v[o + 2]! * dt;
      this.col[i * 4] = this.rgb[o]!;
      this.col[i * 4 + 1] = this.rgb[o + 1]!;
      this.col[i * 4 + 2] = this.rgb[o + 2]!;
      this.col[i * 4 + 3] = Math.max(0, Math.min(1.3, alpha));
      this.size[i] = size;
    }
    this.geo.setDrawRange(0, this.n);
    for (const k of ['position', 'col', 'size']) {
      const at = this.geo.getAttribute(k) as BufferAttribute;
      at.clearUpdateRanges();
      at.addUpdateRange(0, this.n * at.itemSize);
      at.needsUpdate = true;
    }
  }

  dispose() {
    this.geo.dispose();
    this.mat.dispose();
    this.points.removeFromParent();
  }
}

/** A random unit vector. */
function sphere(): [number, number, number] {
  const z = Math.random() * 2 - 1;
  const a = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - z * z);
  return [r * Math.cos(a), z, r * Math.sin(a)];
}
