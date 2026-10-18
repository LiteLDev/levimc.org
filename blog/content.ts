// LeviMC blog (levimc.org/blog/): reads content/blog at build time and renders it with the kit's markdown
// pipeline (unified/remark/rehype + Shiki — the same prose, code and admonition styling as the docs).
//
// The posts keep the Hexo conventions of the old blog (blog.levimc.org, Hexo 7 + hexo-theme-shokax):
//   content/blog/posts/<name>.md   front matter: title, date ("YYYY-MM-DD HH:mm:ss", Asia/Shanghai), author,
//                                  tags, category (or categories); URL /blog/:year/:month/:day/<name>/
//   content/blog/pages/<name>.md   standalone pages (about, friends) at /blog/<name>/
//   content/blog/authors.yml       author name → GitHub account (avatar + profile link)
// Hexo's renderer turned every newline inside a paragraph into a line break (markdown-it `breaks: true`);
// the same is done here so the posts keep their line structure.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { renderMarkdown, splitFrontmatter } from '../kit/docs/node/markdown/render.ts';
import { TokenStyles } from '../kit/docs/node/markdown/shiki.ts';
import type { BlogData, BlogDoc, BlogPost, BlogTerm, BlogArchiveYear } from './types.ts';

export const BLOG_BASE = '/blog/';
/** Index / tag / category / archive pages list this many posts (Hexo `per_page`). */
export const PER_PAGE = 10;
/** Hexo `timezone`: the old permalinks' dates are local dates in Asia/Shanghai (UTC+8, no DST since 1991). */
const TZ_OFFSET = '+08:00';
/** Images the posts load from s2.loli.net (SM.MS) are served from public/blog/images/ (same path). */
const SELF_HOSTED_IMAGE = /^https:\/\/s2\.loli\.net\/(\d{4}\/\d{2}\/\d{2}\/[\w.-]+)$/;

/**
 * Link targets that moved since a post was written: the post text stays as written, the rendered link points at
 * the final URL (no redirect for the reader).
 */
const LINK_FIXES: Record<string, string> = {
  'https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entitycomponents/minecraftcomponent_block_sensor':
    'https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entitycomponents/minecraftcomponent_block_sensor?view=minecraft-bedrock-stable',
};

export interface BuiltBlog {
  data: BlogData;
  /** Rendered HTML per document id (post slug, or "page:<name>"). */
  docs: Map<string, BlogDoc>;
  tokenCss: string;
  warnings: string[];
  /** Every prerendered blog route. */
  routes: string[];
}

