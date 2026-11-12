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

// Things with a flat top that Darling can jump onto. A round one is a point with a radius,
// a long one (the log) is a line with a radius.
export function nearestOn(o, x, y) {
  const dx = o.bx - o.ax, dy = o.by - o.ay, l2 = dx * dx + dy * dy;
  const k = l2 ? Math.max(0, Math.min(1, ((x - o.ax) * dx + (y - o.ay) * dy) / l2)) : 0;
  return [o.ax + dx * k, o.ay + dy * k];
}
export function platDist(o, x, y) { const [cx, cy] = nearestOn(o, x, y); return Math.hypot(x - cx, y - cy); }
export const STEP = 6;       // how far below a top the feet may be and still count as "on it"

// The hedge maze: a place of its own, out to the east of the forest. A grid of cells with hedges between
// them, grown from a seed so it is the same maze every time. Every cell can be reached and there is
// exactly one way between any two cells.
export function buildMaze(seed = 5, n = 5, cell = 200, x0 = 4300, y0 = 500) {
  const r = rng(seed), T = 38;                                    // T = how thick a hedge is
  const id = (cx, cy) => cy * n + cx, links = Array.from({ length: n * n }, () => []);
  const seen = new Set([id(0, n - 1)]), stack = [[0, n - 1]];
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const next = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < n && y < n && !seen.has(id(x, y)));
    if (!next.length) { stack.pop(); continue; }
    const [nx, ny] = next[(r() * next.length) | 0];
    links[id(cx, cy)].push(id(nx, ny)); links[id(nx, ny)].push(id(cx, cy));
    seen.add(id(nx, ny)); stack.push([nx, ny]);
  }
  const open = (a, b) => links[a].includes(b);
  // hedges: one box for every closed side of a cell, and the wall all round
  const walls = [];
  for (let cy = 0; cy < n; cy++) for (let cx = 0; cx < n; cx++) {
    const x = x0 + cx * cell, y = y0 + cy * cell;
    if (cy === 0) walls.push({ x: x - T / 2, y: y - T / 2, w: cell + T, h: T });
    if (cx === 0) walls.push({ x: x - T / 2, y: y - T / 2, w: T, h: cell + T });
    if (cx === n - 1 || !open(id(cx, cy), id(cx + 1, cy))) walls.push({ x: x + cell - T / 2, y: y - T / 2, w: T, h: cell + T });
    if (cy === n - 1 || !open(id(cx, cy), id(cx, cy + 1))) walls.push({ x: x - T / 2, y: y + cell - T / 2, w: cell + T, h: T });
  }
  const centre = (c) => ({ x: x0 + ((c % n) + 0.5) * cell, y: y0 + (((c / n) | 0) + 0.5) * cell });
  const cellAt = (x, y) => id(Math.max(0, Math.min(n - 1, ((x - x0) / cell) | 0)), Math.max(0, Math.min(n - 1, ((y - y0) / cell) | 0)));
  // the cells to walk through from one cell to another (the first is where he stands)
  const route = (from, to) => {
    const prev = new Map([[from, -1]]), q = [from];
    for (let i = 0; i < q.length && !prev.has(to); i++) for (const b of links[q[i]]) if (!prev.has(b)) { prev.set(b, q[i]); q.push(b); }
    const out = [];
    for (let c = to; c >= 0 && prev.has(c); c = prev.get(c)) out.unshift(c);
    return out;
  };
  const start = id(0, n - 1), end = id(n - 1, 0), way = route(start, end);
  // a treat waits at the end of the blind alley that is furthest off the way through
  let side = -1, far = 0;
  for (let c = 0; c < n * n; c++) {
    if (links[c].length !== 1 || c === start || c === end) continue;
    const d = route(start, c).filter((k) => !way.includes(k)).length;
    if (d > far) { far = d; side = c; }
  }
  if (side < 0) side = way[(way.length / 2) | 0];
  const size = n * cell;
  return { n, cell, x0, y0, size, T, walls, centre, cellAt, route, start: centre(start), end: centre(end), side: centre(side), mid: { x: x0 + size / 2, y: y0 + size / 2 },
    bounds: { x0: x0 + T / 2, y0: y0 + T / 2, x1: x0 + size - T / 2, y1: y0 + size - T / 2 } };
}

