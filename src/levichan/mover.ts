// Where she is among the scattered blocks and how she gets around: walking across the blocks' tops and the ground
// (the room she has on each, a body's width in from every edge and every block in her way), hopping up, down and
// across gaps on arcs that clear the blocks around, climbing onto ledges half a metre up, scaling taller faces,
// falling (whenever nothing is under her feet), being carried by the cursor; and carrying the small blocks about.
// World coordinates (./diorama): u right, v toward the viewer, h up, metres; heading 0 faces the viewer (+v).
import type { Cube, Diorama, Piece } from './diorama';
import type { Levi } from './levi';

export type MoveMode = 'stand' | 'path' | 'clip' | 'hop' | 'wall' | 'carried' | 'fall';
type Gait = 'walk' | 'run' | 'tiptoe' | 'skip' | 'carry';

/** A stretch of floor she can stand on (her centre, that is): a block's top or the ground, a rectangle at height h
 * with room above for her. */
export interface Area {
  block: Piece | null;
  h: number;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}
/** Where to go: a point on a block's top (null: the ground). */
export interface Goal {
  u: number;
  v: number;
  block: Piece | null;
}

type P2 = [number, number];
type Edge = { kind: 'step' | 'climb' | 'wall' | 'hop' | 'drop'; pa: P2; pb: P2; cost: number; dir?: P2; face?: number };
type Move = { kind: 'walk'; u: number; v: number } | { kind: 'do'; fn: () => void } | ({ area: Area } & Edge);

const FPS = 30;
const FADE = 9;
/** her body: radius, height, the room she needs over a floor */
const R = 0.2;
const TALL = 1.4;
const ROOM = 1.5;
/** how far past an edge her centre may be and still stand there (her foot is on it) */
const FOOT = 0.12;

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** a rectangle minus another: up to four rectangles */
function subtract(a: Area, o: { x0: number; x1: number; z0: number; z1: number }): Area[] {
  if (o.x1 <= a.x0 || o.x0 >= a.x1 || o.z1 <= a.z0 || o.z0 >= a.z1) return [a];
  const out: Area[] = [];
  const ix0 = Math.max(a.x0, o.x0);
  const ix1 = Math.min(a.x1, o.x1);
  if (o.x0 > a.x0) out.push({ ...a, x1: o.x0 });
  if (o.x1 < a.x1) out.push({ ...a, x0: o.x1 });
  if (o.z0 > a.z0) out.push({ ...a, x0: ix0, x1: ix1, z1: o.z0 });
  if (o.z1 < a.z1) out.push({ ...a, x0: ix0, x1: ix1, z0: o.z1 });
  return out;
}
const rectDist = (x: number, z: number, a: { x0: number; x1: number; z0: number; z1: number }) =>
  Math.hypot(x < a.x0 ? a.x0 - x : x > a.x1 ? x - a.x1 : 0, z < a.z0 ? a.z0 - z : z > a.z1 ? z - a.z1 : 0);

export class Mover {
  u = 0;
  v = 0;
  h = 0;
  heading = 0;
  mode: MoveMode = 'stand';
  /** the block she stands on (null: the ground) */
  on: Piece | null = null;
  /** the block she carries over her head */
  carrying: Piece | null = null;
  private moves: Move[] = [];
  private target: { u: number; v: number } | null = null;
  private gait: Gait = 'walk';
  private done: ((reached: boolean) => void) | null = null;
  private reached = true;
  private faceAt: number | null = null;
  private vu = 0;
  private vv = 0;
  private vh = 0;
  /** a clip that moves her (climb_up): where it starts and ends */
  private rootClip: { name: string; from: [number, number, number]; to: [number, number, number] } | null = null;
  private hopArc: { from: [number, number, number]; to: [number, number, number]; air: [number, number] } | null = null;
  private wallTop = 0;
  private landing: (() => void) | null = null;
  /** the carried block's trip: where it was, where it goes */
  private carry: { phase: 'lift' | 'hold' | 'put'; from: [number, number, number]; to: [number, number, number] } | null = null;
  private cache: { version: number; n: number; areas: Area[] } | null = null;
  onLand?: (speed: number, block: Piece | null) => void;

  constructor(
    private readonly world: Diorama,
    private readonly levi: Levi,
  ) {}

  get r() {
    return R;
  }
  get busy() {
    return this.mode !== 'stand' || !!this.carrying;
  }
  /** how far the ground reaches */
  get bound() {
    return this.world.R + 5;
  }

