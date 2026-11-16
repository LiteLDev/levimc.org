// The Vite config of the pictures: LeviLauncher's own UI preview (e2e/support/ui-preview.config.mjs, which mocks every
// Go binding with window.__audit), plus the data of the tutorial (fixture.js) injected right after LeviLauncher's
// fixture, on the port in LEVIMC_SHOTS_PORT. capture.mjs copies this file and fixture.js into frontend/e2e/support/ of
// the LeviLauncher checkout.
import { readFileSync } from 'node:fs';
import previewConfig from './ui-preview.config.mjs';

export default (env) => {
  const config = previewConfig(env);
  return {
    ...config,
    plugins: [
      {
        name: 'levimc-shots-fixture',
        transformIndexHtml(html) {
          // At the end of <head>: after LeviLauncher's fixture, which is the first script of <head>, and before the
          // app, which is a module and so runs last.
          const script = readFileSync(new URL('./levimc-shots-fixture.js', import.meta.url), 'utf8');
          return html.replace('</head>', () => `<script>${script}</script></head>`);
        },
      },
      ...config.plugins,
    ],
    server: { ...config.server, port: Number(process.env.LEVIMC_SHOTS_PORT || 5179) },
  };
};
