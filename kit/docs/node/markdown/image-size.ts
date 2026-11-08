// Intrinsic size of a local image (PNG, GIF, JPEG, WebP, SVG) read from its header, so markdown images get
// width/height attributes and reserve their space before they load (no layout shift). No dependencies.
import { closeSync, openSync, readFileSync, readSync, statSync } from 'node:fs';

const cache = new Map<string, { mtime: number; size: { width: number; height: number } | null }>();

function head(file: string, n: number): Buffer {
  const fd = openSync(file, 'r');
  try {
    const buf = Buffer.alloc(n);
    const read = readSync(fd, buf, 0, n, 0);
    return buf.subarray(0, read);
  } finally {
    closeSync(fd);
  }
}

function svgSize(text: string): { width: number; height: number } | null {
  const tag = /<svg\b[^>]*>/i.exec(text)?.[0];
  if (!tag) return null;
  const attr = (name: string) => new RegExp(`\\s${name}\\s*=\\s*["']\\s*([\\d.]+)(px)?\\s*["']`, 'i').exec(tag);
  const w = attr('width');
  const h = attr('height');
  if (w && h) return { width: Math.round(+w[1]!), height: Math.round(+h[1]!) };
  const vb = /\sviewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i.exec(tag);
  if (vb) return { width: Math.round(+vb[1]!), height: Math.round(+vb[2]!) };
  return null;
}

function rasterSize(b: Buffer): { width: number; height: number } | null {
  if (b.length >= 24 && b.readUInt32BE(0) === 0x89504e47 && b.toString('latin1', 12, 16) === 'IHDR') return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b.length >= 10 && b.toString('latin1', 0, 3) === 'GIF') return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
  if (b.length >= 30 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
    const kind = b.toString('latin1', 12, 16);
    if (kind === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (kind === 'VP8L') {
      const bits = b.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (kind === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    return null;
  }
  if (b.length >= 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = b[i + 1]!;
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0xff) {
        i += marker === 0xff ? 1 : 2;
        continue;
      }
      const len = b.readUInt16BE(i + 2);
      // SOF0..SOF15 except DHT (C4), JPG (C8), DAC (CC)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  return null;
}

/** Width/height in CSS px of a local image file, or null (unknown format, unreadable, no size). */
export function imageSize(file: string): { width: number; height: number } | null {
  try {
    const mtime = statSync(file).mtimeMs;
    const hit = cache.get(file);
    if (hit && hit.mtime === mtime) return hit.size;
    let size: { width: number; height: number } | null;
    if (/\.svgz?$/i.test(file)) size = svgSize(readFileSync(file, 'utf8').slice(0, 4096));
    else {
      const b = head(file, 64 * 1024);
      size = rasterSize(b);
    }
    if (size && (!(size.width > 0) || !(size.height > 0))) size = null;
    cache.set(file, { mtime, size });
    return size;
  } catch {
    return null;
  }
}

/**
 * Height in px of a shields.io badge (they are 20px, 28px for style=for-the-badge), so a row of badges keeps its
 * height while they load. null for other URLs.
 */
export function badgeHeight(src: string): number | null {
  let u: URL;
  try {
    u = new URL(src);
  } catch {
    return null;
  }
  if (u.hostname !== 'img.shields.io') return null;
  return u.searchParams.get('style') === 'for-the-badge' ? 28 : 20;
}
