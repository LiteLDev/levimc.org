// Per-route <head> tags for the prerendered HTML, in the page's language: title, description, canonical URL,
// the page in the other locales (hreflang, x-default = English) and Open Graph.
import { locales, DEFAULT_LOCALE, LOCALES, type Locale } from './i18n';
import { localeAlternates, localeOfPath, routeIdOf, routeMeta, SITE_ORIGIN } from './routes';
import { blog } from './blog/data';

const BLOG_TITLE = "LeviMC's blog";
/** The social card (scripts/build-og.mjs → public/og/levimc.jpg). */
const OG_IMAGE = `${SITE_ORIGIN}/og/levimc.jpg`;
/** og:locale of each locale (the underscore form, with a territory). */
const OG_LOCALES: Record<Locale, string> = { en: 'en_US', 'zh-Hans': 'zh_CN', 'zh-Hant': 'zh_TW' };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildHead(url: string): string {
  const id = routeIdOf(url);
  const locale = localeOfPath(url);
  const OG_LOCALE = OG_LOCALES[locale];
  const { title, description } = routeMeta(url, locales[locale]);
  const tags = [`<title>${esc(title)}</title>`, `<meta name="description" content="${esc(description)}" />`];
  if (id === null) {
    tags.push('<meta name="robots" content="noindex" />');
  } else {
    const canonical = SITE_ORIGIN + url;
    const alternates = localeAlternates(url);
    const others = alternates ? LOCALES.filter((l) => alternates[l.code] !== null) : [];
    tags.push(`<link rel="canonical" href="${esc(canonical)}" />`);
    // a page in every locale names each of them; a blog post (one language, one URL) none
    if (alternates && others.length > 1) {
      tags.push(
        ...others.map((l) => `<link rel="alternate" hreflang="${l.lang}" href="${esc(SITE_ORIGIN + alternates[l.code]!)}" />`),
        `<link rel="alternate" hreflang="x-default" href="${esc(SITE_ORIGIN + alternates[DEFAULT_LOCALE]!)}" />`,
      );
    }
    tags.push(
      '<meta property="og:type" content="website" />',
      '<meta property="og:site_name" content="LeviMC" />',
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(description)}" />`,
      `<meta property="og:url" content="${esc(canonical)}" />`,
      `<meta property="og:image" content="${OG_IMAGE}" />`,
      '<meta property="og:image:width" content="1200" />',
      '<meta property="og:image:height" content="630" />',
      `<meta property="og:locale" content="${OG_LOCALE}" />`,
      ...(others.length > 1 ? others.filter((l) => l.code !== locale).map((l) => `<meta property="og:locale:alternate" content="${OG_LOCALES[l.code]}" />`) : []),
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
        // a post is in its own language (most are Chinese)
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
