// Feeds of the blog, as the old blog published them (hexo-feed: rss.xml, atom.xml, feed.json; newest 20).
import type { BuiltBlog } from './content.ts';

export const SITE_ORIGIN = 'https://levimc.org';
export const BLOG_TITLE = "LeviMC's blog";
export const BLOG_DESCRIPTION = 'Everything about development';
const FEED_LIMIT = 20;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Feed readers get absolute URLs: site-relative paths, and in-page anchors resolved against the post. */
const absolutize = (html: string, postUrl: string) =>
  html
    .replace(/\s(href|src)="\/(?!\/)/g, ` $1="${SITE_ORIGIN}/`)
    .replace(/\shref="#/g, ` href="${SITE_ORIGIN}${postUrl}#`);
/** A post's category and tags as one list of distinct names (the category is usually also a tag). */
const termNames = (p: BuiltBlog['data']['posts'][number]) => [...new Set([p.category?.name, ...p.tags.map((t) => t.name)].filter((n): n is string => !!n))];

export function feeds(b: BuiltBlog): Record<string, string> {
  const posts = b.data.posts.slice(0, FEED_LIMIT);
  const updated = posts[0]?.date ?? '2023-07-26T00:00:00+08:00';
  const home = `${SITE_ORIGIN}/blog/`;
  const content = (p: { slug: string; url: string }) => absolutize(b.docs.get(p.slug)?.html ?? '', p.url);

  const rss =
    `<?xml version="1.0" encoding="utf-8"?>\n` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n<channel>\n` +
    `  <title>${esc(BLOG_TITLE)}</title>\n  <link>${home}</link>\n  <description>${esc(BLOG_DESCRIPTION)}</description>\n  <language>zh-CN</language>\n` +
    `  <atom:link href="${home}rss.xml" rel="self" type="application/rss+xml"/>\n  <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>\n` +
    posts
      .map(
        (p) =>
          `  <item>\n    <title>${esc(p.title)}</title>\n    <link>${SITE_ORIGIN}${p.url}</link>\n    <guid isPermaLink="true">${SITE_ORIGIN}${p.url}</guid>\n` +
          `    <pubDate>${new Date(p.date).toUTCString()}</pubDate>\n` +
          (p.author ? `    <author>contact@levimc.org (${esc(p.author.name)})</author>\n` : '') +
          termNames(p).map((n) => `    <category>${esc(n)}</category>\n`).join('') +
          `    <description>${esc(p.excerpt)}</description>\n    <content:encoded><![CDATA[${content(p).replace(/]]>/g, ']]]]><![CDATA[>')}]]></content:encoded>\n  </item>\n`,
      )
      .join('') +
    `</channel>\n</rss>\n`;

  const atom =
    `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="zh-CN">\n` +
    `  <title>${esc(BLOG_TITLE)}</title>\n  <subtitle>${esc(BLOG_DESCRIPTION)}</subtitle>\n  <id>${home}</id>\n` +
    `  <link href="${home}"/>\n  <link href="${home}atom.xml" rel="self"/>\n  <updated>${updated}</updated>\n  <author><name>LeviMC</name></author>\n` +
    posts
      .map(
        (p) =>
          `  <entry>\n    <title>${esc(p.title)}</title>\n    <id>${SITE_ORIGIN}${p.url}</id>\n    <link href="${SITE_ORIGIN}${p.url}"/>\n` +
          `    <published>${p.date}</published>\n    <updated>${p.date}</updated>\n` +
          (p.author ? `    <author><name>${esc(p.author.name)}</name>${p.author.github ? `<uri>https://github.com/${p.author.github}</uri>` : ''}</author>\n` : '') +
          termNames(p).map((n) => `    <category term="${esc(n)}"/>\n`).join('') +
          `    <summary>${esc(p.excerpt)}</summary>\n    <content type="html">${esc(content(p))}</content>\n  </entry>\n`,
      )
      .join('') +
    `</feed>\n`;

  const json = JSON.stringify(
    {
      version: 'https://jsonfeed.org/version/1.1',
      title: BLOG_TITLE,
      description: BLOG_DESCRIPTION,
      home_page_url: home,
      feed_url: `${home}feed.json`,
      language: 'zh-CN',
      items: posts.map((p) => ({
        id: `${SITE_ORIGIN}${p.url}`,
        url: `${SITE_ORIGIN}${p.url}`,
        title: p.title,
        summary: p.excerpt,
        content_html: content(p),
        date_published: p.date,
        authors: p.author ? [{ name: p.author.name, ...(p.author.github ? { url: `https://github.com/${p.author.github}` } : {}) }] : undefined,
        tags: termNames(p),
      })),
    },
    null,
    2,
  );

  return { 'blog/rss.xml': rss, 'blog/atom.xml': atom, 'blog/feed.json': json + '\n' };
}
