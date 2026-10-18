import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import { README_PLUGINS } from "./readme-pipeline.ts";

const render = (markdown: string) =>
  renderToStaticMarkup(createElement(ReactMarkdown, { ...README_PLUGINS, children: markdown }));

test("GitHub alerts render as kit admonitions", () => {
  const html = render("> [!WARNING]\n> Mind the creepers.");
  assert.equal(
    html,
    '<div class="kit-adm" data-kind="warning">\n<p class="kit-adm-title">Warning</p>\n' +
      '<div class="kit-adm-body">\n<p>Mind the creepers.</p>\n</div>\n</div>',
  );
});

test("raw HTML cannot pass for a site admonition", () => {
  const html = render(
    '<div class="kit-adm" data-kind="danger" data-pkg-alert="x danger"><p class="kit-adm-title">Notice</p></div>',
  );
  assert.doesNotMatch(html, /kit-adm|data-kind|data-pkg-alert|class=/);
  assert.match(html, /Notice/);
});

test("in-page links reach the heading or element they mean", () => {
  const html = render(
    [
      "[badge](#特性) [usage](#usage) [raw](#anchor) [vague](#a) [nothing](#zzz) [up](#top)",
      "## ✨ 效果演示与特性",
      "## Usage",
      "## Alpha",
      "## Desktop setup",
      '<a name="anchor"></a>',
    ].join("\n\n"),
  );
  const hrefs = [...html.matchAll(/<a href="([^"]*)">/g)].map((m) => m[1]);
  // `#top` scrolls to the top of the page: it is not taken for `#desktop-setup`.
  assert.deepEqual(hrefs, ["#-效果演示与特性", "#usage", "#user-content-anchor", "#a", "#zzz", "#top"]);
});

test("<picture> sources keep working: srcset is resolved like src", () => {
  const html = renderToStaticMarkup(
    createElement(ReactMarkdown, {
      ...README_PLUGINS,
      children: '<picture><source media="(prefers-color-scheme: dark)" srcset="docs/dark.svg"><img src="docs/light.svg"></picture>',
    }),
  );
  // The pipeline keeps the attributes (the component resolves them; see markdown.test.ts).
  assert.match(html, /<source media="\(prefers-color-scheme: dark\)" srcSet="docs\/dark.svg"\/>/);
});

test("raw HTML is sanitized; headings get GitHub's ids", () => {
  const html = render('# Hello world\n\n<img src="x.png" onerror="alert(1)"><script>alert(1)</script>');
  assert.match(html, /<h1 id="hello-world">Hello world<\/h1>/);
  assert.doesNotMatch(html, /onerror|<script/);
});
