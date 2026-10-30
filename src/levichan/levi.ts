// LeviChan's 3D runtime: the PMX model on babylon-mmd (WASM runtime with Bullet physics), cel shading as in
// the LeviChan repo's render.py, a clip player that crossfades over a looping idle, gaze, blinks and
// expressions, and a bone-capsule hit test. Loaded on demand (dynamic import from ./space).
import { RegisterMmdOutlineRenderer } from 'babylon-mmd/esm/Loader/mmdOutlineRenderer.pure';
import { RegisterPmxLoader } from 'babylon-mmd/esm/Loader/pmxLoader.pure';
import { RegisterMmdCompositeRuntimeModelAnimation } from 'babylon-mmd/esm/Runtime/Animation/mmdCompositeRuntimeModelAnimation.pure';
import { RegisterMmdRuntimeModelAnimation } from 'babylon-mmd/esm/Runtime/Animation/mmdRuntimeModelAnimation.pure';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Ray, RegisterRay } from '@babylonjs/core/Culling/ray.pure';
import { RawTexture } from '@babylonjs/core/Materials/Textures/rawTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { LoadAssetContainerAsync } from '@babylonjs/core/Loading/sceneLoader';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MmdStandardMaterialBuilder } from 'babylon-mmd/esm/Loader/mmdStandardMaterialBuilder';
import type { MmdStandardMaterial } from 'babylon-mmd/esm/Loader/mmdStandardMaterial';
import { VmdLoader } from 'babylon-mmd/esm/Loader/vmdLoader';
import type { MmdAnimation } from 'babylon-mmd/esm/Loader/Animation/mmdAnimation';
import { MmdAnimationSpan, MmdCompositeAnimation } from 'babylon-mmd/esm/Runtime/Animation/mmdCompositeAnimation';
import { GetMmdWasmInstance } from 'babylon-mmd/esm/Runtime/Optimized/mmdWasmInstance';
import { MmdWasmInstanceTypeSPR } from 'babylon-mmd/esm/Runtime/Optimized/InstanceType/singlePhysicsRelease';
import { MmdWasmRuntime } from 'babylon-mmd/esm/Runtime/Optimized/mmdWasmRuntime';
import { MmdWasmPhysics } from 'babylon-mmd/esm/Runtime/Optimized/Physics/mmdWasmPhysics';
import type { MmdWasmModel } from 'babylon-mmd/esm/Runtime/Optimized/mmdWasmModel';
import type { IMmdRuntimeLinkedBone } from 'babylon-mmd/esm/Runtime/IMmdRuntimeLinkedBone';

// the typings of the runtime animations (module augmentations of MmdAnimation / MmdCompositeAnimation)
import type {} from 'babylon-mmd/esm/Runtime/Animation/mmdRuntimeModelAnimation';
import type {} from 'babylon-mmd/esm/Runtime/Animation/mmdCompositeRuntimeModelAnimation';

// bundlers drop babylon-mmd's side-effect-only registrations: register explicitly
RegisterMmdOutlineRenderer();
RegisterRay();
RegisterPmxLoader();
RegisterMmdRuntimeModelAnimation();
RegisterMmdCompositeRuntimeModelAnimation();

/** clips.json, written by the LeviChan repo's web clip export. */
export interface ClipInfo {
  frames: number;
  loop?: boolean;
  /** whether the runtime may turn her head and eyes toward the cursor during the clip */
  look?: boolean;
  /** expression keys [frame, PMX morph name, weight], linear between keys of one morph */
  face?: [number, string, number][];
}
export interface Manifest {
  fps: number;
  clips: Record<string, ClipInfo>;
}

export type HitRegion = 'head' | 'face' | 'body' | 'skirt' | 'arm' | 'leg';

