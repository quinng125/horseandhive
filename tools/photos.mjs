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
  levels: { lower: 0.4, upper: 99.6 }, // auto-levels percentiles
  localContrast: null, // e.g. { width: 24, height: 24, maxSlope: 1.4 } for extra "pop" on flat, hazy shots
  film: {
    saturation: 0.88, // overall colour intensity; a touch below 1 reads calm and modern
    greenDesat: 0.45, // extra calming for phone-camera "neon" greens (0 = off)
    contrast: 0.32, // strength of the gentle S-curve (0 = linear)
    blackLift: 0.035, // matte blacks
    whiteRolloff: 0.025, // creamy, compressed highlights
    shadowTint: [-0.012, 0.004, 0.016], // cool, slightly teal shadows
    highlightTint: [0.04, 0.014, -0.03], // warm, golden highlights
  },
  sharpen: { sigma: 0.55, m1: 0.45, m2: 0.9 },
  vignette: 0.18, // 0 disables
  // Baked-in grain is off: random noise doesn't compress, so the site adds film grain
  // with a tiny tiled texture in CSS instead (see .grain in styles.css).
  grain: 0, // e.g. 0.03 to bake grain into the files
  quality: { avif: 50, webp: 76, before: 78 },
  labWidth: 1200, // size of the Photo Lab before/after images
};

// Film-style tone and colour pass on raw RGB pixels.
function filmCurve(data, f) {
  const smooth = (x) => x * x * (3 - 2 * x);
  for (let i = 0; i < data.length; i += 3) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const max = Math.max(r, g, b);
    const greenness = max > 0.02 ? Math.max(0, g - Math.max(r, b)) / max : 0;
    const sat = f.saturation * (1 - f.greenDesat * greenness);
    r = L + (r - L) * sat;
    g = L + (g - L) * sat;
    b = L + (b - L) * sat;
    const sh = (1 - L) * (1 - L);
    const hi = L * L;
    r += sh * f.shadowTint[0] + hi * f.highlightTint[0];
    g += sh * f.shadowTint[1] + hi * f.highlightTint[1];
    b += sh * f.shadowTint[2] + hi * f.highlightTint[2];
    const out = [r, g, b].map((c) => {
      c = Math.min(1, Math.max(0, c));
      c = c + f.contrast * (smooth(c) - c);
      c = f.blackLift + c * (1 - f.blackLift - f.whiteRolloff);
      return Math.round(c * 255);
    });
    data[i] = out[0];
    data[i + 1] = out[1];
    data[i + 2] = out[2];
  }
  return data;
}

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

// Crop to the slot's shape. `focus` is "attention" / "entropy" (automatic), or
// [x, y] fractions marking the point to keep centred, e.g. [0.6, 0.4].
async function cropTo(file, w, h, focus) {
  const oriented = await sharp(file, { failOn: 'none' }).rotate().toColourspace('srgb').removeAlpha().png().toBuffer({ resolveWithObject: true });
  const { width: sw, height: sh } = oriented.info;
  if (Array.isArray(focus)) {
    const target = w / h;
    let cw = sw;
    let ch = sh;
    if (sw / sh > target) cw = Math.round(sh * target);
    else ch = Math.round(sw / target);
    const left = Math.round(Math.min(Math.max(focus[0] * sw - cw / 2, 0), sw - cw));
    const top = Math.round(Math.min(Math.max(focus[1] * sh - ch / 2, 0), sh - ch));
    return { buf: await sharp(oriented.data).extract({ left, top, width: cw, height: ch }).resize({ width: w, height: h, kernel: 'lanczos3' }).png().toBuffer(), srcWidth: cw };
  }
  const position = focus === 'entropy' ? sharp.strategy.entropy : focus === 'attention' ? sharp.strategy.attention : focus ?? 'centre';
  const srcWidth = Math.min(sw, Math.round((sh * w) / h));
  return { buf: await sharp(oriented.data).resize({ width: w, height: h, fit: 'cover', position, kernel: 'lanczos3' }).png().toBuffer(), srcWidth };
}

// Build the full-resolution graded master. Each stage runs as its own pass
// because sharp applies operations within a single pipeline in a fixed order.
async function gradeMaster(file, [rw, rh], maxWidth, focus) {
  const w = maxWidth;
  const h = Math.round((maxWidth * rh) / rw);
  const { buf: cropped, srcWidth } = await cropTo(file, w, h, focus);
  if (srcWidth < w * 0.95) console.warn(`  ! ${path.basename(file)} is only ${srcWidth}px wide after cropping; largest size (${w}px) is upscaled`);
  const before = cropped;

  let buf = await sharp(cropped).normalise(grade.levels).png().toBuffer();
  if (grade.localContrast) buf = await sharp(buf).clahe(grade.localContrast).png().toBuffer();
  const raw = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  filmCurve(raw.data, grade.film);
  buf = await sharp(raw.data, { raw: raw.info }).png().toBuffer();

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

// `soften` (a blur sigma) replaces sharpening for photos that sit behind text
// overlays: it reads as film softness and roughly halves the file size.
async function writeSizes(slot, master, [rw, rh], widths, { sharpen, soften, before }) {
  const files = [];
  for (const width of widths) {
    const height = Math.round((width * rh) / rw);
    let img = sharp(master).resize({ width, height, kernel: 'lanczos3' });
    if (soften) img = img.blur(soften);
    else if (sharpen) img = img.sharpen(grade.sharpen);
    const resized = await img.png().toBuffer();
    const base = path.join(outDir, `${slot}-${width}`);
    await sharp(resized).avif({ quality: grade.quality.avif, effort: 4 }).toFile(base + '.avif');
    await sharp(resized).webp({ quality: grade.quality.webp, effort: 6 }).toFile(base + '.webp');
    files.push(`${slot}-${width}`);
  }
  if (before) {
    const width = Math.min(widths[widths.length - 1], grade.labWidth);
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
      await writeSizes(slot, master, cfg.ratio, cfg.widths, { sharpen: true, soften: cfg.soften, before });
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
  // Remove generated images for slots that no longer exist in slots.json.
  for (const file of await fs.readdir(outDir)) {
    const slot = file.replace(/-(\d+|before|after)\.(avif|webp|jpg)$/, '');
    if (slot !== file && !slots[slot]) await fs.unlink(path.join(outDir, file));
  }
  await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  // Also expose the manifest as a script so the Photo Lab page works from file:// too.
  await fs.writeFile(path.join(outDir, 'manifest.js'), `window.HH_PHOTOS = ${JSON.stringify(manifest)};\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
