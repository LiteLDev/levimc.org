// Heading ids (kit/docs/node/markdown/slug.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugVitepress, slugPymdownx } from '../docs/node/markdown/slug.ts';

test('slugVitepress drops Latin accents and keeps the VitePress shape', () => {
  assert.equal(slugVitepress('Café & Crème'), 'cafe-creme');
  assert.equal(slugVitepress('1. Install'), '_1-install');
});

test('slugVitepress composes Korean and Japanese ids (NFC), so links to them match', () => {
  const ko = slugVitepress('배경 이미지와 인터페이스 재질');
  assert.equal(ko, '배경-이미지와-인터페이스-재질');
  assert.ok(ko.normalize('NFC') === ko);
  const ja = slugVitepress('ダウンロードとミラー');
  assert.equal(ja, 'ダウンロードとミラー');
  assert.ok(ja.normalize('NFC') === ja);
  assert.equal(slugVitepress('设置与个性化'), '设置与个性化');
});

test('slugPymdownx is unchanged', () => {
  assert.equal(slugPymdownx('🔑 SQL数据库'), '-sql数据库');
});
