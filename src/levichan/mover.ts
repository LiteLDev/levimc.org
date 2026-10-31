// Where she is in the exploded page and how she gets around it: walking along the ledges (the blocks' tops, and the
// ground far below), hopping up, down and across gaps, climbing onto ledges half a metre up, scaling the faces of
// taller blocks, falling, being carried by the cursor; and carrying the small blocks about herself.
// World coordinates (./diorama): u right, v toward the viewer, h up; heading 0 faces the viewer (+v).
import type { Cube, Diorama, Piece } from './diorama';
import type { Levi } from './levi';

export type MoveMode = 'stand' | 'path' | 'clip' | 'hop' | 'wall' | 'carried' | 'fall';
type Gait = 'walk' | 'run' | 'tiptoe' | 'skip' | 'carry';

/** A stretch of a ledge she can stand on: its block (null: the ground), its height, the line she walks along it
 * (v) and its extent (u from a to b, already a body radius in from anything in her way). */
export interface Lane {
  block: Piece | null;
  h: number;
  v: number;
  a: number;
  b: number;
}
/** Where to go: a point on a block's top (null: the ground). */
export interface Goal {
  u: number;
  block: Piece | null;
}

type Edge = { kind: 'step' | 'climb' | 'wall' | 'hop' | 'drop'; tu: number; lu: number; cost: number };
type Move = { kind: 'walk'; u: number; v: number } | { kind: 'do'; fn: () => void } | ({ lane: Lane } & Edge);

