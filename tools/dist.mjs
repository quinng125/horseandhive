#!/usr/bin/env node
// Collects the deployable website into dist/ (used by Vercel and other hosts),
// leaving out source files, tools, docs and original photos.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

const rootFiles = (await fs.readdir(root)).filter((f) => f.endsWith('.html'));
const include = [
  ...rootFiles,
  'robots.txt',
  'sitemap.xml',
  'site.webmanifest',
  'assets/css/styles.min.css',
  'assets/js/main.min.js',
  'assets/fonts',
  'assets/img',
  'assets/photos',
];

await fs.rm(dist, { recursive: true, force: true });
for (const item of include) {
  await fs.cp(path.join(root, item), path.join(dist, item), { recursive: true });
}

let files = 0;
let bytes = 0;
async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(p);
    else {
      files++;
      bytes += (await fs.stat(p)).size;
    }
  }
}
await walk(dist);
console.log(`dist/ ready: ${files} files, ${(bytes / 1024 / 1024).toFixed(2)} MB`);
