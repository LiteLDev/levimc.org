import type { Options } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import {
  ALERT_ATTRIBUTE,
  rehypeGithubAlerts,
  remarkGithubAlerts,
} from "./remark-github-alerts.ts";
import { rehypeRepairAnchors } from "./rehype-repair-anchors.ts";

/**
 * A token README authors cannot know, marking the alerts this site renders
 * (see `remark-github-alerts.ts`). It never reaches the HTML, so the server
 * and the browser render the same markup with different tokens.
 */
const ALERT_TOKEN = `pkg${Math.random().toString(36).slice(2)}`;

/**
 * GitHub's own sanitizer, plus the attribute that carries GitHub alerts
 * through it.
 *
 * READMEs come from third-party repositories, so their HTML is sanitized
 * rather than trusted: `defaultSchema` already drops `script`, event handlers,
 * `style`, `class` and `javascript:` URLs, and leaves the presentational
 * attributes (`align`, `width`, `height`) READMEs actually use.
 */
export const README_SANITIZE_SCHEMA: typeof defaultSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div ?? []), ALERT_ATTRIBUTE],
    p: [...(defaultSchema.attributes?.p ?? []), ALERT_ATTRIBUTE],
  },
};

/**
 * How a README becomes HTML, at build time and in the browser alike: GFM,
 * GitHub alerts as kit admonitions, raw HTML (sanitized), GitHub-style
 * heading ids, and in-page links that reach them.
 */
export const README_PLUGINS = {
  remarkPlugins: [remarkGfm, [remarkGithubAlerts, { token: ALERT_TOKEN }]],
  rehypePlugins: [
    rehypeRaw,
    [rehypeSanitize, README_SANITIZE_SCHEMA],
    [rehypeGithubAlerts, { token: ALERT_TOKEN }],
    rehypeSlug,
    rehypeRepairAnchors,
  ],
} satisfies Pick<Options, "remarkPlugins" | "rehypePlugins">;
