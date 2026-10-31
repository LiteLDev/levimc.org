// Runs the story (./script) in the 3D space: a dialogue box she speaks through (acting each line out), the things to
// do in the world (with a marker over the block that matters), real-time waits that keep running while the page is
// closed, and the endings. Everything the visitor does reaches it (note()) and moves the hidden state (./state);
// all of it is saved as it changes, so a reload carries on mid-sentence.
import { Color, Mesh, MeshBasicMaterial, MeshLambertMaterial, OctahedronGeometry, type Material } from 'three';
import type { Space } from '../space';
import type { Brain } from '../brain';
import type { Piece } from '../diorama';
import { pixelTexture, rng } from '../diorama';
import { addToGallery, apply, effectsOf, fresh, gallery, load, save, settle, type Dim, type EventData, type Saved, type StoryEvent } from './state';
import { ENDINGS, NODES, UI, type Action, type Choice, type Line, type Node, type Task, type Text } from './script';

const GOLD = new Color(0.55, 0.42, 0.08);
const BUG = new Color(0.45, 0.05, 0.55);
/** typing speed (characters a second) */
const CPS = 38;

export class Story {
  private s: Saved;
  private readonly zh: boolean;
  private readonly box: HTMLElement;
  private readonly hud: HTMLElement;
  private endEl: HTMLElement | null = null;
  /** the lines on screen now (a node's, or a choice's reply), and how far the current one has typed */
  private queue: Line[] = [];
  private typed = 0;
  private lineStart = 0;
  private replying = false;
  private marker: Mesh;
  private lostCube: { mesh: Mesh; c: import('../diorama').Cube } | null = null;
  private lastInput = performance.now();
  private lastIdle = 0;
  private lastCam = 0;
  private lastSave = 0;
  private lastTick = performance.now();
  private hiddenAt = 0;
  private started = false;
  private dirty = false;

