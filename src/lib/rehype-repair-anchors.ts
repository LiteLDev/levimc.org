import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";
import { decodeFragment } from "./markdown.ts";

const CLOBBER_PREFIX = "user-content-";
const HEADING = /^h[1-6]$/;
/** `#top` with no such element scrolls to the top of the page: never a heading to guess. */
const TOP = "top";

/**
 * Points in-page links (`#…`) that name no element of the README at the one
 * they mean, where that is unambiguous:
 *
 * - `#x` for raw HTML's `id="x"` / `name="x"`, which the sanitizer renames to
 *   `user-content-x` (GitHub resolves these with a script);
 * - `#特性` for the only heading whose id contains it (`-效果演示与特性`), when
 *   the author shortened a heading's anchor.
 *
 * Runs after heading ids are assigned. Links that already work, `#top`, and
 * fragments matching no heading or several, are left as written.
 */
export function rehypeRepairAnchors() {
  return (tree: Root) => {
    const targets = new Set<string>();
    const headings: string[] = [];
    visit(tree, "element", (node: Element) => {
      const { id, name } = node.properties;
      if (typeof id === "string" && id) {
        targets.add(id);
        if (HEADING.test(node.tagName)) headings.push(id);
      }
      if (node.tagName === "a" && typeof name === "string" && name) targets.add(name);
    });

    visit(tree, "element", (node: Element) => {
      const { href } = node.properties;
      if (node.tagName !== "a" || typeof href !== "string" || !href.startsWith("#") || href.length < 2) {
        return;
      }
      const fragment = decodeFragment(href.slice(1));
      if (targets.has(fragment)) return;
      if (targets.has(CLOBBER_PREFIX + fragment)) {
        node.properties.href = `#${CLOBBER_PREFIX}${fragment}`;
        return;
      }
      const wanted = fragment.toLowerCase();
      if (wanted === TOP) return;
      const matches = headings.filter((id) => id.toLowerCase().includes(wanted));
      if (matches.length === 1) node.properties.href = `#${matches[0]}`;
    });
  };
}
