// Demo plain Vite app (levimc.org / levimc.org/mods shape): the GlobalBar is the site's only header and carries
// the app's own languages (state, not part of the URL); same-site bar links navigate inside the app.
import { Link, Route, Routes, useLocation } from 'react-router';
import { GlobalBar } from '../../kit/components/GlobalBar';
import { SiteFooter } from '../../kit/components/SiteFooter';
import { PaintedBackdrop } from '../../kit/components/PaintedBackdrop';
import { PaintedHero } from '../../kit/components/PaintedHero';
import { ThemeProvider } from '../../kit/components/theme';
import { Card } from '../../kit/components/Card';
import { Badge } from '../../kit/components/Badge';
import { usePreferredLocale } from '../../kit/components/locale';
import { DOCS_PROJECTS } from '../../kit/components/projects';
import type { LinkLikeProps } from '../../kit/components/LocaleSwitcher';
import { LOCALES } from './locales';

/** The app pretends to live at https://levimc.org, so the bar's Home / Projects tabs are in-app links. */
export const SITE_ORIGIN = 'https://levimc.org';
/** The paths this app renders; the bar's other levimc.org links (About, Blog …) load from the server. */
const isAppPath = (p: string) => p === '/' || p.startsWith('/projects/');

const RouterLink = ({ href, children, ...rest }: LinkLikeProps) => (
  <Link to={href} {...(rest as object)}>
    {children}
  </Link>
);

type L = (typeof LOCALES)[number];

function Home({ t }: { t: L }) {
  return (
    <main id="main">
      <PaintedHero
        eyebrow="LeviMC"
        name={t.title}
        text={t.text}
        tagline={t.tagline}
        badge={<Badge tone="grass">v1.1.0</Badge>}
        aside={
          <div className="px-card kit-code" style={{ padding: '1rem 1.25rem' }}>
            <code>lip install github.com/LiteLDev/LeviLamina@1.9.6</code>
          </div>
        }
        actions={[
          { theme: 'brand', text: t.projects, link: '/projects/' },
          { theme: 'alt', text: 'GitHub', link: 'https://github.com/LiteLDev' },
        ]}
        linkComponent={RouterLink}
      />
    </main>
  );
}
function Projects({ t }: { t: L }) {
  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-6 py-12">
      <h1 className="mb-8 font-display text-4xl">{t.projects}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DOCS_PROJECTS.map((p) => (
          <Card key={p.id} icon={<img className="kit-card-logo" src={p.logo} alt="" width={52} height={52} />} title={p.name} description={p.repo} href={p.url} />
        ))}
      </div>
    </main>
  );
}
function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-display text-4xl">404</h1>
    </main>
  );
}

export function App() {
  const loc = useLocation();
  const [t, setLocale] = usePreferredLocale(LOCALES, LOCALES[0]);
  const current = loc.pathname === '/' ? 'home' : loc.pathname.startsWith('/projects') ? 'projects' : undefined;
  return (
    <ThemeProvider>
      <PaintedBackdrop scene={loc.pathname !== '/'} />
      <div className="kit-shell kit-above-backdrop" lang={t.lang}>
        <GlobalBar
          current={current}
          locale={t.lang}
          sticky
          siteOrigin={SITE_ORIGIN}
          linkComponent={RouterLink}
          isAppPath={isAppPath}
          languages={{ options: LOCALES.map((l) => ({ code: l.code, label: l.label, lang: l.lang })), current: t.code, onSelect: setLocale }}
        />
        <Routes>
          <Route path="/" element={<Home t={t} />} />
          <Route path="/projects/" element={<Projects t={t} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SiteFooter locale={t.lang} siteOrigin={SITE_ORIGIN} linkComponent={RouterLink} isAppPath={isAppPath} />
      </div>
    </ThemeProvider>
  );
}
