// Converted locales (convertFrom): prose, headings, front matter and link fragments change script; code, link paths
// and URLs stay as written. A stub converter stands in for OpenCC.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { convertMarkdown, localeTarget, traditionalNetworkLinks } from '../docs/node/convert.ts';

const stub = (s) => s.replace(/简/g, '簡').replace(/体/g, '體').replace(/钩/g, '鉤');

test('prose, headings and front matter are converted', () => {
  assert.equal(convertMarkdown('---\ntitle: 简体\n---\n# 钩子\n\n简体文字', stub), '---\ntitle: 簡體\n---\n# 鉤子\n\n簡體文字');
});

test('code stays as written', () => {
  const md = '简体\n\n```cpp\n// 简体注释\nauto s = "简体";\n```\n\n- 简体\n\n    ~~~\n    简体\n    ~~~\n\n用 `简体` 写';
  assert.equal(
    convertMarkdown(md, stub),
    '簡體\n\n```cpp\n// 简体注释\nauto s = "简体";\n```\n\n- 簡體\n\n    ~~~\n    简体\n    ~~~\n\n用 `简体` 写',
  );
});

test('link paths and URLs stay; fragments follow the converted headings', () => {
  assert.equal(convertMarkdown('[简体](简体/钩子.md#钩子)', stub), '[簡體](简体/钩子.md#鉤子)');
  assert.equal(convertMarkdown('<a href="简体.md#简体">简体</a>', stub), '<a href="简体.md#簡體">簡體</a>');
  assert.equal(convertMarkdown('<img src="img/简体.png"> https://example.com/简体 <https://example.com/钩>', stub), '<img src="img/简体.png"> https://example.com/简体 <https://example.com/钩>');
});

test('links to another LeviMC site follow the script: zh-Hans → zh-Hant (kit 2.21.1)', () => {
  const md = '见[教程](https://levimc.org/tutorials/zh-Hans/server/first-server/)和 https://levimc.org/lip/zh-Hans/faq.html ，[本站](../zh/x.md)、[别处](https://example.com/zh-Hans/)\n\n```\nhttps://levimc.org/zh-Hans/\n```';
  const out = convertMarkdown(md, stub);
  assert.match(out, /\(https:\/\/levimc\.org\/tutorials\/zh-Hant\/server\/first-server\/\)/);
  assert.match(out, / https:\/\/levimc\.org\/lip\/zh-Hant\/faq\.html /);
  assert.match(out, /\(https:\/\/example\.com\/zh-Hans\/\)/);
  assert.match(out, /\(\.\.\/zh\/x\.md\)/);
  assert.match(out, /```\nhttps:\/\/levimc\.org\/zh-Hans\/\n```/);
  assert.equal(traditionalNetworkLinks('link: https://levimc.org/zh-Hans/about/'), 'link: https://levimc.org/zh-Hant/about/');
});

test('relative targets naming the source locale point at the converted locale\'s file where it exists (kit 2.24.0)', () => {
  const root = mkdtempSync(join(tmpdir(), 'kit-convert-'));
  try {
    for (const f of ['images/zh-Hans/a.svg', 'images/zh-Hant/a.svg', 'images/zh-Hans/only.svg', 'zh-Hant/x.md']) {
      mkdirSync(join(root, dirname(f)), { recursive: true });
      writeFileSync(join(root, f), '');
    }
    const page = { from: 'zh-Hans', to: 'zh-Hant', contentRoot: root, rel: 'zh-Hans/play/p.md' };
    const conv = (md) => convertMarkdown(md, stub, page);
    // replaced when the zh-Hant file exists: markdown images and links, <img src>, href, query and fragment kept
    assert.equal(conv('![简体](../../images/zh-Hans/a.svg)'), '![簡體](../../images/zh-Hant/a.svg)');
    assert.equal(conv('<img src="../../images/zh-Hans/a.svg" alt="简体">'), '<img src="../../images/zh-Hant/a.svg" alt="簡體">');
    assert.equal(conv("<a href='../../images/zh-Hans/a.svg?v=1#简体'>简体</a>"), "<a href='../../images/zh-Hant/a.svg?v=1#簡體'>簡體</a>");
    assert.equal(conv('[x](../../images/zh-Hans/a.svg "简体")'), '[x](../../images/zh-Hant/a.svg "簡體")');
    // unchanged when it does not exist, or the path leaves the content dir
    assert.equal(conv('![x](../../images/zh-Hans/only.svg)'), '![x](../../images/zh-Hans/only.svg)');
    assert.equal(conv('![x](../../images/zh-Hans/none.svg)'), '![x](../../images/zh-Hans/none.svg)');
    assert.equal(conv('![x](../../../images/zh-Hans/a.svg)'), '![x](../../../images/zh-Hans/a.svg)');
    // a segment equal to the code only, not a substring
    assert.equal(conv('![x](../../images/zh-Hans-old/a.svg)'), '![x](../../images/zh-Hans-old/a.svg)');
    // code spans and blocks stay as written
    assert.equal(conv('`![x](../../images/zh-Hans/a.svg)`'), '`![x](../../images/zh-Hans/a.svg)`');
    assert.equal(conv('```md\n![x](../../images/zh-Hans/a.svg)\n```'), '```md\n![x](../../images/zh-Hans/a.svg)\n```');
    // absolute URLs: only levimc.org's rule applies
    assert.equal(conv('![x](/images/zh-Hans/a.svg) [y](https://example.com/images/zh-Hans/a.svg) [z](https://levimc.org/zh-Hans/tutorials/)'),
      '![x](/images/zh-Hans/a.svg) [y](https://example.com/images/zh-Hans/a.svg) [z](https://levimc.org/zh-Hant/tutorials/)');
    // reference definitions too (their labels stay prose, like the references using them); footnotes are prose
    assert.equal(conv('![简体][简]\n\n[简]: ../../images/zh-Hans/a.svg#简体\n[^1]: 简体'), '![簡體][簡]\n\n[簡]: ../../images/zh-Hant/a.svg#簡體\n[^1]: 簡體');
    // a folder is not a file
    assert.equal(conv('[x](../../zh-Hans)'), '[x](../../zh-Hans)');
    // without page info nothing moves
    assert.equal(convertMarkdown('![x](../../images/zh-Hans/a.svg)', stub), '![x](../../images/zh-Hans/a.svg)');
    assert.equal(localeTarget('../x.md', page), '../x.md');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});