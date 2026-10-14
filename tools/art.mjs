// Illustrated placeholder art for every photo slot.
// Each slot in photos/slots.json has an "art" block describing a scene. When no
// original photo exists for a slot, the pipeline renders this SVG instead, so the
// site always looks finished. Real photos replace the art automatically.

import { horsePath, tailPath } from './horse-shape.mjs';

export const palette = {
  ink: '#1c231d',
  forest: '#2c3b2e',
  pine: '#3a4b3a',
  moss: '#56664a',
  sage: '#8e9a7b',
  sageLight: '#b9c1a6',
  mist: '#d8dccb',
  cream: '#f5efe3',
  parchment: '#eadfc9',
  oat: '#d9c8a9',
  sand: '#cdb48a',
  honey: '#d4922a',
  honeyLight: '#edb95a',
  amber: '#a8661a',
  saddle: '#7a4e2d',
  blush: '#e9c7a2',
  dusk: '#26332b',
};

// Time-of-day moods: sky gradient, sun colour, and hill colours from far to near.
const moods = {
  golden: {
    sky: ['#f3d9a4', '#f6ead2', '#f5efe3'],
    sun: '#f2b84b',
    hills: ['#c9c7a3', '#a3ab88', '#7c8a66', '#56664a', '#3a4b3a'],
    figure: '#1c231d',
  },
  dawn: {
    sky: ['#e8cdb7', '#f1e2d2', '#f5efe3'],
    sun: '#f0c08a',
    hills: ['#cfcdb6', '#b0b69b', '#8e9a7b', '#66765a', '#44553f'],
    figure: '#26332b',
  },
  noon: {
    sky: ['#dfe4d6', '#eef0e6', '#f5efe3'],
    sun: '#f6e3b0',
    hills: ['#c5ccb5', '#a9b597', '#8a9a74', '#647554', '#45563c'],
    figure: '#26332b',
  },
  dusk: {
    sky: ['#2b3a30', '#5a5a3e', '#c9893a'],
    sun: '#f0b24a',
    hills: ['#4a5a44', '#3c4c3a', '#2f3e30', '#243127', '#1a241d'],
    figure: '#121813',
  },
};

// Small deterministic random generator so the art is identical on every run.
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hillLine(w, base, amp, rand, freq = 1) {
  const p1 = rand() * Math.PI * 2;
  const p2 = rand() * Math.PI * 2;
  const p3 = rand() * Math.PI * 2;
  return (x) => {
    const t = x / w;
    return (
      base +
      amp * Math.sin(t * Math.PI * 1.3 * freq + p1) +
      amp * 0.45 * Math.sin(t * Math.PI * 3.1 * freq + p2) +
      amp * 0.18 * Math.sin(t * Math.PI * 7.3 * freq + p3)
    );
  };
}

function hillPath(w, h, fn) {
  const step = Math.max(4, Math.round(w / 120));
  let d = `M0,${h} L0,${fn(0).toFixed(1)}`;
  for (let x = step; x <= w + step; x += step) d += ` L${x},${fn(x).toFixed(1)}`;
  return d + ` L${w + step},${h} Z`;
}

function horse({ kind = 'standing', x, ground, height, color, flip = false }) {
  const s = height / 190;
  const sx = flip ? -s : s;
  const tx = flip ? x + 100 * s : x - 100 * s;
  return `<g transform="translate(${tx.toFixed(1)},${(ground - 198 * s).toFixed(1)}) scale(${sx.toFixed(4)},${s.toFixed(4)})" fill="${color}">
    <path d="${horsePath(kind)}"/><path d="${tailPath(kind)}"/></g>`;
}

function fence(w, fn, { color, offset = 0, spacing = 70, postH = 34, from = 0, to = 1 }) {
  const x0 = Math.round(w * from);
  const x1 = Math.round(w * to);
  let posts = '';
  for (let x = x0; x <= x1; x += spacing) {
    const y = fn(x) + offset;
    posts += `<rect x="${(x - 2.5).toFixed(1)}" y="${(y - postH).toFixed(1)}" width="5" height="${postH + 4}" rx="1.5"/>`;
  }
  const rail = (dy) => {
    let d = '';
    for (let x = x0; x <= x1; x += 8) d += `${d ? 'L' : 'M'}${x},${(fn(x) + offset - dy).toFixed(1)} `;
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round"/>`;
  };
  return `<g fill="${color}">${posts}</g>${rail(postH * 0.85)}${rail(postH * 0.45)}`;
}

