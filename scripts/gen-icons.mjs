/**
 * Generates the PWA / app icons (no image dependencies — pure Node).
 * Draws a maskable "night-map pin" in the product palette and PNG-encodes it.
 *
 *   node scripts/gen-icons.mjs
 */
import { deflateSync, crc32 } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/public/icons');

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const BG = hex('#0f1216');
const BG2 = hex('#1c232d');
const PIN = hex('#e8b04b');
const HOLE = hex('#10141a');

function draw(size) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  // Pin geometry (kept inside the maskable safe zone).
  const headR = size * 0.2;
  const headY = size * 0.4;
  const tipY = size * 0.78;
  const holeR = size * 0.082;

  const put = (x, y, [r, g, b], a = 255) => {
    const i = (y * size + x) * 4;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = a;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Subtle radial background (map "night" feel).
      const dxc = (x - cx) / size;
      const dyc = (y - size * 0.35) / size;
      const t = Math.min(1, Math.hypot(dxc, dyc) * 1.6);
      const bg = [
        Math.round(BG2[0] + (BG[0] - BG2[0]) * t),
        Math.round(BG2[1] + (BG[1] - BG2[1]) * t),
        Math.round(BG2[2] + (BG[2] - BG2[2]) * t),
      ];
      put(x, y, bg);

      // Teardrop pin = circle head ∪ triangle to the tip.
      const dxh = x - cx;
      const dyh = y - headY;
      const inHead = dxh * dxh + dyh * dyh <= headR * headR;
      // Triangle: apex at (cx, tipY), base across the head's horizontal diameter.
      let inTri = false;
      if (y >= headY && y <= tipY) {
        const frac = (tipY - y) / (tipY - headY); // 1 at head, 0 at tip
        const halfW = headR * frac;
        inTri = Math.abs(x - cx) <= halfW;
      }
      if (inHead || inTri) {
        put(x, y, PIN);
        // Punch a hole in the head.
        if (dxh * dxh + dyh * dyh <= holeR * holeR) put(x, y, HOLE);
      }
    }
  }
  return buf;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0, 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  // filter method 0 per scanline
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT, { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(resolve(OUT, `icon-${size}.png`), encodePng(size, draw(size)));
  console.log(`wrote icons/icon-${size}.png`);
}