export function buildForest() {
  const r = rng(11);
  const home = { x: 620, y: 1000 };
  const house = { x: 560, y: 940 };
  const pond = { x: 1560, y: 640, rx: 230, ry: 135 };
  // lily pads on the water: [x, y, size, has a flower] relative to the pond's middle
  pond.lilies = [[-90, 96, 1, true], [50, 86, 0.82, false], [30, -102, 0.9, true], [-70, -96, 0.7, false]];
  const round = (kind, x, y, r, h, wet) => ({ kind, ax: x, ay: y, bx: x, by: y, r, h, wet });
  const log = { kind: 'log', ax: 670, ay: 1365, bx: 870, by: 1365, r: 24, h: 36 };
  const stump = round('stump', 950, 1365, 42, 66);
  // stepping stones across the pond from the west shore to the big lily pad
  const stones = [[-168, 10], [-68, -15], [32, 15]].map(([dx, dy]) => round('stone', pond.x + dx, pond.y + dy, 34, 9, true));
  const island = round('island', pond.x + 142, pond.y - 5, 64, 7, true);
  // the numbered stones of the "hop in the right order" level: 1 to 5, zig-zagging so there is always a choice
  const numbered = [[-177, -38], [-122, 42], [-12, 42], [-67, -38], [43, -38]].map(([dx, dy], i) => Object.assign(round('stone', pond.x + dx, pond.y + dy, 33, 9, true), { num: i + 1, off: true }));
  const platforms = [log, stump, ...stones, island, ...numbered];
  const onPlat = (x, y, pad) => platforms.some((o) => !o.num && platDist(o, x, y) < o.r + pad);
  const gate = { x: 2915, y: 1100 };
  // the gardener stands beside the path, a little way in front of the town gate
  const gardener = { x: gate.x - 230, y: gate.y - 105 };
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

  // keep the view of the log and the stump open: no tree right in front of them
  const logView = (o) => (Math.abs(o.x - 810) < 240 && o.y > log.ay - 60 && o.y < log.ay + 440) ||
    (Math.abs(o.x - (pond.x - 150)) < 200 && o.y > pond.y && o.y < pond.y + 460);        // ...or in front of the stepping stones
  // ...and the plates of strawberries of the counting levels: no trunk (or bush) between a plate and the camera
  const plates = [[850, 800], [1110, 770], [900, 1215], [1160, 1190]];
  const plateView = (o, wide, deep) => !o.apple && plates.some(([x, y]) => Math.abs(o.x - x) < wide && o.y > y - 70 && o.y < y + deep);
  for (let i = trees.length - 1; i >= 0; i--) if (logView(trees[i]) || plateView(trees[i], 170, 470)) trees.splice(i, 1);
  for (let i = mushrooms.length - 1; i >= 0; i--) if (logView(mushrooms[i]) || plateView(mushrooms[i], 170, 470)) mushrooms.splice(i, 1);
  for (const list of [bushes, rocks]) for (let i = list.length - 1; i >= 0; i--) if (plateView(list[i], 110, 200)) list.splice(i, 1);
  // nothing grows through the log or the stump
  for (const list of [tufts, flowers]) for (let i = list.length - 1; i >= 0; i--) if (onPlat(list[i].x, list[i].y, 16)) list.splice(i, 1);

  const allTrees = trees.concat(border);
  const obstacles = [];
  for (const t of allTrees) obstacles.push({ x: t.x, y: t.y - 4, r: 22 * t.s });
  for (const b of bushes) obstacles.push({ x: b.x, y: b.y - 8, r: 30 * b.s });
  for (const k of rocks) obstacles.push({ x: k.x, y: k.y - 8, r: 27 * k.s });
  obstacles.push({ x: house.x, y: house.y - 14, r: 52 });
  obstacles.push({ x: gardener.x, y: gardener.y, r: 38 });

  // In 3D, tree tops that would hide food fade away, so food only needs to stay clear of the tree itself.
  const underCanopy = (x, y, pad = 0) => allTrees.some((t) => Math.abs(x - t.x) < (85 + pad) * t.s && Math.abs(y - t.y) < (70 + pad) * t.s);

  // A good place to put food: open ground, visible, reachable.
  const freeSpot = (x, y) =>
    x > 260 && x < W - 260 && y > 330 && y < H - 260 &&
    !inPond(x, y, 70) && !underCanopy(x, y, 15) && !onPlat(x, y, 70) &&
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

  return { place: 'forest', maze: buildMaze(), home, house, pond, gate, gardener, appleTree, plates, trees: allTrees, bushes, rocks, tufts, flowers, mushrooms, patches, obstacles, platforms, plat: { log, stump, stones, island }, inPond, distToPath, freeSpot, nearFree, underCanopy };
}