function tree(x, ground, size, color) {
  const r = size * 0.32;
  return `<g fill="${color}">
    <rect x="${(x - size * 0.03).toFixed(1)}" y="${(ground - size * 0.45).toFixed(1)}" width="${(size * 0.06).toFixed(1)}" height="${(size * 0.45).toFixed(1)}"/>
    <circle cx="${x}" cy="${(ground - size * 0.62).toFixed(1)}" r="${r.toFixed(1)}"/>
    <circle cx="${(x - r * 0.7).toFixed(1)}" cy="${(ground - size * 0.5).toFixed(1)}" r="${(r * 0.75).toFixed(1)}"/>
    <circle cx="${(x + r * 0.75).toFixed(1)}" cy="${(ground - size * 0.52).toFixed(1)}" r="${(r * 0.7).toFixed(1)}"/>
    <circle cx="${(x + r * 0.1).toFixed(1)}" cy="${(ground - size * 0.85).toFixed(1)}" r="${(r * 0.62).toFixed(1)}"/>
  </g>`;
}

function barn(x, ground, size, color, trim) {
  const w = size;
  const h = size * 0.62;
  const wall = h * 0.5;
  const l = x - w / 2;
  const r = x + w / 2;
  const roof = `M${l},${ground - wall} L${l + w * 0.12},${ground - h * 0.82} L${x},${ground - h} L${r - w * 0.12},${ground - h * 0.82} L${r},${ground - wall} Z`;
  const door = `<rect x="${x - w * 0.14}" y="${ground - wall * 0.86}" width="${w * 0.28}" height="${wall * 0.86}" fill="${trim}" opacity="0.35"/>`;
  const cupola = `<rect x="${x - w * 0.05}" y="${ground - h - w * 0.1}" width="${w * 0.1}" height="${w * 0.12}" fill="${color}"/>
    <path d="M${x - w * 0.07},${ground - h - w * 0.1} L${x},${ground - h - w * 0.17} L${x + w * 0.07},${ground - h - w * 0.1} Z" fill="${color}"/>`;
  return `<g><rect x="${l}" y="${ground - wall}" width="${w}" height="${wall}" fill="${color}"/>
    <path d="${roof}" fill="${color}"/>${cupola}${door}</g>`;
}

function hexPath(cx, cy, r) {
  let d = '';
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }
  return d + 'Z';
}

function honeycomb(w, h, rand) {
  const r = Math.min(w, h) / 9.5;
  const dx = r * Math.sqrt(3);
  const dy = r * 1.5;
  const tones = ['#e9a73c', '#d4922a', '#c27f20', '#f0be62', '#b8741a', '#dda040'];
  let cells = '';
  for (let row = -1, y = 0; y < h + r * 2; row++, y = row * dy) {
    for (let col = -1, x = 0; x < w + dx; col++, x = col * dx + (row % 2 ? dx / 2 : 0)) {
      const tone = tones[Math.floor(rand() * tones.length)];
      const capped = rand() > 0.72;
      cells += `<path d="${hexPath(x, y, r * 0.93)}" fill="${capped ? '#f4dfb0' : tone}"/>`;
      if (!capped && rand() > 0.5) {
        cells += `<path d="${hexPath(x - r * 0.15, y - r * 0.2, r * 0.38)}" fill="#fff6dc" opacity="0.35"/>`;
      }
    }
  }
  // Honey drips from the top edge.
  let drips = '';
  for (let i = 0; i < 5; i++) {
    const x = w * (0.08 + rand() * 0.84);
    const len = h * (0.06 + rand() * 0.16);
    const wd = r * (0.1 + rand() * 0.1);
    drips += `<path d="M${x - wd},0 L${x - wd},${len} a${wd},${wd} 0 0 0 ${wd * 2},0 L${x + wd},0 Z" fill="#b8741a" opacity="0.9"/>`;
  }
  return `<rect width="${w}" height="${h}" fill="#a8661a"/>${cells}${drips}`;
}

