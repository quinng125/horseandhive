#!/usr/bin/env node
// Horse & Hive photo pipeline.
//
//   npm run photos            process every slot in photos/slots.json
//   npm run photos -- hero    process only the named slot(s)
//
// For each slot it looks for an original in photos/original/<slot>.(jpg|jpeg|png|webp|tif|tiff).
// Originals get the house "upgrade": straightened, smart-cropped to the slot's
// aspect ratio, auto-levelled, colour graded (warm, soft matte), sharpened, given a
// gentle vignette and a whisper of film grain, stripped of location metadata, and
// exported as AVIF + WebP at several widths. Slots without an original get the
// illustrated placeholder from tools/art.mjs so the site never shows a gap.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { renderArt } from './art.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slotsFile = path.join(root, 'photos/slots.json');
const originalsDir = path.join(root, 'photos/original');
const outDir = path.join(root, 'assets/photos');
const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff'];

// The grade. Tweak here to change the look of every photo on the site at once.
export const grade = {
  levels: { lower: 0.5, upper: 99.7 }, // auto-levels percentiles
  localContrast: null, // e.g. { width: 24, height: 24, maxSlope: 1.4 } for extra "pop" on flat, hazy shots
  saturation: 0.9, // a touch below 1 reads as modern and calm
  brightness: 1.03,
  // Warm highlights, slightly cooler shadows (rows are output R, G, B).
  warmth: [
    [1.05, 0.03, -0.02],
    [0.0, 1.0, 0.01],
    [-0.02, 0.02, 0.94],
  ],
  matte: { slope: 0.95, lift: [10, 8, 6] }, // lifted blacks for a soft film look
  sharpen: { sigma: 0.5, m1: 0.4, m2: 0.8 },
  vignette: 0.2, // 0 disables
  grain: 0.025, // 0 disables
  quality: { avif: 52, webp: 78, before: 82 },
};

async function findOriginal(slot) {
  for (const ext of extensions) {
    for (const name of [slot + ext, slot + ext.toUpperCase()]) {
      const file = path.join(originalsDir, name);
      try {
        await fs.access(file);
        return file;
      } catch {}
    }
  }
  return null;
}

