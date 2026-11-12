import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { DOWNLOADS, FILE, compareDesc, format, latestOf, merge } from './update.mjs';

const answer = (win, linux) => ({
  result: {
    links: [
      { downloadType: 'serverBedrockWindows', downloadUrl: `https://www.minecraft.net/bedrockdedicatedserver/bin-win/bedrock-server-${win}.zip` },
      { downloadType: 'serverBedrockLinux', downloadUrl: `https://www.minecraft.net/bedrockdedicatedserver/bin-linux/bedrock-server-${linux}.zip` },
      { downloadType: 'serverBedrockPreviewWindows', downloadUrl: 'https://www.minecraft.net/bedrockdedicatedserver/bin-win-preview/bedrock-server-1.26.70.24.zip' },
      { downloadType: 'serverJar', downloadUrl: 'https://piston-data.mojang.com/v1/objects/0/server.jar' },
    ],
  },
});

test('compareDesc orders by the numbers, newest first', () => {
  assert.deepEqual(['1.9.0.15', '1.16.100.04', '1.16.20.03', '1.26.0.2'].sort(compareDesc), ['1.26.0.2', '1.16.100.04', '1.16.20.03', '1.9.0.15']);
  assert.equal(compareDesc('1.16.1.02', '1.16.1.2'), 0);
});

test('latestOf keeps the releases only, keyed by side/platform', () => {
  assert.deepEqual(latestOf(answer('1.26.63.1', '1.26.63.1')), { 'server/win-x64': '1.26.63.1', 'server/linux-x64': '1.26.63.1' });
});

test('latestOf refuses an answer without a release, or with a bad version', () => {
  assert.throws(() => latestOf({ result: { links: [] } }), /names no server\/win-x64/);
  assert.throws(() => latestOf(answer('1.26.63', '1.26.63.1')), /no version/);
});

test('merge adds new versions in order and keeps known ones once', () => {
  const have = { 'server/win-x64': ['1.26.62.1', '1.16.1.02'], 'server/linux-x64': ['1.26.62.1'] };
  const { versions, added } = merge(have, { 'server/win-x64': '1.26.63.1', 'server/linux-x64': '1.26.62.1' });
  assert.deepEqual(versions, { 'server/win-x64': ['1.26.63.1', '1.26.62.1', '1.16.1.02'], 'server/linux-x64': ['1.26.62.1'] });
  assert.deepEqual(added, [['server/win-x64', '1.26.63.1']]);
  assert.deepEqual(merge(have, { 'server/win-x64': '1.16.1.2' }).added, []);
  assert.deepEqual(have['server/win-x64'], ['1.26.62.1', '1.16.1.02'], 'the input is not changed');
});

test('versions.json is in the published shape: known keys, release versions, newest first, no duplicates', () => {
  const text = readFileSync(FILE, 'utf8');
  const versions = JSON.parse(text);
  assert.equal(text, format(versions));
  assert.deepEqual(Object.keys(versions).sort(), Object.values(DOWNLOADS).sort());
  for (const [key, list] of Object.entries(versions)) {
    assert.ok(list.length, key);
    for (const v of list) assert.match(v, /^\d+(?:\.\d+){3}$/, key);
    assert.deepEqual([...list].sort(compareDesc), list, `${key} is newest first`);
    for (let i = 1; i < list.length; i++) assert.notEqual(compareDesc(list[i - 1], list[i]), 0, `${key}: ${list[i]} twice`);
  }
});
