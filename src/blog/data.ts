// The blog's data in the app: metadata of every post/page (small, in the main bundle) and the rendered
// markdown of each post/page as its own lazily loaded chunk.
import { useEffect, useState } from 'react';
import * as virtualBlog from 'virtual:levimc-blog';
import type { BlogData, BlogDoc, BlogPost, BlogTerm } from '../../blog/types.ts';

export const blog = virtualBlog.blog as BlogData;
const blogRoutes = virtualBlog.routes;
const docs = virtualBlog.docs as Record<string, () => Promise<{ default: BlogDoc }>>;
export type { BlogDoc, BlogPost, BlogTerm };

export const BLOG_ROUTES: readonly string[] = blogRoutes;
const ROUTE_SET = new Set(blogRoutes);

/** What a blog URL shows (null: not a blog page). */
export type BlogView =
  | { kind: 'index'; page: number }
  | { kind: 'post'; post: BlogPost }
  | { kind: 'page'; name: string }
  | { kind: 'tags' }
  | { kind: 'tag'; term: BlogTerm; page: number }
  | { kind: 'categories' }
  | { kind: 'category'; term: BlogTerm; page: number }
  | { kind: 'archives'; year?: string; month?: string; page: number };

/** Resolve a pathname (exact, case-sensitive — like GitHub Pages) to a blog view. */
export function resolveBlogPath(pathname: string): BlogView | null {
  if (!ROUTE_SET.has(pathname)) return null;
  let rest = pathname.slice('/blog/'.length);
  let page = 1;
  const pm = /^(.*?)page\/(\d+)\/$/.exec(rest);
  if (pm) {
    rest = pm[1]!;
    page = Number(pm[2]);
  }
  if (rest === '') return { kind: 'index', page };
  const post = blog.posts.find((p) => p.url === pathname);
  if (post) return { kind: 'post', post };
  const pageDoc = Object.values(blog.pages).find((p) => p.url === pathname);
  if (pageDoc) return { kind: 'page', name: pageDoc.name };
  if (rest === 'tags/') return { kind: 'tags' };
  if (rest === 'categories/') return { kind: 'categories' };
  const base = '/blog/' + rest;
  const tag = blog.tags.find((t) => t.url === base);
  if (tag) return { kind: 'tag', term: tag, page };
  const cat = blog.categories.find((t) => t.url === base);
  if (cat) return { kind: 'category', term: cat, page };
  const am = /^archives\/(?:(\d{4})\/(?:(\d{2})\/)?)?$/.exec(rest);
  if (am) return { kind: 'archives', year: am[1], month: am[2], page };
  return null;
}

/** Document id of the markdown a view renders. */
export function docIdOf(view: BlogView | null): string | null {
  if (!view) return null;
  if (view.kind === 'post') return view.post.slug;
  if (view.kind === 'page') return `page:${view.name}`;
  return null;
}

const cache = new Map<string, BlogDoc>();

export async function loadBlogDoc(id: string): Promise<BlogDoc | undefined> {
  const hit = cache.get(id);
  if (hit) return hit;
  const load = docs[id];
  if (!load) return undefined;
  const doc = (await load()).default;
  cache.set(id, doc);
  return doc;
}

/** Load the markdown of the page at `pathname` before hydrating it (so the first render matches the HTML). */
export function preloadBlogPath(pathname: string): Promise<unknown> {
  const id = docIdOf(resolveBlogPath(pathname));
  return id ? loadBlogDoc(id) : Promise.resolve();
}

/** The rendered markdown of `id`: synchronously when already loaded (prerender, first load), else after loading. */
export function useBlogDoc(id: string): BlogDoc | undefined {
  const [loaded, setLoaded] = useState<{ id: string; doc: BlogDoc | undefined } | null>(null);
  useEffect(() => {
    if (cache.has(id)) return;
    let live = true;
    void loadBlogDoc(id).then((doc) => live && setLoaded({ id, doc }));
    return () => {
      live = false;
    };
  }, [id]);
  return cache.get(id) ?? (loaded?.id === id ? loaded.doc : undefined);
}

/** Posts newest first, paged like Hexo (per_page). */
export function pageOf<T>(items: readonly T[], page: number): { items: T[]; pageCount: number } {
  const per = blog.perPage;
  return { items: items.slice((page - 1) * per, page * per), pageCount: Math.max(1, Math.ceil(items.length / per)) };
}

export const pagedHref = (base: string, page: number) => (page <= 1 ? base : `${base}page/${page}/`);
