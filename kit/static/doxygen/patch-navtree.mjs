#!/usr/bin/env node
// Patches the navtree.js Doxygen generated (doxygen 1.16) for the kit's docs layout and for very long lists:
//
//  * getNode() renders a window of WINDOW entries around the current page's entry of a list longer than that (the
//    Class List of LeviLamina has ~9,700 top-level entries: building them all cost ~80k DOM nodes and seconds of main
//    thread on every class page) plus a "Show all N" row that renders the rest in idle-time chunks; anything that
//    needs an entry outside the window (hash navigation) renders the whole list first.
//  * adjustSyncIconPosition() is a no-op (the sync icon is hidden; it only forced layout on every expand and resize).
//  * With the kit's layout (kit.js sets window.kitDoxygen): no in-pane sizing on every resize (resizeHeight — the page
//    scrolls, not Doxygen's panes, and it re-scrolled to the URL's anchor on every resize) and no outline of its own
//    (initPageToc — kit.js builds the docs' "On this page").
//
// Every patch checks the code it replaces; a navtree.js it does not recognise is left as it is (with a warning).
//
//   node kit/static/doxygen/patch-navtree.mjs <doxygen html output dir>
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WINDOW = 150;
const BEFORE = 60;
const CHUNK = 200;
const MARK = '/* levimc-kit: patched by patch-navtree.mjs */';

export function patchNavtree(src) {
  if (src.includes(MARK)) return { src, applied: [], skipped: [], already: true };
  const applied = [];
  const skipped = [];
  const patch = (name, re, replace) => {
    if (re.test(src)) {
      src = src.replace(re, replace);
      applied.push(name);
    } else skipped.push(name);
  };

  patch(
    'getNode window',
    /const getNode = function\(o, po\) \{\n\s*po\.childrenVisited = true;\n\s*const l = po\.childrenData\.length-1;\n\s*for \(let i in po\.childrenData\) \{\n\s*const nodeData = po\.childrenData\[i\];\n\s*po\.children\[i\] = newNode\(o, po, nodeData\[0\], nodeData\[1\], nodeData\[2\], i==l\);\n\s*\}\n\s*\}/,
    `const getNode = function(o, po) {
    po.childrenVisited = true;
    const data = po.childrenData;
    const n = data.length, l = n-1;
    const make = function(i) { po.children[i] = newNode(o, po, data[i][0], data[i][1], data[i][2], i==l); return po.children[i]; };
    if (n <= ${WINDOW}) { for (let i = 0; i < n; i++) make(i); return; }
    // a long list: the entries around the current page's (o.breadcrumbs: the path to it), the rest on demand
    const want = o.breadcrumbs && o.breadcrumbs[po.depth] !== undefined && po === kitPathNode(o, po.depth) ? o.breadcrumbs[po.depth] : 0;
    const from = Math.max(0, Math.min(want - ${BEFORE}, n - ${WINDOW})), to = Math.min(n, from + ${WINDOW});
    for (let i = from; i < to; i++) make(i);
    const ul = po.getChildrenUL();
    const more = document.createElement('li');
    more.className = 'kit-tree-more';
    more.innerHTML = '<div class="item"><span class="label"><a href="javascript:void(0)">Show all ' + n + '</a></span></div>';
    ul.appendChild(more);
    // the rest renders in idle-time chunks once asked; a later sync call (showNode/expand needing an entry that is
    // not rendered yet) finishes whatever is left at once
    let started = false, finished = false, k = 0, todo = null, first = null;
    const step = function(sync) {
      if (finished) return;
      const end = sync === true ? todo.length : Math.min(todo.length, k + ${CHUNK});
      for (; k < end; k++) {
        const i = todo[k];
        const node = make(i);
        if (i < from) ul.insertBefore(node.li, first);
        else ul.insertBefore(node.li, more);
      }
      if (k < todo.length) (window.requestIdleCallback || setTimeout)(step);
      else { finished = true; if (more.parentNode) more.parentNode.removeChild(more); }
    };
    po.kitRenderAll = function(sync) {
      if (!started) {
        started = true;
        first = po.children[from].li;
        todo = [];
        for (let i = 0; i < from; i++) todo.push(i);
        for (let i = to; i < n; i++) todo.push(i);
        more.querySelector('a').textContent = '…';
      }
      step(sync === true);
    };
    more.querySelector('a').onclick = function() { po.kitRenderAll(false); return false; };
  }
  // the node on the path to the current page at a depth (the root is o.node)
  const kitPathNode = function(o, depth) {
    let node = o.node;
    for (let d = 0; d < depth && node; d++) node = node.children[o.breadcrumbs[d]];
    return node;
  }`,
  );
  // showNode/expand: an entry outside a rendered window is rendered (the whole list) before it is used
  patch(
    'showNode window',
    /const n = node\.children\[o\.breadcrumbs\[index\]\];/,
    `if (!node.children[o.breadcrumbs[index]] && node.kitRenderAll) node.kitRenderAll(true);
        const n = node.children[o.breadcrumbs[index]];`,
  );
  patch('adjustSyncIconPosition', /function adjustSyncIconPosition\(\) \{/, 'function adjustSyncIconPosition() { return;');
  patch('resizeHeight', /function resizeHeight\(\) \{/, 'function resizeHeight() { if (window.kitDoxygen) return;');
  patch('initPageToc', /\$\(document\)\.ready\(function\(\) \{ initPageToc\(\); initResizable\(\); \}\);/, '$(document).ready(function() { if (!window.kitDoxygen) initPageToc(); initResizable(); });');
  if (applied.length) src = MARK + '\n' + src;
  return { src, applied, skipped, already: false };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const dir = process.argv[2];
  if (!dir) {
    console.error('usage: node patch-navtree.mjs <doxygen html output dir>');
    process.exit(2);
  }
  const file = join(dir, 'navtree.js');
  const { src, applied, skipped, already } = patchNavtree(readFileSync(file, 'utf8'));
  if (already) console.log(`patch-navtree: ${file} is already patched`);
  else {
    writeFileSync(file, src);
    console.log(`patch-navtree: ${file}: ${applied.join(', ') || 'nothing'}${skipped.length ? ` · not recognised (left as is): ${skipped.join(', ')}` : ''}`);
  }
}