function vignetteSvg(w, h, strength) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs><radialGradient id="v" cx="0.5" cy="0.48" r="0.72">
      <stop offset="0.5" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#140e06" stop-opacity="${strength}"/>
    </radialGradient></defs>
    <rect width="100%" height="100%" fill="url(#v)"/></svg>`);
}

async function grainLayer(w, h, strength) {
  return sharp({ create: { width: w, height: h, channels: 3, background: '#808080', noise: { type: 'gaussian', mean: 128, sigma: 28 } } })
    .greyscale()
    .ensureAlpha(strength)
    .png()
    .toBuffer();
}

// Build the full-resolution graded master. Each stage runs as its own pass
// because sharp applies operations within a single pipeline in a fixed order.
async function gradeMaster(file, [rw, rh], maxWidth, focus) {
  const w = maxWidth;
  const h = Math.round((maxWidth * rh) / rw);
  const position = focus === 'attention' ? sharp.strategy.attention : focus === 'entropy' ? sharp.strategy.entropy : focus ?? 'centre';

  let buf = await sharp(file, { failOn: 'none' })
    .rotate()
    .resize({ width: w, height: h, fit: 'cover', position, kernel: 'lanczos3' })
    .toColourspace('srgb')
    .removeAlpha()
    .png()
    .toBuffer();
  const before = buf;

  buf = await sharp(buf).normalise(grade.levels).png().toBuffer();
  if (grade.localContrast) buf = await sharp(buf).clahe(grade.localContrast).png().toBuffer();
  buf = await sharp(buf).modulate({ saturation: grade.saturation, brightness: grade.brightness }).png().toBuffer();
  buf = await sharp(buf).recomb(grade.warmth).png().toBuffer();
  buf = await sharp(buf)
    .linear([grade.matte.slope, grade.matte.slope, grade.matte.slope], grade.matte.lift)
    .png()
    .toBuffer();

  const layers = [];
  if (grade.vignette) layers.push({ input: vignetteSvg(w, h, grade.vignette), blend: 'multiply' });
  if (grade.grain) layers.push({ input: await grainLayer(w, h, grade.grain), blend: 'overlay' });
  if (layers.length) buf = await sharp(buf).composite(layers).png().toBuffer();

  return { master: buf, before, w, h };
}

async function artMaster(art, [rw, rh], maxWidth) {
  const w = maxWidth;
  const h = Math.round((maxWidth * rh) / rw);
  const svg = renderArt(art, w, h);
  const master = await sharp(Buffer.from(svg)).png().toBuffer();
  return { master, w, h };
}

async function writeSizes(slot, master, [rw, rh], widths, { sharpen, before }) {
  const files = [];
  for (const width of widths) {
    const height = Math.round((width * rh) / rw);
    let img = sharp(master).resize({ width, height, kernel: 'lanczos3' });
    if (sharpen) img = img.sharpen(grade.sharpen);
    const resized = await img.png().toBuffer();
    const base = path.join(outDir, `${slot}-${width}`);
    await sharp(resized).avif({ quality: grade.quality.avif, effort: 4 }).toFile(base + '.avif');
    await sharp(resized).webp({ quality: grade.quality.webp, effort: 6 }).toFile(base + '.webp');
    files.push(`${slot}-${width}`);
  }
  if (before) {
    const width = widths[widths.length - 1];
    const height = Math.round((width * rh) / rw);
    await sharp(before).resize({ width, height }).jpeg({ quality: grade.quality.before, mozjpeg: true }).toFile(path.join(outDir, `${slot}-before.jpg`));
    await sharp(master).resize({ width, height }).sharpen(grade.sharpen).jpeg({ quality: grade.quality.before, mozjpeg: true }).toFile(path.join(outDir, `${slot}-after.jpg`));
  }
  return files;
}

async function cleanSlot(slot) {
  const entries = await fs.readdir(outDir).catch(() => []);
  await Promise.all(entries.filter((f) => f.startsWith(slot + '-') && /-(\d+|before|after)\.(avif|webp|jpg)$/.test(f) && f.replace(/-(\d+|before|after)\.(avif|webp|jpg)$/, '') === slot).map((f) => fs.unlink(path.join(outDir, f))));
}

async function main() {
  const slots = JSON.parse(await fs.readFile(slotsFile, 'utf8'));
  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const unknown = only.filter((s) => !slots[s]);
  if (unknown.length) {
    console.error(`Unknown slot(s): ${unknown.join(', ')}\nKnown slots: ${Object.keys(slots).join(', ')}`);
    process.exit(1);
  }
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(originalsDir, { recursive: true });

  const manifestFile = path.join(outDir, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8').catch(() => '{}'));

  for (const [slot, cfg] of Object.entries(slots)) {
    if (only.length && !only.includes(slot)) continue;
    const original = await findOriginal(slot);
    const maxWidth = Math.max(...cfg.widths);
    await cleanSlot(slot);
    if (original) {
      const { master, before } = await gradeMaster(original, cfg.ratio, maxWidth, cfg.focus);
      await writeSizes(slot, master, cfg.ratio, cfg.widths, { sharpen: true, before });
      manifest[slot] = { source: 'photo', original: path.relative(root, original), ratio: cfg.ratio, widths: cfg.widths, alt: cfg.alt };
      console.log(`✓ ${slot.padEnd(18)} photo  ← ${path.relative(root, original)}`);
    } else {
      const { master } = await artMaster(cfg.art, cfg.ratio, maxWidth);
      await writeSizes(slot, master, cfg.ratio, cfg.widths, { sharpen: false });
      manifest[slot] = { source: 'art', ratio: cfg.ratio, widths: cfg.widths, alt: cfg.alt };
      console.log(`· ${slot.padEnd(18)} art    (add photos/original/${slot}.jpg to replace)`);
    }
  }
  for (const slot of Object.keys(manifest)) if (!slots[slot]) delete manifest[slot];
  await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  // Also expose the manifest as a script so the Photo Lab page works from file:// too.
  await fs.writeFile(path.join(outDir, 'manifest.js'), `window.HH_PHOTOS = ${JSON.stringify(manifest)};\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
