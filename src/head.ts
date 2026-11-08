// Per-route <head> tags for the prerendered HTML (English, like the prerendered body).
import { locales, DEFAULT_LOCALE } from './i18n';
import { routeIdOf, routeMeta, SITE_ORIGIN } from './routes';
import { blog } from './blog/data';

const BLOG_TITLE = "LeviMC's blog";
/** The social card (scripts/build-og.mjs → public/og/levimc.jpg). */
const OG_IMAGE = `${SITE_ORIGIN}/og/levimc.jpg`;
/** The language pages are prerendered in (og:locale wants the underscore form). */
const OG_LOCALE = 'en_US';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildHead(url: string): string {
  const id = routeIdOf(url);
  const { title, description } = routeMeta(url, locales[DEFAULT_LOCALE]);
  const tags = [`<title>${esc(title)}</title>`, `<meta name="description" content="${esc(description)}" />`];
  if (id === null) {
    tags.push('<meta name="robots" content="noindex" />');
  } else {
    const canonical = SITE_ORIGIN + url;
    tags.push(
      `<link rel="canonical" href="${esc(canonical)}" />`,
      '<meta property="og:type" content="website" />',
      '<meta property="og:site_name" content="LeviMC" />',
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(description)}" />`,
      `<meta property="og:url" content="${esc(canonical)}" />`,
      `<meta property="og:image" content="${OG_IMAGE}" />`,
      '<meta property="og:image:width" content="1200" />',
      '<meta property="og:image:height" content="630" />',
      `<meta property="og:locale" content="${OG_LOCALE}" />`,
      '<meta name="twitter:card" content="summary_large_image" />',
      '<meta name="twitter:site" content="@levimc_org" />',
    );
    if (id === 'blog') {
      const post = blog.posts.find((p) => p.url === url);
      if (post) {
        tags.push(
          `<meta property="article:published_time" content="${esc(post.date)}" />`,
          ...(post.author ? [`<meta property="article:author" content="${esc(post.author.name)}" />`] : []),
          ...[post.category, ...post.tags].filter((x) => x !== null).map((x) => `<meta property="article:tag" content="${esc(x.name)}" />`),
        );
        tags[tags.indexOf('<meta property="og:type" content="website" />')] = '<meta property="og:type" content="article" />';
        // a post is in its own language (most are Chinese), whatever the interface's
        tags[tags.indexOf(`<meta property="og:locale" content="${OG_LOCALE}" />`)] = `<meta property="og:locale" content="${esc(post.lang.replace('-', '_'))}" />`;
      }
    }
  }
  // the blog's feeds, discoverable from every page
  tags.push(
    `<link rel="alternate" type="application/rss+xml" title="${esc(BLOG_TITLE)}" href="${SITE_ORIGIN}/blog/rss.xml" />`,
    `<link rel="alternate" type="application/atom+xml" title="${esc(BLOG_TITLE)}" href="${SITE_ORIGIN}/blog/atom.xml" />`,
  );
  return tags.join('\n    ');
}
