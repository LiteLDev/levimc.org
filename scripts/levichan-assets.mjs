// Packs LeviChan's 3D assets for the site from a LeviChan build (github.com/LiteLDev/LeviChan):
//
//   node scripts/levichan-assets.mjs --pmx <dir with Levi.pmx + tex/> --motions <dir with *.vmd + clips.json>
//
// writes public/levichan/: model/Levi.pmx.gz (the browser inflates it), model/tex/*.png, motions/<clip>.vmd
// (key-reduced: the export keys every frame; linear keys within 0.35 deg / 3 mm), and clips.json (the clips'
// manifest plus the model's files and download size). The model data's terms are in public/levichan/NOTICE.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith('--') ? [...a, [v.slice(2), all[i + 1]]] : a), []));
if (!args.pmx || !args.motions) {
  console.error('usage: node scripts/levichan-assets.mjs --pmx <dir> --motions <dir> [--out public/levichan]');
  process.exit(2);
}
const out = args.out ?? 'public/levichan';
fs.mkdirSync(path.join(out, 'model/tex'), { recursive: true });
fs.mkdirSync(path.join(out, 'motions'), { recursive: true });

// ------------------------------------------------------------------ model
const pmx = fs.readFileSync(path.join(args.pmx, 'Levi.pmx'));
const gz = zlib.gzipSync(pmx, { level: 9 });
fs.writeFileSync(path.join(out, 'model/Levi.pmx.gz'), gz);
const textures = [];
let size = gz.length;
for (const f of fs.readdirSync(path.join(args.pmx, 'tex')).sort()) {
  const b = fs.readFileSync(path.join(args.pmx, 'tex', f));
  fs.writeFileSync(path.join(out, 'model/tex', f), b);
  textures.push(`tex/${f}`);
  size += b.length;
}

// ------------------------------------------------------------------ motions: VMD key reduction
const ROT_TOL = (0.35 * Math.PI) / 180;
const POS_TOL = 0.003 * 12.5; // 3 mm in MMD units
const LINEAR = Buffer.from([20, 20, 20, 20, 20, 20, 20, 20, 107, 107, 107, 107, 107, 107, 107, 107]);

function readVmd(buf) {
  let o = 50; // 30 header + 20 model name
  const nb = buf.readUInt32LE(o);
  o += 4;
  const bones = new Map();
  for (let i = 0; i < nb; i++, o += 111) {
    const name = buf.subarray(o, o + 15).toString('latin1');
    const k = {
      f: buf.readUInt32LE(o + 15),
      p: [0, 1, 2].map((j) => buf.readFloatLE(o + 19 + 4 * j)),
      q: [0, 1, 2, 3].map((j) => buf.readFloatLE(o + 31 + 4 * j)),
      interp: buf.subarray(o + 47, o + 111),
    };
    if (!bones.has(name)) bones.set(name, []);
    bones.get(name).push(k);
  }
  return { head: buf.subarray(0, 50), bones, rest: buf.subarray(o) };
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
function slerp(a, b, t) {
  let d = dot(a, b);
  const bb = d < 0 ? b.map((v) => -v) : b;
  d = Math.abs(d);
  if (d > 0.9995) {
    const r = a.map((v, i) => v + (bb[i] - v) * t);
    const n = Math.hypot(...r);
    return r.map((v) => v / n);
  }
  const th = Math.acos(d);
  const s = Math.sin(th);
  const wa = Math.sin((1 - t) * th) / s;
  const wb = Math.sin(t * th) / s;
  return a.map((v, i) => v * wa + bb[i] * wb);
}
const angle = (a, b) => 2 * Math.acos(Math.min(1, Math.abs(dot(a, b))));

/** Keep the fewest keys whose linear (slerp) interpolation stays within tolerance of every dropped key. */
function reduce(keys) {
  keys.sort((x, y) => x.f - y.f);
  if (keys.length <= 2) return keys;
  const kept = [keys[0]];
  let a = 0;
  for (let b = 2; b <= keys.length; b++) {
    const end = keys[Math.min(b, keys.length - 1)];
    let ok = b < keys.length;
    if (ok) {
      const A = keys[a];
      for (let i = a + 1; i < b && ok; i++) {
        const t = (keys[i].f - A.f) / (end.f - A.f);
        const p = A.p.map((v, j) => v + (end.p[j] - v) * t);
        if (Math.hypot(...p.map((v, j) => v - keys[i].p[j])) > POS_TOL) ok = false;
        else if (angle(slerp(A.q, end.q, t), keys[i].q) > ROT_TOL) ok = false;
      }
    }
    if (!ok) {
      kept.push(keys[b - 1]);
      a = b - 1;
    }
  }
  if (kept[kept.length - 1] !== keys[keys.length - 1]) kept.push(keys[keys.length - 1]);
  // a bone that never moves needs one key
  const still = kept.every((k) => Math.hypot(...k.p.map((v, j) => v - kept[0].p[j])) < 1e-5 && angle(k.q, kept[0].q) < 1e-5);
  return still ? [kept[0]] : kept;
}

function writeVmd({ head, bones, rest }) {
  const parts = [head];
  const all = [];
  for (const [name, keys] of bones) for (const k of reduce(keys)) all.push([name, k]);
  const n = Buffer.alloc(4);
  n.writeUInt32LE(all.length);
  parts.push(n);
  for (const [name, k] of all) {
    const b = Buffer.alloc(111);
    b.write(name, 0, 15, 'latin1');
    b.writeUInt32LE(k.f, 15);
    k.p.forEach((v, j) => b.writeFloatLE(v, 19 + 4 * j));
    k.q.forEach((v, j) => b.writeFloatLE(v, 31 + 4 * j));
    for (let r = 0; r < 4; r++) LINEAR.copy(b, 47 + 16 * r);
    parts.push(b);
  }
  parts.push(rest);
  return Buffer.concat(parts);
}

const manifest = JSON.parse(fs.readFileSync(path.join(args.motions, 'clips.json'), 'utf8'));
let before = 0;
let after = 0;
for (const name of Object.keys(manifest.clips)) {
  const src = path.join(args.motions, `${name}.vmd`);
  if (!fs.existsSync(src)) {
    console.warn(`missing ${src}: dropped from the manifest`);
    delete manifest.clips[name];
    continue;
  }
  const buf = fs.readFileSync(src);
  const red = writeVmd(readVmd(buf));
  fs.writeFileSync(path.join(out, 'motions', `${name}.vmd`), red);
  before += buf.length;
  after += red.length;
}
manifest.model = { pmx: 'model/Levi.pmx.gz', size, textures };
fs.writeFileSync(path.join(out, 'clips.json'), JSON.stringify(manifest, null, 1) + '\n');
const mb = (n) => (n / 1048576).toFixed(2) + ' MB';
console.log(`model ${mb(size)} (PMX ${mb(pmx.length)} -> ${mb(gz.length)} gz); motions ${Object.keys(manifest.clips).length} clips ${mb(before)} -> ${mb(after)}`);
