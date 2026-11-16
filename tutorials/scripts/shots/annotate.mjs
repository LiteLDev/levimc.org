#!/usr/bin/env node
// Annotated pictures of the real interface of an app, for the tutorials (SHOTS.md, next to this file).
//
// A picture is one SVG file per language: a capture of the app (PNG, JPEG or WebP, taken at a device pixel ratio of
// usually 2) embedded as a data URL, in a frame (a Windows window, an Android phone, or none), with annotations drawn
// above it as vectors in the visual language of lip's screenshots (lip: docs/SCREENSHOTS.md,
// tests/Lip.Cli.Tests/Tui/Screenshots/SvgRenderer.cs): boxes, ellipses, a dimmed focus, arrows from labels in the
// margins, numbered callouts with a legend, and keys to press. The same spec and capture give the same file, byte for
// byte.
//
//   node scripts/shots/annotate.mjs <spec.json>... [--out <dir>]
//
// As a module: renderShot(spec, lang, options) → the SVG text; writeShots(spec, outDir, options) writes
// <outDir>/<lang>/<name>.svg for every language; assertDesensitized(text, extra) for the capture scripts.
// Pure Node, no dependencies.
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The colors of the annotations, as lip draws them. */
export const COLORS = Object.freeze({
  note: '#ffa94d',
  dark: '#1a1d24',
  panel: '#272b35',
  border: '#3d4454',
  text: '#d8dee9',
  muted: '#9aa3b5',
  dim: '#0b0d11',
});

/** The languages of a spec that names none. */
export const DEFAULT_LANGUAGES = Object.freeze(['en', 'zh-Hans', 'zh-Hant']);

/** The frames a capture can be drawn in. */
export const FRAMES = Object.freeze(['windows', 'android', 'none']);

/** The kinds of annotations. */
export const KINDS = Object.freeze(['box', 'ellipse', 'focus', 'arrow', 'callout', 'keys']);

/** A file larger than this fails: a picture is downloaded by every reader of its page. */
export const MAX_BYTES = 600 * 1024;

const SIDES = ['left', 'right', 'top', 'bottom'];
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANGUAGE_TAG = /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-[A-Z]{2})?$/;

// The text of the annotations: 13 pixels high, whose characters are about 7.8 wide (CJK: two of them).
const LABEL_SIZE = 13;
const ADVANCE = 7.8;
const MARGIN = 10;
const PILL_HEIGHT = 22;
const PILL_GAP = 28;
const CALLOUT_RADIUS = 10;
const FOOTER_RADIUS = 9.5;
// How far a target may reach past the capture before it fails: the rectangles of a page are fractional.
const TOLERANCE = 0.5;

// A sans-serif font with Chinese characters, the first that the reader has.
const FONTS = {
  base: "system-ui,'Segoe UI'",
  hans: "'Microsoft YaHei UI','PingFang SC','Noto Sans CJK SC'",
  hant: "'Microsoft JhengHei UI','PingFang TC','Noto Sans CJK TC'",
};

/** The font family of the labels of a picture in a language: Traditional Chinese prefers its own fonts. */
export function fontFamily(lang) {
  const cjk = lang === 'zh-Hant' ? [FONTS.hant, FONTS.hans] : [FONTS.hans, FONTS.hant];
  return [FONTS.base, ...cjk, 'sans-serif'].join(',');
}

// The frames: how far the window reaches past the screen at each side, its corner and that of the screen.
const FRAME_GEOMETRY = {
  // The launcher draws its own title bar: the window is the capture, with rounded corners and a border.
  windows: { left: 0, top: 0, right: 0, bottom: 0, radius: 8, screen: 8 },
  // A phone held in landscape: a dark body around the screen, the camera in the left short side.
  android: { left: 36, top: 14, right: 36, bottom: 14, radius: 28, screen: 8 },
  none: { left: 0, top: 0, right: 0, bottom: 0, radius: 0, screen: 0 },
};

// ---------------------------------------------------------------------------------------------------------------------
// Numbers and text

/** A number as the picture writes it: at most two decimals, none that are zero. */
export function fmt(value) {
  if (!Number.isFinite(value)) throw new Error(`Not a finite number: ${value}`);
  const rounded = Math.round(Math.abs(value) * 100 + 1e-7) / 100;
  return rounded === 0 ? '0' : `${value < 0 ? '-' : ''}${rounded}`;
}

function escapeXml(text) {
  let out = '';
  for (const c of String(text)) {
    if (c === '&') out += '&amp;';
    else if (c === '<') out += '&lt;';
    else if (c === '>') out += '&gt;';
    else if (c === '"') out += '&quot;';
    else out += c < ' ' ? ' ' : c;
  }
  return out;
}

