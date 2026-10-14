// Hand-plotted horse silhouettes (facing right), smoothed with Catmull-Rom splines.
// Coordinates live in a 200 x 200 box with the ground at y = 198.

function smooth(points, closed = true, tension = 0.5) {
  const p = points;
  const n = p.length;
  const get = (i) => p[(i + n) % n];
  let d = `M${p[0][0]},${p[0][1]}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const t = tension / 3;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d + (closed ? 'Z' : '');
}

// Shared body: hind legs, belly and front legs, traced from the chest backwards.
const legs = [
  [146, 116], [146, 130], [144, 158], [145, 184], [148, 196], [137, 197], [137, 184], [136, 158], [134, 140],
  [131, 138], [128, 142], [127, 160], [126, 186], [128, 196], [119, 197], [119, 186], [119, 160], [118, 142],
  [104, 144], [86, 144], [72, 140],
  [70, 148], [68, 160], [64, 172], [65, 186], [68, 196], [58, 197], [57, 186], [56, 172], [56, 154],
  [53, 160], [51, 170], [51, 186], [54, 196], [44, 197], [43, 186], [43, 174], [39, 165], [40, 152],
  [37, 136], [32, 118], [31, 100],
];

// Standing horse, head up.
const standing = [
  [38, 82], [54, 72], [80, 78], [104, 76], [122, 70], [134, 58], [146, 43], [155, 30],
  [155, 15], [161, 24], [165, 14], [167, 27], [176, 38], [184, 50], [190, 60], [188, 67],
  [180, 70], [169, 65], [161, 63], [155, 76], [151, 92], [148, 106],
  ...legs,
];

// Grazing horse, head down.
const grazing = [
  [38, 82], [54, 72], [80, 78], [104, 78], [124, 72], [142, 80], [156, 98], [166, 120],
  [174, 142], [181, 136], [180, 148], [187, 160], [190, 178], [190, 190], [182, 195], [175, 188],
  [168, 174], [160, 156], [152, 136], [148, 122],
  ...legs,
];

// Tails as tapered filled shapes.
const tails = {
  standing: [[40, 79], [28, 86], [21, 104], [19, 128], [21, 150], [26, 168], [28, 148], [28, 124], [30, 104], [37, 90]],
  grazing: [[40, 79], [28, 86], [21, 104], [19, 128], [21, 150], [26, 168], [28, 148], [28, 124], [30, 104], [37, 90]],
};

export function horsePath(kind = 'standing') {
  return smooth(kind === 'grazing' ? grazing : standing);
}
export function tailPath(kind = 'standing') {
  return smooth(tails[kind]);
}
