import assert from "node:assert/strict";
import { test } from "node:test";
import type { Element, Root as HastRoot } from "hast";
import type { Blockquote, Paragraph, Root } from "mdast";
import { rehypeGithubAlerts, remarkGithubAlerts } from "./remark-github-alerts.ts";

const TOKEN = "t0k3n";
const paragraph = (value: string): Paragraph => ({ type: "paragraph", children: [{ type: "text", value }] });
const quote = (...children: Paragraph[]): Blockquote => ({ type: "blockquote", children });

function run(...children: Blockquote[]): Root {
  const tree: Root = { type: "root", children };
  remarkGithubAlerts({ token: TOKEN })(tree);
  return tree;
}

test("an alert is marked up as a kit admonition with a title and a body", () => {
  const tree = run(quote(paragraph("[!WARNING]\nMind the creepers.")));
  const node = tree.children[0] as Blockquote;
  assert.equal(node.data?.hName, "div");
  assert.deepEqual(node.data?.hProperties, { dataPkgAlert: `${TOKEN} warning` });
  const [title, body] = node.children as [Paragraph, Blockquote];
  assert.deepEqual(title.data?.hProperties, { dataPkgAlert: `${TOKEN} title` });
  assert.deepEqual(title.children, [{ type: "text", value: "Warning" }]);
  assert.equal(body.data?.hName, "div");
  assert.deepEqual(body.data?.hProperties, { dataPkgAlert: `${TOKEN} body` });
  assert.deepEqual(body.children, [paragraph("Mind the creepers.")]);
});

test("GitHub's alert types map to the kit's styles", () => {
  const kinds = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"].map((type) => {
    const node = run(quote(paragraph(`[!${type}]`), paragraph("x"))).children[0] as Blockquote;
    return (node.data?.hProperties as { dataPkgAlert: string }).dataPkgAlert.split(" ")[1];
  });
  assert.deepEqual(kinds, ["note", "tip", "example", "warning", "danger"]);
});

test("a marker alone in its paragraph is dropped", () => {
  const node = run(quote(paragraph("[!tip]"), paragraph("Body."))).children[0] as Blockquote;
  const body = node.children[1] as Blockquote;
  assert.deepEqual(body.children, [paragraph("Body.")]);
});

test("ordinary quotes are left alone", () => {
  const node = run(quote(paragraph("Just a quote [!NOTE]"))).children[0] as Blockquote;
  assert.equal(node.data, undefined);
});

const div = (dataPkgAlert: string): Element => ({
  type: "element",
  tagName: "div",
  properties: { dataPkgAlert },
  children: [],
});

test("only marks with the token become kit classes; every mark is removed", () => {
  const tree: HastRoot = {
    type: "root",
    children: [div(`${TOKEN} danger`), div(`${TOKEN} title`), div(`${TOKEN} body`), div("guess danger"), div(TOKEN)],
  };
  rehypeGithubAlerts({ token: TOKEN })(tree);
  const props = tree.children.map((node) => (node as Element).properties);
  assert.deepEqual(props, [
    { className: ["kit-adm"], dataKind: "danger" },
    { className: ["kit-adm-title"] },
    { className: ["kit-adm-body"] },
    {},
    {},
  ]);
});
