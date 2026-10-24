#!/usr/bin/env node
// Checks that every LeviMC site shows the same chrome: fetches each page, cuts out the GlobalBar
// ([data-kit-globalbar]) and the footer ([data-kit-footer]), normalizes what may differ per site — the current
// tab / project (aria-current), the language menu's options (each site's own locales), same-site links written
// root-relative, router attributes, the bar's layout variants (sticky; the phone menu, which docs sites put in
// their drawer) — and compares them with the first page.
//
//   node kit/scripts/chrome-parity.mjs [url …]        (default: one page of every LeviMC site)
//   node kit/scripts/chrome-parity.mjs http://127.0.0.1:4173/=https://levimc.org …   (a local preview, compared
//                                                     as the origin after "=")
//
// Exit code 1 when a page differs (a unified diff of the first difference is printed) or has no chrome.
const DEFAULT_URLS = [
  'https://levimc.org/',
  'https://levimc.org/blog/',
  'https://levimc.org/mods/',
  'https://docs.levimc.org/',
  'https://docs.levimc.org/LeviLamina/',
  'https://docs.levimc.org/LeviLamina/api/index.html',
  'https://docs.levimc.org/LegacyScriptEngine/',
  'https://docs.levimc.org/lip/',
  'https://docs.levimc.org/LeviLauncher/',
  'https://docs.levimc.org/LeviLaunchroid/',
];
const urls = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const list = urls.length ? urls : DEFAULT_URLS;

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
/** The element whose start tag matches `re`, with its whole subtree (HTML, balanced by tag name; SVG self-closes). */
function cut(html, re) {
  const m = re.exec(html);
  if (!m) return null;
  const tagRe = /<(\/?)([a-zA-Z][\w:-]*)\b[^>]*?(\/?)>|<!--[\s\S]*?-->/g;
  tagRe.lastIndex = m.index;
  let depth = 0;
  for (let t; (t = tagRe.exec(html)); ) {
    if (!t[2]) continue;
    const name = t[2].toLowerCase();
    if (t[1]) depth--;
    else if (!t[3] && !VOID.has(name)) depth++;
    if (depth === 0) return html.slice(m.index, tagRe.lastIndex);
  }
  return null;
}

function normalize(html, origin) {
  // layout variants, not content: a sticky bar (sites where it is the only header); docs sites fold the bar's phone
  // menu (the same links, GlobalNavList) into their own drawer instead of the bar's menu button
  const more = cut(html, /<details [^>]*class="kit-menu kit-gbar-more"/);
  if (more) html = html.replace(more, '');
  // the language menu's options are the site's own locales (docs: links to the page in each language)
  const langs = cut(html, /<div [^>]*role="menu"[^>]*data-kit-t-aria="language"/);
  if (langs) html = html.replace(langs, '<!--locale options-->');
  return (
    html
      .replace(/ kit-gbar-(sticky|no-menu)/g, '')
      // same-site links: absolute and root-relative forms are the same link
      .replace(/href="\/(?!\/)/g, `href="${origin}/`)
      .replace(/ data-discover="true"/g, '')
      .replace(/ aria-current="(page|true)"/g, '')
      .replace(/ lang="[^"]*"/g, '')
      // attribute order (a router link and a plain <a> write href and class in different orders)
      .replace(/<([a-zA-Z][\w-]*)((?:\s+[\w:-]+(?:="[^"]*")?)+)\s*(\/?)>/g, (_, tag, attrs, slash) => `<${tag} ${attrs.trim().match(/[\w:-]+(?:="[^"]*")?/g).sort().join(' ')}${slash}>`)
      // React's text separators (renderToString) — renderToStaticMarkup output has none
      .replace(/<!-- -->/g, '')
      // the language menu's trigger shows the current language
      .replace(/<span class="kit-menu-trigger-label">[^<]*<\/span>/g, '<span class="kit-menu-trigger-label">…</span>')
      .replace(/>\s+</g, '><')
      .replace(/></g, '>\n<')
  );
}

function firstDiff(a, b) {
  const A = a.split('\n');
  const B = b.split('\n');
  let i = 0;
  while (i < A.length && i < B.length && A[i] === B[i]) i++;
  if (i === A.length && i === B.length) return null;
  return [`  @ line ${i + 1}`, ...A.slice(Math.max(0, i - 2), i + 3).map((l) => `  - ${l.slice(0, 200)}`), ...B.slice(Math.max(0, i - 2), i + 3).map((l) => `  + ${l.slice(0, 200)}`)].join('\n');
}

let ref = null;
let failed = false;
for (const arg of list) {
  const [url, as] = arg.split('=');
  let html;
  try {
    const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
    html = await res.text();
  } catch (e) {
    console.log(`✘ ${url} — ${e.message}`);
    failed = true;
    continue;
  }
  const origin = as ?? new URL(url).origin;
  const gen = /<meta name="generator" content="(levimc-kit [^"]*)"/.exec(html)?.[1] ?? 'no levimc-kit generator';
  const bar = cut(html, /<div [^>]*data-kit-globalbar/);
  const foot = cut(html, /<footer [^>]*data-kit-footer/);
  if (!bar || !foot) {
    console.log(`✘ ${url} — ${!bar ? 'no GlobalBar' : ''}${!bar && !foot ? ', ' : ''}${!foot ? 'no footer' : ''} (${gen})`);
    failed = true;
    continue;
  }
  const cur = { bar: normalize(bar, origin), foot: normalize(foot, origin) };
  if (!ref) {
    ref = { url, ...cur };
    console.log(`✔ ${url} — reference (${gen})`);
    continue;
  }
  const d = firstDiff(ref.bar, cur.bar) ?? firstDiff(ref.foot, cur.foot);
  if (d) {
    failed = true;
    console.log(`✘ ${url} — differs from ${ref.url} (${gen})\n${d}`);
  } else console.log(`✔ ${url} — same chrome (${gen})`);
}
process.exit(failed ? 1 : 0);