/** How many columns a character takes: 2 for CJK and other wide characters, 0 for marks and controls, else 1. */
export function charWidth(ch) {
  const value = ch.codePointAt(0) ?? 0;
  if (value < 0x20 || (value >= 0x7f && value < 0xa0)) return 0;
  if (/^[\p{Mn}\p{Me}\p{Cf}]$/u.test(ch)) return 0;
  const wide =
    (value >= 0x1100 && value <= 0x115f) ||
    (value >= 0x2e80 && value <= 0x303e) ||
    (value >= 0x3041 && value <= 0x33ff) ||
    (value >= 0x3400 && value <= 0x4dbf) ||
    (value >= 0x4e00 && value <= 0x9fff) ||
    (value >= 0xa000 && value <= 0xa4cf) ||
    (value >= 0xac00 && value <= 0xd7a3) ||
    (value >= 0xf900 && value <= 0xfaff) ||
    (value >= 0xfe30 && value <= 0xfe4f) ||
    (value >= 0xff00 && value <= 0xff60) ||
    (value >= 0xffe0 && value <= 0xffe6) ||
    (value >= 0x1f300 && value <= 0x1faff) ||
    (value >= 0x20000 && value <= 0x3fffd);
  return wide ? 2 : 1;
}

/** How many columns a text takes. */
export function textWidth(text) {
  let width = 0;
  for (const ch of text) width += charWidth(ch);
  return width;
}

const NOT_AT_START = '，。、；：！？）」』》〉】”’…—,.;:!?)]}%';
const NOT_AT_END = '（「『《〈【“‘([{';
const SOFT_BREAKS = '/\\.-_#@';

function breaksBetween(first, second) {
  const value = second.codePointAt(0) ?? 0;
  return (
    (charWidth(first) === 2 || charWidth(second) === 2) &&
    charWidth(second) > 0 &&
    first !== '‍' &&
    (value < 0x1f3fb || value > 0x1f3ff) &&
    !NOT_AT_START.includes(second) &&
    !NOT_AT_END.includes(first)
  );
}

function softBreakBetween(first, second) {
  return SOFT_BREAKS.includes(first) && !SOFT_BREAKS.includes(second);
}

function* units(paragraph, width) {
  let first = true;
  for (const word of paragraph.split(' ')) {
    let unit = '';
    let spaced = !first;
    const parts = textWidth(word) > width;
    first = false;
    let before = null;
    for (const ch of word) {
      if (before !== null && (breaksBetween(before, ch) || (parts && softBreakBetween(before, ch)))) {
        yield [unit, spaced];
        unit = '';
        spaced = false;
      }
      unit += ch;
      before = ch;
    }
    yield [unit, spaced];
  }
}

/**
 * The text as lines of at most `width` columns (lip's TextWidth.Wrap): broken at spaces, and before or after a wide
 * character as Chinese text is, but not before a closing mark or after an opening one; a word longer than a line
 * after the marks between its parts (/ \ . - _ # @), and where the line ends otherwise.
 */
export function wrap(text, width) {
  const lines = [];
  width = Math.max(1, Math.floor(width));
  for (const paragraph of String(text).replaceAll('\r', '').split('\n')) {
    let line = '';
    let used = 0;
    for (const [unit, spaced] of units(paragraph.replaceAll('\t', ' '), width)) {
      const w = textWidth(unit);
      let space = spaced && used > 0;
      if (used > 0 && used + (space ? 1 : 0) + w > width) {
        lines.push(line);
        line = '';
        used = 0;
        space = false;
      }
      if (space) {
        line += ' ';
        used++;
      }
      for (const ch of unit) {
        const cw = charWidth(ch);
        if (used > 0 && used + cw > width) {
          lines.push(line);
          line = '';
          used = 0;
        }
        line += ch;
        used += cw;
      }
    }
    lines.push(line);
  }
  return lines;
}

function glyphs(text) {
  const out = [];
  let column = 0;
  for (const ch of text) {
    const width = charWidth(ch);
    if (width > 0) {
      out.push({ text: ch, column, width });
      column += width;
    }
  }
  return out;
}

function kindOf(glyph) {
  if (glyph.text === ' ') return 'space';
  const value = glyph.text.codePointAt(0) ?? 0;
  if (value > 0x20 && value < 0x7f) return 'ascii';
  // Pictographs are wide too, but come from another font than the characters around them.
  return glyph.width === 2 && value < 0x1f000 ? 'wide' : 'other';
}

/**
 * A text as SVG text elements, as lip writes them: runs of ASCII (with single spaces) are one element stretched to
 * the width of their columns, wide characters each in the middle of their two columns, so that the width of a label
 * is known whatever the font of the reader.
 */
function textElements(text, x, y, attributes) {
  const list = glyphs(text);
  let svg = '';
  for (let i = 0; i < list.length; ) {
    const kind = kindOf(list[i]);
    if (kind === 'space') {
      i++;
      continue;
    }
    let end = i + 1;
    if (kind !== 'other') {
      while (end < list.length) {
        const next = kindOf(list[end]);
        if (next === kind) end++;
        else if (kind === 'ascii' && list[end].text === ' ' && end + 1 < list.length && kindOf(list[end + 1]) === 'ascii')
          end += 2;
        else break;
      }
    }
    const run = list.slice(i, end);
    const content = escapeXml(run.map((g) => g.text).join(''));
    const columns = run[run.length - 1].column + run[run.length - 1].width - run[0].column;
    if (kind === 'ascii') {
      svg += `<text x="${fmt(x + run[0].column * ADVANCE)}" y="${fmt(y)}" textLength="${fmt(columns * ADVANCE)}"`;
      svg += ' lengthAdjust="spacingAndGlyphs"';
    } else {
      const middles = run.map((g) => fmt(x + (g.column + g.width / 2) * ADVANCE)).join(' ');
      svg += `<text x="${middles}" y="${fmt(y)}" text-anchor="middle"`;
    }
    svg += `${attributes}>${content}</text>\n`;
    i = end;
  }
  return svg;
}

