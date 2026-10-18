// Plain Vite + React app (the shape of levimc.org / pkg.levimc.org) built with the vendored kit:
//   vite build app && vite build app --ssr src/entry-server.tsx --outDir .kit/ssr && node app/prerender.mjs
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createThemeInitScript } from '../kit/components/theme.ts';
import { FONT_HEAD_HTML } from '../kit/components/fonts.ts';
import { LOCALES } from './src/locales.ts';

// The pre-paint script: theme + language preference; a visitor whose language maps to another locale than the
// prerendered English does not see English first (the page is hidden until usePreferredLocale switched).
const initScript = createThemeInitScript({ appLocales: { locales: LOCALES, prerendered: 'en' } });

/** The pre-paint theme/language script and the fonts, before any stylesheet. */
const kitHead = (): Plugin => ({
  name: 'kit-head',
  transformIndexHtml: (html) => html.replace('<!--kit-head-->', () => `<script>${initScript}</script>\n    ${FONT_HEAD_HTML}`),
});

export default defineConfig({
  plugins: [kitHead(), react(), tailwindcss()],
});
