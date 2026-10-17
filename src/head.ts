// Per-route <head> tags for the prerendered HTML (English, like the prerendered body).
import { locales, DEFAULT_LOCALE } from './i18n';
import { routeIdOf, routeMeta, SITE_ORIGIN } from './routes';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildHead(url: string): string {
  const id = routeIdOf(url);
  const { title, description } = routeMeta(id, locales[DEFAULT_LOCALE]);
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
      '<meta name="twitter:card" content="summary" />',
      '<meta name="twitter:site" content="@levimc_org" />',
    );
  }
  return tags.join('\n    ');
}
