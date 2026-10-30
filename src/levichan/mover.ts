// Where she is on the page and how she gets around it: walking and running on paths around the blocks, climbing
// onto the low ones and hopping down, hiding behind the tall ones, being carried by the cursor and falling. Page-local
// coordinates (./diorama): u right, v down the page (toward the camera), h up; heading 0 faces +v.
import type { Box, Cube, Diorama } from './diorama';
import type { Levi } from './levi';

export type MoveMode = 'stand' | 'path' | 'clip' | 'carried' | 'fall';

interface Step {
  u: number;
  v: number;
}

const FPS = 30;
const FADE = 9;

export class Mover {
  u = 0;
  v = 0;
  h = 0;
  heading = 0;
  mode: MoveMode = 'stand';
  /** the block she stands on (null: the ground) */
  on: Box | null = null;
  private path: Step[] = [];
  private gait: 'walk' | 'run' | 'tiptoe' | 'skip' = 'walk';
  private done: (() => void) | null = null;
  private faceAt: number | null = null;
  private vh = 0;
  /** a clip that moves her (climb_up, jump_down): where it started and where it ends */
  private rootClip: { name: string; from: [number, number, number]; to: [number, number, number] } | null = null;
  onLand?: (speed: number, box: Box | null) => void;

  constructor(
    private readonly world: Diorama,
    private readonly levi: Levi,
  ) {}

  get m() {
    return this.world.m;
  }
  /** her body radius on the page */
  get r() {
    return 0.2 * this.m;
  }
  get busy() {
    return this.mode !== 'stand';
  }

  place(u: number, v: number, h = 0) {
    this.u = u;
    this.v = v;
    this.h = h;
    this.on = h > 0 ? this.world.supportAt(u, v, h + 1).box : null;
  }

  /** Walk (or run...) to a point on the level she is on; off a block first if the point is elsewhere. */
  goTo(u: number, v: number, gait: Mover['gait'] = 'walk', then?: () => void) {
    if (this.mode === 'carried' || this.mode === 'fall') return false;
    const goal = this.clampToPage(u, v);
    if (this.on) {
      const b = this.on;
      const inside = goal.u > b.u && goal.u < b.u + b.w && goal.v > b.v && goal.v < b.v + b.d;
      if (inside) {
        this.path = [goal];
      } else {
        // to the edge toward the goal, hop down, then on
        const eu = Math.max(b.u + this.r, Math.min(b.u + b.w - this.r, goal.u));
        const ev = Math.max(b.v + this.r, Math.min(b.v + b.d - this.r, goal.v));
        this.path = [{ u: eu, v: ev }];
        this.start(gait, () => this.hopDown(goal.u, goal.v, () => this.goTo(goal.u, goal.v, gait, then)));
        return true;
      }
    } else {
      const p = this.plan(goal);
      if (!p) return false;
      this.path = p;
    }
    this.start(gait, then);
    return true;
  }

  private start(gait: Mover['gait'], then?: () => void) {
    // whatever she was doing in place stops when she sets off
    if (this.levi.current) this.levi.stop();
    this.gait = gait;
    this.done = then ?? null;
    this.mode = 'path';
    this.levi.setBase(this.levi.clips[gait] ? gait : 'walk');
  }

  stop() {
    if (this.mode === 'path') {
      this.path = [];
      this.mode = 'stand';
      this.levi.setBase('idle');
      this.done = null;
    }
  }

  /** Turn to face a page point (when standing). */
  look(u: number, v: number) {
    this.faceAt = Math.atan2(u - this.u, v - this.v);
  }

