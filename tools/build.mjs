#!/usr/bin/env node
// Tiny static-site builder: src/pages/*.html -> ./*.html
//
// Page files start with a front-matter block:
//   ---
//   title: Riding Lessons
//   description: ...
//   nav: lessons
//   ---
// Inside pages and partials:
//   {{> header}}                          include src/partials/header.html
//   {{title}}                             front-matter or site value
//   {{pic hero sizes="100vw" eager}}      responsive <picture> for a photo slot
//     options: sizes="..." class="..." alt="..." pos="50% 20%" eager (above-the-fold, high priority)

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');
const slots = JSON.parse(await fs.readFile(path.join(root, 'photos/slots.json'), 'utf8'));

const site = {
  siteName: 'Horse & Hive Farm',
  siteUrl: 'https://horseandhive.com',
  phone: '(443) 606-4639',
  phoneHref: 'tel:+14436064639',
  email: 'hhfarm2012@gmail.com',
  street: '13220 Long Green Pike',
  city: 'Hydes',
  region: 'MD',
  zip: '21082',
  facebook: 'https://www.facebook.com/horseandhive/',
  instagram: 'https://www.instagram.com/horseandhive/',
  year: String(new Date().getFullYear()),
};

function parseFrontMatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: text.slice(m[0].length) };
}

function attr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function picture(args) {
  const tokens = args.match(/(\w[\w-]*)="([^"]*)"|[\w-]+/g) ?? [];
  const slot = tokens.shift();
  const cfg = slots[slot];
  if (!cfg) throw new Error(`Unknown photo slot "${slot}"`);
  const opts = {};
  for (const t of tokens) {
    const kv = t.match(/^(\w[\w-]*)="([^"]*)"$/);
    if (kv) opts[kv[1]] = kv[2];
    else opts[t] = true;
  }
  const [rw, rh] = cfg.ratio;
  const max = Math.max(...cfg.widths);
  const mid = cfg.widths[Math.min(1, cfg.widths.length - 1)];
  const set = (ext) => cfg.widths.map((w) => `assets/photos/${slot}-${w}.${ext} ${w}w`).join(', ');
  const sizes = opts.sizes ?? '100vw';
  const alt = opts.alt ?? cfg.alt;
  const loading = opts.eager ? 'fetchpriority="high"' : 'loading="lazy"';
  const cls = opts.class ? ` class="${attr(opts.class)}"` : '';
  // pos="50% 20%" sets object-position, for images that a layout crops further.
  const style = opts.pos ? ` style="object-position:${attr(opts.pos)}"` : '';
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${attr(sizes)}"><img${cls}${style} src="assets/photos/${slot}-${mid}.webp" srcset="${set('webp')}" sizes="${attr(sizes)}" width="${max}" height="${Math.round((max * rh) / rw)}" alt="${attr(alt)}" ${loading} decoding="async"></picture>`;
}

async function render(text, vars, depth = 0) {
  if (depth > 10) throw new Error('Partial nesting too deep');
  let out = text;
  const includes = [...out.matchAll(/\{\{>\s*([\w-]+)\s*\}\}/g)];
  for (const [token, name] of includes) {
    const partial = await fs.readFile(path.join(src, 'partials', `${name}.html`), 'utf8');
    out = out.replace(token, await render(partial, vars, depth + 1));
  }
  out = out.replace(/\{\{pic\s+([^}]+)\}\}/g, (_, args) => picture(args.trim()));
  out = out.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (token, key) => (key in vars ? vars[key] : token));
  return out;
}

// Minify the hand-written CSS and JS into the files the pages load.
async function minifyAssets() {
  const jobs = [
    ['assets/css/styles.css', 'assets/css/styles.min.css', 'css'],
    ['assets/js/main.js', 'assets/js/main.min.js', 'js'],
  ];
  for (const [from, to, loader] of jobs) {
    const code = await fs.readFile(path.join(root, from), 'utf8');
    const out = await transform(code, { loader, minify: true, target: loader === 'css' ? ['chrome100', 'safari15', 'firefox100'] : 'es2019' });
    await fs.writeFile(path.join(root, to), out.code);
    console.log(`minified ${from} -> ${to} (${(code.length / 1024).toFixed(1)}kB -> ${(out.code.length / 1024).toFixed(1)}kB)`);
  }
}

async function main() {
  await minifyAssets();
  const pages = (await fs.readdir(path.join(src, 'pages'))).filter((f) => f.endsWith('.html'));
  for (const file of pages) {
    const raw = await fs.readFile(path.join(src, 'pages', file), 'utf8');
    const { meta, body } = parseFrontMatter(raw);
    const slug = file.replace(/\.html$/, '');
    const vars = {
      ...site,
      robots: 'index, follow',
      baseTag: '',
      ...meta,
      slug,
      canonical: `${site.siteUrl}/${slug === 'index' ? '' : file}`,
      ogImage: `${site.siteUrl}/assets/img/og-image.jpg`,
    };
    // Pages served from arbitrary paths (the 404 page) need an absolute base.
    if (meta.base) vars.baseTag = `<base href="${meta.base}">`;
    vars.fullTitle = meta.title ? `${meta.title} · ${site.siteName}` : `${site.siteName} · Riding Lessons, Boarding & Camp in Hydes, MD`;
    let html = await render(body, vars);
    if (meta.nav) {
      html = html.replace(new RegExp(`data-nav="${meta.nav}"`, 'g'), `data-nav="${meta.nav}" aria-current="page"`);
    }
    const leftover = html.match(/\{\{[^}]*\}\}/g);
    if (leftover) throw new Error(`${file}: unresolved tokens ${[...new Set(leftover)].join(', ')}`);
    await fs.writeFile(path.join(root, file), html);
    console.log(`built ${file}`);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
