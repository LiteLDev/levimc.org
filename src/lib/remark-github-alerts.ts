import type { Element, Root as HastRoot } from "hast";
import type { Blockquote, Root } from "mdast";
import { visit } from "unist-util-visit";

export const ALERT_TYPES = [
  "note",
  "tip",
  "important",
  "warning",
  "caution",
] as const;

export type AlertType = (typeof ALERT_TYPES)[number];

const ALERT_TITLES: Record<AlertType, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
};

/**
 * The levimc-kit admonition style each GitHub alert is drawn with — the same
 * mapping the kit's docs engine uses: note = book & quill, tip = emerald,
 * important = potion (violet, like GitHub's), warning = torch, caution = TNT.
 */
export const ALERT_KINDS = {
  note: "note",
  tip: "tip",
  important: "example",
  warning: "warning",
  caution: "danger",
} as const satisfies Record<AlertType, string>;

/** `[!WARNING]`, alone on the first line of a blockquote, as GitHub writes it. */
const ALERT_MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*$/i;

/**
 * The attribute (`data-pkg-alert`) that carries an alert's parts through the
 * HTML sanitizer. Its value starts with a token only this page knows, so raw
 * HTML in a README cannot pass for an alert; {@link rehypeGithubAlerts} turns
 * genuine ones into kit classes and drops the attribute everywhere.
 */
export const ALERT_ATTRIBUTE = "dataPkgAlert";

export interface GithubAlertsOptions {
  /** A token READMEs cannot know (see {@link ALERT_ATTRIBUTE}). */
  token: string;
}

/**
 * Finds GitHub's blockquote alerts (`> [!NOTE]`) in the markdown and marks
 * them up as levimc-kit admonitions — finished by {@link rehypeGithubAlerts}
 * once the HTML is sanitized:
 *
 *   <div class="kit-adm" data-kind="warning">
 *     <p class="kit-adm-title">Warning</p>
 *     <div class="kit-adm-body">…</div>
 *   </div>
 */
export function remarkGithubAlerts({ token }: GithubAlertsOptions) {
  return (tree: Root) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      // Already an alert, or the body of one.
      if (node.data?.hName) return;

      const [first] = node.children;
      if (first?.type !== "paragraph") return;

      const [text] = first.children;
      if (text?.type !== "text") return;

      const [markerLine = "", ...bodyLines] = text.value.split("\n");
      const marker = ALERT_MARKER.exec(markerLine);
      if (!marker?.[1]) return;

      const type = marker[1].toLowerCase() as AlertType;
      const body = bodyLines.join("\n");

      if (body === "") {
        // The marker was the whole paragraph: drop it, and a hard break the
        // author may have left dangling behind it.
        first.children.shift();
        if (first.children[0]?.type === "break") first.children.shift();
        if (first.children.length === 0) node.children.shift();
      } else {
        text.value = body;
      }

      const content = node.children;
      node.data = {
        hName: "div",
        hProperties: { [ALERT_ATTRIBUTE]: `${token} ${ALERT_KINDS[type]}` },
      };
      node.children = [
        {
          type: "paragraph",
          data: {
            hName: "p",
            hProperties: { [ALERT_ATTRIBUTE]: `${token} title` },
          },
          children: [{ type: "text", value: ALERT_TITLES[type] }],
        },
        {
          // A second blockquote node only to group the body; it is emitted as
          // a plain `div`, not as a quote.
          type: "blockquote",
          data: {
            hName: "div",
            hProperties: { [ALERT_ATTRIBUTE]: `${token} body` },
          },
          children: content,
        },
      ];
    });
  };
}

/**
 * Runs after the sanitizer: gives the alerts {@link remarkGithubAlerts} made
 * their kit classes, and strips the marker attribute from everything else.
 */
export function rehypeGithubAlerts({ token }: GithubAlertsOptions) {
  const prefix = `${token} `;
  return (tree: HastRoot) => {
    visit(tree, "element", (node: Element) => {
      const value = node.properties[ALERT_ATTRIBUTE];
      if (value === undefined) return;
      delete node.properties[ALERT_ATTRIBUTE];
      if (typeof value !== "string" || !value.startsWith(prefix)) return;
      const part = value.slice(prefix.length);
      if (part === "title") node.properties.className = ["kit-adm-title"];
      else if (part === "body") node.properties.className = ["kit-adm-body"];
      else {
        node.properties.className = ["kit-adm"];
        node.properties.dataKind = part;
      }
    });
  };
}