  constructor(
    private readonly space: Space,
    private readonly brain: Brain,
  ) {
    this.zh = (document.documentElement.lang || navigator.language || '').toLowerCase().startsWith('zh');
    this.s = load();
    // time away since the last visit
    const away = Date.now() - this.s.lastSeen;
    if (this.s.interactions > 0) this.event('visible', { ms: away });
    apply(this.s.d, { visits: 0.1 });
    const h = new Date().getHours();
    if (h >= 22 || h < 6) apply(this.s.d, { night_visits: 0.15 });
    this.box = this.el('lc-dlg');
    this.hud = this.el('lc-quest');
    this.box.hidden = true;
    this.hud.hidden = true;
    this.box.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      this.advance();
    });
    this.marker = new Mesh(new OctahedronGeometry(0.22), new MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.9 }));
    this.marker.visible = false;
  }

  private el(id: string) {
    const e = document.createElement('div');
    e.id = id;
    e.className = 'lc-ui';
    document.body.appendChild(e);
    return e;
  }
  private t(x: Text) {
    return this.zh ? x.zh : x.en;
  }
  private get node(): Node | undefined {
    return NODES.get(this.s.node);
  }
  /** While she talks (or sleeps through a wait), she doesn't wander off on her own. */
  get busy() {
    return this.started && (this.s.phase === 'lines' || this.s.phase === 'choices' || this.queue.length > 0 || this.sleeping);
  }
  private get sleeping() {
    return this.s.node === 'c5' && this.s.phase === 'wait';
  }
  get chapterTitle() {
    for (let n: Node | undefined = this.node, i = 0; n && i < 40; i++) {
      if (n.chapter) return this.t(n.chapter);
      const idx = [...NODES.keys()].indexOf(n.id);
      n = [...NODES.values()][idx - 1];
    }
    return '';
  }
  get endingsSeen() {
    return gallery().length;
  }
  get endingsTotal() {
    return Object.keys(ENDINGS).length;
  }

  /** Begin (or pick up) the story, once she has landed. */
  start() {
    if (this.started) return;
    this.started = true;
    // what the world looked like where the story left it
    if (this.s.flags.night) this.space.world.setNight(+this.s.flags.night);
    this.restoreWorld();
    if (this.s.phase === 'done') return;
    if (this.s.interactions > 0) this.space.say(this.t(UI.resume), 3000);
    if (this.s.phase === 'lines') this.showLines(this.node?.lines ?? [], this.s.line);
    else if (this.s.phase === 'choices') this.showChoices();
    this.renderHud();
  }

  // ------------------------------------------------------------------ what the visitor does
  /** Something the visitor did: it moves her, and may be what a task waits for. */
  note(ev: StoryEvent, data: EventData = {}) {
    const now = performance.now();
    if (ev === 'camMove' || ev === 'camWheel' || ev === 'camLook' || ev === 'cam') {
      // the camera moves all the time: it counts once in a while
      if (now - this.lastCam < 2500 && !this.taskWants(ev)) return;
      this.lastCam = now;
    }
    if (ev === 'hidden') {
      this.hiddenAt = Date.now();
      return;
    }
    if (ev === 'visible' && this.hiddenAt) data = { ms: Date.now() - this.hiddenAt };
    this.lastInput = now;
    // a corrupted block she plays with is a block she fixes
    if (ev === 'play' && data.piece && this.isCorrupt(data.piece as Piece)) {
      this.cleanse(data.piece as Piece);
      ev = 'whack';
    }
    if (this.sleeping) this.sleepTalk(ev);
    this.event(ev, data);
    this.s.interactions++;
    if (this.started) this.progress(ev, data);
  }
  private event(ev: StoryEvent, data: EventData) {
    apply(this.s.d, effectsOf(ev, data));
    this.dirty = true;
  }
  private taskWants(ev: StoryEvent) {
    return this.s.phase === 'tasks' && !!this.node?.tasks?.some((t) => t.ev.includes(ev) && (this.s.tasks[t.id] ?? 0) < t.need);
  }
  private progress(ev: StoryEvent, data: EventData) {
    const n = this.node;
    if (this.s.phase !== 'tasks' || !n?.tasks) return;
    let hit = false;
    for (const task of n.tasks) {
      if (!task.ev.includes(ev) || (this.s.tasks[task.id] ?? 0) >= task.need) continue;
      if (task.kind && data.kind !== task.kind) continue;
      if (task.keystone && data.piece !== this.keystone(task.keystone)) continue;
      this.s.tasks[task.id] = (this.s.tasks[task.id] ?? 0) + 1;
      hit = true;
    }
    if (hit) this.renderHud();
  }

  /** Asleep: she murmurs at a pat, and wakes cross at anything rougher. */
  private sleepTalk(ev: StoryEvent) {
    if (ev === 'pat') {
      this.space.say(this.zh ? 'Zzz……嘿嘿……' : 'Zzz… hehe…', 1600);
      apply(this.s.d, { gentleness: 0.04, affection: 0.02 });
    } else if (ev === 'poke' || ev === 'pickup' || ev === 'cubeHit' || ev === 'kiss') {
      this.space.say(this.zh ? '唔……不许吵我……' : 'Mm… let me sleep…', 1600);
      apply(this.s.d, { harshness: 0.03, patience: -0.05, anger: 0.05 });
    }
  }

  // ------------------------------------------------------------------ the frame
  update(now: number) {
    const dt = now - this.lastTick;
    this.lastTick = now;
    if (!this.started) {
      // once she has landed and said hello
      if (this.space.introDone && this.space.mover?.mode === 'stand' && !this.startTimer) this.startTimer = window.setTimeout(() => this.start(), 2500);
      return;
    }
    this.s.playedMs += dt;
    // a minute's worth of settling
    if (this.s.playedMs % 60000 < dt) settle(this.s.d, 1);
    // nothing done for a while
    if (now - this.lastInput > 45000 && now - this.lastIdle > 45000) {
      this.lastIdle = now;
      this.event('idle', {});
    }
    // typing the current line
    const line = this.queue[0];
    if (line) {
      const txt = this.t(line);
      const k = Math.min(txt.length, Math.floor(((now - this.lineStart) / 1000) * CPS));
      if (k !== this.typed) {
        this.typed = k;
        const p = this.box.querySelector('.lc-dlg-text');
        if (p) p.textContent = txt.slice(0, k);
        this.box.classList.toggle('lc-typed', k >= txt.length);
      }
    }
    // tasks and the wait
    if (this.s.phase === 'tasks' || this.s.phase === 'wait') {
      const n = this.node!;
      const tasksDone = (n.tasks ?? []).every((t) => (this.s.tasks[t.id] ?? 0) >= t.need);
      if (tasksDone && this.s.phase === 'tasks' && n.wait) {
        this.s.phase = 'wait';
        this.dirty = true;
      }
      if (tasksDone && Date.now() >= this.s.waitUntil) this.go(this.nextOf(n));
      else this.tickHud();
      if (this.sleeping && this.space.levi && !this.space.levi.current && this.space.mover?.mode === 'stand') this.brain.perform('sit_rest', { はぅ: 0.4 }, false);
    }
    this.updateWorld(now);
    if (this.dirty && now - this.lastSave > 1500) this.persist();
  }
  private startTimer = 0;

  private persist() {
    this.s.lastSeen = Date.now();
    save(this.s);
    this.dirty = false;
    this.lastSave = performance.now();
  }

  // ------------------------------------------------------------------ nodes, lines, choices
  private nextOf(n: Node) {
    return typeof n.next === 'string' ? n.next : n.next(this.s.d as Record<Dim, number>, this.s);
  }
  private go(id: string) {
    if (id === 'END') {
      this.s.phase = 'done';
      this.box.hidden = true;
      this.renderHud();
      this.persist();
      this.showEnding();
      return;
    }
    const n = NODES.get(id);
    if (!n) return;
    this.s.node = id;
    this.s.line = 0;
    this.s.tasks = {};
    this.s.phase = 'lines';
    for (const a of n.enter ?? []) this.run(a);
    this.persist();
    this.renderHud();
    this.showLines(n.lines, 0);
  }

  private showLines(lines: Line[], from: number) {
    const d = this.s.d as Record<Dim, number>;
    this.queue = lines.slice(from).filter((l) => !l.if || l.if(d, this.s));
    if (!this.queue.length) return this.linesDone();
    this.showLine();
  }
  private showLine() {
    const l = this.queue[0]!;
    this.box.hidden = false;
    this.box.classList.toggle('lc-sys', !!l.sys);
    this.box.classList.remove('lc-typed');
    this.box.innerHTML = `<div class="lc-dlg-name">${l.sys ? '' : 'LeviChan'}</div><p class="lc-dlg-text"></p><div class="lc-dlg-next" title="${this.t(UI.skipHint)}">▼</div>`;
    this.typed = -1;
    this.lineStart = performance.now();
    if (l.act || l.mood) this.brain.perform(l.act ?? null, l.mood ?? {}, true);
    if (l.then) this.run(l.then);
  }
  /** A click on the box (or Enter): the rest of the line at once, or the next line. */
  advance() {
    const l = this.queue[0];
    if (!l) return;
    if (this.typed < this.t(l).length) {
      this.lineStart = -1e9;
      return;
    }
    this.note('line');
    this.queue.shift();
    if (!this.replying) this.s.line++;
    this.dirty = true;
    if (this.queue.length) return this.showLine();
    if (this.replying) {
      this.replying = false;
      return this.go(this.nextOf(this.node!));
    }
    this.linesDone();
  }
  private linesDone() {
    const n = this.node!;
    if (n.choices) {
      this.s.phase = 'choices';
      this.showChoices();
      return;
    }
    this.box.hidden = true;
    this.s.phase = 'tasks';
    this.s.waitUntil = n.wait ? Date.now() + n.wait.min * 60000 : 0;
    this.dirty = true;
    this.renderHud();
    if (!n.tasks?.length && !n.wait) this.go(this.nextOf(n));
  }
  private showChoices() {
    const n = this.node!;
    this.box.hidden = false;
    this.box.classList.remove('lc-sys');
    this.box.classList.add('lc-typed');
    const last = [...n.lines].reverse().find((l) => !l.sys);
    this.box.innerHTML = `<div class="lc-dlg-name">LeviChan</div><p class="lc-dlg-text">${last ? escapeHtml(this.t(last)) : ''}</p><div class="lc-choices"></div>`;
    const list = this.box.querySelector('.lc-choices')!;
    n.choices!.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `${i + 1}. ${this.t(c)}`;
      b.addEventListener('click', () => this.choose(c));
      list.appendChild(b);
    });
  }
  private choose(c: Choice) {
    apply(this.s.d, c.fx);
    if (c.flag) this.s.flags[c.flag[0]] = c.flag[1];
    this.note('choice');
    this.s.phase = 'lines';
    this.replying = true;
    this.queue = [...c.reply];
    this.persist();
    this.showLine();
  }
  /** Keys: Enter / Space-free advance, digits pick a choice. */
  key(e: KeyboardEvent) {
    if (!this.started || this.box.hidden) return false;
    if (e.key === 'Enter') {
      if (this.s.phase !== 'choices' || this.queue.length) this.advance();
      return true;
    }
    const k = +e.key;
    if (this.s.phase === 'choices' && !this.queue.length && k >= 1) {
      const c = this.node?.choices?.[k - 1];
      if (c) {
        this.choose(c);
        return true;
      }
    }
    return false;
  }

  // ------------------------------------------------------------------ the world
  private run(a: Action) {
    const flags = this.s.flags;
    if (a.do === 'night') {
      flags.night = a.k;
      this.space.world.setNight(a.k);
    } else if (a.do === 'corrupt') {
      if (!flags.corrupt) {
        const r = rng(this.s.startedAt % 1000);
        const keys = new Set(['title', 'bar', 'button', 'media', 'card', 'heading', 'text'].map((k) => this.keystone(k)));
        const pool = this.space.world.pieces.map((_, i) => i).filter((i) => !keys.has(this.space.world.pieces[i]!));
        const pick: number[] = [];
        while (pick.length < 3 && pool.length) pick.push(pool.splice(Math.floor(r() * pool.length), 1)[0]!);
        flags.corrupt = pick.join(',');
      }
    } else if (a.do === 'lostCube') {
      flags.lostCube = 1;
      this.spawnLostCube();
    } else if (a.do === 'awaken') {
      flags['awake_' + a.kind] = 1;
      apply(this.s.d, { [`shard_${a.kind}`]: 1 } as Partial<Record<Dim, number>>);
      const p = a.kind === 'self' ? null : this.keystone(a.kind);
      if (p) {
        p.tint.copy(GOLD);
        p.sides.emissive.copy(GOLD);
        this.space.world.play(p, 'glow');
      }
      if (a.kind === 'self' && this.lostCube) {
        this.lostCube.mesh.removeFromParent();
        this.space.world.cubes = this.space.world.cubes.filter((c) => c !== this.lostCube!.c);
        this.lostCube = null;
      }
    } else if (a.do === 'focus') {
      this.space.focus();
    } else if (a.do === 'ending') {
      this.s.ending = a.id;
      addToGallery(a.id);
      this.cinematic(a.id);
    }
    this.dirty = true;
  }

  /** What the story has done to the world, done again (after a reload, or on a new page). */
  private restoreWorld() {
    for (const k of ['title', 'bar', 'button', 'media', 'card', 'heading', 'text']) {
      const p = this.s.flags['awake_' + k] ? this.keystone(k) : null;
      if (p) {
        p.tint.copy(GOLD);
        p.sides.emissive.copy(GOLD);
      }
    }
    if (this.s.flags.lostCube && !this.s.flags.awake_self) this.spawnLostCube();
  }

  /** The block standing for a keystone on this page: the first of its kind (or some block, if there is none). */
  keystone(kind: string): Piece | null {
    const ps = this.space.world.pieces;
    if (!ps.length) return null;
    return ps.find((p) => p.kind === kind && p.w * (p.h1 - p.h0) > 0.05) ?? ps[(['title', 'bar', 'button', 'media', 'card', 'heading', 'text'].indexOf(kind) * 7) % ps.length] ?? null;
  }
  private corrupt(): Piece[] {
    const f = this.s.flags.corrupt;
    if (!f) return [];
    return String(f)
      .split(',')
      .filter((i) => !this.s.flags['clean_' + i])
      .map((i) => this.space.world.pieces[+i])
      .filter((p): p is Piece => !!p);
  }
  isCorrupt(p: Piece) {
    return this.corrupt().includes(p);
  }
  private cleanse(p: Piece) {
    const i = this.space.world.pieces.indexOf(p);
    this.s.flags['clean_' + i] = 1;
    p.sides.emissive.copy(p.tint);
    p.front.color.setScalar(1);
    this.space.world.play(p, 'glow');
  }

  private spawnLostCube() {
    if (this.lostCube) return;
    const w = this.space.world;
    const tex = pixelTexture('stone', 77);
    const mat = new MeshLambertMaterial({ map: tex, emissive: new Color(0.9, 0.75, 0.2), emissiveIntensity: 0.6 });
    const R = w.R + 4;
    const c = w.addCube([mat, mat, mat, mat, mat, mat] as Material[], 0.4, -R, -R * 0.6, 3);
    c.mesh.userData.special = true;
    this.lostCube = { mesh: c.mesh, c };
  }

  private updateWorld(now: number) {
    const w = this.space.world;
    if (this.marker.parent !== w.scene) w.scene.add(this.marker);
    // the marker over the block a task is about
    const task = this.s.phase === 'tasks' ? this.node?.tasks?.find((t) => t.keystone && (this.s.tasks[t.id] ?? 0) < t.need) : undefined;
    const target = task?.keystone ? this.keystone(task.keystone) : null;
    const lost = this.lostCube && this.s.phase === 'tasks' && this.node?.id === 'c6' ? this.lostCube.c : null;
    this.marker.visible = !!target || !!lost;
    if (target) this.marker.position.set(target.u + target.w / 2, target.h1 + 0.7 + Math.sin(now / 300) * 0.08, target.z - target.d / 2);
    else if (lost) this.marker.position.set(lost.u, lost.h + 1 + Math.sin(now / 300) * 0.08, lost.v);
    this.marker.rotation.y = now / 600;
    // bugs flicker
    for (const p of this.corrupt()) {
      const k = 0.5 + 0.5 * Math.sin(now / 90 + p.u * 3);
      p.sides.emissive.copy(BUG).multiplyScalar(0.6 + 0.6 * k);
      p.front.color.setRGB(1, 0.7 + 0.3 * k, 1);
    }
    // the lost cube: found when the camera comes near it, brought when it lies by her
    if (this.lostCube && this.s.phase === 'tasks' && this.node?.id === 'c6') {
      const c = this.lostCube.c;
      const cam = this.space.camera.position;
      if (!this.s.tasks.find && Math.hypot(cam.x - c.u, cam.z - c.v, cam.y - c.h) < 6) this.note('found');
      const mv = this.space.mover;
      if (this.s.tasks.find && mv && !c.held && Math.hypot(c.u - mv.u, c.v - mv.v) < 1.5 && Math.abs(c.h - mv.h) < 1) this.note('cubeNear');
    }
  }

  // ------------------------------------------------------------------ the HUD
  private renderHud() {
    const n = this.node;
    const tasks = this.s.phase === 'tasks' || this.s.phase === 'wait' ? (n?.tasks ?? []) : [];
    const wait = (this.s.phase === 'tasks' || this.s.phase === 'wait') && n?.wait && this.s.waitUntil > Date.now();
    if (this.s.phase === 'done' || (!tasks.length && !wait)) {
      this.hud.hidden = true;
      return;
    }
    this.hud.hidden = false;
    this.hud.innerHTML =
      `<h5>${escapeHtml(this.chapterTitle)}</h5><b>${this.t(UI.tasks)}</b><ul>` +
      tasks.map((t: Task) => `<li class="${(this.s.tasks[t.id] ?? 0) >= t.need ? 'lc-done' : ''}">${escapeHtml(this.t(t))}${t.need > 1 ? ` <span>${Math.min(t.need, this.s.tasks[t.id] ?? 0)}/${t.need}</span>` : ''}</li>`).join('') +
      `</ul>` +
      (wait ? `<div class="lc-wait"><span>${escapeHtml(this.t(n!.wait!))}</span> <b class="lc-clock"></b><small>${this.t(UI.waitHint)}</small></div>` : '');
    this.tickHud();
  }
  private tickHud() {
    const c = this.hud.querySelector('.lc-clock');
    if (!c) {
      if (this.s.waitUntil > Date.now() && this.hud.hidden === false && this.node?.wait) this.renderHud();
      return;
    }
    const ms = Math.max(0, this.s.waitUntil - Date.now());
    const txt = `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
    if (c.textContent !== txt) c.textContent = txt;
    if (ms <= 0) this.renderHud();
  }

  // ------------------------------------------------------------------ endings
  private cinematic(id: string) {
    const w = this.space.world;
    const mv = this.space.mover;
    if (id === 'broken') {
      w.setNight(0.4);
      for (const p of w.pieces) {
        p.tint.copy(BUG).multiplyScalar(0.5);
        w.play(p, 'wobble');
      }
    } else if (id === 'miner') {
      for (let i = 0; i < 10; i++) {
        const tex = pixelTexture(i % 2 ? 'dirt' : 'stone', 300 + i);
        const m = new MeshLambertMaterial({ map: tex });
        w.addCube([m, m, m, m, m, m], 0.32, (mv?.u ?? 0) + (Math.random() - 0.5) * 3, (mv?.v ?? 0) + (Math.random() - 0.5) * 3, 4 + i * 0.6);
      }
    } else if (id === 'idol') {
      const t = this.keystone('title');
      if (t) w.play(t, 'bounce');
    } else if (id === 'explorer' && mv) {
      mv.goTo({ u: -w.R - 3, v: -w.R * 0.6, block: null }, 'run');
    } else if (id === 'tidy') {
      for (const p of w.pieces) if (p.kind === 'button') w.play(p, 'spin');
    } else if (id === 'loop') {
      w.implode(performance.now());
      setTimeout(() => w.explode(performance.now()), 2600);
    }
  }

  private showEnding() {
    const id = this.s.ending;
    const e = id ? ENDINGS[id] : null;
    if (!e) return;
    this.endEl?.remove();
    const el = this.el('lc-end');
    this.endEl = el;
    const seen = gallery();
    el.innerHTML = `<div class="lc-end-card">
      <small>${this.t(UI.ending)} · ${e.kind}</small>
      <h3>${escapeHtml(this.t(e))}</h3>
      <p>${escapeHtml(this.t(e.desc))}</p>
      <div class="lc-end-gallery">${Object.keys(ENDINGS)
        .map((k) => `<i class="${seen.includes(k) ? 'lc-seen' : ''}" title="${seen.includes(k) ? escapeHtml(this.t(ENDINGS[k]!)) : '?'}"></i>`)
        .join('')}</div>
      <small>${this.t(UI.endings)} ${seen.length}/${Object.keys(ENDINGS).length}</small>
      <div class="lc-end-actions"><button type="button" data-free>${this.t(UI.freeplay)}</button><button type="button" data-again>${this.t(UI.again)}</button></div>
    </div>`;
    el.querySelector('[data-free]')!.addEventListener('click', () => {
      el.remove();
      // the page put back together: the space closes on its own
      if (id === 'true' || id === 'normal') setTimeout(() => this.space.exit(), 600);
    });
    el.querySelector('[data-again]')!.addEventListener('click', () => {
      el.remove();
      this.reset(false);
    });
  }

  /** Start the story over (the endings seen stay). */
  reset(confirmFirst = true) {
    if (confirmFirst && !confirm(this.t(UI.confirmReset))) return;
    const w = this.space.world;
    for (const p of w.pieces) {
      p.tint.setScalar(0);
      p.sides.emissive.setScalar(0);
      p.front.color.setScalar(1);
    }
    w.setNight(0);
    if (this.lostCube) {
      this.lostCube.mesh.removeFromParent();
      w.cubes = w.cubes.filter((c) => c !== this.lostCube!.c);
      this.lostCube = null;
    }
    this.s = fresh();
    this.queue = [];
    this.replying = false;
    this.persist();
    this.go('p0');
  }

  dispose() {
    this.persist();
    clearTimeout(this.startTimer);
    this.box.remove();
    this.hud.remove();
    this.endEl?.remove();
    this.marker.removeFromParent();
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
