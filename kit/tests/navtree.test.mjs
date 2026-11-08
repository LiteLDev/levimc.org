// Unit tests for static/doxygen/patch-navtree.mjs: the tree data split (splitTreeData) and the patches it applies
// to a navtree.js-shaped source. Run: node --test "kit/tests/*.test.mjs" (no dependencies).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { patchNavtree, splitTreeData } from '../static/doxygen/patch-navtree.mjs';

// a Class List like Doxygen's: [text, link, children] where children is null, a script name or a list
const entry = (name, depth) => [
  name,
  `d0/d00/class_${name}.html`,
  depth ? Array.from({ length: 12 }, (_, i) => entry(`${name}_m${i}_with_a_long_enough_name`, depth - 1)) : null,
];
const sample = () => [entry('absl', 2), ['Leaf', 'd1/d01/leaf.html', null], ['Lazy', null, 'd2/d02/lazy'], ...Array.from({ length: 60 }, (_, i) => entry(`ns${i}`, 2))];

/** Loads a split data dir the way navtree.js does: string children are the names of scripts defining them. */
function load(dir, name) {
  const ctx = vm.createContext({});
  const get = (n) => {
    vm.runInContext(readFileSync(join(dir, n + '.js'), 'utf8'), ctx);
    return JSON.parse(JSON.stringify(ctx[n])); // out of the vm's realm, so deepEqual compares plain arrays
  };
  const expand = (list) =>
    list.map((e) => {
      if (typeof e[2] === 'string' && /_k(_\d+)+$/.test(e[2])) return [e[0], e[1], expand(get(e[2]))];
      return Array.isArray(e[2]) ? [e[0], e[1], expand(e[2])] : e;
    });
  return expand(get(name));
}

test('splitTreeData: large tree data scripts split into small lazily loaded parts, losslessly', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kit-navtree-'));
  try {
    const data = sample();
    writeFileSync(join(dir, 'annotated_dup.js'), 'var annotated_dup =\n' + JSON.stringify(data, null, 2) + ';\n');
    writeFileSync(join(dir, 'navtreedata.js'), 'var NAVTREE =\n[ [ "x", "index.html", null ] ];\n'); // small: untouched
    writeFileSync(join(dir, 'menudata.js'), 'var menudata={children:[]};\n'); // not tree data: untouched
    const before = readFileSync(join(dir, 'annotated_dup.js'), 'utf8').length;
    const done = splitTreeData(dir);
    assert.equal(done.length, 1);
    assert.match(done[0], /^annotated_dup\.js \(\d+ parts\)$/);
    const files = readdirSync(dir);
    assert.ok(files.some((f) => /^annotated_dup_k(_\d+)+\.js$/.test(f)));
    assert.ok(readFileSync(join(dir, 'annotated_dup.js'), 'utf8').length < before / 4);
    for (const f of files.filter((f) => f.startsWith('annotated_dup_k_'))) assert.ok(readFileSync(join(dir, f)).length < 64 * 1024, f);
    assert.deepEqual(load(dir, 'annotated_dup'), data);
    // the script names are what navtree.js's getData reads: the file name (no directory), '-' → '_'
    for (const f of files.filter((f) => f.startsWith('annotated_dup_k_'))) assert.match(f, /^[A-Za-z_][\w]*\.js$/);
    assert.deepEqual(splitTreeData(dir), []); // idempotent: the parts are small now
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('patchNavtree: leaves an unknown source alone and marks a patched one', () => {
  const unknown = patchNavtree('function somethingElse() {}');
  assert.equal(unknown.applied.length, 0);
  assert.equal(unknown.src, 'function somethingElse() {}');
  const once = patchNavtree('function adjustSyncIconPosition() {\n}\nfunction resizeHeight() {\n}\n');
  assert.deepEqual(once.applied, ['adjustSyncIconPosition', 'resizeHeight']);
  assert.equal(patchNavtree(once.src).already, true);
});