/** hexo-util slugize() with Hexo's defaults (tags / categories, `filename_case: 0`). */
export function hexoSlugize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Hexo `breaks: true`: a newline inside a paragraph is a line break (trailing "  " outside code fences). */
export function hardBreaks(markdown: string): string {
  let fence: string | null = null;
  return markdown
    .split('\n')
    .map((line) => {
      const m = /^ {0,3}(`{3,}|~{3,})/.exec(line);
      if (fence) {
        if (m && m[1]![0] === fence[0] && m[1]!.length >= fence.length && !/\S/.test(line.slice(m[0].length))) fence = null;
        return line;
      }
      if (m) {
        fence = m[1]!;
        return line;
      }
      if (!line.trim() || / {2,}$/.test(line) || /\\$/.test(line)) return line;
      return line.replace(/\s*$/, '') + '  ';
    })
    .join('\n');
}

function asList(v: unknown): string[] {
  if (v === undefined || v === null || v === '') return [];
  return (Array.isArray(v) ? v : [v]).flat().map((x) => String(x).trim()).filter(Boolean);
}

/** Front matter date → { iso: "2023-07-26T18:28:00+08:00", y, m, d } in Asia/Shanghai. */
export function parseHexoDate(v: unknown, file: string): { iso: string; y: string; m: string; d: string } {
  let local: string;
  if (v instanceof Date) {
    const t = new Date(v.getTime() + 8 * 3600_000).toISOString();
    local = `${t.slice(0, 10)} ${t.slice(11, 19)}`;
  } else {
    const s = String(v ?? '').trim();
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(s);
    if (!m) throw new Error(`${file}: front matter "date" must look like 2024-08-11 09:51:07 (got ${JSON.stringify(s)})`);
    const p = (x: string | undefined, n = 2) => (x ?? '0').padStart(n, '0');
    local = `${m[1]}-${p(m[2])}-${p(m[3])} ${p(m[4])}:${p(m[5])}:${p(m[6])}`;
  }
  return { iso: `${local.replace(' ', 'T')}${TZ_OFFSET}`, y: local.slice(0, 4), m: local.slice(5, 7), d: local.slice(8, 10) };
}

const STRINGS = { copyCode: '复制代码', copied: '已复制', footnotes: '脚注', backToRef: '返回引用' };

export async function buildBlog(root: string): Promise<BuiltBlog> {
  const dir = join(root, 'content/blog');
  const publicDir = join(root, 'public');
  const styles = new TokenStyles();
  const warnings: string[] = [];
  const docs = new Map<string, BlogDoc>();

  const authorsFile = join(dir, 'authors.yml');
  const authors = (existsSync(authorsFile) ? parseYaml(readFileSync(authorsFile, 'utf8')) : {}) as Record<string, { github?: string; id?: number }>;

  const render = async (file: string, body: string, lang: string) => {
    const r = await renderMarkdown(hardBreaks(body), {
      compat: 'commonmark',
      slug: 'vitepress',
      lineNumbers: true,
      codeTitle: 'pygments',
      languageAlias: {},
      admonitionTitles: 'vitepress',
      outline: [2, 3],
      styles,
      strings: STRINGS,
      resolveLink: (href, kind) => {
        if (kind === 'img') {
          const m = SELF_HOSTED_IMAGE.exec(href);
          if (m) {
            const local = `blog/images/${m[1]}`;
            if (existsSync(join(publicDir, local))) return { href: '/' + local };
            warnings.push(`${file}: image ${href} is not self-hosted (download it to public/${local})`);
          }
          return { href };
        }
        if (/^https?:\/\//i.test(href)) return { href: LINK_FIXES[href] ?? href, external: true };
        if (/^mailto:/i.test(href)) return { href };
        if (href.startsWith('/')) return { href };
        return null;
      },
      onWarning: (m) => warnings.push(`${file}: ${m}`),
    });
    return { html: r.html, toc: r.toc, description: r.description, lang, text: r.sections.map((s) => s.text).join(' ') };
  };

  // ---- posts
  const postDir = join(dir, 'posts');
  const posts: BlogPost[] = [];
  for (const name of readdirSync(postDir).filter((f) => f.endsWith('.md')).sort()) {
    const file = `content/blog/posts/${name}`;
    const { data: fm, body } = splitFrontmatter(readFileSync(join(postDir, name), 'utf8'));
    if (fm.published === false) continue;
    const slug = basename(name, '.md');
    const date = parseHexoDate(fm.date, file);
    const r = await render(file, body, 'zh-CN');
    const authorName = typeof fm.author === 'string' && fm.author.trim() ? fm.author.trim() : null;
    const a = authorName ? authors[authorName] : undefined;
    const term = (kind: 'tags' | 'categories', n: string): BlogTerm => ({ name: n, slug: hexoSlugize(n), url: `${BLOG_BASE}${kind}/${hexoSlugize(n)}/`, count: 0 });
    const chars = r.text.replace(/\s+/g, '').length;
    posts.push({
      slug,
      title: String(fm.title ?? slug),
      date: date.iso,
      url: `${BLOG_BASE}${date.y}/${date.m}/${date.d}/${slug}/`,
      oldPath: `/${date.y}/${date.m}/${date.d}/${slug}/`,
      author: authorName ? { name: authorName, github: a?.github, avatar: a?.id ? `https://avatars.githubusercontent.com/u/${a.id}?v=4` : undefined } : null,
      tags: asList(fm.tags ?? fm.tag).map((t) => term('tags', t)),
      category: asList(fm.categories ?? fm.category).map((c) => term('categories', c))[0] ?? null,
      excerpt: r.description.length > 140 ? r.description.slice(0, 138).replace(/[\s，。,.;；：:、]+$/, '') + '…' : r.description,
      readingMinutes: Math.max(1, Math.round(chars / 400)),
      lang: 'zh-CN',
    });
    docs.set(slug, { html: r.html, toc: r.toc, lang: r.lang });
  }
  posts.sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : x.slug.localeCompare(y.slug)));

  // ---- tags, categories, archives
  const collect = (pick: (p: BlogPost) => BlogTerm[]) => {
    const map = new Map<string, BlogTerm>();
    for (const p of posts)
      for (const t of pick(p)) {
        const cur = map.get(t.slug) ?? { ...t, count: 0 };
        cur.count++;
        map.set(t.slug, cur);
      }
    return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  };
  const tags = collect((p) => p.tags);
  const categories = collect((p) => (p.category ? [p.category] : []));
  const archives: BlogArchiveYear[] = [];
  for (const p of posts) {
    const y = p.date.slice(0, 4);
    const m = p.date.slice(5, 7);
    let year = archives.find((a) => a.year === y);
    if (!year) archives.push((year = { year: y, count: 0, months: [] }));
    year.count++;
    let month = year.months.find((x) => x.month === m);
    if (!month) year.months.push((month = { month: m, count: 0 }));
    month.count++;
  }

  // ---- standalone pages
  const pageDir = join(dir, 'pages');
  const pages: BlogData['pages'] = {};
  for (const name of existsSync(pageDir) ? readdirSync(pageDir).filter((f) => f.endsWith('.md')).sort() : []) {
    const file = `content/blog/pages/${name}`;
    const { data: fm, body } = splitFrontmatter(readFileSync(join(pageDir, name), 'utf8'));
    const key = basename(name, '.md');
    const r = await render(file, body, 'zh-CN');
    pages[key] = { name: key, title: String(fm.title ?? key), date: fm.date ? parseHexoDate(fm.date, file).iso : undefined, url: `${BLOG_BASE}${key}/`, oldPath: `/${key}/` };
    docs.set(`page:${key}`, { html: r.html, toc: r.toc, lang: r.lang });
  }

  // ---- routes (trailing slash, one HTML file each)
  const pagesOf = (n: number) => Math.max(1, Math.ceil(n / PER_PAGE));
  const paged = (base: string, n: number) => Array.from({ length: pagesOf(n) }, (_, i) => (i === 0 ? base : `${base}page/${i + 1}/`));
  const routes = [
    ...paged(BLOG_BASE, posts.length),
    ...posts.map((p) => p.url),
    `${BLOG_BASE}tags/`,
    ...tags.flatMap((t) => paged(t.url, t.count)),
    `${BLOG_BASE}categories/`,
    ...categories.flatMap((c) => paged(c.url, c.count)),
    ...paged(`${BLOG_BASE}archives/`, posts.length),
    ...archives.flatMap((y) => [...paged(`${BLOG_BASE}archives/${y.year}/`, y.count), ...y.months.flatMap((m) => paged(`${BLOG_BASE}archives/${y.year}/${m.month}/`, m.count))]),
    ...Object.values(pages).map((p) => p.url),
  ];

  return { data: { posts, tags, categories, archives, pages, perPage: PER_PAGE }, docs, tokenCss: styles.css(), warnings, routes };
}
