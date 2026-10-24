import assert from "node:assert/strict";
import { test } from "node:test";
import { loadShowcase, safeSvg, showcaseFiles } from "./showcase.ts";

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="#4f8a5b"/></svg>';

test("safeSvg: plain drawings, animations and embedded sprites pass", () => {
  assert.ok(safeSvg(SVG));
  assert.ok(safeSvg(`<?xml version="1.0"?>\n<!-- hud -->\n${SVG}`));
  assert.ok(
    safeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><g id="a"/></defs><use href="#a"/>' +
        '<image href="data:image/png;base64,iVBORw0KGgo=" width="9" height="9"/><animate attributeName="opacity" values="0;1" dur="1s"/>' +
        '<rect fill="url(#g)"/><style>@media (prefers-reduced-motion: reduce){*{animation:none}}</style></svg>',
    ),
  );
});

test("safeSvg: anything that can run script or reach out is refused", () => {
  for (const bad of [
    '<svg><script>alert(1)</script></svg>',
    '<svg onload="alert(1)"></svg>',
    '<svg><a href="javascript:alert(1)"><rect/></a></svg>',
    '<svg><foreignObject><div/></foreignObject></svg>',
    '<svg><image href="https://example.com/x.png"/></svg>',
    '<svg><image href="data:text/html;base64,PHNjcmlwdD4="/></svg>',
    '<svg><use href="other.svg#a"/></svg>',
    "<svg><style>@import 'https://example.com/x.css';</style></svg>",
    '<svg><rect fill="url(https://example.com/x)"/></svg>',
    '<!DOCTYPE svg [<!ENTITY x "y">]><svg/>',
    "<html><svg/></html>",
  ]) {
    assert.equal(safeSvg(bad), false, bad);
  }
});

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const mp4 = new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]);

test("loadShowcase: keeps valid items, copies their files, drops the rest", async (t) => {
  const raw = "https://raw.githubusercontent.com/Owner/Repo/HEAD/docs/showcase/";
  const served: Record<string, BodyInit> = {
    [`${raw}showcase.json`]: JSON.stringify({
      items: [
        { kind: "image", src: "a.png", width: 1280, height: 720, title: { en: "A", "zh-CN": "甲" }, caption: "One line" },
        { kind: "video", src: "b.mp4", poster: "a.png", width: 1280, height: 720, title: { en: "B" } },
        { kind: "svg", src: "c.svg", width: 64, height: 64, title: { en: "C" } },
        { kind: "svg", src: "evil.svg", width: 64, height: 64, title: { en: "Evil" } },
        { kind: "image", src: "../escape.png", width: 1, height: 1, title: { en: "Escape" } },
        { kind: "image", src: "fake.png", width: 1, height: 1, title: { en: "Not a PNG" } },
        { kind: "image", src: "a.png", width: 1, height: 1 },
        { kind: "gif", src: "d.gif", width: 1, height: 1, title: { en: "GIF" } },
      ],
    }),
    [`${raw}a.png`]: png,
    [`${raw}b.mp4`]: mp4,
    [`${raw}c.svg`]: SVG,
    [`${raw}evil.svg`]: '<svg onload="alert(1)"/>',
    [`${raw}fake.png`]: "<html>",
  };
  t.mock.method(globalThis, "fetch", async (url: string) =>
    url in served ? new Response(served[url]) : new Response("Not Found", { status: 404 }),
  );

  const items = await loadShowcase("https://github.com/Owner/Repo");
  assert.deepEqual(
    items.map((i) => [i.kind, i.src, i.poster ?? null]),
    [
      ["image", "/mods/showcase/Owner/Repo/a.png", null],
      ["video", "/mods/showcase/Owner/Repo/b.mp4", "/mods/showcase/Owner/Repo/a.png"],
      ["svg", "/mods/showcase/Owner/Repo/c.svg", null],
    ],
  );
  assert.deepEqual(items[0]!.title, { en: "A", "zh-CN": "甲" });
  assert.deepEqual(items[0]!.caption, { en: "One line" });
  assert.deepEqual([...showcaseFiles().keys()].sort(), [
    "showcase/Owner/Repo/a.png",
    "showcase/Owner/Repo/b.mp4",
    "showcase/Owner/Repo/c.svg",
  ]);
  assert.equal(showcaseFiles().get("showcase/Owner/Repo/b.mp4")!.type, "video/mp4");

  // no manifest, or not on GitHub: no gallery
  assert.deepEqual(await loadShowcase("https://github.com/Owner/Other"), []);
  assert.deepEqual(await loadShowcase("https://gitee.com/Owner/Repo"), []);
});