function arena(w, h, m, rand) {
  const horizon = h * 0.48;
  const far = hillLine(w, horizon - h * 0.05, h * 0.04, rand);
  const trees = Array.from({ length: 9 }, (_, i) => tree(w * (i / 8) + (rand() - 0.5) * w * 0.06, horizon, h * (0.18 + rand() * 0.12), m.hills[2])).join('');
  const sandTop = horizon + h * 0.02;
  // Jump: two standards with striped rails.
  const jx = w * 0.56;
  const jw = w * 0.26;
  const jy = h * 0.8;
  const sh = h * 0.2;
  const stripes = (y) => {
    let s = '';
    const n = 8;
    for (let i = 0; i < n; i++) {
      s += `<rect x="${(jx - jw / 2 + (jw / n) * i).toFixed(1)}" y="${y.toFixed(1)}" width="${(jw / n).toFixed(1)}" height="${(h * 0.014).toFixed(1)}" fill="${i % 2 ? palette.cream : palette.honey}"/>`;
    }
    return s;
  };
  return `
    <path d="${hillPath(w, h, far)}" fill="${m.hills[1]}"/>
    ${trees}
    <rect x="0" y="${sandTop}" width="${w}" height="${h - sandTop}" fill="url(#sand)"/>
    ${fence(w, () => sandTop + h * 0.035, { color: palette.cream, postH: h * 0.07, spacing: w / 9 })}
    <g fill="${palette.cream}">
      <rect x="${(jx - jw / 2 - w * 0.012).toFixed(1)}" y="${(jy - sh).toFixed(1)}" width="${(w * 0.012).toFixed(1)}" height="${sh.toFixed(1)}"/>
      <rect x="${(jx + jw / 2).toFixed(1)}" y="${(jy - sh).toFixed(1)}" width="${(w * 0.012).toFixed(1)}" height="${sh.toFixed(1)}"/>
    </g>
    ${stripes(jy - sh * 0.82)}${stripes(jy - sh * 0.5)}
    <ellipse cx="${jx}" cy="${jy + h * 0.01}" rx="${jw * 0.6}" ry="${h * 0.012}" fill="${palette.amber}" opacity="0.18"/>`;
}

function indoor(w, h, m) {
  // Looking out of a barn aisle into a sunny field.
  const doorW = w * 0.42;
  const doorH = h * 0.62;
  const dx = (w - doorW) / 2;
  const dy = h * 0.2;
  const outside = `<g clip-path="url(#door)">
    <rect x="${dx}" y="${dy}" width="${doorW}" height="${doorH}" fill="url(#sky)"/>
    <circle cx="${dx + doorW * 0.62}" cy="${dy + doorH * 0.36}" r="${doorW * 0.09}" fill="${m.sun}"/>
    <path d="${hillPath(w, h, (x) => dy + doorH * 0.62 + Math.sin(x / 60) * 6)}" fill="${m.hills[2]}"/>
    <path d="${hillPath(w, h, (x) => dy + doorH * 0.78 + Math.sin(x / 45 + 1) * 5)}" fill="${m.hills[3]}"/>
  </g>`;
  const boards = Array.from({ length: 14 }, (_, i) => `<rect x="${(i * w) / 14}" y="0" width="${w / 14 - 3}" height="${h}" fill="${i % 2 ? '#3d3022' : '#45372a'}"/>`).join('');
  return `<rect width="${w}" height="${h}" fill="#352a1f"/>${boards}
    <rect x="${dx - 14}" y="${dy - 14}" width="${doorW + 28}" height="${doorH + 14}" fill="#241c14"/>
    ${outside}
    <path d="M${dx},${dy + doorH} L${w * 0.08},${h} L${w * 0.92},${h} L${dx + doorW},${dy + doorH} Z" fill="url(#aisle)"/>
    <path d="M${dx + doorW * 0.08},${dy + doorH} L${w * 0.32},${h} L${w * 0.68},${h} L${dx + doorW * 0.92},${dy + doorH} Z" fill="${m.sun}" opacity="0.12"/>`;
}