  /** Climb onto a block: walk to its nearest side, face it, climb. */
  climb(b: Box, then?: () => void) {
    if (this.on === b) return false;
    // the clip carries her root_end[2] (metres, -z forward) onto it: start that far out, less a body radius in
    const fwd = -(this.levi.clips.climb_up?.root_end?.[2] ?? -0.45) * this.m;
    const out = Math.max(this.r * 0.6, fwd - this.r * 1.3);
    const cu = Math.max(b.u + this.r, Math.min(b.u + b.w - this.r, this.u));
    const cv = Math.max(b.v + this.r, Math.min(b.v + b.d - this.r, this.v));
    const sides: [number, number][] = [
      [cu, b.v + b.d + out],
      [cu, b.v - out],
      [b.u - out, cv],
      [b.u + b.w + out, cv],
    ];
    sides.sort((a, c) => Math.hypot(a[0] - this.u, a[1] - this.v) - Math.hypot(c[0] - this.u, c[1] - this.v));
    const [su, sv] = sides[0]!;
    const dir = Math.atan2(Math.max(b.u, Math.min(b.u + b.w, su)) - su, Math.max(b.v, Math.min(b.v + b.d, sv)) - sv);
    const into = { u: su + Math.sin(dir) * fwd, v: sv + Math.cos(dir) * fwd };
    return this.goTo(su, sv, 'walk', () => {
      this.heading = Math.atan2(into.u - su, into.v - sv);
      this.moveClip('climb_up', [into.u, into.v, b.h], () => {
        this.on = b;
        // up there, she turns round to the viewer
        this.look(this.u, this.v + 100);
        then?.();
      });
    });
  }

  /** Hop down from the block she is on toward a point. */
  hopDown(u: number, v: number, then?: () => void) {
    const b = this.on;
    if (!b) return then?.();
    this.heading = Math.atan2(u - this.u, v - this.v);
    const d = -(this.levi.clips.jump_down?.root_end?.[2] ?? -0.4) * this.m;
    const tu = this.u + Math.sin(this.heading) * d;
    const tv = this.v + Math.cos(this.heading) * d;
    this.moveClip('jump_down', [tu, tv, 0], () => {
      this.on = null;
      this.onLand?.(2 * this.m, null);
      then?.();
    });
  }

