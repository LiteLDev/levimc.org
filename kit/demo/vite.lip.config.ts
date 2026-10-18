import { defineConfig } from 'vite';
import { kitDocs } from './kit/docs/node/vite.ts';
import lip from './lip.config.ts';

export default defineConfig({
  plugins: [kitDocs(lip)],
});