function landscape(w, h, m, art, rand) {
  const layers = art.layers ?? 4;
  const horizon = h * (art.horizon ?? 0.58);
  const fns = [];
  let out = '';
  for (let i = 0; i < layers; i++) {
    const t = i / Math.max(1, layers - 1);
    const base = horizon + t * h * (art.depth ?? 0.3);
    const amp = h * (0.035 + t * 0.03) * (art.roll ?? 1);
    const fn = hillLine(w, base, amp, rand, 0.8 + t * 0.4);
    fns.push(fn);
    const color = m.hills[Math.min(m.hills.length - 1, i + (5 - layers))];
    out += `<path d="${hillPath(w, h, fn)}" fill="${color}"/>`;
    if (art.trees && i === 0) {
      for (let k = 0; k < art.trees; k++) {
        const x = w * (0.04 + rand() * 0.92);
        out += tree(x, fn(x) + 4, h * (0.08 + rand() * 0.07), m.hills[Math.min(4, i + 2)]);
      }
    }
    if (art.barn && i === Math.min(1, layers - 1)) {
      const x = w * art.barn.x;
      out += barn(x, fn(x) + 6, w * (art.barn.size ?? 0.14), m.hills[4], palette.cream);
    }
    if (art.fence && i === layers - 2) {
      out += fence(w, fn, { color: m.figure, offset: h * 0.02, spacing: w / 14, postH: h * 0.05, from: art.fence.from ?? 0, to: art.fence.to ?? 1 });
    }
  }
  for (const hz of art.horses ?? []) {
    const fn = fns[Math.min(fns.length - 1, hz.layer ?? fns.length - 1)];
    const x = w * hz.x;
    out += horse({ kind: hz.kind, x, ground: fn(x) + h * 0.012, height: h * hz.size, color: m.figure, flip: hz.flip });
  }
  return out;
}

export function renderArt(art, width, height) {
  const w = width;
  const h = height;
  const m = moods[art.mood ?? 'golden'];
  const rand = rng(art.seed ?? 7);
  const sunX = w * (art.sun?.x ?? 0.7);
  const sunY = h * (art.sun?.y ?? 0.42);
  const sunR = Math.min(w, h) * (art.sun?.r ?? 0.09);

  let body;
  if (art.scene === 'honey') body = honeycomb(w, h, rand);
  else if (art.scene === 'arena') body = arena(w, h, m, rand);
  else if (art.scene === 'indoor') body = indoor(w, h, m);
  else body = landscape(w, h, m, art, rand);

  const showSky = art.scene !== 'honey' && art.scene !== 'indoor';
  const doorW = w * 0.42;
  const doorH = h * 0.62;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${m.sky[0]}"/><stop offset="0.6" stop-color="${m.sky[1]}"/><stop offset="1" stop-color="${m.sky[2]}"/>
    </linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="${m.sun}" stop-opacity="0.55"/><stop offset="1" stop-color="${m.sun}" stop-opacity="0"/></radialGradient>
    <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9c29a"/><stop offset="1" stop-color="#b99a6c"/></linearGradient>
    <linearGradient id="aisle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b5a43"/><stop offset="1" stop-color="#2b2219"/></linearGradient>
    <clipPath id="door"><rect x="${(w - doorW) / 2}" y="${h * 0.2}" width="${doorW}" height="${doorH}"/></clipPath>
    <radialGradient id="vignette" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1c1408" stop-opacity="0.22"/></radialGradient>
  </defs>
  ${showSky ? `<rect width="${w}" height="${h}" fill="url(#sky)"/>
  <circle cx="${sunX}" cy="${sunY}" r="${sunR * 3.2}" fill="url(#glow)"/>
  <circle cx="${sunX}" cy="${sunY}" r="${sunR}" fill="${m.sun}"/>` : ''}
  ${body}
  <rect width="${w}" height="${h}" fill="url(#vignette)"/>
</svg>`;
}
