#!/usr/bin/env node
// Checks every built page for broken internal links, missing assets and missing #anchors.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = (await fs.readdir(root)).filter((f) => f.endsWith('.html'));
const html = Object.fromEntries(await Promise.all(pages.map(async (p) => [p, await fs.readFile(path.join(root, p), 'utf8')])));
const ids = Object.fromEntries(Object.entries(html).map(([p, h]) => [p, new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));

const problems = [];
const exists = async (file) => fs.access(path.join(root, file)).then(() => true, () => false);

for (const [page, h] of Object.entries(html)) {
  const refs = [
    ...[...h.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]),
    ...[...h.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0])),
  ];
  for (const ref of new Set(refs)) {
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(ref) || ref.includes("'")) continue; // skip external links and JS-built strings
    const [rawPath, hash] = ref.replace(/&amp;/g, '&').split('#');
    const file = rawPath.split('?')[0];
    let target = page;
    if (file && file !== './' && file !== '/') {
      target = file.replace(/^\.?\//, '');
      if (target.startsWith('#')) target = page;
      if (!(await exists(target))) {
        problems.push(`${page}: missing file ${ref}`);
        continue;
      }
    } else if (file === './' || file === '/') {
      target = 'index.html';
    }
    if (hash && target.endsWith('.html') && !ids[target]?.has(hash)) {
      problems.push(`${page}: missing anchor #${hash} in ${target}`);
    }
  }
  // Every <use href="#..."> must point at a defined symbol.
  for (const m of h.matchAll(/<use href="#([^"]+)"/g)) {
    if (!h.includes(`id="${m[1]}"`)) problems.push(`${page}: missing icon #${m[1]}`);
  }
  // Every image needs alt text.
  for (const m of h.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(m[0])) problems.push(`${page}: image without alt: ${m[0].slice(0, 80)}`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s) found.`);
  process.exit(1);
}
console.log(`✓ ${pages.length} pages checked: links, anchors, assets, icons and alt text all OK.`);