const FPS = 30;
const FADE = 9;

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
  onLand?: (speed: number, block: Piece | null) => void;

  constructor(
    private readonly world: Diorama,
    private readonly levi: Levi,
  ) {}

  get m() {
    return this.world.m;
  }
  /** her body radius */
  get r() {
    return 0.2 * this.m;
  }
  get busy() {
    return this.mode !== 'stand' || !!this.carrying;
  }

  place(u: number, v: number, h: number, block: Piece | null) {
    this.u = u;
    this.v = v;
    this.h = h;
    this.on = block;
    this.mode = 'stand';
  }

  // ------------------------------------------------------------------ the ledges
  /** Every stretch she can stand on, with room above for her. */
  lanes(): Lane[] {
    const m = this.m;
    const r = this.r;
    const room = 1.5 * m;
    const blocks = this.world.blocks();
    const out: Lane[] = [];
    const cut = (block: Piece | null, h: number, v: number, a: number, b: number) => {
      let spans: [number, number][] = [[a, b]];
      for (const c of blocks) {
        if (c === block || c.h0 >= h + room || c.h1 <= h + 2 || c.z <= v - r || c.z - c.d >= v + r) continue;
        const ca = c.u - r;
        const cb = c.u + c.w + r;
        spans = spans.flatMap(([x, y]) => (cb <= x || ca >= y ? [[x, y]] : ([[x, Math.min(y, ca)], [Math.max(x, cb), y]] as [number, number][]).filter(([p, q]) => q - p > 2)));
      }
      for (const [x, y] of spans) if (y - x > 2) out.push({ block, h, v, a: x, b: y });
    };
    for (const b of blocks) {
      if (b.w < 2 * r + 4) continue;
      cut(b, b.h1, b.z - Math.min(b.d, this.world.step) / 2, b.u + r, b.u + b.w - r);
    }
    cut(null, 0, 0.55 * m, r, this.world.W - r);
    return out;
  }

  /** The lane she is on (or the nearest stretch of her ledge). */
  private laneOf(lanes: Lane[]) {
    let best: Lane | null = null;
    let bd = Infinity;
    for (const l of lanes) {
      if (l.block !== this.on || Math.abs(l.h - this.h) > 4) continue;
      const d = this.u < l.a ? l.a - this.u : this.u > l.b ? this.u - l.b : 0;
      if (d < bd) {
        bd = d;
        best = l;
      }
    }
    return best;
  }

  /** How she gets from lane I (arriving at u = ua) to lane J, if she can. */
  private edge(I: Lane, ua: number, J: Lane): Edge | null {
    if (I === J) return null;
    const m = this.m;
    const dh = J.h - I.h;
    const o0 = Math.max(I.a, J.a);
    const o1 = Math.min(I.b, J.b);
    let tu: number;
    let lu: number;
    let gap: number;
    if (o1 >= o0) {
      tu = lu = Math.max(o0, Math.min(o1, ua));
      gap = 0;
    } else if (J.a > I.b) {
      [tu, lu, gap] = [I.b, J.a, J.a - I.b];
    } else {
      [tu, lu, gap] = [I.a, J.b, I.a - J.b];
    }
    const dv = J.v - I.v;
    const horiz = Math.hypot(gap, dv);
    const walk = Math.abs(ua - tu);
    // the same ledge across a crack
    if (Math.abs(dh) < 0.05 * m && Math.abs(dv) < 0.05 * m && gap < 0.3 * m) return { kind: 'step', tu, lu, cost: walk + gap };
    if (J.block && gap === 0) {
      // a block face behind her lane: climb onto it, or scale it
      const ahead = I.v - J.block.z;
      if (ahead > 0.05 * m && ahead < 0.95 * m) {
        if (dh >= 0.35 * m && dh <= 0.65 * m && this.levi.clips.climb_up) return { kind: 'climb', tu, lu, cost: walk + 1.5 * m };
        if (dh > 0.65 * m && J.block.h0 <= I.h + 0.4 * m && this.levi.clips.wall_climb) return { kind: 'wall', tu, lu, cost: walk + dh * 2 + m };
      }
    }
    if (dh > 0 && dh <= 1.0 * m && horiz <= 1.4 * m) return { kind: 'hop', tu, lu, cost: walk + horiz + dh + m };
    if (dh <= 0 && horiz <= 1.6 * m) return { kind: -dh <= 2.4 * m ? 'hop' : 'drop', tu, lu, cost: walk + horiz + m - dh * 0.3 };
    return null;
  }

  /** Go to a point on a block's top (or the ground): walking, hopping, climbing as needed. `then(reached)`: false
   * if she could only get as close as she could. */
  goTo(goal: Goal, gait: Gait = 'walk', then?: (reached: boolean) => void) {
    if (this.mode === 'carried' || this.mode === 'fall') return false;
    const lanes = this.lanes();
    const s = this.laneOf(lanes);
    if (!s) return false;
    const goals = lanes.filter((l) => l.block === goal.block);
    if (!goals.length) return false;
    const gl = goals.reduce((a, b) => (dist1(goal.u, b) < dist1(goal.u, a) ? b : a));
    const n = lanes.length;
    const si = lanes.indexOf(s);
    const gi = lanes.indexOf(gl);
    const cost = new Float64Array(n).fill(Infinity);
    const arr = new Float64Array(n);
    const prev: ({ i: number; e: Edge } | null)[] = new Array(n).fill(null);
    const seen = new Uint8Array(n);
    cost[si] = 0;
    arr[si] = Math.max(s.a, Math.min(s.b, this.u));
    for (;;) {
      let i = -1;
      for (let k = 0; k < n; k++) if (!seen[k] && cost[k]! < Infinity && (i < 0 || cost[k]! < cost[i]!)) i = k;
      if (i < 0 || i === gi) break;
      seen[i] = 1;
      for (let j = 0; j < n; j++) {
        if (seen[j]) continue;
        const e = this.edge(lanes[i]!, arr[i]!, lanes[j]!);
        if (!e) continue;
        const c = cost[i]! + e.cost;
        if (c < cost[j]!) {
          cost[j] = c;
          arr[j] = e.lu;
          prev[j] = { i, e };
        }
      }
    }
    // out of reach: as close as she can get
    let end = gi;
    let gu = Math.max(gl.a, Math.min(gl.b, goal.u));
    this.reached = cost[gi]! < Infinity;
    if (!this.reached) {
      const gh = gl.h;
      let bd = Infinity;
      for (let k = 0; k < n; k++) {
        if (cost[k]! === Infinity) continue;
        const l = lanes[k]!;
        const d = Math.hypot(dist1(gu, l), (l.h - gh) * 1.5, l.v - gl.v);
        if (d < bd) {
          bd = d;
          end = k;
        }
      }
      gu = Math.max(lanes[end]!.a, Math.min(lanes[end]!.b, gu));
    }
    const chain: { lane: Lane; e: Edge }[] = [];
    for (let k = end; prev[k]; k = prev[k]!.i) chain.push({ lane: lanes[k]!, e: prev[k]!.e });
    chain.reverse();
    const moves: Move[] = [];
    let at = s;
    for (const { lane, e } of chain) {
      moves.push({ kind: 'walk', u: e.tu, v: at.v });
      moves.push({ ...e, lane });
      at = lane;
    }
    moves.push({ kind: 'walk', u: gu, v: at.v });
    this.stopClip();
    this.moves = moves;
    this.gait = gait;
    this.done = then ?? null;
    this.next();
    return true;
  }

  /** Walk along her own ledge to u. */
  walkTo(u: number, gait: Gait = 'walk', then?: (reached: boolean) => void) {
    const l = this.laneOf(this.lanes());
    return this.goTo({ u: l ? Math.max(l.a, Math.min(l.b, u)) : u, block: this.on }, gait, then);
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

  private next(): void {
    const mv = this.moves.shift();
    if (!mv) {
      this.mode = 'stand';
      this.target = null;
      this.levi.setBase(this.carrying ? 'carry_idle' : 'idle');
      const d = this.done;
      this.done = null;
      d?.(this.reached);
      return;
    }
    const m = this.m;
    if (mv.kind === 'do') return mv.fn();
    if (mv.kind === 'walk') {
      if (Math.hypot(mv.u - this.u, mv.v - this.v) < 3) return this.next();
      this.target = { u: mv.u, v: mv.v };
      this.mode = 'path';
      this.base(this.gait === 'carry' ? 'carry_walk' : this.gait);
      return;
    }
    const J = mv.lane;
    if (mv.kind === 'step') {
      this.on = J.block;
      this.h = J.h;
      this.moves.unshift({ kind: 'walk', u: mv.lu, v: J.v });
      return this.next();
    }
    if (mv.kind === 'climb' || mv.kind === 'wall') {
      // up against the face, facing it
      const face = J.block!.z;
      const sv = Math.min(this.v + 0.2 * m, face + (mv.kind === 'climb' ? 0.35 : 0.3) * m);
      this.target = null;
      const up = () => {
        this.heading = Math.PI;
        if (mv.kind === 'climb') {
          this.moveClip('climb_up', [mv.lu, face - 0.1 * m, J.h], () => {
            this.on = J.block;
            this.moves.unshift({ kind: 'walk', u: mv.lu, v: J.v });
            this.next();
          });
        } else {
          this.mode = 'wall';
          this.wallTop = J.h - 0.5 * m;
          this.landing = () =>
            this.moveClip('climb_up', [mv.lu, face - 0.1 * m, J.h], () => {
              this.on = J.block;
              this.moves.unshift({ kind: 'walk', u: mv.lu, v: J.v });
              this.next();
            });
          this.levi.setBase('wall_climb');
        }
      };
      if (Math.hypot(mv.tu - this.u, sv - this.v) > 3) {
        // up to the face first
        this.moves.unshift({ kind: 'walk', u: mv.tu, v: sv }, { kind: 'do', fn: up });
        return this.next();
      }
      return up();
    }
    // a hop (anywhere within reach) or a drop off a high ledge
    const to: [number, number, number] = [mv.lu, J.v, J.h];
    this.heading = Math.atan2(to[0] - this.u, to[1] - this.v);
    if (Math.abs(to[0] - this.u) < 2 && Math.abs(to[1] - this.v) < 2) this.heading = J.h > this.h ? Math.PI : 0;
    this.target = null;
    const land = () => {
      this.on = J.block;
      this.next();
    };
    if (mv.kind === 'drop' || !this.levi.clips.hop) {
      // off the edge and down: a ballistic fall that lands there, then the landing
      const fallT = Math.sqrt((2 * Math.max(1, this.h - J.h)) / (9.8 * m)) + 0.25;
      this.vu = (to[0] - this.u) / fallT;
      this.vv = (to[1] - this.v) / fallT;
      this.vh = 0.25 * 9.8 * m * 0.5;
      this.mode = 'fall';
      this.levi.setBase('idle');
      this.landing = () => {
        this.vu = this.vv = 0;
        if (this.levi.clips.fall_land) this.moveClip('fall_land', [this.u, this.v, this.h], land);
        else land();
      };
      return;
    }
    const info = this.levi.clips.hop!;
    const air = ((info as { air?: [number, number] }).air ?? [13, 26]) as [number, number];
    this.hopArc = { from: [this.u, this.v, this.h], to, air };
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
  /** Can she carry this block (small enough, near her height)? */
  canLift(p: Piece) {
    const m = this.m;
    return !p.held && p !== this.on && p.w <= 1.8 * m && p.h1 - p.h0 <= 1.0 * m && p.t >= 1 && !!this.levi.clips.lift_up;
  }
  /** The spot to lift a block from: on the ledge right below it, in front of its face. */
  liftSpot(p: Piece, lanes = this.lanes()): { lane: Lane; u: number } | null {
    const m = this.m;
    let best: { lane: Lane; u: number } | null = null;
    let bd = Infinity;
    for (const l of lanes) {
      const ahead = l.v - p.z;
      if (l.h > p.h0 + 2 || p.h0 - l.h > 0.4 * m || ahead < 0.05 * m || ahead > 0.9 * m) continue;
      // under it, or just beside it (she can grab it by its end)
      const a = Math.max(l.a, Math.min(p.u + 0.2 * m, p.u + p.w / 2));
      const b = Math.min(l.b, Math.max(p.u + p.w - 0.2 * m, p.u + p.w / 2));
      if (b < a && (l.b < p.u - 0.15 * m || l.a > p.u + p.w + 0.15 * m)) continue;
      const u = b < a ? (l.b < p.u + p.w / 2 ? l.b : l.a) : Math.max(a, Math.min(b, p.u + p.w / 2));
      const d = Math.abs(u - (p.u + p.w / 2)) + Math.abs(l.h - this.h) * 0.5;
      if (d < bd) {
        bd = d;
        best = { lane: l, u };
      }
    }
    return best;
  }

  /** Go to a block, lift it over her head, carry it along the ledge and set it down somewhere free. */
  moveBlock(p: Piece, then?: (moved: boolean) => void) {
    if (!this.canLift(p) || this.carrying) return false;
    const spot = this.liftSpot(p);
    if (!spot) return false;
    return this.goTo({ u: spot.u, block: spot.lane.block }, 'walk', (reached) => {
      if (!reached || !this.canLift(p)) return then?.(false);
      this.lift(p, () => this.carryOff(p, then));
    });
  }

  private lift(p: Piece, then: () => void) {
    this.heading = Math.PI;
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

  /** Along her ledge to a free spot (either way, a little off), set it down beside her. */
  private carryOff(p: Piece, then?: (moved: boolean) => void) {
    const m = this.m;
    const lane = this.laneOf(this.lanes());
    const tries: { su: number; side: number }[] = [];
    if (lane)
      for (let off = 1.0 * m; off < 4 * m; off += 0.3 * m)
        for (const side of Math.random() < 0.5 ? [1, -1] : [-1, 1]) {
          const su = this.u - side * off;
          if (su >= lane.a && su <= lane.b) tries.push({ su, side });
        }
    const sup = lane?.block;
    let fit: { su: number; side: number; z: number } | null = null;
    for (const { su, side } of tries) {
      const bu = side > 0 ? su + 0.3 * m : su - 0.3 * m - p.w;
      const cu = bu + p.w / 2;
      if (sup && (cu < sup.u || cu > sup.u + sup.w)) continue;
      // centred on her line, or further out toward the ledge's edge (clear of the blocks behind)
      const z = [0.5, 0.8, 1].map((k) => lane!.v + p.d * k).find((z) => this.world.free(bu, p.w, lane!.h + 1, lane!.h + (p.h1 - p.h0), z, p.d, p));
      if (z !== undefined) {
        fit = { su, side, z };
        break;
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
    if (!fit || !lane) {
      // nowhere to go: back where it was
      return put(this.carry!.from, Math.PI);
    }
    const bu = fit.side > 0 ? fit.su + 0.3 * m : fit.su - 0.3 * m - p.w;
    const dest: [number, number, number] = [bu, lane.h + 1, fit.z];
    this.goTo({ u: fit.su, block: lane.block }, 'carry', () => {
      if (this.carrying !== p) return then?.(false);
      put(dest, fit.side > 0 ? Math.PI / 2 : -Math.PI / 2);
    });
  }

  /** Where the carried block is now (over her head, or on its way up or down). */
  private updateCarry() {
    const p = this.carrying;
    const c = this.carry;
    if (!p || !c) return;
    const m = this.m;
    const bob = Math.sin(performance.now() / 260) * 0.01 * m;
    const over: [number, number, number] = [this.u - p.w / 2, this.h + 1.62 * m + bob, this.v + p.d / 2];
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
  /** Hanging from the cursor: her feet toward (u, h), on the plane she is in. */
  carryTo(u: number, h: number) {
    if (this.mode !== 'carried') return;
    const r = this.r;
    u = Math.max(r, Math.min(this.world.W - r, u));
    this.u += (u - this.u) * 0.35;
    this.h += (Math.max(0, h) - this.h) * 0.35;
  }
  drop() {
    if (this.mode !== 'carried') return;
    this.mode = 'fall';
    this.vh = 0;
    this.vu = this.vv = 0;
  }

  update(dt: number, cubes: Cube[]) {
    const m = this.m;
    if (this.mode === 'path' && this.target) {
      const du = this.target.u - this.u;
      const dv = this.target.v - this.v;
      const dist = Math.hypot(du, dv);
      const want = Math.atan2(du, dv);
      this.turnToward(want, dt, 9);
      // speed from the loop's stride (metres per cycle), slower while still turning
      const info = this.levi.clips[this.levi.baseLoop];
      const fallback = { walk: 1.0, run: 2.8, tiptoe: 0.5, skip: 1.6, carry: 0.9 }[this.gait];
      const speed = (info?.stride && info.frames ? (info.stride * FPS) / info.frames : fallback) * m;
      const align = Math.max(0, Math.cos(angleDiff(want, this.heading)));
      const step = Math.min(dist, speed * dt * (0.25 + 0.75 * align));
      if (dist > 0.5) {
        this.u += (du / dist) * step;
        this.v += (dv / dist) * step;
      }
      if (dist < Math.max(3, speed * dt * 1.2)) {
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
        const k = cs.t >= cs.frames - FADE ? Math.max(0, Math.min(1, 1 - cs.weight)) : 0;
        [this.u, this.v, this.h] = lerp3(this.rootClip.from, this.rootClip.to, k);
      }
    } else if (this.mode === 'hop' && this.hopArc) {
      // the arc, over the clip's frames in the air
      const cs = this.levi.clipState();
      const a = this.hopArc;
      if (cs && cs.name === 'hop') {
        const s = Math.max(0, Math.min(1, (cs.t - a.air[0]) / (a.air[1] - a.air[0])));
        const [u, v, h] = lerp3(a.from, a.to, s);
        const lift = Math.max(a.from[2], a.to[2]) + 0.3 * m - (a.from[2] + a.to[2]) / 2;
        this.u = u;
        this.v = v;
        this.h = h + 4 * lift * s * (1 - s);
      }
    } else if (this.mode === 'wall') {
      // up the face at the climb's own pace
      const info = this.levi.clips.wall_climb;
      const speed = info?.stride && info.frames ? (info.stride * FPS) / info.frames : 0.3;
      this.h = Math.min(this.wallTop, this.h + speed * m * dt);
      if (this.h >= this.wallTop) {
        const l = this.landing;
        this.landing = null;
        this.mode = 'clip';
        l?.();
      }
    } else if (this.mode === 'fall') {
      this.vh -= 9.8 * m * dt;
      this.u += this.vu * dt;
      this.v += this.vv * dt;
      this.h += this.vh * dt;
      const sup = this.world.supportAt(this.u, this.v, this.h - this.vh * dt + 2);
      if (this.h <= sup.h && this.vh < 0) {
        const speed = -this.vh;
        this.h = sup.h;
        this.vh = 0;
        this.on = sup.block;
        this.mode = 'stand';
        const l = this.landing;
        this.landing = null;
        if (l) l();
        else this.onLand?.(speed, sup.block);
      }
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
        const lim = this.r + c.s / 2;
        if (d < lim && d > 0.01) {
          c.vu += (du / d) * 0.9 * m;
          c.vv += (dv / d) * 0.9 * m;
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

const dist1 = (u: number, l: Lane) => (u < l.a ? l.a - u : u > l.b ? u - l.b : 0);
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