// ---------------------------------------------------------------------------------------------------------------------
// Images

/** The size in pixels and the media type of a PNG, JPEG or WebP image, read from its header. */
export function imageInfo(bytes) {
  const b = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (b.length >= 24 && b.readUInt32BE(0) === 0x89504e47 && b.readUInt32BE(4) === 0x0d0a1a0a) {
    return { type: 'image/png', width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let at = 2;
    while (at + 4 <= b.length) {
      if (b[at] !== 0xff) throw new Error('Not a JPEG image: a marker was expected.');
      const marker = b[at + 1];
      if (marker === 0xff) {
        at++;
        continue;
      }
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
        at += 2;
        continue;
      }
      const length = b.readUInt16BE(at + 2);
      const frame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (frame && at + 9 <= b.length) {
        return { type: 'image/jpeg', width: b.readUInt16BE(at + 7), height: b.readUInt16BE(at + 5) };
      }
      at += 2 + length;
    }
    throw new Error('A JPEG image without a frame header.');
  }
  if (b.length >= 30 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
    const chunk = b.toString('latin1', 12, 16);
    if (chunk === 'VP8 ') {
      return { type: 'image/webp', width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === 'VP8L') {
      const bits = b.readUInt32LE(21);
      return { type: 'image/webp', width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8X') {
      return { type: 'image/webp', width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
    }
  }
  throw new Error('Not a PNG, JPEG or WebP image.');
}

// ---------------------------------------------------------------------------------------------------------------------
// Specs

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !ArrayBuffer.isView(value);
}

/** Whether a value of a spec is given per language: an object whose keys are all language tags. */
function isLocalized(value) {
  if (!isPlainObject(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => LANGUAGE_TAG.test(key));
}

/** The value for a language of a value that may be given per language. */
function pick(value, lang, what) {
  if (!isLocalized(value)) return value;
  if (!(lang in value)) throw new Error(`${what} has no value for "${lang}".`);
  return value[lang];
}

/** A text that must be given for each language. */
function label(value, lang, what) {
  if (!isLocalized(value)) {
    throw new Error(`${what} must be given per language, as { "en": …, "zh-Hans": …, "zh-Hant": … }.`);
  }
  const text = value[lang];
  if (typeof text !== 'string' || text.trim() === '') throw new Error(`${what} has no text for "${lang}".`);
  return text;
}

function rect(value, what) {
  if (!isPlainObject(value)) throw new Error(`${what} must be { x, y, width, height }.`);
  for (const key of ['x', 'y', 'width', 'height']) {
    if (typeof value[key] !== 'number' || !Number.isFinite(value[key])) {
      throw new Error(`${what}.${key} must be a number.`);
    }
  }
  if (value.width <= 0 || value.height <= 0) throw new Error(`${what} is empty: ${JSON.stringify(value)}.`);
  return { x: value.x, y: value.y, width: value.width, height: value.height };
}

function within(r, width, height, what) {
  if (r.x < -TOLERANCE || r.y < -TOLERANCE || r.x + r.width > width + TOLERANCE || r.y + r.height > height + TOLERANCE) {
    throw new Error(
      `${what} ${JSON.stringify(r)} is not in the capture, which is ${fmt(width)}×${fmt(height)} CSS pixels.`,
    );
  }
}

function loadImage(source, options, what) {
  if (source instanceof Uint8Array) return source;
  if (typeof source !== 'string' || source === '') throw new Error(`${what} must be the path of a PNG, JPEG or WebP.`);
  const file = path.resolve(options.baseDir ?? process.cwd(), source);
  try {
    return readFileSync(file);
  } catch (error) {
    throw new Error(`${what}: cannot read ${file} (${error.code ?? error.message}).`);
  }
}

class Box {
  constructor(x, y, w, h) {
    Object.assign(this, { x, y, w, h });
  }
  get right() {
    return this.x + this.w;
  }
  get bottom() {
    return this.y + this.h;
  }
  get cx() {
    return this.x + this.w / 2;
  }
  get cy() {
    return this.y + this.h / 2;
  }
  grow(by) {
    return new Box(this.x - by, this.y - by, this.w + 2 * by, this.h + 2 * by);
  }
}

/** The middle of the circle of a callout: 14 pixels beyond the side of its target. */
function calloutCenter(side, x, y, w, h) {
  const away = CALLOUT_RADIUS + 4;
  if (side === 'left') return [x - away, y + h / 2];
  if (side === 'right') return [x + w + away, y + h / 2];
  if (side === 'top') return [x + w / 2, y - away];
  return [x + w / 2, y + h + away];
}

const pillWidth = (text) => textWidth(text) * ADVANCE + 16;
const outline = (b) => `M${fmt(b.x)} ${fmt(b.y)}H${fmt(b.right)}V${fmt(b.bottom)}H${fmt(b.x)}z`;

/** The caption and the badges of keys as rows that fit a panel, each with its offset from the left and width. */
function keyRows(caption, keys, panelWidth) {
  const rows = [[]];
  let x = 14;
  if (caption) {
    const width = textWidth(caption) * ADVANCE;
    rows[0].push({ text: caption, caption: true, x, width });
    x += width + 12;
  }
  for (const key of keys) {
    const width = Math.max(26, textWidth(key) * ADVANCE + 16);
    if (x + width > panelWidth - 14 && rows[rows.length - 1].length > 0) {
      rows.push([]);
      x = 14;
    }
    rows[rows.length - 1].push({ text: key, caption: false, x, width });
    x += width + 8;
  }
  return rows;
}

/**
 * The SVG picture of a spec in one language.
 *
 * @param {object} spec  the spec (SHOTS.md, "The spec"); `image` paths are relative to `options.baseDir`
 * @param {string} lang  one of `spec.languages`
 * @param {{ baseDir?: string }} [options]
 * @returns {string} the SVG text
 */
/** The languages of a spec: a non-empty list of distinct language tags. */
function languagesOf(spec) {
  const languages = spec?.languages ?? DEFAULT_LANGUAGES;
  if (
    !Array.isArray(languages) ||
    languages.length === 0 ||
    languages.some((l) => typeof l !== 'string' || !LANGUAGE_TAG.test(l)) ||
    new Set(languages).size !== languages.length
  ) {
    throw new Error(`The languages of a spec must be distinct language tags, such as ["en", "zh-Hans"]: ${JSON.stringify(languages)}.`);
  }
  return languages;
}

export function renderShot(spec, lang, options = {}) {
  if (!isPlainObject(spec)) throw new Error('A spec must be an object.');
  const name = spec.name;
  if (typeof name !== 'string' || !NAME.test(name)) {
    throw new Error(`The name ${JSON.stringify(name)} is not <topic>-<nn>-<what>, in lower case with hyphens.`);
  }
  const where = `Picture "${name}" (${lang})`;
  const languages = languagesOf(spec);
  if (!languages.includes(lang)) {
    throw new Error(`${where}: "${lang}" is not one of its languages (${JSON.stringify(languages)}).`);
  }

  // The capture and the part of it that is shown, in CSS pixels.
  const bytes = loadImage(pick(spec.image, lang, `${where}: image`), options, `${where}: image`);
  const info = imageInfo(bytes);
  const scale = spec.scale ?? 1;
  if (typeof scale !== 'number' || !(scale > 0)) throw new Error(`${where}: scale must be a positive number.`);
  const imageWidth = info.width / scale;
  const imageHeight = info.height / scale;
  const cropValue = pick(spec.crop, lang, `${where}: crop`);
  const crop = cropValue === undefined ? null : rect(cropValue, `${where}: crop`);
  if (crop) within(crop, imageWidth, imageHeight, `${where}: crop`);
  const contentWidth = crop ? crop.width : imageWidth;
  const contentHeight = crop ? crop.height : imageHeight;

  const frame = spec.frame ?? 'windows';
  if (!FRAMES.includes(frame)) throw new Error(`${where}: frame must be one of ${FRAMES.join(', ')}.`);
  const geometry = FRAME_GEOMETRY[frame];
  const titleValue = pick(spec.title, lang, `${where}: title`);
  const title = typeof titleValue === 'string' && titleValue !== '' ? titleValue : name;

  // The annotations, with their targets in CSS pixels of the content.
  const boxes = [];
  const focus = [];
  const arrows = [];
  const callouts = [];
  const keys = [];
  const notes = spec.notes ?? [];
  if (!Array.isArray(notes)) throw new Error(`${where}: notes must be an array.`);
  notes.forEach((note, index) => {
    const what = `${where}: notes[${index}]`;
    if (!isPlainObject(note) || !KINDS.includes(note.kind)) {
      throw new Error(`${what}: kind must be one of ${KINDS.join(', ')}.`);
    }
    if (note.kind === 'keys') {
      const badges = pick(note.keys, lang, `${what}.keys`);
      if (!Array.isArray(badges) || badges.length === 0 || badges.some((k) => typeof k !== 'string' || k === '')) {
        throw new Error(`${what}.keys must be a non-empty array of key names.`);
      }
      const caption = note.caption === undefined ? null : label(note.caption, lang, `${what}.caption`);
      keys.push({ caption, badges });
      return;
    }
    const side = note.side ?? (note.kind === 'callout' ? 'left' : 'right');
    if (!SIDES.includes(side)) throw new Error(`${what}.side must be one of ${SIDES.join(', ')}.`);
    const targetValue = pick(note.target, lang, `${what}.target`);
    const targetList = note.kind === 'focus' && Array.isArray(targetValue) ? targetValue : [targetValue];
    if (targetList.length === 0) throw new Error(`${what}.target is an empty list.`);
    const targets = targetList.map((t, i) => {
      const named = targetList.length > 1 ? `${what}.target[${i}]` : `${what}.target`;
      const r = rect(t, named);
      within(r, contentWidth, contentHeight, named);
      return r;
    });
    switch (note.kind) {
      case 'box':
      case 'ellipse':
        boxes.push({ round: note.kind === 'ellipse', target: targets[0] });
        break;
      case 'focus':
        focus.push(...targets);
        break;
      case 'arrow':
        arrows.push({ text: label(note.label, lang, `${what}.label`), side, target: targets[0] });
        break;
      case 'callout': {
        if (!Number.isInteger(note.n) || note.n < 0) throw new Error(`${what}.n must be the number of the callout.`);
        if (callouts.some((c) => c.n === note.n)) throw new Error(`${what}: there is already a callout ${note.n}.`);
        const text = note.label === undefined ? null : label(note.label, lang, `${what}.label`);
        callouts.push({ n: note.n, text, side, target: targets[0] });
        break;
      }
    }
  });

  const windowWidth = contentWidth + geometry.left + geometry.right;
  const windowHeight = contentHeight + geometry.top + geometry.bottom;

  // How far the marks drawn around targets (boxes, ellipses, callouts) reach past the window at each side: the
  // window of a capture has no padding, so a callout at the left of a target at its edge lies outside it.
  const overflow = { left: 0, top: 0, right: 0, bottom: 0 };
  const extend = (x0, y0, x1, y1) => {
    overflow.left = Math.max(overflow.left, -(x0 + geometry.left));
    overflow.top = Math.max(overflow.top, -(y0 + geometry.top));
    overflow.right = Math.max(overflow.right, x1 + geometry.left - windowWidth);
    overflow.bottom = Math.max(overflow.bottom, y1 + geometry.top - windowHeight);
  };
  for (const { round, target: t } of boxes) {
    if (round) {
      const rx = t.width * 0.71 + 3 + 1;
      const ry = t.height * 0.71 + 3 + 1;
      const cx = t.x + t.width / 2;
      const cy = t.y + t.height / 2;
      extend(cx - rx, cy - ry, cx + rx, cy + ry);
    } else {
      extend(t.x - 5, t.y - 3, t.x + t.width + 5, t.y + t.height + 3);
    }
  }
  for (const c of callouts) {
    const [x, y] = calloutCenter(c.side, c.target.x, c.target.y, c.target.width, c.target.height);
    const r = CALLOUT_RADIUS + 1;
    extend(x - r, y - r, x + r, y + r);
  }

  // The margins come first: they move the window, and with it every target.
  const marginAt = (side) => {
    const at = arrows.filter((a) => a.side === side);
    const base =
      at.length === 0
        ? MARGIN
        : side === 'top' || side === 'bottom'
          ? PILL_GAP + PILL_HEIGHT + MARGIN
          : Math.max(...at.map((a) => pillWidth(a.text))) + PILL_GAP + MARGIN;
    return Math.max(base, overflow[side] + MARGIN);
  };
  const win = new Box(marginAt('left'), marginAt('top'), windowWidth, windowHeight);
  const content = new Box(win.x + geometry.left, win.y + geometry.top, contentWidth, contentHeight);
  const place = (r) => new Box(content.x + r.x, content.y + r.y, r.width, r.height);

  const labels = arrows.map((a) => {
    const target = place(a.target);
    const along = a.side === 'top' || a.side === 'bottom';
    return { ...a, target, width: pillWidth(a.text), at: along ? target.cx : target.cy };
  });

  // Moves the labels of a side apart where they would lie on each other, in the order of their targets; returns how
  // far to the right the labels above or below the window reach, with the margin.
  const spread = (side) => {
    const along = side === 'top' || side === 'bottom';
    let reach = 0;
    let previous = -Infinity;
    const onSide = labels.filter((l) => l.side === side).sort((a, b) => a.at - b.at);
    for (const l of onSide) {
      const half = along ? l.width / 2 : PILL_HEIGHT / 2;
      const first = along ? MARGIN + half : win.y + half;
      l.at = Math.max(l.at, first, previous + half + (along ? 8 : 4));
      previous = l.at + half;
      if (along) reach = previous + MARGIN;
    }
    return reach;
  };
  const width = Math.max(win.right + marginAt('right'), spread('top'), spread('bottom'));
  spread('left');
  spread('right');

  // The legend and the keys are in a panel of their own below the window, readable on any page.
  const legendColumns = Math.floor((windowWidth - 60) / ADVANCE);
  const legend = callouts
    .filter((c) => c.text !== null)
    .sort((a, b) => a.n - b.n)
    .map((c) => ({ n: c.n, lines: wrap(c.text, legendColumns) }));
  const footerTop = win.bottom + marginAt('bottom');
  for (const k of keys) {
    for (const item of keyRows(k.caption, k.badges, windowWidth).flat()) {
      if (item.x + item.width > windowWidth - 14) {
        throw new Error(`${where}: "${item.text}" does not fit in the panel below a window ${fmt(windowWidth)} wide.`);
      }
    }
  }
  const footerContent =
    legend.reduce((sum, entry) => sum + entry.lines.length * 22, 0) +
    keys.reduce((sum, k) => sum + keyRows(k.caption, k.badges, windowWidth).length * 32, 0);
  const footer = footerContent > 0 ? new Box(win.x, footerTop, windowWidth, footerContent + 16) : null;
  let height = footer ? footer.bottom + MARGIN : footerTop;
  for (const l of labels) {
    if (l.side === 'left' || l.side === 'right') height = Math.max(height, l.at + PILL_HEIGHT / 2 + MARGIN);
  }

  // Drawing.
  const C = COLORS;
  const id = (what) => `${name}-${what}`;
  let svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(width)}" height="${fmt(height)}"` +
    ` viewBox="0 0 ${fmt(width)} ${fmt(height)}" role="img" font-family="${fontFamily(lang)}"` +
    ` font-size="${fmt(LABEL_SIZE)}">\n` +
    `<title>${escapeXml(title)}</title>\n<defs>\n` +
    `<clipPath id="${id('screen')}"><rect x="${fmt(content.x)}" y="${fmt(content.y)}" width="${fmt(content.w)}"` +
    ` height="${fmt(content.h)}" rx="${fmt(geometry.screen)}"/></clipPath>\n`;
  if (frame !== 'none') {
    svg +=
      `<filter id="${id('shadow')}" x="-10%" y="-10%" width="120%" height="125%">` +
      `<feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.28"/></filter>\n`;
  }
  svg += '</defs>\n';

  // The frame.
  if (frame === 'windows') {
    svg +=
      `<rect x="${fmt(win.x)}" y="${fmt(win.y)}" width="${fmt(win.w)}" height="${fmt(win.h)}"` +
      ` rx="${fmt(geometry.radius)}" fill="${C.dark}" filter="url(#${id('shadow')})"/>\n`;
  } else if (frame === 'android') {
    svg +=
      `<rect x="${fmt(win.x)}" y="${fmt(win.y)}" width="${fmt(win.w)}" height="${fmt(win.h)}"` +
      ` rx="${fmt(geometry.radius)}" fill="${C.dark}" filter="url(#${id('shadow')})"/>\n` +
      `<rect x="${fmt(win.x + 0.5)}" y="${fmt(win.y + 0.5)}" width="${fmt(win.w - 1)}" height="${fmt(win.h - 1)}"` +
      ` rx="${fmt(geometry.radius - 0.5)}" fill="none" stroke="${C.border}"/>\n` +
      `<circle cx="${fmt(win.x + geometry.left / 2)}" cy="${fmt(win.cy)}" r="4.5" fill="${C.dim}"` +
      ` stroke="${C.border}"/>\n`;
  }

  // The capture, cropped by a viewBox: the image is embedded as it is.
  const href = `data:${info.type};base64,${Buffer.from(bytes).toString('base64')}`;
  svg += `<g clip-path="url(#${id('screen')})">\n`;
  if (crop) {
    svg +=
      `<svg x="${fmt(content.x)}" y="${fmt(content.y)}" width="${fmt(content.w)}" height="${fmt(content.h)}"` +
      ` viewBox="${fmt(crop.x)} ${fmt(crop.y)} ${fmt(crop.width)} ${fmt(crop.height)}" preserveAspectRatio="none">` +
      `<image width="${fmt(imageWidth)}" height="${fmt(imageHeight)}" preserveAspectRatio="none" href="${href}"/></svg>\n`;
  } else {
    svg +=
      `<image x="${fmt(content.x)}" y="${fmt(content.y)}" width="${fmt(imageWidth)}" height="${fmt(imageHeight)}"` +
      ` preserveAspectRatio="none" href="${href}"/>\n`;
  }
  svg += '</g>\n';
  if (frame === 'windows') {
    svg +=
      `<rect x="${fmt(win.x + 0.5)}" y="${fmt(win.y + 0.5)}" width="${fmt(win.w - 1)}" height="${fmt(win.h - 1)}"` +
      ` rx="${fmt(geometry.radius - 0.5)}" fill="none" stroke="${C.border}" stroke-opacity="0.7"/>\n`;
  }

  // Focus: the content dimmed but for the targets.
  // A mask rather than lip's even-odd path, so that holes that overlap stay clear.
  if (focus.length > 0) {
    const all = outline(content.grow(6));
    svg +=
      `<mask id="${id('focus')}"><path fill="#fff" d="${all}"/><path fill="#000" d="` +
      focus.map((r) => outline(place(r).grow(3))).join('') +
      '"/></mask>\n' +
      `<path clip-path="url(#${id('screen')})" mask="url(#${id('focus')})" fill="${C.dim}" fill-opacity="0.62"` +
      ` d="${all}"/>\n`;
  }

  // Boxes and ellipses.
  for (const b of boxes) {
    const t = place(b.target);
    if (b.round) {
      svg += `<ellipse cx="${fmt(t.cx)}" cy="${fmt(t.cy)}" rx="${fmt(t.w * 0.71 + 3)}" ry="${fmt(t.h * 0.71 + 3)}"`;
    } else {
      svg += `<rect x="${fmt(t.x - 4)}" y="${fmt(t.y - 2)}" width="${fmt(t.w + 8)}" height="${fmt(t.h + 4)}" rx="6"`;
    }
    svg += ` fill="${C.note}" fill-opacity="0.1" stroke="${C.note}" stroke-width="2"/>\n`;
  }

  // Labels in the margins, with their arrows.
  for (const l of labels) {
    const t = l.target;
    let pill;
    let from;
    let to;
    if (l.side === 'left') {
      pill = new Box(win.x - PILL_GAP - l.width, l.at - PILL_HEIGHT / 2, l.width, PILL_HEIGHT);
      from = [win.x - PILL_GAP, l.at];
      to = [t.x - 5, t.cy];
    } else if (l.side === 'right') {
      pill = new Box(win.right + PILL_GAP, l.at - PILL_HEIGHT / 2, l.width, PILL_HEIGHT);
      from = [win.right + PILL_GAP, l.at];
      to = [t.right + 5, t.cy];
    } else if (l.side === 'top') {
      pill = new Box(l.at - l.width / 2, win.y - PILL_GAP - PILL_HEIGHT, l.width, PILL_HEIGHT);
      from = [l.at, win.y - PILL_GAP];
      to = [t.cx, t.y - 4];
    } else {
      pill = new Box(l.at - l.width / 2, win.bottom + PILL_GAP, l.width, PILL_HEIGHT);
      from = [l.at, win.bottom + PILL_GAP];
      to = [t.cx, t.bottom + 4];
    }
    const [fx, fy] = from;
    const [tx, ty] = to;
    const length = Math.hypot(tx - fx, ty - fy);
    const dx = length === 0 ? 1 : (tx - fx) / length;
    const dy = length === 0 ? 0 : (ty - fy) / length;
    const line = `M${fmt(fx)} ${fmt(fy)}L${fmt(tx - dx * 7)} ${fmt(ty - dy * 7)}`;
    const head =
      `M${fmt(tx)} ${fmt(ty)}` +
      `L${fmt(tx - dx * 10 - dy * 4.5)} ${fmt(ty - dy * 10 + dx * 4.5)}` +
      `L${fmt(tx - dx * 10 + dy * 4.5)} ${fmt(ty - dy * 10 - dx * 4.5)}z`;
    // A dark line below the bright one keeps the arrow apart from what it crosses.
    svg +=
      `<path d="${line}" fill="none" stroke="${C.dark}" stroke-width="4" stroke-opacity="0.6" stroke-linecap="round"/>\n` +
      `<path d="${line}" fill="none" stroke="${C.note}" stroke-width="2" stroke-linecap="round"/>\n` +
      `<path d="${head}" fill="${C.note}" stroke="${C.dark}" stroke-width="1" stroke-linejoin="round"/>\n` +
      `<rect x="${fmt(pill.x)}" y="${fmt(pill.y)}" width="${fmt(pill.w)}" height="${fmt(pill.h)}" rx="6"` +
      ` fill="${C.note}"/>\n`;
    svg += textElements(l.text, pill.x + 8, pill.y + 15.5, ` font-weight="700" fill="${C.dark}"`);
  }

  // Numbered callouts.
  const number = (n, x, y) =>
    `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${fmt(CALLOUT_RADIUS)}" fill="${C.note}" stroke="${C.dark}"` +
    ` stroke-width="1.5"/>\n` +
    `<text x="${fmt(x)}" y="${fmt(y + 4.5)}" text-anchor="middle" font-weight="700" fill="${C.dark}">${n}</text>\n`;
  for (const c of callouts) {
    const t = place(c.target);
    svg += number(c.n, ...calloutCenter(c.side, t.x, t.y, t.w, t.h));
  }

  // The panel below the window: what the numbers stand for, then the keys to press.
  if (footer) {
    const f = footer;
    svg +=
      `<rect x="${fmt(f.x + 0.5)}" y="${fmt(f.y + 0.5)}" width="${fmt(f.w - 1)}" height="${fmt(f.h - 1)}"` +
      ` rx="${fmt(FOOTER_RADIUS)}" fill="${C.panel}" stroke="${C.border}"/>\n`;
    let y = f.y + 8;
    for (const entry of legend) {
      svg += number(entry.n, f.x + 12 + CALLOUT_RADIUS, y + 11);
      for (const line of entry.lines) {
        svg += textElements(line, f.x + 42, y + 15.5, ` fill="${C.text}"`);
        y += 22;
      }
    }
    for (const k of keys) {
      for (const row of keyRows(k.caption, k.badges, f.w)) {
        for (const item of row) {
          const x = f.x + item.x;
          if (item.caption) {
            svg += textElements(item.text, x, y + 20.5, ` fill="${C.muted}"`);
            continue;
          }
          svg +=
            `<rect x="${fmt(x + 0.5)}" y="${fmt(y + 4.5)}" width="${fmt(item.width - 1)}" height="23" rx="5"` +
            ` fill="${C.dark}" stroke="${C.note}"/>\n`;
          svg += textElements(
            item.text,
            x + (item.width - textWidth(item.text) * ADVANCE) / 2,
            y + 20.5,
            ` font-weight="700" fill="${C.text}"`,
          );
        }
        y += 32;
      }
    }
  }

  svg += '</svg>\n';
  const size = Buffer.byteLength(svg);
  if (size > MAX_BYTES) {
    throw new Error(
      `${where} is ${Math.round(size / 1024)} KB, more than ${MAX_BYTES / 1024} KB: crop the capture, or capture ` +
        'less of the screen.',
    );
  }
  return svg;
}

/**
 * Writes the picture of a spec in each of its languages to `<outDir>/<lang>/<name>.svg`; a file that would not
 * change is not touched. All languages are drawn before anything is written, so a spec that fails writes nothing.
 *
 * @param {object} spec
 * @param {string} outDir
 * @param {{ baseDir?: string }} [options]  `baseDir`: what the paths of the spec are relative to (default: the cwd)
 * @returns {Promise<{ lang: string, file: string, changed: boolean }[]>}
 */
export async function writeShots(spec, outDir, options = {}) {
  const drawn = languagesOf(spec).map((lang) => ({ lang, svg: renderShot(spec, lang, options) }));
  const results = [];
  for (const { lang, svg } of drawn) {
    const file = path.join(outDir, lang, `${spec.name}.svg`);
    // A checkout that turned the line ends into CRLF holds the same picture.
    const changed = !existsSync(file) || readFileSync(file, 'utf8').replaceAll('\r\n', '\n') !== svg;
    if (changed) {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, svg);
    }
    results.push({ lang, file, changed });
  }
  return results;
}

// ---------------------------------------------------------------------------------------------------------------------
// Desensitizing

/**
 * Fails when a text (what a capture shows: the page's text, its input values) holds anything of the machine or the
 * person that made it: the user name of the OS (when it has 3 characters or more), the home directory (with either
 * slash), something like an e-mail address, or any of `extra` (case-insensitive). Call it before every capture.
 *
 * @param {string} text
 * @param {string[]} [extra]  more strings that must not show, such as a real account name
 */
export function assertDesensitized(text, extra = []) {
  const haystack = String(text).toLowerCase();
  const found = [];
  let user = '';
  try {
    user = os.userInfo().username;
  } catch {
    // No user name to look for.
  }
  // The user name as a word of its own, not inside another ("app" in "Apps"); paths separate it with slashes.
  const escaped = user.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (user.length >= 3 && new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu').test(String(text))) {
    found.push(`the user name "${user}"`);
  }
  const home = os.homedir();
  // A home of "/" or "C:\" would match any path.
  if (home && home.replace(/[\\/]+$/, '').length >= 4) {
    for (const form of new Set([home, home.replaceAll('\\', '/'), home.replaceAll('/', '\\')])) {
      if (haystack.includes(form.toLowerCase())) {
        found.push(`the home directory "${form}"`);
        break;
      }
    }
  }
  // The domain starts with a letter and does not end in a file type: "icon@2x.png" is no address.
  const email =
    /[\p{L}\p{N}._%+-]+@\p{L}[\p{L}\p{N}-]*(?:\.[\p{L}\p{N}-]+)*\.(?!(?:png|jpe?g|webp|gif|svg)\b)\p{L}{2,}/iu.exec(
      String(text),
    );
  if (email) found.push(`an e-mail address "${email[0]}"`);
  for (const value of extra) {
    if (value && haystack.includes(String(value).toLowerCase())) found.push(`"${value}"`);
  }
  if (found.length > 0) {
    throw new Error(`The capture is not desensitized: it shows ${found.join(', ')}. Use fake data (SHOTS.md).`);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Command line

/** Reads a spec file: one spec, or an array of them. Paths in it are relative to the file. */
export function readSpecFile(file) {
  const specs = JSON.parse(readFileSync(file, 'utf8'));
  return (Array.isArray(specs) ? specs : [specs]).map((spec) => ({ spec, baseDir: path.dirname(path.resolve(file)) }));
}

async function main(argv) {
  const files = [];
  let out = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') {
      out = argv[++i];
      if (!out) throw new Error('--out needs a directory.');
    } else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log('Usage: node scripts/shots/annotate.mjs <spec.json>... [--out <dir>]\nSee scripts/shots/SHOTS.md.');
      return;
    } else {
      files.push(argv[i]);
    }
  }
  if (files.length === 0) throw new Error('Usage: node scripts/shots/annotate.mjs <spec.json>... [--out <dir>]');
  for (const file of files) {
    for (const { spec, baseDir } of readSpecFile(file)) {
      const outDir = out ? path.resolve(out) : spec.out ? path.resolve(baseDir, spec.out) : null;
      if (!outDir) throw new Error(`${file}: give --out <dir>, or "out" in the spec.`);
      for (const r of await writeShots(spec, outDir, { baseDir })) {
        console.log(`${r.changed ? 'wrote    ' : 'unchanged'} ${path.relative(process.cwd(), r.file)}`);
      }
    }
  }
}

/** Whether this module is the script Node runs: the same file through any link, in any case on Windows. */
function isMain() {
  if (!process.argv[1]) return false;
  const real = (file) => {
    try {
      const resolved = realpathSync(path.resolve(file));
      return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
    } catch {
      return null;
    }
  };
  const self = real(fileURLToPath(import.meta.url));
  return self !== null && (real(process.argv[1]) === self || real(`${process.argv[1]}.mjs`) === self);
}

if (isMain()) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