// Slide the pig out of anything solid. Soft and forgiving: no getting stuck.
export function pushOut(world, p, rad) {
  if (world.place === 'maze') {                     // in the maze there are only hedges
    const b = world.maze.bounds;
    for (let pass = 0; pass < 2; pass++) for (const o of world.maze.walls) {
      const cx = Math.max(o.x, Math.min(o.x + o.w, p.x)), cy = Math.max(o.y, Math.min(o.y + o.h, p.y));
      const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
      if (d >= rad) continue;
      if (d > 0.001) { p.x = cx + (dx / d) * rad; p.y = cy + (dy / d) * rad; }
      else if (Math.abs(p.x - (o.x + o.w / 2)) / o.w > Math.abs(p.y - (o.y + o.h / 2)) / o.h) p.x = p.x < o.x + o.w / 2 ? o.x - rad : o.x + o.w + rad;
      else p.y = p.y < o.y + o.h / 2 ? o.y - rad : o.y + o.h + rad;
    }
    p.x = Math.max(b.x0 + rad, Math.min(b.x1 - rad, p.x)); p.y = Math.max(b.y0 + rad, Math.min(b.y1 - rad, p.y));
    return;
  }
  for (const o of world.obstacles) {
    const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy), min = o.r + rad;
    if (d < min) {
      if (d < 0.001) { p.x += min; continue; }
      p.x = o.x + (dx / d) * min; p.y = o.y + (dy / d) * min;
    }
  }
  // the log, the stump and the stones are solid from the side, but not once he is up on top
  const z = p.z || 0;
  for (const o of world.platforms) {
    if (o.off || z >= o.h - STEP) continue;
    const [cx, cy] = nearestOn(o, p.x, p.y), dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy), min = o.r + rad - 4;
    if (d < min) {
      if (d < 0.001) { p.y += min; continue; }
      p.x = cx + (dx / d) * min; p.y = cy + (dy / d) * min;
    }
  }
  // the pond's edge is soft – unless he is in the air or up on a stone
  const pd = world.pond, rx = pd.rx + rad + 6, ry = pd.ry + rad + 2;
  const ex = (p.x - pd.x) / rx, ey = (p.y - pd.y) / ry, e = Math.hypot(ex, ey);
  if (e < 1 && z < 1 && !p.air) {
    if (e < 0.001) { p.y = pd.y + ry; } else { p.x = pd.x + (ex / e) * rx; p.y = pd.y + (ey / e) * ry; }
  }
  p.x = Math.max(MARGIN, Math.min(W - MARGIN, p.x));
  p.y = Math.max(MARGIN + 110, Math.min(H - MARGIN, p.y));
}
