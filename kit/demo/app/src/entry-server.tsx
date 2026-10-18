import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { App } from './App';

const TITLES: Record<string, string> = { '/': 'LeviMC app demo', '/projects/': 'Projects | LeviMC app demo' };

export function render(url: string) {
  const html = renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  );
  return { html, head: `<title>${TITLES[url] ?? 'Not found | LeviMC app demo'}</title>`, lang: 'en' };
}
