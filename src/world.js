// The forest: a fixed, seeded layout so the place feels familiar every time.
import { rng, dist } from './util.js';

export const W = 3000, H = 2000, MARGIN = 150;

// The dirt path from the nest to the (future) town gate in the east.
export const PATH = [[560, 1010], [1000, 1080], [1400, 1040], [1800, 1150], [2300, 1080], [2960, 1100]];

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const k = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - dx * k, py - ay - dy * k);
}
export function distToPath(x, y) {
  let d = Infinity;
  for (let i = 0; i < PATH.length - 1; i++) d = Math.min(d, distToSeg(x, y, PATH[i][0], PATH[i][1], PATH[i + 1][0], PATH[i + 1][1]));
  return d;
}

export function buildForest() {
  const r = rng(11);
  const home = { x: 620, y: 1000 };
  const house = { x: 560, y: 940 };
  const pond = { x: 1560, y: 640, rx: 230, ry: 135 };
  const gate = { x: 2915, y: 1100 };
  const appleTree = { x: 1300, y: 1430, s: 1.35, hue: 3, seed: 1, apple: true };

  const inPond = (x, y, pad = 0) => ((x - pond.x) / (pond.rx + pad)) ** 2 + ((y - pond.y) / (pond.ry + pad)) ** 2 < 1;
  const farFrom = (arr, x, y, g) => arr.every((o) => dist(x, y, o.x, o.y) > g);
  // keep the nest clear, and also the strip in front of it where a tree would block the camera's view of the start
  const nestView = (x, y) => Math.abs(x - home.x) < 260 && y > home.y - 100 && y < home.y + 520;
  // ...and in front of the drinking spot on the pond's near shore
  const pondView = (x, y) => Math.abs(x - (pond.x - 10)) < 190 && y > pond.y && y < pond.y + pond.ry + 430;
  const clear = (x, y) => dist(x, y, home.x, home.y) > 250 && !nestView(x, y) && !pondView(x, y) && !inPond(x, y, 80) && distToPath(x, y) > 110;
  const mkTree = (x, y, s) => ({ x, y, s, hue: (r() * 4) | 0, seed: r() * 10 });

  // Border: a cosy wall of trees all around.
  const border = [];
  for (let x = 30; x < W; x += 112) {
    border.push(mkTree(x + r() * 30, 80 + r() * 50, 1 + r() * 0.3));
    border.push(mkTree(x + r() * 30, H + 60 + r() * 40, 1.05 + r() * 0.3));
  }
  for (let y = 230; y < H; y += 118) {
    border.push(mkTree(50 + r() * 40, y + r() * 30, 1 + r() * 0.3));
    if (Math.abs(y - gate.y) > 240) border.push(mkTree(W - 50 - r() * 40, y + r() * 30, 1 + r() * 0.3));
  }

  // Scattered trees inside.
  const trees = [appleTree];
  for (let i = 0; i < 1500 && trees.length < 46; i++) {
    const x = 220 + r() * (W - 440), y = 330 + r() * (H - 560);
    if (clear(x, y) && farFrom(trees, x, y, 215)) trees.push(mkTree(x, y, 0.85 + r() * 0.4));
  }

  const BERRY = ['#FF7FA0', '#C79BFF', '#FFD43B', '#6EC6FF'];
  const bushes = [];
  for (let i = 0; i < 1500 && bushes.length < 30; i++) {
    const x = 200 + r() * (W - 400), y = 260 + r() * (H - 460);
    if (clear(x, y) && farFrom(trees, x, y, 95) && farFrom(bushes, x, y, 150)) bushes.push({ x, y, s: 0.85 + r() * 0.4, berry: BERRY[(r() * 4) | 0], w: 0 });
  }
  const rocks = [];
  for (let i = 0; i < 1000 && rocks.length < 12; i++) {
    const x = 200 + r() * (W - 400), y = 260 + r() * (H - 460);
    if (clear(x, y) && farFrom(trees, x, y, 90) && farFrom(bushes, x, y, 100) && farFrom(rocks, x, y, 200)) rocks.push({ x, y, s: 0.8 + r() * 0.5 });
  }
  const tufts = [];
  for (let i = 0; i < 3000 && tufts.length < 150; i++) {
    const x = 170 + r() * (W - 340), y = 220 + r() * (H - 380);
    if (!inPond(x, y, 25) && distToPath(x, y) > 70 && dist(x, y, home.x, home.y) > 130 && farFrom(trees, x, y, 40)) tufts.push({ x, y, seed: r() * 10, dark: r() < 0.5, w: 0 });
  }
  const PETAL = ['#FFFFFF', '#FF9EC4', '#C79BFF', '#FFB36B', '#8FD3FF'];
  const flowers = [];
  for (let i = 0; i < 3000 && flowers.length < 260; i++) {
    const x = 120 + r() * (W - 240), y = 160 + r() * (H - 280);
    if (!inPond(x, y, 18) && distToPath(x, y) > 55) flowers.push({ x, y, color: PETAL[(r() * 5) | 0], rot: r() * 6 });
  }
  const mushrooms = [];
  for (const tr of trees) {
    if (r() < 0.45) mushrooms.push({ x: tr.x + (r() < 0.5 ? -1 : 1) * (38 + r() * 20), y: tr.y + 8 + r() * 14, s: 0.8 + r() * 0.4, color: r() < 0.7 ? '#F2545B' : '#FF9F45' });
  }
  const patches = [];
  for (let i = 0; i < 70; i++) patches.push({ x: r() * W, y: r() * H, rx: 90 + r() * 170, ry: 50 + r() * 80, light: r() < 0.5 });

  const allTrees = trees.concat(border);
  const obstacles = [];
  for (const t of allTrees) obstacles.push({ x: t.x, y: t.y - 4, r: 22 * t.s });
  for (const b of bushes) obstacles.push({ x: b.x, y: b.y - 8, r: 30 * b.s });
  for (const k of rocks) obstacles.push({ x: k.x, y: k.y - 8, r: 27 * k.s });
  obstacles.push({ x: house.x, y: house.y - 14, r: 52 });

  // In 3D, tree tops that would hide food fade away, so food only needs to stay clear of the tree itself.
  const underCanopy = (x, y, pad = 0) => allTrees.some((t) => Math.abs(x - t.x) < (85 + pad) * t.s && Math.abs(y - t.y) < (70 + pad) * t.s);

  // A good place to put food: open ground, visible, reachable.
  const freeSpot = (x, y) =>
    x > 260 && x < W - 260 && y > 330 && y < H - 260 &&
    !inPond(x, y, 70) && !underCanopy(x, y, 15) &&
    obstacles.every((o) => dist(x, y, o.x, o.y) > o.r + 60) &&
    dist(x, y, house.x, house.y) > 150;

  const nearFree = (x, y) => {
    for (let rad = 0; rad < 500; rad += 25) {
      for (let a = 0; a < 6.28; a += 0.5) {
        const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
        if (freeSpot(px, py)) return { x: px, y: py };
      }
    }
    return { x, y };
  };

  return { home, house, pond, gate, appleTree, trees: allTrees, bushes, rocks, tufts, flowers, mushrooms, patches, obstacles, inPond, distToPath, freeSpot, nearFree, underCanopy };
}

// Slide the pig out of anything solid. Soft and forgiving: no getting stuck.
export function pushOut(world, p, rad) {
  for (const o of world.obstacles) {
    const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy), min = o.r + rad;
    if (d < min) {
      if (d < 0.001) { p.x += min; continue; }
      p.x = o.x + (dx / d) * min; p.y = o.y + (dy / d) * min;
    }
  }
  const pd = world.pond, rx = pd.rx + rad + 6, ry = pd.ry + rad + 2;
  const ex = (p.x - pd.x) / rx, ey = (p.y - pd.y) / ry, e = Math.hypot(ex, ey);
  if (e < 1) {
    if (e < 0.001) { p.y = pd.y + ry; } else { p.x = pd.x + (ex / e) * rx; p.y = pd.y + (ey / e) * ry; }
  }
  p.x = Math.max(MARGIN, Math.min(W - MARGIN, p.x));
  p.y = Math.max(MARGIN + 110, Math.min(H - MARGIN, p.y));
}
