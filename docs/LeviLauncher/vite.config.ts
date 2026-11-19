import { defineConfig } from 'vite';
import { kitDocs } from './kit/docs/node/vite.ts';
import docs from './docs.config.ts';

export default defineConfig({
  plugins: [kitDocs(docs)],
  // The app chunk carries the navigation of all nine locales (every page under every prefix): with the Concepts and
  // Reference sections it is a little over Vite's default 500 kB warning limit.
  build: { chunkSizeWarningLimit: 700 },
});