  place(u: number, v: number, h: number, block: Piece | null) {
    this.u = u;
    this.v = v;
    this.h = h;
    this.on = block;
    this.mode = 'stand';
  }
  /** Set her in the air somewhere: she falls from there. */
  dropFrom(u: number, v: number, h: number) {
    this.place(u, v, h, null);
    this.vh = 0;
    this.fall();
  }

  // ------------------------------------------------------------------ the floors
  /** Every stretch of floor she can stand on. */
  areas(): Area[] {
    const blocks = this.world.blocks();
    if (this.cache && this.cache.version === this.world.version && this.cache.n === blocks.length) return this.cache.areas;
    const out: Area[] = [];
    const L = this.bound;
    for (const s of [...blocks, null]) {
      const h = s ? s.h1 : 0;
      const top: Area = s ? { block: s, h, x0: s.u + R, x1: s.u + s.w - R, z0: s.z - s.d + R, z1: s.z - R } : { block: null, h: 0, x0: -L, x1: L, z0: -L, z1: L };
      if (top.x1 - top.x0 < 0.02 || top.z1 - top.z0 < 0.02) continue;
      let rects = [top];
      for (const b of blocks) {
        if (b === s || b.h0 >= h + ROOM || b.h1 <= h + 0.02) continue;
        const o = { x0: b.u - R, x1: b.u + b.w + R, z0: b.z - b.d - R, z1: b.z + R };
        rects = rects.flatMap((a) => subtract(a, o));
      }
      for (const a of rects) if (a.x1 - a.x0 > 0.02 && a.z1 - a.z0 > 0.02) out.push(a);
    }
    this.cache = { version: this.world.version, n: blocks.length, areas: out };
    return out;
  }

  /** The floor she is on (or the nearest stretch of it). */
  areaOf(areas = this.areas(), u = this.u, v = this.v, h = this.h, block = this.on) {
    let best: Area | null = null;
    let bd = Infinity;
    for (const a of areas) {
      if (a.block !== block || Math.abs(a.h - h) > 0.05) continue;
      const d = rectDist(u, v, a);
      if (d < bd) {
        bd = d;
        best = a;
      }
    }
    return best;
  }

  /** Is her body clear of the blocks along a hop or a fall (sampled on its arc)? */
  private arcClear(a: [number, number, number], b: [number, number, number], lift: number) {
    const blocks = this.world.blocks();
    const s0 = R * 0.75;
    for (let i = 1; i < 10; i++) {
      const s = i / 10;
      const x = a[0] + (b[0] - a[0]) * s;
      const z = a[1] + (b[1] - a[1]) * s;
      const h = a[2] + (b[2] - a[2]) * s + 4 * lift * s * (1 - s);
      for (const k of blocks)
        if (k.u < x + s0 && k.u + k.w > x - s0 && k.z - k.d < z + s0 && k.z > z - s0 && k.h0 < h + TALL - 0.05 && k.h1 > h + 0.08) return false;
    }
    return true;
  }

