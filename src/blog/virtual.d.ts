// Virtual modules of blog/plugin.ts (typed in src/blog/data.ts: an ambient module cannot import the types).
declare module 'virtual:levimc-blog' {
  export const blog: unknown;
  /** Every prerendered blog route (trailing slash). */
  export const routes: string[];
  /** Lazily loaded rendered markdown per document id (post slug or "page:<name>"). */
  export const docs: Record<string, () => Promise<{ default: unknown }>>;
}
declare module 'virtual:levimc-blog/tokens.css';
