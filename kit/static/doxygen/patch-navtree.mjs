#!/usr/bin/env node
// Patches the navtree.js Doxygen generated (doxygen 1.16) for the kit's docs layout and for very long lists:
//
//  * getNode() renders a window of WINDOW entries around the current page's entry of a list longer than that (the
//    Class List of LeviLamina has ~9,700 top-level entries: building them all cost ~80k DOM nodes and seconds of main
//    thread on every class page) plus a "Show all N" row that renders the rest in idle-time chunks; anything that
//    needs an entry outside the window (hash navigation) renders the whole list first.
//  * adjustSyncIconPosition() is a no-op (the sync icon is hidden; it only forced layout on every expand and resize).
//  * With the kit's layout, nothing in the tree reads computed styles per frame. On a 25k-node class page each read
//    recalculated the whole document's style (~1.3 s of main thread on a budget phone when the tree was built):
//    expanding and collapsing are instant (no jQuery slideDown/slideUp), the current entry is scrolled into view
//    once without animation (showRoot used jQuery scrollTo over 100 ms), and the scrollbar width probe (only used
//    by the sync icon) is skipped.
//  * With the kit's layout (kit.js sets window.kitDoxygen): no in-pane sizing on every resize (resizeHeight — the page
//    scrolls, not Doxygen's panes, and it re-scrolled to the URL's anchor on every resize) and no outline of its own
//    (initPageToc — kit.js builds the docs' "On this page") and no pane splitter (initResizable — the kit's grid
//    sizes the panes; its jQuery width reads forced a style pass over the whole page while the tree was built).
//
// Every patch checks the code it replaces; a navtree.js it does not recognise is left as it is (with a warning).
//
// The tree's data scripts are split too (splitTreeData): Doxygen writes each top-level list in one file, and
// LeviLamina's Class List (annotated_dup.js, 2.4 MB) and Class Hierarchy (hierarchy.js, 2.8 MB) had to be
// downloaded and parsed before the tree could open on any class page. Every child list larger than
// SPLIT_CHILD bytes moves into a script of its own, which navtree.js already loads on demand (a string
// childrenData is a script name; getData reads the variable of that name).
//
//   node kit/static/doxygen/patch-navtree.mjs <doxygen html output dir>
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WINDOW = 150;
const BEFORE = 60;
const CHUNK = 200;
const SPLIT_FILE = 256 * 1024; // tree data scripts above this size are split
const SPLIT_CHILD = 4 * 1024; // ... moving every child list above this size into a script of its own
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
  patch(
    'scrollbar probe',
    /const scrollbarWidth = getScrollBarWidth\(\);/,
    'const scrollbarWidth = window.kitDoxygen ? 0 : getScrollBarWidth();',
  );
  patch(
    'instant expand',
    /\$\(node\.getChildrenUL\(\)\)\.slideDown\("fast",adjustSyncIconPosition\);/,
    'if (window.kitDoxygen) node.getChildrenUL().style.display = "block"; else $(node.getChildrenUL()).slideDown("fast",adjustSyncIconPosition);',
  );
  patch(
    'instant collapse',
    /\$\(node\.getChildrenUL\(\)\)\.slideUp\("fast",adjustSyncIconPosition\);/,
    'if (window.kitDoxygen) node.getChildrenUL().style.display = "none"; else $(node.getChildrenUL()).slideUp("fast",adjustSyncIconPosition);',
  );
  patch(
    'showRoot instant',
    /const showRoot = function\(\) \{/,
    `const showRoot = function() {
    if (window.kitDoxygen) { // one scroll, no animation: the current entry in the middle of the tree's scroller
      let tries = 0;
      const show = function() {
        const sel = document.getElementById('selected'), nt = document.getElementById('nav-tree');
        if (!sel || !nt) { if (++tries < 40) setTimeout(show, 50); return; }
        let sc = nt; // the nearest scrolling box up to the sidebar (never the page)
        while (sc && sc !== document.body && !(sc.scrollHeight > sc.clientHeight + 1)) sc = sc.parentElement;
        if (sc === document.body || sc === document.documentElement) sc = null;
        if (sc) sc.scrollTop += sel.getBoundingClientRect().top - sc.getBoundingClientRect().top - sc.clientHeight / 2;
      };
      show();
      return;
    }`,
  );
  patch('resizeHeight', /function resizeHeight\(\) \{/, 'function resizeHeight() { if (window.kitDoxygen) return;');
  patch('initPageToc', /\$\(document\)\.ready\(function\(\) \{ initPageToc\(\); initResizable\(\); \}\);/, '$(document).ready(function() { if (!window.kitDoxygen) { initPageToc(); initResizable(); } });');
  if (applied.length) src = MARK + '\n' + src;
  return { src, applied, skipped, already: false };
}

/**
 * Splits the large tree data scripts in a Doxygen html output dir (see the header). Returns the files it split.
 * A data script is `var <name> =\n[ ... ];` (JSON-compatible arrays of [text, link, children]).
 */
export function splitTreeData(dir) {
  const done = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.js')) continue;
    const path = join(dir, f);
    if (statSync(path).size <= SPLIT_FILE) continue;
    const src = readFileSync(path, 'utf8');
    const m = /^var ([A-Za-z_$][\w$]*) =\s*(\[[\s\S]*\]);?\s*$/.exec(src);
    if (!m || m[1] !== f.slice(0, -3).replace(/-/g, '_') || m[1] === 'NAVTREE') continue;
    let data;
    try {
      data = JSON.parse(m[2]);
    } catch {
      continue; // not plain JSON: leave it as Doxygen wrote it
    }
    let parts = 0;
    const out = (name, list) => writeFileSync(join(dir, name + '.js'), 'var ' + name + ' =\n' + JSON.stringify(list) + ';\n');
    const walk = (list, prefix) => {
      list.forEach((e, i) => {
        if (!Array.isArray(e) || !Array.isArray(e[2])) return;
        const name = prefix + '_' + i;
        walk(e[2], name); // the deepest lists first, so each script stays small
        if (JSON.stringify(e[2]).length > SPLIT_CHILD) {
          out(name, e[2]);
          e[2] = name;
          parts++;
        }
      });
    };
    walk(data, m[1] + '_k');
    if (!parts) continue;
    out(m[1], data);
    done.push(`${f} (${parts} parts)`);
  }
  return done;
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
  const split = splitTreeData(dir);
  console.log(`patch-navtree: tree data split: ${split.join(', ') || 'none above ' + SPLIT_FILE / 1024 + ' KB'}`);
}