  /** Play a clip that takes her somewhere (the page point it ends at), or slide there if it is missing. */
  private moveClip(name: string, to: [number, number, number], then?: () => void) {
    this.path = [];
    this.levi.setBase('idle');
    this.mode = 'clip';
    if (!this.levi.clips[name]) {
      // no clip yet: a hop there
      const from: [number, number, number] = [this.u, this.v, this.h];
      const t0 = performance.now();
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / 450);
        this.u = from[0] + (to[0] - from[0]) * k;
        this.v = from[1] + (to[1] - from[1]) * k;
        this.h = from[2] + (to[2] - from[2]) * k + Math.sin(Math.PI * k) * 0.25 * this.m;
        if (k < 1) requestAnimationFrame(step);
        else {
          this.mode = 'stand';
          then?.();
        }
      };
      requestAnimationFrame(step);
      return;
    }
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

  /** Picked up by the cursor. */
  pickUp() {
    this.path = [];
    this.rootClip = null;
    this.mode = 'carried';
    this.levi.setBase('idle');
    this.on = null;
  }
  carryTo(u: number, v: number) {
    if (this.mode !== 'carried') return;
    const p = this.clampToPage(u, v);
    const sup = this.world.supportAt(p.u, p.v).h;
    // she dangles a little behind the cursor, held up off whatever is under it
    this.u += (p.u - this.u) * 0.35;
    this.v += (p.v - this.v) * 0.35;
    this.h += (sup + 0.5 * this.m - this.h) * 0.25;
  }
  drop() {
    if (this.mode !== 'carried') return;
    this.mode = 'fall';
    this.vh = 0;
  }

  update(dt: number, cubes: Cube[]) {
    const m = this.m;
    if (this.mode === 'path') {
      const target = this.path[0];
      if (!target) {
        this.mode = 'stand';
        this.levi.setBase('idle');
        const d = this.done;
        this.done = null;
        d?.();
      } else {
        const du = target.u - this.u;
        const dv = target.v - this.v;
        const dist = Math.hypot(du, dv);
        const want = Math.atan2(du, dv);
        this.turnToward(want, dt, 9);
        // speed from the loop's stride (metres per cycle), slower while still turning
        const info = this.levi.clips[this.levi.baseLoop];
        const fallback = { walk: 1.0, run: 2.8, tiptoe: 0.5, skip: 1.6 }[this.gait];
        const speed = (info?.stride && info.frames ? (info.stride * FPS) / info.frames : fallback) * m;
        const align = Math.max(0, Math.cos(angleDiff(want, this.heading)));
        const step = Math.min(dist, speed * dt * (0.25 + 0.75 * align));
        this.u += Math.sin(this.heading) * step;
        this.v += Math.cos(this.heading) * step;
        if (dist < Math.max(6, speed * dt * 1.5)) this.path.shift();
      }
    } else if (this.mode === 'clip' && this.rootClip) {
      // the clip carries her centre away from her spot; as it fades into the idle, move the spot under her so
      // the blend stays put (the clip's own end offset fades out exactly as the spot moves in)
      const cs = this.levi.clipState();
      if (cs && cs.name === this.rootClip.name) {
        const k = cs.t >= cs.frames - FADE ? Math.max(0, Math.min(1, 1 - cs.weight)) : 0;
        const [a, b] = [this.rootClip.from, this.rootClip.to];
        this.u = a[0] + (b[0] - a[0]) * k;
        this.v = a[1] + (b[1] - a[1]) * k;
        this.h = a[2] + (b[2] - a[2]) * k;
      }
    } else if (this.mode === 'fall') {
      this.vh -= 9.8 * m * dt;
      this.h += this.vh * dt;
      const sup = this.world.supportAt(this.u, this.v, this.h + 2);
      if (this.h <= sup.h) {
        const speed = -this.vh;
        this.h = sup.h;
        this.vh = 0;
        this.on = sup.box;
        this.mode = 'stand';
        if (sup.box) this.world.bump(sup.box, -speed * 0.15);
        this.onLand?.(speed, sup.box);
      }
    }
    if (this.mode === 'stand' && this.faceAt !== null) {
      if (Math.abs(angleDiff(this.faceAt, this.heading)) < 0.02) this.faceAt = null;
      else this.turnToward(this.faceAt, dt, 5);
    }
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
    const step = Math.sign(d) * Math.min(Math.abs(d), rate * dt);
    this.heading += step;
  }

  private clampToPage(u: number, v: number) {
    const r = this.r;
    return { u: Math.max(r, Math.min(this.world.W - r, u)), v: Math.max(r, Math.min(this.world.Hp - r, v)) };
  }

  // ------------------------------------------------------------------ paths (A* on a grid, ground level)
  private plan(goal: Step): Step[] | null {
    const cell = Math.max(14, Math.round(this.r * 0.7));
    const pad = 360;
    const u0 = Math.max(0, Math.min(this.u, goal.u) - pad);
    const v0 = Math.max(0, Math.min(this.v, goal.v) - pad);
    const u1 = Math.min(this.world.W, Math.max(this.u, goal.u) + pad);
    const v1 = Math.min(this.world.Hp, Math.max(this.v, goal.v) + pad);
    const nu = Math.max(1, Math.ceil((u1 - u0) / cell));
    const nv = Math.max(1, Math.ceil((v1 - v0) / cell));
    if (nu * nv > 40000) return [goal];
    const blocked = new Uint8Array(nu * nv);
    const step = 0.08 * this.m;
    const infl = this.r;
    for (const b of this.world.boxes(step)) {
      const a0 = Math.max(0, Math.floor((b.u - infl - u0) / cell));
      const a1 = Math.min(nu - 1, Math.floor((b.u + b.w + infl - u0) / cell));
      const b0 = Math.max(0, Math.floor((b.v - infl - v0) / cell));
      const b1 = Math.min(nv - 1, Math.floor((b.v + b.d + infl - v0) / cell));
      for (let j = b0; j <= b1; j++) for (let i = a0; i <= a1; i++) blocked[j * nu + i] = 1;
    }
    const idx = (u: number, v: number) => {
      const i = Math.max(0, Math.min(nu - 1, Math.floor((u - u0) / cell)));
      const j = Math.max(0, Math.min(nv - 1, Math.floor((v - v0) / cell)));
      return j * nu + i;
    };
    const s = idx(this.u, this.v);
    let g = idx(goal.u, goal.v);
    blocked[s] = 0;
    if (blocked[g]) {
      // the goal is inside a block: the nearest free cell
      let best = -1;
      let bd = Infinity;
      for (let k = 0; k < blocked.length; k++) {
        if (blocked[k]) continue;
        const d = Math.hypot((k % nu) - (g % nu), Math.floor(k / nu) - Math.floor(g / nu));
        if (d < bd) {
          bd = d;
          best = k;
        }
      }
      if (best < 0) return null;
      g = best;
      goal = { u: u0 + ((g % nu) + 0.5) * cell, v: v0 + (Math.floor(g / nu) + 0.5) * cell };
    }
    const gi = g % nu;
    const gj = Math.floor(g / nu);
    const cost = new Float32Array(nu * nv).fill(Infinity);
    const from = new Int32Array(nu * nv).fill(-1);
    const open: [number, number][] = [[0, s]];
    cost[s] = 0;
    const hfun = (k: number) => Math.hypot((k % nu) - gi, Math.floor(k / nu) - gj);
    let iter = 0;
    while (open.length && iter++ < 40000) {
      // a small binary heap would be faster; the grid is small
      let bi = 0;
      for (let k = 1; k < open.length; k++) if (open[k]![0] < open[bi]![0]) bi = k;
      const [, cur] = open.splice(bi, 1)[0]!;
      if (cur === g) break;
      const ci = cur % nu;
      const cj = Math.floor(cur / nu);
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue;
          const ni = ci + di;
          const nj = cj + dj;
          if (ni < 0 || nj < 0 || ni >= nu || nj >= nv) continue;
          const n = nj * nu + ni;
          if (blocked[n]) continue;
          if (di && dj && (blocked[cj * nu + ni] || blocked[nj * nu + ci])) continue;
          const c = cost[cur]! + (di && dj ? 1.4142 : 1);
          if (c < cost[n]!) {
            cost[n] = c;
            from[n] = cur;
            open.push([c + hfun(n), n]);
          }
        }
    }
    if (from[g] === -1 && g !== s) return null;
    const cells: Step[] = [];
    for (let k = g; k !== s && k !== -1; k = from[k]!) cells.push({ u: u0 + ((k % nu) + 0.5) * cell, v: v0 + (Math.floor(k / nu) + 0.5) * cell });
    cells.reverse();
    cells.push(goal);
    // shortcut: drop points she can see past
    const out: Step[] = [];
    let at: Step = { u: this.u, v: this.v };
    let i = 0;
    while (i < cells.length) {
      let j = cells.length - 1;
      while (j > i && !this.clear(at, cells[j]!, blocked, nu, nv, u0, v0, cell)) j--;
      out.push(cells[j]!);
      at = cells[j]!;
      i = j + 1;
    }
    return out;
  }

  private clear(a: Step, b: Step, blocked: Uint8Array, nu: number, nv: number, u0: number, v0: number, cell: number) {
    const n = Math.ceil(Math.hypot(b.u - a.u, b.v - a.v) / (cell * 0.5));
    for (let k = 1; k < n; k++) {
      const u = a.u + ((b.u - a.u) * k) / n;
      const v = a.v + ((b.v - a.v) * k) / n;
      const i = Math.floor((u - u0) / cell);
      const j = Math.floor((v - v0) / cell);
      if (i >= 0 && j >= 0 && i < nu && j < nv && blocked[j * nu + i]) return false;
    }
    return true;
  }
}

export function angleDiff(a: number, b: number) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}
