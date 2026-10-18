import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { FONT_HEAD_HTML } from './kit/components/fonts.ts';
import { PREPAINT_SCRIPT } from './src/prepaint.ts';
import { levimcBlog } from './blog/plugin.ts';

/** Inlines the no-flash theme/locale script and the kit's web fonts into index.html. */
function levimcHead(): Plugin {
  return {
    name: 'levimc-head',
    transformIndexHtml(html) {
      return html.replace('<!--prepaint-->', () => `<script>${PREPAINT_SCRIPT}</script>`).replace('<!--fonts-->', () => FONT_HEAD_HTML);
    },
  };
}

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  // levimcBlog: content/blog → the /blog/ pages' data (virtual modules) and feeds
  plugins: [levimcBlog(), react(), tailwindcss(), levimcHead()],
});
