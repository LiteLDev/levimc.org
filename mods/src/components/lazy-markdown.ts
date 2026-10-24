import { lazy, type ComponentType } from "react";
import type { MarkdownProps } from "./markdown";

type MarkdownModule = typeof import("./markdown");

let loaded: MarkdownModule | undefined;
let loading: Promise<MarkdownModule> | undefined;

/**
 * The README renderer (react-markdown, GFM, raw HTML, sanitizer) is half of
 * the app's JavaScript and only mod pages need it, so it is a chunk of its
 * own. Mod pages load it before hydrating, and links to them start loading
 * it on hover.
 */
export function loadMarkdown(): Promise<MarkdownModule> {
  loading ??= import("./markdown").then(
    (module) => (loaded = module),
    (error: unknown) => {
      loading = undefined; // let the next attempt try again
      throw error;
    },
  );
  return loading;
}

/**
 * `Markdown`, rendered without suspending once {@link loadMarkdown} has
 * finished: the server and the hydrating client both wait for it first, so
 * both render the README in the same pass.
 */
export const LazyMarkdown = lazy<ComponentType<MarkdownProps>>(() => {
  if (loaded) {
    const { Markdown } = loaded;
    // A thenable that resolves synchronously, so React never suspends here.
    return {
      then: (resolve: (module: { default: typeof Markdown }) => void) =>
        resolve({ default: Markdown }),
    } as unknown as Promise<{ default: typeof Markdown }>;
  }
  return loadUntilLoaded().then(({ Markdown }) => ({ default: Markdown }));
});

/**
 * React remembers a failed lazy load for good, so keep trying (backing off)
 * instead: the page keeps what it shows until the chunk arrives.
 */
async function loadUntilLoaded(): Promise<MarkdownModule> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await loadMarkdown();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, Math.min(8000, 1000 * 2 ** attempt)));
    }
  }
}
