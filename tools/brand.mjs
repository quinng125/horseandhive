#!/usr/bin/env node
// Generates favicons and app icons from the Horse & Hive mark.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'assets/img');

const mark = (fg) => `<path d="M20 1.8 37.6 11.9v20.2L20 42.2 2.4 32.1V11.9z" fill="none" stroke="${fg}" stroke-width="1.6" stroke-linejoin="round"/><path d="M13.2 13.5v8.3a6.8 6.8 0 0 0 13.6 0v-8.3" fill="none" stroke="${fg}" stroke-width="3.6"/><path d="M11.2 13.4h4.1M24.7 13.4h4.1" stroke="${fg}" stroke-width="1.8" stroke-linecap="round"/><circle cx="20" cy="9.2" r="1.5" fill="${fg}"/>`;

const icon = (size, pad = 0.18, radius = 0.22) => {
  const inner = size * (1 - pad * 2);
  const scale = inner / 44;
  const x = (size - 40 * scale) / 2;
  const y = (size - 44 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * radius}" fill="#1f2b23"/>
  <g transform="translate(${x} ${y}) scale(${scale})">${mark('#f0c674')}</g></svg>`;
};

await fs.mkdir(out, { recursive: true });
await fs.writeFile(path.join(out, 'favicon.svg'), icon(64, 0.12));
await sharp(Buffer.from(icon(32, 0.1))).png().toFile(path.join(out, 'favicon-32.png'));
await sharp(Buffer.from(icon(180, 0.2, 0))).png().toFile(path.join(out, 'apple-touch-icon.png'));
await sharp(Buffer.from(icon(192, 0.2))).png().toFile(path.join(out, 'icon-192.png'));
await sharp(Buffer.from(icon(512, 0.26, 0))).png().toFile(path.join(out, 'icon-512.png'));
console.log('icons written to assets/img');
