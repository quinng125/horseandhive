#!/usr/bin/env node
// Generates favicons and app icons from the farm's beehive-and-horseshoe mark
// (assets/img/logo-mark.png: a white shape on a transparent background).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'assets/img');
const markFile = path.join(out, 'logo-mark.png');

const background = '#1f2b23';
const foreground = '#f0c674';

async function icon(size, { pad = 0.18, radius = 0.22 } = {}) {
  const inner = Math.round(size * (1 - pad * 2));
  const alpha = await sharp(markFile).extractChannel('alpha').resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  const mark = await sharp({ create: { width: inner, height: inner, channels: 3, background: foreground } }).joinChannel(alpha).png().toBuffer();
  const r = Math.round(size * radius);
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="${background}"/></svg>`);
  const offset = Math.round((size - inner) / 2);
  return sharp(bg).composite([{ input: mark, left: offset, top: offset }]).png();
}

await fs.mkdir(out, { recursive: true });
await fs.rm(path.join(out, 'favicon.svg'), { force: true });
await (await icon(32, { pad: 0.08, radius: 0.2 })).toFile(path.join(out, 'favicon-32.png'));
await (await icon(180, { pad: 0.16, radius: 0 })).toFile(path.join(out, 'apple-touch-icon.png'));
await (await icon(192)).toFile(path.join(out, 'icon-192.png'));
await (await icon(512, { pad: 0.24, radius: 0 })).toFile(path.join(out, 'icon-512.png'));
console.log('icons written to assets/img');
