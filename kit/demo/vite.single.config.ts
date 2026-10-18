// The docs demo as a single-locale site (English only, at /Single/): the LeviMC chrome — bar, footer, the
// drawer's LeviMC links — follows the visitor's stored language; the content stays English.
//   npm run build:single && npm run preview:single && npm run smoke:single
import { defineConfig } from 'vite';
import { kitDocs } from './kit/docs/node/vite.ts';
import docs from './docs.config.ts';

export default defineConfig({
  plugins: [
    kitDocs({
      ...docs,
      base: '/Single/',
      outDir: 'dist-single',
      i18n: { ...docs.i18n!, locales: docs.i18n!.locales.filter((l) => l.code === 'en') },
      exclude: [...(docs.exclude ?? []), '**/*.zh.md'],
    }),
  ],
});
