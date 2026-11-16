// Converted locales (convertFrom): prose, headings, front matter and link fragments change script; code, link paths
// and URLs stay as written. A stub converter stands in for OpenCC.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { convertMarkdown, traditionalNetworkLinks } from '../docs/node/convert.ts';

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