const FPS = 30;
/** MMD units per metre (export_pmx.MMD_SCALE) */
export const MMD_SCALE = 12.5;
/** levi/toon.py RAMP_THRESHOLD / RAMP_BY_KEY: the N.L where each palette key turns to its shade tone */
const RAMP_THRESHOLD = 0.3;
const RAMP_BY_KEY: Record<string, number> = { dress: 0.48, dress_mint: 0.48, sleeve: 0.48, sleeve_dark: 0.48, hair: 0.42, green: 0.5, leaf: 0.5, shoe: 0.1 };
/** render.py's key light, relative to the camera: from the viewer's upper left */
const SUN_AZ = (20 * Math.PI) / 180;
const SUN_EL = (12 * Math.PI) / 180;
/** render.py's inverted hull: 1.25 sheet px (1/643 m each), in MMD units */
const OUTLINE_WORLD = (1.25 / 643) * MMD_SCALE;
/** crossfade between clips and the idle (frames) */
const FADE = 9;

const GAZE_YAW = (55 * Math.PI) / 180;
const GAZE_PITCH_UP = (25 * Math.PI) / 180;
const GAZE_PITCH_DOWN = (30 * Math.PI) / 180;
const NECK_SHARE = 0.4;

async function fetchBytes(url: string, onBytes?: (n: number) => void): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${url}: HTTP ${res.status}`);
  let stream: ReadableStream<Uint8Array> = res.body;
  // count the bytes as they arrive (compressed size), then inflate .gz assets (GitHub Pages serves them as is)
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    onBytes?.(value.length);
  }
  let blob = new Blob(chunks as BlobPart[]);
  // a server that sends Content-Encoding: gzip (Vite's dev server) has inflated it already: look for gzip's magic
  const magic = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  if (url.endsWith('.gz') && magic[0] === 0x1f && magic[1] === 0x8b) {
    stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
    blob = await new Response(stream).blob();
  }
  return new Uint8Array(await blob.arrayBuffer());
}

function fileOf(bytes: Uint8Array, relPath: string, type = 'application/octet-stream'): File {
  const f = new File([bytes as BlobPart], relPath.split('/').pop()!, { type });
  Object.defineProperty(f, 'webkitRelativePath', { value: relPath });
  return f;
}

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

interface Playing {
  name: string;
  span: MmdAnimationSpan;
  start: number;
  frames: number;
  info: ClipInfo;
  resolve: () => void;
  stopAt: number | null;
}

interface BoneRef {
  linked: IMmdRuntimeLinkedBone;
  index: number;
}

export interface LeviOptions {
  base: string;
  canvas: HTMLCanvasElement;
  /** download progress: bytes received so far, expected total */
  onProgress?: (received: number, total: number) => void;
}

export class Levi {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly camera: FreeCamera;
  private readonly sun: DirectionalLight;
  private runtime!: MmdWasmRuntime;
  private model!: MmdWasmModel;
  private mesh!: Mesh;
  private manifest!: Manifest;
  private readonly anims = new Map<string, Promise<MmdAnimation>>();
  private comp = new MmdCompositeAnimation('levichan');
  private idleSpans: MmdAnimationSpan[] = [];
  private idleFrames = 120;
  private playing: Playing | null = null;
  private bones = new Map<string, BoneRef>();
  private outlineMats: MmdStandardMaterial[] = [];
  private readonly base: string;

  // gaze: the target (world), how much she looks (0..1), the head's current yaw / pitch
  gazeTarget: Vector3 | null = null;
  gazeWeight = 0;
  private gazeW = 0;
  private yaw = 0;
  private pitch = 0;
  private yawV = 0;
  private pitchV = 0;
  private nextBlink = 2;
  private blinkT = -1;
  /** extra expression set by the brain (morph -> weight), eased */
  mood: Record<string, number> = {};
  /** her face between clips (the brain's small expressions); a clip's own face keys replace it */
  idleMood: Record<string, number> = {};
  private moodNow: Record<string, number> = {};
  private lastTime = performance.now();

  private constructor(opts: LeviOptions) {
    this.base = opts.base;
    this.engine = new Engine(opts.canvas, true, { premultipliedAlpha: true, preserveDrawingBuffer: false, stencil: true, antialias: true, alpha: true }, true);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0, 0, 0, 0);
    this.scene.ambientColor = new Color3(0, 0, 0);
    this.camera = new FreeCamera('levichan-cam', new Vector3(0, 10, -40), this.scene);
    this.camera.rotationQuaternion = Quaternion.Identity();
    this.camera.minZ = 0.5;
    this.camera.maxZ = 2000;
    this.camera.fovMode = Camera.FOVMODE_VERTICAL_FIXED;
    // one white sun of strength 1, no fill (render.py): N.L in 0..1 picks base or shade
    this.sun = new DirectionalLight('levichan-sun', new Vector3(0, -1, 1), this.scene);
    this.sun.intensity = 1;
    this.sun.diffuse = new Color3(1, 1, 1);
    this.sun.specular = new Color3(0, 0, 0);
  }

  static async load(opts: LeviOptions): Promise<Levi> {
    const levi = new Levi(opts);
    await levi.init(opts);
    return levi;
  }

  private async init(opts: LeviOptions) {
    const base = this.base;
    const manifestRes = await fetch(`${base}clips.json`);
    this.manifest = (await manifestRes.json()) as Manifest & { model: { pmx: string; size: number; textures: string[] } };
    const m = this.manifest as Manifest & { model: { pmx: string; size: number; textures: string[] } };
    let received = 0;
    const total = m.model.size;
    const progress = (n: number) => {
      received += n;
      opts.onProgress?.(received, total);
    };
    const wasmP = GetMmdWasmInstance(new MmdWasmInstanceTypeSPR());
    const [pmx, wasm, ...texs] = await Promise.all([
      fetchBytes(base + m.model.pmx, progress),
      wasmP,
      ...m.model.textures.map((t) => fetchBytes(base + 'model/' + t, progress)),
    ]);
    this.runtime = new MmdWasmRuntime(wasm, this.scene, new MmdWasmPhysics(this.scene));
    this.runtime.register(this.scene);
    const refs = m.model.textures.map((t, i) => fileOf(texs[i]!, t, 'image/png'));
    const builder = new MmdStandardMaterialBuilder();
    const res = await LoadAssetContainerAsync(fileOf(pmx, 'Levi.pmx'), this.scene, {
      rootUrl: '',
      pluginExtension: '.pmx',
      pluginOptions: { mmdmodel: { materialBuilder: builder, referenceFiles: refs, loggingEnabled: false } },
    });
    res.addAllToScene();
    this.mesh = res.meshes[0] as Mesh;
    const subMeshes = (this.mesh.metadata as { meshes: Mesh[] }).meshes;
    for (const sm of subMeshes) {
      sm.alwaysSelectAsActiveMesh = true; // skinned bounds are the rest pose's: never cull her
      const mat = sm.material as MmdStandardMaterial | null;
      if (mat && 'renderOutline' in mat) {
        mat.specularColor = new Color3(0, 0, 0);
        await this.celToon(mat);
        const dt = mat.diffuseTexture as Texture | null;
        // 1-D gradient ramps (U = toon_grad, 0 at the roots): clamp, or U = 0 wraps into a 50% mix of both ends
        if (dt && /grad_/.test(dt.name || dt.url || '')) {
          dt.wrapU = dt.wrapV = Texture.CLAMP_ADDRESSMODE;
          dt.updateSamplingMode(Texture.BILINEAR_SAMPLINGMODE);
        }
        if (mat.renderOutline) this.outlineMats.push(mat);
      }
    }
    this.model = this.runtime.createMmdModel(this.mesh);
    const bones = this.model.runtimeBones;
    for (let i = 0; i < bones.length; i++) this.bones.set(bones[i]!.name, { linked: bones[i]!.linkedBone, index: i });

    // the clip player: one composite animation whose spans are the idle loop and the current clip
    const idleInfo = this.manifest.clips.idle;
    if (idleInfo) this.idleFrames = idleInfo.frames;
    const idle = await this.anim('idle');
    this.ensureIdle(idle, 0);
    const handle = this.model.createRuntimeAnimation(this.comp);
    this.model.setRuntimeAnimation(handle);
    this.runtime.setManualAnimationDuration(1e9);
    await this.runtime.playAnimation();

    // gaze, blinks and expressions go in after the animation and before the bones reach the WASM solver:
    // MmdWasmModel copies the JS bones to WASM right after morph.update()
    const morph = this.model.morph;
    const update = morph.update.bind(morph);
    morph.update = () => {
      this.afterAnimate();
      update();
    };
    this.scene.onBeforeRenderObservable.add(() => this.beforeRender());
  }

  /** The exported toon ramps are for MMD's v = 0.5 - 0.5 N.L; babylon-mmd reads v = N.L. Rebuild each one so
   * the shade starts at render.py's threshold for the material's palette key. */
  private readonly toonCache = new Map<string, RawTexture>();
  private async celToon(mat: MmdStandardMaterial) {
    const tex = mat.toonTexture as Texture | null;
    if (!tex) return;
    await new Promise<void>((r) => (tex.isReady() ? r() : tex.onLoadObservable.addOnce(() => r())));
    const key = tex.name || tex.url || '';
    let rt = this.toonCache.get(key);
    if (!rt) {
      const { width, height } = tex.getSize();
      const px = (await tex.readPixels()) as ArrayBufferView | null;
      let lit = 0;
      let ratio = [1, 1, 1];
      if (px) {
        const arr = px as unknown as ArrayLike<number>;
        const k = px instanceof Float32Array ? 1 : 255;
        for (let y = 0; y < height; y++) {
          const i = y * width * 4;
          const c = [arr[i]! / k, arr[i + 1]! / k, arr[i + 2]! / k];
          if (c[0]! > 0.999 && c[1]! > 0.999 && c[2]! > 0.999) lit++;
          else ratio = c;
        }
      }
      const m = /toon_(\w+)\.png/.exec(key);
      const T = m ? (RAMP_BY_KEY[m[1]!] ?? RAMP_THRESHOLD) : 1 - (2 * lit) / Math.max(1, height);
      const N = 1024;
      const data = new Uint8Array(N * 4);
      for (let v = 0; v < N; v++) {
        const c = (v + 0.5) / N >= T ? [1, 1, 1] : ratio;
        data.set([Math.round(c[0]! * 255), Math.round(c[1]! * 255), Math.round(c[2]! * 255), 255], v * 4);
      }
      rt = RawTexture.CreateRGBATexture(data, 1, N, this.scene, false, false, Texture.NEAREST_SAMPLINGMODE);
      rt.wrapU = rt.wrapV = Texture.CLAMP_ADDRESSMODE;
      this.toonCache.set(key, rt);
    }
    mat.toonTexture = rt;
  }

  get clips(): Record<string, ClipInfo> {
    return this.manifest.clips;
  }

  /** Load a clip's VMD once (on demand). */
  anim(name: string): Promise<MmdAnimation> {
    let p = this.anims.get(name);
    if (!p) {
      p = new VmdLoader(this.scene).loadAsync(name, `${this.base}motions/${name}.vmd`);
      p.catch(() => this.anims.delete(name));
      this.anims.set(name, p);
    }
    return p;
  }
  preload(names: string[]) {
    for (const n of names) if (this.manifest.clips[n]) void this.anim(n).catch(() => {});
  }

  private get now() {
    return this.runtime.currentFrameTime;
  }

  /** Keep idle spans back to back from `from` to well past now. */
  private ensureIdle(idle: MmdAnimation, from: number) {
    const L = this.idleFrames;
    let end = this.idleSpans.length ? this.idleSpans[this.idleSpans.length - 1]!.offset + L : from;
    while (end < (this.runtime ? this.now : 0) + 2 * L) {
      const s = new MmdAnimationSpan(idle, 0, L, end, 1);
      this.comp.addSpan(s);
      this.idleSpans.push(s);
      end += L;
    }
    // drop idle spans that are over
    while (this.idleSpans.length > 1 && this.idleSpans[0]!.offset + L < (this.runtime ? this.now : 0) - 1) {
      this.comp.removeSpan(this.idleSpans.shift()!);
    }
  }

  get current(): string | null {
    return this.playing?.name ?? null;
  }
  get currentInfo(): ClipInfo | null {
    return this.playing?.info ?? null;
  }

  /** Play a clip once over the idle; resolves when it has faded back out. A new clip cuts the current one
   * (crossfading from wherever it is). */
  async play(name: string): Promise<void> {
    const info = this.manifest.clips[name];
    if (!info) return;
    const anim = await this.anim(name);
    if (this.playing) this.stop();
    const start = this.now;
    const span = new MmdAnimationSpan(anim, 0, info.frames, start, 0);
    this.comp.addSpan(span);
    return new Promise<void>((resolve) => {
      this.playing = { name, span, start, frames: info.frames, info, resolve, stopAt: null };
    });
  }

  /** Fade the current clip out now. */
  stop() {
    const p = this.playing;
    if (!p) return;
    const t = this.now - p.start;
    // a clip ending anyway keeps its own fade; else fade out from here
    if (p.stopAt === null && t < p.frames - FADE) p.stopAt = t;
    this.finish(p, true);
  }

  private finish(p: Playing, early: boolean) {
    if (this.playing !== p) return;
    this.playing = null;
    if (early) {
      // keep the span alive for its fade-out, with frozen time
      const t0 = this.now;
      const w0 = p.span.weight;
      const fade = () => {
        const k = 1 - (this.now - t0) / FADE;
        if (k <= 0 || this.playing?.span === p.span) {
          this.comp.removeSpan(p.span);
          this.scene.onBeforeRenderObservable.removeCallback(fade);
          return;
        }
        p.span.weight = w0 * smooth(k);
        this.setIdleWeight(1 - this.weightOfPlaying() - p.span.weight);
      };
      this.scene.onBeforeRenderObservable.add(fade);
    } else {
      this.comp.removeSpan(p.span);
    }
    p.resolve();
  }

  private weightOfPlaying() {
    return this.playing ? this.playing.span.weight : 0;
  }
  private setIdleWeight(w: number) {
    const v = Math.max(1e-4, w);
    for (const s of this.idleSpans) s.weight = v;
  }

  private beforeRender() {
    const nowMs = performance.now();
    const dt = Math.min(0.1, (nowMs - this.lastTime) / 1000);
    this.lastTime = nowMs;
    const p = this.playing;
    if (p) {
      const t = this.now - p.start;
      const a = smooth(Math.min(t / FADE, (p.frames - t) / FADE));
      p.span.weight = Math.max(1e-4, a);
      this.setIdleWeight(1 - a);
      if (t >= p.frames) this.finish(p, false);
    } else if (!this.comp.spans.some((s) => !this.idleSpans.includes(s))) {
      this.setIdleWeight(1);
    }
    const idle = this.anims.get('idle');
    if (idle) void idle.then((a) => this.ensureIdle(a, this.now));
    this.updateFace(dt);
    this.updateOutline();
  }

  // ------------------------------------------------------------------ face: blinks and expressions
  private updateFace(dt: number) {
    const morph = this.model.morph;
    const want: Record<string, number> = {};
    const p = this.playing;
    if (p?.info.face) {
      const t = this.now - p.start;
      const a = smooth(Math.min(t / FADE, (p.frames - t) / FADE));
      const byMorph = new Map<string, [number, number][]>();
      for (const [f, name, w] of p.info.face) {
        if (!byMorph.has(name)) byMorph.set(name, []);
        byMorph.get(name)!.push([f, w]);
      }
      for (const [name, keys] of byMorph) {
        keys.sort((x, y) => x[0] - y[0]);
        let w = 0;
        if (t <= keys[0]![0]) w = keys[0]![1];
        else if (t >= keys[keys.length - 1]![0]) w = keys[keys.length - 1]![1];
        else
          for (let i = 0; i + 1 < keys.length; i++) {
            const [f0, w0] = keys[i]!;
            const [f1, w1] = keys[i + 1]!;
            if (t >= f0 && t <= f1) w = w0 + ((w1 - w0) * (t - f0)) / Math.max(1e-6, f1 - f0);
          }
        want[name] = w * a;
      }
    }
    for (const [k, v] of Object.entries(this.mood)) want[k] = Math.max(want[k] ?? 0, v);
    if (!p?.info.face?.length) for (const [k, v] of Object.entries(this.idleMood)) want[k] = Math.max(want[k] ?? 0, v);
    // ease every expression we ever touched toward its target
    for (const k of new Set([...Object.keys(want), ...Object.keys(this.moodNow)])) {
      const cur = this.moodNow[k] ?? 0;
      const tgt = want[k] ?? 0;
      const next = cur + (tgt - cur) * Math.min(1, dt * 10);
      this.moodNow[k] = Math.abs(next) < 1e-3 && tgt === 0 ? 0 : next;
      morph.setMorphWeight(k, this.moodNow[k]!);
      if (this.moodNow[k] === 0 && tgt === 0) delete this.moodNow[k];
    }
    // blinks every 2-6 s (a double blink now and then), not while the eyes are closed or smiling shut
    const closed = (this.moodNow['まばたき'] ?? 0) + (this.moodNow['笑い'] ?? 0) + (this.moodNow['ウィンク'] ?? 0) + (this.moodNow['ウィンク右'] ?? 0);
    this.nextBlink -= dt;
    if (this.blinkT < 0 && this.nextBlink <= 0) {
      this.blinkT = 0;
      this.nextBlink = Math.random() < 0.15 ? 0.35 : 2 + Math.random() * 4;
    }
    let blink = 0;
    if (this.blinkT >= 0) {
      this.blinkT += dt;
      const T = 0.16;
      blink = this.blinkT < T / 2 ? this.blinkT / (T / 2) : 1 - (this.blinkT - T / 2) / (T / 2);
      if (this.blinkT >= T) this.blinkT = -1;
    }
    if (closed < 0.5) morph.setMorphWeight('まばたき', Math.max(this.moodNow['まばたき'] ?? 0, Math.max(0, blink)));
  }

  // ------------------------------------------------------------------ gaze
  private boneWorld(name: string, out: Matrix): Matrix | null {
    const b = this.bones.get(name);
    if (!b) return null;
    const rb = this.model.runtimeBones[b.index]!;
    Matrix.FromArrayToRef(rb.worldMatrix, 0, this.tmpB);
    // (multiplyToRef must not write into its own operand)
    return this.tmpB.multiplyToRef(this.mesh.getWorldMatrix(), out);
  }
  /** World position of a bone (after the last frame's solve). */
  bonePos(name: string): Vector3 | null {
    const m = this.boneWorld(name, Matrix.Identity());
    return m ? m.getTranslation() : null;
  }

  private readonly tmpM = Matrix.Identity();
  private readonly tmpB = Matrix.Identity();
  private afterAnimate() {
    const dt = 1 / 60;
    const info = this.playing?.info;
    const allowed = !this.playing || info?.look !== false;
    const wantW = this.gazeTarget && allowed ? this.gazeWeight : 0;
    this.gazeW += (wantW - this.gazeW) * Math.min(1, dt * 4);
    let ty = 0;
    let tp = 0;
    const torso = this.boneWorld('上半身2', this.tmpM);
    const head = this.bonePos('頭');
    if (this.gazeTarget && torso && head) {
      // the target in the upper torso's frame (PMX bone frames are the model's axes at rest; she faces -Z)
      const inv = torso.getRotationMatrix().invert();
      const d = Vector3.TransformNormal(this.gazeTarget.subtract(head), inv).normalize();
      ty = Math.atan2(-d.x, -d.z);
      tp = Math.atan2(d.y, Math.hypot(d.x, d.z));
      ty = Math.max(-GAZE_YAW, Math.min(GAZE_YAW, ty));
      tp = Math.max(-GAZE_PITCH_DOWN, Math.min(GAZE_PITCH_UP, tp));
    }
    // a critically damped spring toward the target, so the head turns like a head, not a servo
    const k = 60;
    const c = 2 * Math.sqrt(k);
    this.yawV += (k * (ty * this.gazeW - this.yaw) - c * this.yawV) * dt;
    this.pitchV += (k * (tp * this.gazeW - this.pitch) - c * this.pitchV) * dt;
    this.yaw += this.yawV * dt;
    this.pitch += this.pitchV * dt;
    if (!Number.isFinite(this.yaw + this.pitch + this.yawV + this.pitchV)) this.yaw = this.pitch = this.yawV = this.pitchV = 0;
    // yaw about +Y, then pitch: up is -X turn for a figure facing -Z in a left-handed frame
    const q = Quaternion.RotationYawPitchRoll(this.yaw, -this.pitch, 0);
    this.turnBone('首', Quaternion.Slerp(Quaternion.Identity(), q, NECK_SHARE));
    this.turnBone('頭', Quaternion.Slerp(Quaternion.Identity(), q, 1 - NECK_SHARE));
    this.turnBone('両目', Quaternion.RotationYawPitchRoll(this.yaw * 0.2, -this.pitch * 0.2, 0));
  }

  /** What the animation left on each gaze bone, and what we wrote over it: a clip that does not key a bone leaves
   * our last value there, which must not be turned again (it would spin a little further every frame). */
  private readonly gazeBase = new Map<string, { base: Quaternion; wrote: Quaternion }>();
  private turnBone(name: string, q: Quaternion) {
    const b = this.bones.get(name);
    if (!b) return;
    const cur = b.linked.rotationQuaternion;
    let rec = this.gazeBase.get(name);
    if (!rec) {
      rec = { base: cur.clone(), wrote: cur.clone() };
      this.gazeBase.set(name, rec);
    } else if (!cur.equalsWithEpsilon(rec.wrote, 1e-6)) {
      rec.base.copyFrom(cur); // the animation wrote a fresh value this frame
    }
    const out = q.multiply(rec.base);
    rec.wrote.copyFrom(out);
    b.linked.rotationQuaternion = out;
  }

  // ------------------------------------------------------------------ camera, light, outline
  /** Put the camera at `pos` looking along `forward` with `up` (world), vertical field of view `fov`. */
  setCamera(world: Matrix, fov: number) {
    const pos = world.getTranslation();
    this.camera.position.copyFrom(pos);
    Quaternion.FromRotationMatrixToRef(world.getRotationMatrix(), this.camera.rotationQuaternion!);
    this.camera.fov = fov;
    // the key light follows the camera (render.py place_sun)
    const right = Vector3.TransformNormal(Vector3.Right(), world).normalize();
    const up = Vector3.TransformNormal(Vector3.Up(), world).normalize();
    const back = Vector3.TransformNormal(Vector3.Forward(), world).normalize().negate();
    const toLight = right
      .scale(-Math.sin(SUN_AZ) * Math.cos(SUN_EL))
      .add(up.scale(Math.sin(SUN_EL)))
      .add(back.scale(Math.cos(SUN_AZ) * Math.cos(SUN_EL)))
      .normalize();
    this.sun.direction = toLight.negate();
  }

  /** babylon-mmd's MMD edge is in screen pixels (2 x outlineWidth); render.py's hull is a world width. */
  private updateOutline() {
    const head = this.bonePos('首');
    if (!head) return;
    const dist = Vector3.Distance(head, this.camera.position);
    const pxPerUnit = this.engine.getRenderHeight() / (2 * dist * Math.tan(this.camera.fov / 2));
    const w = (OUTLINE_WORLD * pxPerUnit) / 2;
    for (const m of this.outlineMats) m.outlineWidth = w;
  }

  // ------------------------------------------------------------------ hit test
  /** Which part of her a ray hits (bone capsules), with the distance along the ray. */
  hit(ray: Ray): { region: HitRegion; t: number; point: Vector3 } | null {
    const P = (n: string) => this.bonePos(n);
    const caps: [HitRegion, Vector3 | null, Vector3 | null, number][] = [];
    const head = P('頭');
    const neck = P('首');
    if (head && neck) {
      const up = head.subtract(neck).normalize();
      const centre = head.add(up.scale(0.9));
      caps.push(['head', centre.add(up.scale(0.5)), centre.add(up.scale(0.5)), 1.35]);
      caps.push(['face', head.add(up.scale(0.25)), head.add(up.scale(0.25)), 1.05]);
    }
    caps.push(['body', P('上半身'), P('首'), 1.25]);
    caps.push(['skirt', P('下半身'), this.mid(P('左ひざ'), P('右ひざ')), 2.6]);
    for (const s of ['左', '右']) {
      caps.push(['arm', P(s + '腕'), P(s + 'ひじ'), 0.7]);
      caps.push(['arm', P(s + 'ひじ'), P(s + '手首'), 0.6]);
      caps.push(['leg', P(s + 'ひざ'), P(s + '足首'), 0.55]);
    }
    let best: { region: HitRegion; t: number; point: Vector3 } | null = null;
    for (const [region, a, b, r] of caps) {
      if (!a || !b) continue;
      const t = rayCapsule(ray, a, b, r);
      if (t !== null && (!best || t < best.t - (region === 'face' ? 0.6 : 0))) best = { region, t, point: ray.origin.add(ray.direction.scale(t)) };
    }
    return best;
  }
  private mid(a: Vector3 | null, b: Vector3 | null) {
    return a && b ? a.add(b).scale(0.5) : null;
  }

  /** Screen position (CSS px) of a world point. */
  project(p: Vector3): { x: number; y: number } {
    const w = this.engine.getRenderWidth();
    const h = this.engine.getRenderHeight();
    const v = Vector3.Project(p, Matrix.IdentityReadOnly, this.scene.getTransformMatrix(), this.camera.viewport.toGlobal(w, h));
    const s = this.engine.getHardwareScalingLevel();
    return { x: v.x * s, y: v.y * s };
  }

  dispose() {
    this.runtime.unregister(this.scene);
    this.runtime.dispose(this.scene);
    this.scene.dispose();
    this.engine.dispose();
  }
}

/** Distance along the ray to a capsule (segment a-b, radius r), or null. */
function rayCapsule(ray: Ray, a: Vector3, b: Vector3, r: number): number | null {
  // closest points between the ray and the segment
  const d1 = ray.direction;
  const d2 = b.subtract(a);
  const w = ray.origin.subtract(a);
  const A = Vector3.Dot(d1, d1);
  const B = Vector3.Dot(d1, d2);
  const C = Vector3.Dot(d2, d2);
  const D = Vector3.Dot(d1, w);
  const E = Vector3.Dot(d2, w);
  const den = A * C - B * B;
  let s = den > 1e-9 ? (B * E - C * D) / den : 0;
  let u = C > 1e-9 ? (B * s + E) / C : 0;
  u = Math.max(0, Math.min(1, u));
  s = Math.max(0, (B * u - D) / A);
  const p = ray.origin.add(d1.scale(s));
  const q = a.add(d2.scale(u));
  const dist = Vector3.Distance(p, q);
  if (dist > r) return null;
  return Math.max(0, s - Math.sqrt(r * r - dist * dist));
}
