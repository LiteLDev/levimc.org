// Vite plugin: compiles content/blog at build start and exposes it to the app through virtual modules —
//   virtual:levimc-blog            { blog (metadata of every post/page), routes, docs: { id: () => import(…) } }
//   virtual:levimc-blog/doc/<id>   one lazily loaded chunk per post / page ({ html, toc, lang })
//   virtual:levimc-blog/tokens.css Shiki token colours of the code blocks
// and emits the feeds (blog/rss.xml, blog/atom.xml, blog/feed.json) with the client build.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import { buildBlog, type BuiltBlog } from './content.ts';
import { feeds } from './feeds.ts';

const MAIN_ID = 'virtual:levimc-blog';
const DOC_PREFIX = 'virtual:levimc-blog/doc/';
const TOKENS_ID = 'virtual:levimc-blog/tokens.css';
const R_MAIN = '\0levimc-blog';
const R_DOC = '\0levimc-blog-doc:';
// a path-like id, so Vite's CSS pipeline processes it
const R_TOKENS = '/__levimc-blog-tokens.css';

export function levimcBlog(): Plugin {
  let root = process.cwd();
  let isSsr = false;
  let isBuild = false;
  let built: Promise<BuiltBlog> | null = null;
  const ensure = () => (built ??= buildBlog(root));

  return {
    name: 'levimc-blog',
    enforce: 'pre',
    config(vc, env) {
      root = vc.root ? resolve(vc.root) : process.cwd();
      isSsr = !!env.isSsrBuild;
      isBuild = env.command === 'build';
      return {
        build: isSsr
          ? undefined
          : { rollupOptions: { output: { chunkFileNames: (c) => (c.facadeModuleId?.startsWith(R_DOC) ? 'assets/blog/[name].[hash].js' : 'assets/[name].[hash].js') } } },
      };
    },
    async buildStart() {
      const b = await ensure();
      if (isBuild && !isSsr) for (const w of b.warnings) this.warn(`[blog] ${w}`);
      for (const w of b.warnings) if (/not self-hosted/.test(w) && isBuild) this.error(`[blog] ${w}`);
    },
    resolveId(id) {
      if (id === MAIN_ID) return R_MAIN;
      if (id.startsWith(DOC_PREFIX)) return R_DOC + id.slice(DOC_PREFIX.length);
      if (id === TOKENS_ID) return R_TOKENS;
      return null;
    },
    async load(id) {
      if (id === R_MAIN) {
        const b = await ensure();
        const docs = [...b.docs.keys()].map((k) => `  ${JSON.stringify(k)}: () => import(${JSON.stringify(DOC_PREFIX + encodeURIComponent(k))})`).join(',\n');
        return `export const blog = ${JSON.stringify(b.data)};\nexport const routes = ${JSON.stringify(b.routes)};\nexport const docs = {\n${docs}\n};\n`;
      }
      if (id.startsWith(R_DOC)) {
        const b = await ensure();
        const doc = b.docs.get(decodeURIComponent(id.slice(R_DOC.length)));
        return `export default ${JSON.stringify(doc ?? { html: '', toc: [], lang: 'zh-CN' })};`;
      }
      if (id === R_TOKENS) return (await ensure()).tokenCss;
      return null;
    },
    async generateBundle(_out, bundle) {
      if (isSsr) return;
      const b = await ensure();
      for (const [fileName, source] of Object.entries(feeds(b))) this.emitFile({ type: 'asset', fileName, source });
      // route → its markdown chunk, so prerender.mjs can modulepreload it (the client waits for it before hydrating)
      const chunkOf = new Map<string, string>();
      for (const c of Object.values(bundle))
        if (c.type === 'chunk' && c.facadeModuleId?.startsWith(R_DOC)) chunkOf.set(decodeURIComponent(c.facadeModuleId.slice(R_DOC.length)), c.fileName);
      const preload: Record<string, string> = {};
      const add = (url: string, id: string) => {
        const file = chunkOf.get(id);
        if (file) preload[url] = file;
      };
      for (const p of b.data.posts) add(p.url, p.slug);
      for (const [name, page] of Object.entries(b.data.pages)) add(page.url, `page:${name}`);
      mkdirSync(join(root, '.kit'), { recursive: true });
      writeFileSync(join(root, '.kit/blog-preload.json'), JSON.stringify(preload, null, 2) + '\n');
    },
    configureServer(server: ViteDevServer) {
      const dir = join(root, 'content/blog');
      server.watcher.add(dir);
      server.watcher.on('all', (_e, file) => {
        if (!resolve(file).startsWith(dir)) return;
        built = null;
        for (const id of [R_MAIN, R_TOKENS]) {
          const m = server.moduleGraph.getModuleById(id);
          if (m) server.moduleGraph.invalidateModule(m);
        }
        for (const m of server.moduleGraph.idToModuleMap.values()) if (m.id?.startsWith(R_DOC)) server.moduleGraph.invalidateModule(m);
        server.ws.send({ type: 'full-reload' });
      });
      // dev: serve the feeds too
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0]!.replace(/^\//, '');
        const f = feeds(await ensure())[path];
        if (f === undefined) return next();
        res.setHeader('Content-Type', path.endsWith('.json') ? 'application/json' : 'application/xml');
        res.end(f);
      });
    },
  };
}