  /** Can she walk straight from a to b at height h (floor all the way, nothing in her way)? */
  private clearLine(a: P2, b: P2, h: number) {
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.1);
    const blocks = this.world.blocks();
    for (let i = 1; i < n; i++) {
      const x = a[0] + ((b[0] - a[0]) * i) / n;
      const z = a[1] + ((b[1] - a[1]) * i) / n;
      if (Math.abs(this.world.supportAt(x, z, h + 0.05, FOOT).h - h) > 0.03) return false;
      for (const k of blocks)
        if (k.u < x + R && k.u + k.w > x - R && k.z - k.d < z + R && k.z > z - R && k.h0 < h + ROOM && k.h1 > h + 0.02) return false;
    }
    return true;
  }

  /** How she gets from floor A (arriving at p) to floor B, if she can. */
  private edge(A: Area, p: P2, B: Area): Edge | null {
    if (A === B) return null;
    // the nearest points of the two, near where she is
    let ax = clamp(p[0], A.x0, A.x1);
    let az = clamp(p[1], A.z0, A.z1);
    let bx = clamp(ax, B.x0, B.x1);
    let bz = clamp(az, B.z0, B.z1);
    ax = clamp(bx, A.x0, A.x1);
    az = clamp(bz, A.z0, A.z1);
    bx = clamp(ax, B.x0, B.x1);
    bz = clamp(az, B.z0, B.z1);
    const horiz = Math.hypot(bx - ax, bz - az);
    if (horiz > 1.7) return null;
    const dh = B.h - A.h;
    const walk = Math.hypot(ax - p[0], az - p[1]);
    const pa: P2 = [ax, az];
    const pb: P2 = [bx, bz];
    // the same floor across a seam
    if (Math.abs(dh) < 0.05 && horiz < 0.3) return { kind: 'step', pa, pb, cost: walk + horiz };
    // a block's face in front of her: climb onto it, or scale it
    const k = B.block;
    if (k && dh >= 0.3 && k.h0 <= A.h + 0.4) {
      let dir: P2 | null = null;
      let face = 0;
      let dist = 0;
      if (ax <= k.u) [dir, face, dist] = [[1, 0], k.u, k.u - ax];
      else if (ax >= k.u + k.w) [dir, face, dist] = [[-1, 0], k.u + k.w, ax - k.u - k.w];
      else if (az >= k.z) [dir, face, dist] = [[0, -1], k.z, az - k.z];
      else if (az <= k.z - k.d) [dir, face, dist] = [[0, 1], k.z - k.d, k.z - k.d - az];
      if (dir && dist < 0.6) {
        if (dh <= 0.7 && this.levi.clips.climb_up) return { kind: 'climb', pa, pb, dir, face, cost: walk + 1.5 };
        if (dh > 0.7 && this.levi.clips.wall_climb && dh < 7) return { kind: 'wall', pa, pb, dir, face, cost: walk + dh * 2 + 1 };
      }
    }
    if (!this.levi.clips.hop) return null;
    const from: [number, number, number] = [ax, az, A.h];
    const to: [number, number, number] = [bx, bz, B.h];
    const lift = Math.max(A.h, B.h) + 0.35 - (A.h + B.h) / 2;
    if (dh > 0.05 && dh <= 1.0 && horiz <= 1.4 && this.arcClear(from, to, lift)) return { kind: 'hop', pa, pb, cost: walk + horiz + dh + 1 };
    if (dh <= 0.05 && horiz <= 1.6) {
      if (-dh <= 2.4 && this.arcClear(from, to, lift)) return { kind: 'hop', pa, pb, cost: walk + horiz + 1 - dh * 0.3 };
      if (-dh > 2.4 && this.arcClear(from, to, 0.15)) return { kind: 'drop', pa, pb, cost: walk + horiz + 1 - dh * 0.3 };
    }
    return null;
  }

  /** Go to a point on a block's top (or the ground): walking, hopping, climbing as needed. `then(reached)`: false
   * if she could only get as close as she could. */
  goTo(goal: Goal, gait: Gait = 'walk', then?: (reached: boolean) => void) {
    if (this.mode === 'carried' || this.mode === 'fall') return false;
    const areas = this.areas();
    const s = this.areaOf(areas);
    if (!s) return false;
    const gh = goal.block ? goal.block.h1 : 0;
    let gl: Area | null = null;
    let gd = Infinity;
    for (const a of areas) {
      const d = rectDist(goal.u, goal.v, a) + (a.block === goal.block ? 0 : 3 + Math.abs(a.h - gh) * 2);
      if (d < gd) {
        gd = d;
        gl = a;
      }
    }
    if (!gl) return false;
    const n = areas.length;
    const si = areas.indexOf(s);
    const gi = areas.indexOf(gl);
    const cost = new Float64Array(n).fill(Infinity);
    const arr: P2[] = new Array(n);
    const prev: ({ i: number; e: Edge } | null)[] = new Array(n).fill(null);
    const seen = new Uint8Array(n);
    cost[si] = 0;
    arr[si] = [clamp(this.u, s.x0, s.x1), clamp(this.v, s.z0, s.z1)];
    for (;;) {
      let i = -1;
      for (let k = 0; k < n; k++) if (!seen[k] && cost[k]! < Infinity && (i < 0 || cost[k]! < cost[i]!)) i = k;
      if (i < 0 || i === gi) break;
      seen[i] = 1;
      const A = areas[i]!;
      for (let j = 0; j < n; j++) {
        if (seen[j]) continue;
        const B = areas[j]!;
        // too far apart to matter
        if (B.x0 > A.x1 + 1.7 || A.x0 > B.x1 + 1.7 || B.z0 > A.z1 + 1.7 || A.z0 > B.z1 + 1.7) continue;
        const e = this.edge(A, arr[i]!, B);
        if (!e) continue;
        const c = cost[i]! + e.cost;
        if (c < cost[j]!) {
          cost[j] = c;
          arr[j] = e.pb;
          prev[j] = { i, e };
        }
      }
    }
    // out of reach: as close as she can get
    let end = gi;
    this.reached = cost[gi]! < Infinity && gl.block === goal.block;
    if (cost[gi]! === Infinity) {
      let bd = Infinity;
      for (let k = 0; k < n; k++) {
        if (cost[k]! === Infinity) continue;
        const a = areas[k]!;
        const d = rectDist(goal.u, goal.v, a) + Math.abs(a.h - gh) * 1.5;
        if (d < bd) {
          bd = d;
          end = k;
        }
      }
    }
    const ea = areas[end]!;
    const gp: P2 = [clamp(goal.u, ea.x0, ea.x1), clamp(goal.v, ea.z0, ea.z1)];
    const chain: { area: Area; e: Edge }[] = [];
    for (let k = end; prev[k]; k = prev[k]!.i) chain.push({ area: areas[k]!, e: prev[k]!.e });
    chain.reverse();
    const moves: Move[] = [];
    // across one floor (seams and all) she walks straight wherever she can: the corners in between are pulled tight
    let run: P2[] = [];
    let from: P2 = [this.u, this.v];
    let h = this.h;
    const flush = () => {
      for (let i = 0; i < run.length; ) {
        let j = run.length - 1;
        while (j > i && !this.clearLine(from, run[j]!, h)) j--;
        moves.push({ kind: 'walk', u: run[j]![0], v: run[j]![1] });
        from = run[j]!;
        i = j + 1;
      }
      run = [];
    };
    for (const { area, e } of chain) {
      if (e.kind === 'step') {
        run.push(e.pa, e.pb);
        continue;
      }
      run.push(e.pa);
      flush();
      moves.push({ ...e, area });
      from = e.pb;
      h = area.h;
    }
    run.push(gp);
    flush();
    this.stopClip();
    this.moves = moves;
    this.gait = gait;
    this.done = then ?? null;
    this.next();
    return true;
  }

  /** Walk across her own floor to (u, v). */
  walkTo(u: number, v: number, gait: Gait = 'walk', then?: (reached: boolean) => void) {
    return this.goTo({ u, v, block: this.on }, gait, then);
  }

  private stopClip() {
    if (this.levi.current && !this.carrying) this.levi.stop();
  }

  stop() {
    if (this.mode === 'path') {
      this.moves = [];
      this.target = null;
      this.mode = 'stand';
      this.levi.setBase(this.carrying ? 'carry_idle' : 'idle');
      this.done = null;
    }
  }

  /** Turn to face a world point (when standing). */
  look(u: number, v: number) {
    this.faceAt = Math.atan2(u - this.u, v - this.v);
  }
  /** Turn to a heading (0: the viewer). */
  face(heading: number) {
    this.faceAt = heading;
  }

  private base(name: string) {
    this.levi.setBase(this.levi.clips[name] ? name : 'walk');
  }

  private finish() {
    this.mode = 'stand';
    this.target = null;
    this.levi.setBase(this.carrying ? 'carry_idle' : 'idle');
    const d = this.done;
    this.done = null;
    d?.(this.reached);
  }

  private next(): void {
    const mv = this.moves.shift();
    if (!mv) return this.finish();
    if (mv.kind === 'do') return mv.fn();
    if (mv.kind === 'walk') {
      if (Math.hypot(mv.u - this.u, mv.v - this.v) < 0.02) return this.next();
      this.target = { u: mv.u, v: mv.v };
      this.mode = 'path';
      this.base(this.gait === 'carry' ? 'carry_walk' : this.gait);
      return;
    }
    const B = mv.area;
    if (mv.kind === 'step') {
      this.moves.unshift({ kind: 'walk', u: mv.pb[0], v: mv.pb[1] });
      return this.next();
    }
    if (mv.kind === 'climb' || mv.kind === 'wall') {
      // up against the face, facing it
      const [dx, dz] = mv.dir!;
      const back = mv.kind === 'climb' ? 0.35 : 0.28;
      const A = this.areaOf();
      let su = dx ? mv.face! - dx * back : mv.pa[0];
      let sv = dz ? mv.face! - dz * back : mv.pa[1];
      if (A) {
        su = clamp(su, A.x0, A.x1);
        sv = clamp(sv, A.z0, A.z1);
      }
      const top: [number, number, number] = [dx ? mv.face! + dx * 0.1 : su, dz ? mv.face! + dz * 0.1 : sv, B.h];
      const up = () => {
        this.heading = Math.atan2(dx, dz);
        const over = () =>
          this.moveClip('climb_up', top, () => {
            this.on = B.block;
            this.moves.unshift({ kind: 'walk', u: mv.pb[0], v: mv.pb[1] });
            this.next();
          });
        if (mv.kind === 'climb') return over();
        this.mode = 'wall';
        this.wallTop = B.h - 0.5;
        this.landing = over;
        this.levi.setBase('wall_climb');
      };
      this.moves.unshift({ kind: 'walk', u: su, v: sv }, { kind: 'do', fn: up });
      return this.next();
    }
    // a hop (anywhere within reach) or a drop off a high ledge
    const to: [number, number, number] = [mv.pb[0], mv.pb[1], B.h];
    if (Math.hypot(to[0] - this.u, to[1] - this.v) > 0.05) this.heading = Math.atan2(to[0] - this.u, to[1] - this.v);
    this.target = null;
    const land = () => {
      this.on = B.block;
      if (B.block && !B.block.fx) this.world.play(B.block, 'dip');
      this.next();
    };
    if (mv.kind === 'drop') {
      // off the edge and down: a ballistic fall that lands there, then the landing
      const fallT = Math.sqrt((2 * Math.max(0.1, this.h - B.h)) / 9.8) + 0.25;
      this.vu = (to[0] - this.u) / fallT;
      this.vv = (to[1] - this.v) / fallT;
      this.vh = 0.25 * 9.8 * 0.5;
      this.mode = 'fall';
      this.levi.setBase('idle');
      this.landing = () => {
        this.vu = this.vv = 0;
        if (this.levi.clips.fall_land) this.moveClip('fall_land', [this.u, this.v, this.h], land);
        else land();
      };
      return;
    }
    const info = this.levi.clips.hop as { air?: [number, number] } | undefined;
    this.hopArc = { from: [this.u, this.v, this.h], to, air: info?.air ?? [13, 26] };
    this.mode = 'hop';
    this.levi.setBase('idle');
    void this.levi.play('hop').then(() => {
      if (this.mode !== 'hop') return;
      this.hopArc = null;
      [this.u, this.v, this.h] = to;
      this.mode = 'stand';
      land();
    });
  }

  /** Play a clip that takes her somewhere (the world point it ends at). */
  private moveClip(name: string, to: [number, number, number], then?: () => void) {
    this.target = null;
    this.levi.setBase('idle');
    this.mode = 'clip';
    this.rootClip = { name, from: [this.u, this.v, this.h], to };
    void this.levi.play(name).then(() => {
      if (this.rootClip?.name === name) {
        [this.u, this.v, this.h] = to;
        this.rootClip = null;
      }
      if (this.mode === 'clip') this.mode = 'stand';
      then?.();
    });
  }

  // ------------------------------------------------------------------ carrying a block about
  /** Can she carry this block (small enough, nothing on it, not under her)? */
  canLift(p: Piece) {
    if (p.held || p === this.on || p.t < 1 || !this.levi.clips.lift_up) return false;
    if (p.w > 1.8 || p.d > 1.8 || p.h1 - p.h0 > 1.0) return false;
    return !this.world.blocks().some((b) => b !== p && Math.abs(b.h0 - p.h1) < 0.02 && b.u < p.u + p.w && b.u + b.w > p.u && b.z - b.d < p.z && b.z > p.z - p.d);
  }
  /** The spot to lift a block from: on the floor it rests on (or just below it), right beside it. */
  liftSpot(p: Piece, areas = this.areas()): { area: Area; u: number; v: number } | null {
    const foot = { x0: p.u, x1: p.u + p.w, z0: p.z - p.d, z1: p.z };
    let best: { area: Area; u: number; v: number } | null = null;
    let bd = Infinity;
    for (const a of areas) {
      if (a.h > p.h0 + 0.05 || p.h0 - a.h > 0.4) continue;
      const u = clamp((foot.x0 + foot.x1) / 2, a.x0, a.x1);
      const v = clamp((foot.z0 + foot.z1) / 2, a.z0, a.z1);
      const d = rectDist(u, v, foot);
      if (d > 0.55) continue;
      const score = d + Math.abs(a.h - this.h) * 0.5 + Math.hypot(u - this.u, v - this.v) * 0.05;
      if (score < bd) {
        bd = score;
        best = { area: a, u, v };
      }
    }
    return best;
  }

  /** Go to a block, lift it over her head, carry it across her floor and set it down somewhere free. */
  moveBlock(p: Piece, then?: (moved: boolean) => void) {
    if (!this.canLift(p) || this.carrying) return false;
    const spot = this.liftSpot(p);
    if (!spot) return false;
    return this.goTo({ u: spot.u, v: spot.v, block: spot.area.block }, 'walk', (reached) => {
      if (!reached || !this.canLift(p) || Math.hypot(this.u - spot.u, this.v - spot.v) > 0.1) return then?.(false);
      this.lift(p, () => this.carryOff(p, then));
    });
  }

  private lift(p: Piece, then: () => void) {
    this.heading = Math.atan2(p.u + p.w / 2 - this.u, p.z - p.d / 2 - this.v);
    this.carrying = p;
    p.held = true;
    this.world.version++;
    this.carry = { phase: 'lift', from: [p.u, p.h0, p.z], to: [p.u, p.h0, p.z] };
    this.mode = 'clip';
    void this.levi.play('lift_up').then(() => {
      if (this.carrying !== p) return;
      this.carry!.phase = 'hold';
      this.levi.setBase('carry_idle');
      this.mode = 'stand';
      then();
    });
  }

  /** Across her floor to a free spot a little way off, and set it down in front of her. */
  private carryOff(p: Piece, then?: (moved: boolean) => void) {
    const A = this.areaOf();
    const hgt = p.h1 - p.h0;
    let fit: { su: number; sv: number; dir: P2; u: number; z: number } | null = null;
    if (A) {
      const dirs: P2[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (let i = 0; i < 80 && !fit; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 1 + Math.random() * 3;
        const su = clamp(this.u + Math.cos(ang) * dist, A.x0, A.x1);
        const sv = clamp(this.v + Math.sin(ang) * dist, A.z0, A.z1);
        if (Math.hypot(su - this.u, sv - this.v) < 0.8) continue;
        const dir = dirs[Math.floor(Math.random() * 4)]!;
        const cx = su + dir[0] * (0.3 + p.w / 2);
        const cz = sv + dir[1] * (0.3 + p.d / 2);
        const u = cx - p.w / 2;
        const z = cz + p.d / 2;
        const sup = A.block;
        // all of it on her floor (a block's top), clear of everything
        if (sup && (u < sup.u || u + p.w > sup.u + sup.w || z - p.d < sup.z - sup.d || z > sup.z)) continue;
        if (!sup && (Math.abs(cx) > this.world.R + 2 || Math.abs(cz) > this.world.R + 2)) continue;
        if (!this.world.free(u, p.w, A.h + 0.001, A.h + hgt, z, p.d, p)) continue;
        fit = { su, sv, dir, u, z };
      }
    }
    const put = (dest: [number, number, number], heading: number) => {
      this.heading = heading;
      this.carry = { phase: 'put', from: [p.u, p.h0, p.z], to: dest };
      this.mode = 'clip';
      void this.levi.play('put_down').then(() => {
        this.levi.setBase('idle');
        if (this.mode === 'clip') this.mode = 'stand';
        then?.(true);
      });
    };
    if (!fit || !A) {
      // nowhere to go: back where it was
      const from = this.carry!.from;
      return put(from, Math.atan2(from[0] + p.w / 2 - this.u, from[2] - p.d / 2 - this.v));
    }
    const f = fit;
    this.goTo({ u: f.su, v: f.sv, block: A.block }, 'carry', () => {
      if (this.carrying !== p) return then?.(false);
      put([f.u, A.h, f.z], Math.atan2(f.dir[0], f.dir[1]));
    });
  }

  /** Where the carried block is now (over her head, or on its way up or down). */
  private updateCarry() {
    const p = this.carrying;
    const c = this.carry;
    if (!p || !c) return;
    const bob = Math.sin(performance.now() / 260) * 0.01;
    const over: [number, number, number] = [this.u - p.w / 2, this.h + 1.62 + bob, this.v + p.d / 2];
    let at = over;
    const cs = this.levi.clipState();
    const t = cs && (cs.name === 'lift_up' || cs.name === 'put_down') ? cs.t : null;
    const info = cs?.info as { grab?: number; up?: number; down?: number; release?: number } | undefined;
    if (c.phase === 'lift') {
      const g = info?.grab ?? 24;
      const u = info?.up ?? 44;
      const k = t === null ? 1 : smooth01((t - g) / (u - g));
      at = lerp3(c.from, over, k);
      if (t !== null && t >= u) this.levi.setBase('carry_idle');
    } else if (c.phase === 'put') {
      const d0 = 10;
      const d1 = info?.down ?? 24;
      const k = t === null ? 1 : smooth01((t - d0) / (d1 - d0));
      at = lerp3(over, c.to, k);
      if (t === null || t >= (info?.release ?? 30)) {
        this.world.moveTo(p, c.to[0], c.to[1], c.to[2]);
        p.held = false;
        this.carrying = null;
        this.carry = null;
        this.world.play(p, 'dip');
        return;
      }
    }
    this.world.hold(p, at[0], at[1], at[2]);
  }

  /** She lets go of what she carries (picked up by the cursor): it goes back where it was. */
  private dropCarried() {
    const p = this.carrying;
    if (!p || !this.carry) return;
    const [u, h0, z] = this.carry.from;
    this.world.moveTo(p, u, h0, z);
    p.held = false;
    this.carrying = null;
    this.carry = null;
  }

  // ------------------------------------------------------------------ the cursor carries her
  pickUp() {
    this.moves = [];
    this.target = null;
    this.rootClip = null;
    this.hopArc = null;
    this.landing = null;
    this.done = null;
    this.dropCarried();
    this.mode = 'carried';
    this.levi.setBase('idle');
    this.on = null;
  }
  /** Hanging from the cursor: her feet toward (u, v, h). */
  carryTo(u: number, v: number, h: number) {
    if (this.mode !== 'carried') return;
    const L = this.bound;
    this.u += (clamp(u, -L, L) - this.u) * 0.35;
    this.v += (clamp(v, -L, L) - this.v) * 0.35;
    this.h += (Math.max(0, h) - this.h) * 0.35;
  }
  drop() {
    if (this.mode !== 'carried') return;
    this.fall();
  }
  /** Nothing under her feet any more: she falls (whatever she was doing). */
  private fall() {
    this.moves = [];
    this.target = null;
    this.landing = null;
    const d = this.done;
    this.done = null;
    this.mode = 'fall';
    this.vh = Math.min(this.vh, 0);
    this.vu = this.vv = 0;
    this.levi.setBase(this.carrying ? 'carry_idle' : 'idle');
    d?.(false);
  }

  /** Her body against the blocks: pushed out sideways (the shallow way) from any she is in. */
  private pushOut(except: Piece | null) {
    for (const b of this.world.blocks()) {
      if (b === except || b.h0 >= this.h + TALL || b.h1 <= this.h + 0.05) continue;
      const dx0 = this.u + R - b.u;
      const dx1 = b.u + b.w - (this.u - R);
      const dz0 = this.v + R - (b.z - b.d);
      const dz1 = b.z - (this.v - R);
      if (dx0 <= 0 || dx1 <= 0 || dz0 <= 0 || dz1 <= 0) continue;
      const m = Math.min(dx0, dx1, dz0, dz1);
      if (m === dx0) this.u -= dx0;
      else if (m === dx1) this.u += dx1;
      else if (m === dz0) this.v -= dz0;
      else this.v += dz1;
      if (m === dx0 || m === dx1) this.vu = 0;
      else this.vv = 0;
    }
  }

  update(dt: number, cubes: Cube[]) {
    if (this.mode === 'path' && this.target) {
      const du = this.target.u - this.u;
      const dv = this.target.v - this.v;
      const dist = Math.hypot(du, dv);
      const want = Math.atan2(du, dv);
      this.turnToward(want, dt, 9);
      // speed from the loop's stride (metres per cycle), slower while still turning
      const info = this.levi.clips[this.levi.baseLoop];
      const fallback = { walk: 1.0, run: 2.8, tiptoe: 0.5, skip: 1.6, carry: 0.9 }[this.gait];
      const speed = info?.stride && info.frames ? (info.stride * FPS) / info.frames : fallback;
      const align = Math.max(0, Math.cos(angleDiff(want, this.heading)));
      const step = Math.min(dist, speed * dt * (0.25 + 0.75 * align));
      if (dist > 0.002) {
        this.u += (du / dist) * step;
        this.v += (dv / dist) * step;
      }
      if (dist < Math.max(0.02, speed * dt * 1.2)) {
        this.u = this.target.u;
        this.v = this.target.v;
        this.target = null;
        this.next();
      }
    } else if (this.mode === 'clip' && this.rootClip) {
      // the clip carries her centre away from her spot; as it fades into the idle, move the spot under her so
      // the blend stays put (the clip's own end offset fades out exactly as the spot moves in)
      const cs = this.levi.clipState();
      if (cs && cs.name === this.rootClip.name) {
        const k = cs.t >= cs.frames - FADE ? clamp(1 - cs.weight, 0, 1) : 0;
        [this.u, this.v, this.h] = lerp3(this.rootClip.from, this.rootClip.to, k);
      }
    } else if (this.mode === 'hop' && this.hopArc) {
      // the arc, over the clip's frames in the air
      const cs = this.levi.clipState();
      const a = this.hopArc;
      if (cs && cs.name === 'hop') {
        const s = clamp((cs.t - a.air[0]) / (a.air[1] - a.air[0]), 0, 1);
        const [u, v, h] = lerp3(a.from, a.to, s);
        const lift = Math.max(a.from[2], a.to[2]) + 0.35 - (a.from[2] + a.to[2]) / 2;
        this.u = u;
        this.v = v;
        this.h = h + 4 * lift * s * (1 - s);
      }
    } else if (this.mode === 'wall') {
      // up the face at the climb's own pace
      const info = this.levi.clips.wall_climb;
      const speed = info?.stride && info.frames ? (info.stride * FPS) / info.frames : 0.3;
      this.h = Math.min(this.wallTop, this.h + speed * dt);
      if (this.h >= this.wallTop) {
        const l = this.landing;
        this.landing = null;
        this.mode = 'clip';
        l?.();
      }
    } else if (this.mode === 'fall') {
      const prevH = this.h;
      this.vh -= 9.8 * dt;
      this.u += this.vu * dt;
      this.v += this.vv * dt;
      this.h += this.vh * dt;
      // the sides of what she falls past push her off; its top catches her
      const sup = this.world.supportAt(this.u, this.v, prevH + 0.02, FOOT);
      this.pushOut(sup.block);
      if (this.h <= sup.h && this.vh <= 0) {
        const speed = -this.vh;
        this.h = sup.h;
        this.vh = 0;
        this.on = sup.block;
        this.mode = 'stand';
        const l = this.landing;
        this.landing = null;
        if (l) l();
        else {
          this.levi.setBase(this.carrying ? 'carry_idle' : 'idle');
          this.onLand?.(speed, sup.block);
        }
      }
    }
    // standing or walking: nothing under her feet any more (a block taken away, an edge) and she falls
    if (this.mode === 'stand' || this.mode === 'path') {
      const sup = this.world.supportAt(this.u, this.v, this.h + 0.05, FOOT);
      if (sup.h < this.h - 0.03) this.fall();
      else {
        this.h = sup.h;
        this.on = sup.block;
        this.pushOut(sup.block);
      }
      const L = this.bound;
      this.u = clamp(this.u, -L, L);
      this.v = clamp(this.v, -L, L);
    }
    if (this.mode === 'stand' && this.faceAt !== null) {
      if (Math.abs(angleDiff(this.faceAt, this.heading)) < 0.02) this.faceAt = null;
      else this.turnToward(this.faceAt, dt, 5);
    }
    this.updateCarry();
    // she nudges cubes out of her way
    if (this.mode === 'path') {
      for (const c of cubes) {
        if (c.held || Math.abs(c.h - this.h) > c.s) continue;
        const du = c.u - this.u;
        const dv = c.v - this.v;
        const d = Math.hypot(du, dv);
        const lim = R + c.s / 2;
        if (d < lim && d > 0.001) {
          c.vu += (du / d) * 0.9;
          c.vv += (dv / d) * 0.9;
          c.u += (du / d) * (lim - d);
          c.v += (dv / d) * (lim - d);
        }
      }
    }
  }

  private turnToward(want: number, dt: number, rate: number) {
    const d = angleDiff(want, this.heading);
    this.heading += Math.sign(d) * Math.min(Math.abs(d), rate * dt);
  }
}

const smooth01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp3 = (a: [number, number, number], b: [number, number, number], k: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];

export function angleDiff(a: number, b: number) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}
