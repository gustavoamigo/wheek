// Game logic: the pig, the mission, hints and the picture HUD.
// The 3D view lives in scene.js; here the world is a flat map (x = east, y = south).
import { TAU, clamp, lerp, dist, easeOut, easeInOut } from './util.js';
import * as A from './audio.js';
import * as Art from './art.js';
import { buildForest, pushOut, nearestOn, platDist, STEP, W, H } from './world.js';
import { spawn, burst, updateFx, drawFx } from './fx.js';
import { input, initInput, keyVector } from './input.js';
import * as S from './scene.js';

const canvas = document.getElementById('game');
const hud = document.getElementById('hud');
const ctx = hud.getContext('2d');
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const view = S.view;

// ------------------------------------------------------------------ state --
const world = buildForest();
const PIG_R = 26;

const G = {
  t: 0, mode: 'title',
  world,
  pig: {
    x: world.home.x + 40, y: world.home.y + 20, vx: 0, vy: 0, heading: 0.35,
    walkPhase: 0, state: 'idle', stateT: 0, hopT: -1, pops: 0, runT: 0, zoom: false,
    blinkSeed: Math.random() * 3, food: null, stepAcc: 0, dustAcc: 0, stuckT: 0,
    z: 0, vz: 0, air: false, on: null,   // height: jumping and standing on things
    safe: null,                          // the last place he stood, to go back to after a splash
  },
  level: -1,         // -1 = just play (breakfast and a drink, for ever); 0, 1, 2 = the levels
  done: 0,           // how many levels are finished
  jumpOn: true,      // is the jump button there? (not yet in level 1)
  task: null,        // the number game of the level, if it has one (see startTask)
  piles: [],         // plates of strawberries (counting level)
  nums: [],          // numbers that pop up when something is counted
  gardener: { wave: 0, nod: 0, no: 0, happy: 0 }, gateOpen: false,
  foods: [], eaten: 0, round: 0, stars: 0,
  mission: 'food',   // 'food' = breakfast (five foods), then 'drink' = a drink at the pond
  slotPop: [0, 0, 0, 0, 0, 0, 0, 0],
  flyers: [],
  hint: null,        // { x, y, kind, t } – where the last sniff pointed
  trail: null,       // scent trail on the ground
  idleT: 0, moved: 0, celebT: 0, starPop: 0,
  squirrel: { hasApple: true, wave: 0, dropT: -1 },
  butterflies: [],
};
window.__G = G;
try { G.stars = Math.min(99, parseInt(localStorage.getItem('darling.stars') || '0', 10) || 0); } catch {}
try { G.done = clamp(parseInt(localStorage.getItem('darling.level') || '0', 10) || 0, 0, 8); } catch {}
if (params.has('unlock')) G.done = 8;

const { squirrelPos } = S.initScene(canvas, world);
function resize() {
  S.resize();
  hud.width = Math.round(view.cw * view.dpr); hud.height = Math.round(view.ch * view.dpr);
}
window.addEventListener('resize', resize);
resize();

for (let i = 0; i < 9; i++) {
  const b = {
    x: 300 + Math.random() * (W - 600), y: 400 + Math.random() * (H - 800), h: 50, seed: Math.random() * 10,
    a: Math.random() * TAU, color: ['#FF9EC4', '#FFE066', '#B8A1FF', '#8FD3FF', '#FFFFFF'][i % 5], boost: 0,
  };
  G.butterflies.push(b); S.addButterfly(b);
}

// handy for effects: a point in front of (or behind) the pig, at some height
const nose = (d = 62, h = 44) => {
  const p = G.pig;
  return { x: p.x + Math.cos(p.heading) * d, y: h, z: p.y + Math.sin(p.heading) * d };
};

// Round 1 is hand-placed close to the nest; later rounds spread further out.
const FIRST_SPOTS = { carrot: [860, 960], strawberry: [1120, 800], dandelion: [1000, 1300], lettuce: [1700, 1010] };

function pickSpot(taken) {
  for (let i = 0; i < 600; i++) {
    const x = 260 + Math.random() * (W - 520), y = 330 + Math.random() * (H - 600);
    if (!world.freeSpot(x, y)) continue;
    if (dist(x, y, G.pig.x, G.pig.y) < 450) continue;
    if (dist(x, y, world.appleTree.x, world.appleTree.y) < 320) continue;
    if (taken.some((o) => dist(x, y, o.x, o.y) < 420)) continue;
    return { x, y };
  }
  return world.nearFree(W / 2, H / 2 + 300);
}

// The levels. Each one adds one new idea; the goals are pictures in the top bar.
const PL = world.plat;
const waterSpot = () => [world.pond.x - 10, world.pond.y + world.pond.ry + 38];
const LEVELS = [
  // 1: three easy things – eat, drink, ask the squirrel
  { jump: false, start: [world.home.x + 40, world.home.y + 20], goals: () => [['carrot', ...FIRST_SPOTS.carrot], ['water', ...waterSpot()], ['apple']] },
  // 2: jump – up onto the log, and from the log onto the stump
  { jump: true, start: [790, 1480], face: -1.57, goals: () => [['dandelion', PL.log.ax + 55, PL.log.ay, PL.log.h], ['strawberry', PL.stump.ax, PL.stump.ay, PL.stump.h]] },
  // 3: jumps in a row – over the stepping stones to the big lily pad
  { jump: true, start: [1215, 690], face: 0, goals: () => [['carrot', PL.stones[1].ax, PL.stones[1].ay, PL.stones[1].h], ['lettuce', PL.island.ax + 14, PL.island.ay + 6, PL.island.h]] },
  // 4: counting – find the plate with that many strawberries
  { jump: false, start: [world.home.x + 40, world.home.y + 20], task: 'piles', counts: [4, 2, 5, 3], asks: [3, 5, 4], goals: () => [] },
  // 5: number order – hop the stones 1, 2, 3, 4, 5
  { jump: true, start: [1215, 690], face: 0, task: 'order', seq: [1, 2, 3, 4, 5], goals: () => [['lettuce', PL.island.ax + 14, PL.island.ay + 6, PL.island.h]] },
  // 6: count your wheeks – the gardener at the gate shows a number
  { jump: false, start: [2400, 1110], face: 0, task: 'wheeks', asks: [2, 4, 3], goals: () => [['carrot'], ['strawberry'], ['lettuce']] },
  // 7: adding – "2 + 1": find the plate with that many altogether
  { jump: false, start: [world.home.x + 40, world.home.y + 20], task: 'piles', counts: [5, 3, 6, 4], asks: [[2, 1], [2, 3], [3, 3]], goals: () => [] },
  // 8: adding on the stones – "1 + 1": hop onto the stone with the answer (2, then 4, then 5), then the lily pad
  { jump: true, start: [1215, 690], face: 0, task: 'order', seq: [2, 4, 5], asks: [[1, 1], [2, 2], [2, 3]], goals: () => [['strawberry', PL.island.ax + 14, PL.island.ay + 6, PL.island.h]] },
];

// ----------------------------------------------------------- number games --
const GD = world.gardener;
const nearGardener = (r) => dist(G.pig.x, G.pig.y, GD.x, GD.y) < r;
const popNum = (n, x, h, z) => G.nums.push({ n, x, h, z, t: 0 });

function startTask(type, L) {
  if (type === 'piles') {
    // four plates of strawberries; he is asked for one number (or one sum) after the other
    const spots = [[850, 800], [1110, 770], [900, 1215], [1160, 1190]];
    G.piles = spots.map(([x, y], i) => ({ ...world.nearFree(x, y), n: L.counts[i], left: L.counts[i], wob: 0, show: 0, cool: false, hint: false }));
    G.task = { type, asks: L.asks, i: 0, tries: 0, bubble: 8 };
  } else if (type === 'order') {
    // seq = the stones to land on, in order; asks = the sums whose answers they are (if it is a sum level)
    G.task = { type, seq: L.seq, asks: L.asks, k: 0, bubble: 1e9 };
    G.foods[0].slot = L.seq.length;                 // the treat comes after the five numbers in the picture bar
  } else {
    G.task = { type, asks: L.asks, i: 0, count: 0, wait: 0, tries: 0 };
    G.foods.forEach((f, i) => { Object.assign(f, world.nearFree(GD.x - 190 - i * 45, GD.y + 150 - i * 55)); f.hidden = true; f.thrown = true; f.hx = GD.x - 120; f.hy = GD.y + 70; });
  }
  S.setPiles(G.piles);
}
// the number being asked for right now (or 0). A sum is asked as a pair: [2, 3] means "2 + 3".
const total = (a) => (Array.isArray(a) ? a[0] + a[1] : a);
const parts = (a) => (Array.isArray(a) ? a : [a]);
const askNow = () => { const t = G.task, i = t && (t.type === 'order' ? t.k : t.i); return t && t.asks && i < t.asks.length ? t.asks[i] : 0; };
const asking = () => total(askNow());
// the gardener only asks while there is no treat lying about
const gardenerAsks = () => G.task && G.task.type === 'wheeks' && asking() && G.celebT <= 0 && !G.foods.some((f) => !f.eaten && !f.hidden);

function touchPile(pl) {
  const p = G.pig, t = G.task;
  input.target = null; p.vx = p.vy = 0; G.idleT = 0;
  p.heading = Math.atan2(pl.y - p.y, pl.x - p.x);
  if (pl.n === asking()) { p.state = 'count'; p.pile = pl; p.bites = 0; p.stateT = p.stateDur = pl.n * 0.6 + 0.3; return; }
  // not this one: a head shake, the plate wobbles and shows its own number; nothing is lost
  pl.cool = true; pl.wob = 1; pl.show = 3.5; t.tries++; t.bubble = 5;
  if (t.tries >= 2) for (const o of G.piles) o.hint = o.n === asking();     // after two goes the right plate shines
  p.state = 'nope'; p.stateT = 0.8; A.nope();
}

function pileDone() {
  const t = G.task;
  G.slotPop[t.i] = 1; t.i++; t.tries = 0; t.bubble = 6;
  for (const o of G.piles) o.hint = false;
  popcorn(2); A.chime(6);
  const n = nose(50, 50); burst(n.x, n.y, n.z, 10);
  if (t.i >= t.asks.length) celebrate();
}

function gardenerHears() {
  const t = G.task, g = G.gardener;
  if (!nearGardener(650)) return;
  if (!gardenerAsks()) { g.wave = 1.6; spawn({ type: 'heart', x: GD.x, y: 340, z: GD.y, vy: 60, delay: 0.4, life: 1.3, size: 14, color: '#FF7FA0' }); return; }
  // She counts every wheek and is in no hurry: too few just means "go on". Only when the number
  // is reached does she wait a moment (in case one more comes), and one too many starts again.
  t.count++; t.wait = t.count >= asking() ? 1.1 : 0; g.nod = 0.7;
  const c = t.count; setTimeout(() => { A.chime(c); popNum(c, G.pig.x, 125, G.pig.y); }, 380);
}

function gardenerJudges() {
  const t = G.task, g = G.gardener;
  if (t.count === asking()) {
    const f = G.foods[t.i];
    g.happy = 1.6; G.slotPop[t.i] = 1; A.chime(6);
    f.hidden = false; f.fall = 0; f.fx = GD.x - 30; f.fy = 190; f.fz = GD.y + 30;
    t.i++; t.tries = 0;
  } else { g.no = 1; A.nope(); t.tries++; }       // too many or too few: she shakes her head and the dots empty
  t.count = 0;
}

function setPlatforms(numbered) {
  for (const o of world.platforms) { o.off = o.num ? !numbered : numbered && o.kind === 'stone'; o.wob = 0; }
}

function startRound() {
  G.foods = []; G.eaten = 0; G.hint = null; G.trail = null; G.idleT = 0;
  G.squirrel.hasApple = false; G.squirrel.dropT = -1;
  G.task = null; G.piles = []; G.nums.length = 0; G.gateOpen = false;
  const L = LEVELS[G.level];
  setPlatforms(!!L && L.task === 'order');
  if (!L || !L.task) S.setPiles(G.piles);
  if (G.level >= 0) {
    L.goals().forEach(([kind, x, y, h = 0], slot) => {
      let hidden = false;
      if (x === undefined && L.task === 'wheeks') { x = y = 0; }
      else if (kind === 'apple') { ({ x, y } = world.nearFree(world.appleTree.x + 130, world.appleTree.y + 110)); hidden = true; G.squirrel.hasApple = true; }
      else if (!h && kind !== 'water') ({ x, y } = world.nearFree(x, y));
      G.foods.push({ kind, slot, x, y, h, eaten: false, hidden, bite: 0, fall: -1, born: G.t, seed: slot * 2.3 });
    });
    if (L.task) startTask(L.task, L);
    S.setFoods(G.foods);
    return;
  }
  if (G.mission === 'drink') {
    // thirsty after breakfast: one goal, at the near shore of the pond
    const pd = world.pond;
    G.foods.push({ kind: 'water', slot: 0, x: pd.x - 10, y: pd.y + pd.ry + 38, eaten: false, hidden: false, bite: 0, fall: -1, born: G.t, seed: 0 });
    S.setFoods(G.foods);
    burst(G.foods[0].x, 40, G.foods[0].y, 8);
    return;
  }
  const taken = [];
  Art.FOOD_KINDS.forEach((kind, slot) => {
    let pos, hidden = false;
    if (kind === 'apple') { pos = world.nearFree(world.appleTree.x + 130, world.appleTree.y + 110); hidden = true; }
    else if (G.round === 0) pos = world.nearFree(...FIRST_SPOTS[kind]);
    else pos = pickSpot(taken);
    taken.push(pos);
    G.foods.push({ kind, slot, x: pos.x, y: pos.y, eaten: false, hidden, bite: 0, fall: -1, born: G.t, seed: Math.random() * 10 });
  });
  G.squirrel.hasApple = true; G.squirrel.dropT = -1;
  S.setFoods(G.foods);
  if (G.round > 0) for (const f of G.foods) if (!f.hidden) burst(f.x, 30, f.y, 6);
}
startRound();

// ---------------------------------------------------------------- actions --
function popcorn(n = 1) { G.pig.pops = Math.min(4, G.pig.pops + n); }

const nearSquirrel = (r) => dist(G.pig.x, G.pig.y, world.appleTree.x + 60, world.appleTree.y + 60) < r;

function nearestFood() {
  let best = null, bd = Infinity;
  for (const f of G.foods) {
    if (f.eaten) continue;
    const tx = f.hidden ? f.hx ?? world.appleTree.x + 90 : f.x, ty = f.hidden ? f.hy ?? world.appleTree.y + 130 : f.y;
    const d = G.level >= 0 ? f.slot : dist(G.pig.x, G.pig.y, tx, ty);     // in a level: in the order of the pictures
    if (d < bd) { bd = d; best = { x: tx, y: ty, kind: f.kind, food: f }; }
  }
  return best;
}

function doSniff() {
  const p = G.pig;
  if (G.mode !== 'play' || p.state !== 'idle') return;
  p.state = 'sniff'; p.stateT = 0.85; input.target = null;
  A.sniff();
  const n = nose(70, 50);
  for (let i = 0; i < 3; i++) {
    spawn({ type: 'puff', ...n, vx: Math.cos(p.heading) * 40, vz: Math.sin(p.heading) * 40, vy: 30, delay: i * 0.2, life: 0.5, size: 4, grow: 16, color: '#fff', alpha: 0.75 });
  }
}

function finishSniff() {
  const p = G.pig, n = nearestFood();
  G.idleT = 0;
  if (G.task && G.task.type === 'piles' && asking()) {
    // the smell reminds him how many he wants; after two wrong plates it also leads to the right one
    G.task.bubble = 6; A.chime(1);
    const pl = G.piles.find((o) => o.hint && o.left > 0);
    if (pl) { G.hint = { x: pl.x, y: pl.y, kind: 'strawberry', t: 10 }; G.trail = { x0: p.x, y0: p.y, x1: pl.x, y1: pl.y, t: 0, life: 8 }; p.heading = Math.atan2(pl.y - p.y, pl.x - p.x); }
    return;
  }
  if (!n) { spawn({ type: 'heart', x: p.x, y: 100, z: p.y, vy: 70, life: 1.2, size: 13, color: '#FF7FA0' }); return; }
  G.hint = { x: n.x, y: n.y, kind: n.kind, t: 10 };
  G.trail = { x0: p.x, y0: p.y, x1: n.x, y1: n.y, t: 0, life: 8 };
  p.heading = Math.atan2(n.y - p.y, n.x - p.x);
  A.chime(1);
}

function doWheek() {
  const p = G.pig;
  if (G.mode !== 'play' || p.state !== 'idle') return;
  p.state = 'wheek'; p.stateT = 0.75; input.target = null;
  A.wheek();
  const n = nose(60, 55);
  for (let i = 0; i < 3; i++) {
    spawn({ type: 'ring', ...n, delay: i * 0.24, life: 0.75, size: 20, grow: 230, color: '#FF7FA0', alpha: 0.9 });
    spawn({ type: 'note', ...n, y: 80, vx: (Math.random() - 0.5) * 120, vz: (Math.random() - 0.5) * 60, vy: 130, delay: i * 0.24, life: 1.1, size: 11, color: '#FF7FA0', drag: 1 });
  }
  for (const b of G.butterflies) if (dist(b.x, b.y, p.x, p.y) < 500) b.boost = 1.5;
  if (G.celebT <= 0) gardenerHears();
  // The squirrel in the apple tree hears you!
  if (nearSquirrel(480)) {
    G.squirrel.wave = 2.2;
    setTimeout(() => A.squirrelChatter(), 500);
    if (G.squirrel.hasApple && G.squirrel.dropT < 0) G.squirrel.dropT = 0.7;
    else if (!G.squirrel.hasApple) spawn({ type: 'heart', x: squirrelPos.x, y: squirrelPos.y + 100, z: squirrelPos.z, vy: 60, delay: 0.5, life: 1.3, size: 13, color: '#FF7FA0' });
  }
}

function dropApple() {
  const apple = G.foods.find((f) => f.kind === 'apple');
  G.squirrel.hasApple = false;
  if (!apple || apple.eaten) return;
  apple.hidden = false; apple.fall = 0;
  apple.fx = squirrelPos.x + 20; apple.fy = squirrelPos.y + 30; apple.fz = squirrelPos.z + 20;
  if (G.hint && G.hint.kind === 'apple') { G.hint.x = apple.x; G.hint.y = apple.y; G.trail = null; }
}

// ------------------------------------------------------------------ jump --
const GRAV = 1400, JUMP_V = 380, JUMP_REACH = 350;   // reach = the fastest an aimed jump may fly
// Where can he get to from here? Everything close enough and not too high.
function reachable() {
  const p = G.pig, out = [];
  for (const o of world.platforms) {
    if (o === p.on || o.off) continue;
    const disc = JUMP_V * JUMP_V - 2 * GRAV * (o.h - p.z);
    if (disc < 0) continue;                                    // too high from here
    const t = (JUMP_V + Math.sqrt(disc)) / GRAV;
    const [x, y] = nearestOn(o, p.x, p.y), d = dist(p.x, p.y, x, y);
    if (d <= JUMP_REACH * t) out.push({ o, x, y, d, t });
  }
  return out;
}
// The one roughly in a given direction (used when the player is steering).
function jumpToward(dir, cone) {
  let best = null, bs = Infinity;
  for (const c of reachable()) {
    const da = Math.atan2(c.y - G.pig.y, c.x - G.pig.x) - dir, ang = Math.abs(Math.atan2(Math.sin(da), Math.cos(da)));
    if (ang <= cone && ang * 150 + c.d < bs) { bs = ang * 150 + c.d; best = c; }
  }
  return best;
}
// The one that takes him closer to (or up towards) the next treat, whichever way he is facing.
// (Not on the numbered stones: there, choosing the stone is the game.)
function jumpToGoal() {
  const p = G.pig, n = nearestFood();
  if (!n || !n.food.h || (G.task && G.task.type === 'order')) return null;
  const here = dist(p.x, p.y, n.x, n.y);
  let best = null, bs = Infinity;
  for (const c of reachable()) {
    const [gx, gy] = nearestOn(c.o, n.x, n.y), far = dist(gx, gy, n.x, n.y);
    if (!(far < here - 10 || (n.food.h > p.z + 20 && c.o.h > p.z))) continue;
    if (far < bs) { bs = far; best = c; }
  }
  // nothing in reach yet, but he is standing on something long (the log): hop along it towards the treat
  if (!best && p.on) {
    const [x, y] = nearestOn(p.on, n.x, n.y), d = dist(p.x, p.y, x, y), t = (2 * JUMP_V) / GRAV;
    if (d > 20 && d <= JUMP_REACH * t) best = { o: p.on, x, y, d, t };
  }
  return best;
}

function doJump(to) {
  const p = G.pig;
  if (G.mode !== 'play' || p.state !== 'idle' || p.air || !G.jumpOn) return;
  let dir = p.heading, sp = Math.hypot(p.vx, p.vy) > 60 ? 300 : 170, steering = false;
  const [kx, ky] = keyVector();
  if (kx || ky) { dir = Math.atan2(ky, kx); sp = 300; steering = true; }
  else if (input.pointerDown && input.target && dist(input.target.x, input.target.y, p.x, p.y) > 30) { dir = Math.atan2(input.target.y - p.y, input.target.x - p.x); sp = 300; steering = true; }
  // Steering (keys, or a finger held down) says where to go. With no steering – the button
  // pressed by mouse or one finger – the jump snaps to the thing that leads to the treat.
  const tg = to || (steering ? jumpToward(dir, 1.2) : (jumpToGoal() || jumpToward(dir, 1.2)));
  if (tg) { dir = Math.atan2(tg.y - p.y, tg.x - p.x); sp = clamp(tg.d / tg.t, 30, JUMP_REACH); }
  p.heading = dir; p.jvx = Math.cos(dir) * sp; p.jvy = Math.sin(dir) * sp;
  p.vz = JUMP_V; p.air = true; p.on = null; p.pops = 0; G.idleT = 0;
  if (!input.pointerDown) input.target = null;
  A.jump();
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.7; spawn({ type: 'puff', x: p.x + Math.cos(a) * 26, y: p.z + 6, z: p.y + Math.sin(a) * 26, vx: Math.cos(a) * 60, vz: Math.sin(a) * 60, life: 0.35, size: 5, grow: 22, color: '#fff', alpha: 0.6 }); }
}

function landed(o) {
  const p = G.pig;
  p.air = false; p.vz = 0; p.on = o; p.z = o ? o.h : 0;
  A.land();
  for (let i = 0; i < 5; i++) { const a = i * 1.257; spawn({ type: 'puff', x: p.x + Math.cos(a) * 28, y: p.z + 5, z: p.y + Math.sin(a) * 28, vx: Math.cos(a) * 80, vz: Math.sin(a) * 80, life: 0.4, size: 6, grow: 24, color: '#fff', alpha: 0.65 }); }
  if (o && o.wet) spawn({ type: 'ring', x: o.ax, y: 2, z: o.ay, life: 0.9, size: o.r, grow: 70, color: '#FFFFFF', alpha: 0.7 });
  // the numbered stones want to be hopped in order
  const t = G.task;
  if (t && t.type === 'order' && o && (o.num || o.kind === 'island')) {
    const want = t.k < t.seq.length ? t.seq[t.k] : 0;            // 0 = all stones done, the lily pad is next
    const wrong = o.num ? !t.seq.slice(0, t.k).includes(o.num) : want > 0;
    if (o.num && o.num === want) { G.slotPop[t.k] = 1; t.k++; A.chime(t.k); popNum(o.num, o.ax, 70, o.ay); burst(o.ax, 30, o.ay, 6); }
    else if (wrong && p.safe) {          // not yet: the stone wobbles and he bounces back to where he was
      o.wob = 1; A.nope(); input.target = null;
      p.state = 'bounce'; p.stateT = 0.45; p.vx = p.vy = 0;
    }
  }
}

// Splash! Getting wet is funny: he bobs in the water, hops back to where he stood, and shakes dry.
function startSplash() {
  const p = G.pig;
  p.air = false; p.vz = 0; p.vx = p.vy = 0; p.z = -20; p.on = null; p.pops = 0; p.hopT = -1;
  p.state = 'splash'; p.stateT = 0.6; p.dry = false; input.target = null;
  A.splash();
  for (let i = 0; i < 3; i++) spawn({ type: 'ring', x: p.x, y: 2, z: p.y, delay: i * 0.14, life: 0.9, size: 20, grow: 150, color: '#FFFFFF', alpha: 0.9 });
  for (let i = 0; i < 22; i++) { const a = Math.random() * TAU, v = 80 + Math.random() * 200; spawn({ type: 'puff', x: p.x, y: 8, z: p.y, vx: Math.cos(a) * v, vz: Math.sin(a) * v, vy: 260 + Math.random() * 260, g: 900, life: 0.8, size: 4 + Math.random() * 3, color: '#8FDBFA' }); }
}

function updateHeight(dt) {
  const p = G.pig;
  if (p.air) {
    const pz = p.z;
    p.vz -= GRAV * dt; p.z += p.vz * dt;
    if (p.vz >= 0) return;
    let land = null, ld = 0;
    for (const o of world.platforms) {
      if (o.off || pz < o.h || p.z >= o.h) continue;
      const d = platDist(o, p.x, p.y);
      if (d < o.r + 46 && (!land || o.h > land.h)) { land = o; ld = d; }       // generous: close is good enough
    }
    if (land) {
      const k = land.r * 0.7;
      if (ld > k) { const [cx, cy] = nearestOn(land, p.x, p.y); p.x = cx + ((p.x - cx) / ld) * k; p.y = cy + ((p.y - cy) / ld) * k; }
      landed(land);
    } else if (p.z <= 0) {
      if (world.inPond(p.x, p.y, -6)) startSplash(); else landed(null);
    }
    return;
  }
  const o = p.on;
  if (o) {
    const [cx, cy] = nearestOn(o, p.x, p.y), d = dist(p.x, p.y, cx, cy);
    const lim = o.wet ? o.r - 4 : o.r + 4;      // no slipping off the edge by walking: only a jump leaves it
    if (d > lim) { p.x = cx + ((p.x - cx) / d) * lim; p.y = cy + ((p.y - cy) / d) * lim; }
  }
  if (p.state === 'idle') p.safe = { x: p.x, y: p.y, z: p.z, on: p.on };
}

function startMunch(f) {
  const p = G.pig;
  p.food = f; input.target = null;
  p.vx = p.vy = 0;
  if (f.kind === 'water') {
    p.state = 'drink'; p.stateT = p.stateDur = 2.1;
    p.heading = Math.atan2(world.pond.y - p.y, f.x - p.x);     // face the water
    A.drink(6);
    return;
  }
  p.state = 'munch'; p.stateT = p.stateDur = 1.15;
  if (dist(f.x, f.y, p.x, p.y) > 4) p.heading = Math.atan2(f.y - p.y, f.x - p.x);
  A.munch(5);
}

function finishMunch() {
  const p = G.pig, f = p.food;
  p.food = null;
  if (!f || f.eaten) return;
  f.eaten = true; G.eaten++; G.idleT = 0;
  if (G.hint && G.hint.kind === f.kind) { G.hint = null; G.trail = null; }
  A.chime(G.eaten + 1);
  popcorn(2);
  const n = nose(50, 50);
  burst(n.x, n.y, n.z, 10);
  const [sx, sy] = S.project(f.x, 40 + (f.h || 0), f.y);
  G.flyers.push({ type: 'food', kind: f.kind, slot: f.slot, sx, sy, t: 0, dur: 0.75 });
  if (G.eaten === G.foods.length) celebrate();
}

function celebrate() {
  G.celebT = 6.5;
  if (G.task && G.task.type === 'wheeks') { G.gateOpen = true; G.gardener.wave = 4; }
  setTimeout(() => { if (G.celebT > 0) { A.fanfare(); popcorn(4); } }, 700);
  setTimeout(() => {
    if (G.celebT <= 0) return;
    const [sx, sy] = S.project(G.pig.x, 110 + G.pig.z, G.pig.y);
    G.flyers.push({ type: 'star', sx, sy, t: 0, dur: 1.1 });
  }, 1500);
}

// Space is the jump key; where there is no jumping yet (level 1) it wheeks, as it always did.
input.onAction = (a) => { A.initAudio(); (a === 'sniff' ? doSniff : a === 'jump' && G.jumpOn ? doJump : doWheek)(); };
input.onTap = (sx, sy) => {
  if (G.mode !== 'play') return true;
  const [px, py, k] = S.project(G.pig.x, 40 + G.pig.z, G.pig.y);
  if (Math.hypot(sx - px, sy - py) < Math.max(36, 62 * k)) { if (!G.pig.air) popcorn(1); return true; }   // tickle the pig!
  // touch a stone, the log or the stump that is in reach: he jumps onto it
  if (G.jumpOn && G.pig.state === 'idle' && !G.pig.air) {
    let best = null, bd = Infinity;
    for (const c of reachable()) {
      const [wx, wy] = S.screenToGround(sx, sy, c.o.h), d = platDist(c.o, wx, wy) - c.o.r;
      if (d < 26 && d < bd) { bd = d; best = c; }
    }
    if (best) { A.initAudio(); doJump(best); return true; }
  }
  return false;
};

// ----------------------------------------------------------------- update --
function turnToward(p, target, k) {
  const d = target - p.heading;
  p.heading += Math.atan2(Math.sin(d), Math.cos(d)) * k;
}

function updatePig(dt) {
  const p = G.pig;
  if (p.state !== 'idle') {
    p.stateT -= dt;
    if (p.state === 'drink' && p.food) {
      p.food.bite = 1 - Math.max(0, p.stateT) / p.stateDur;
      if (Math.random() < dt * 5) spawn({ type: 'ring', ...nose(66, 3), life: 0.9, size: 8, grow: 60, color: '#FFFFFF', alpha: 0.8 });
      if (Math.random() < dt * 10) spawn({ type: 'puff', ...nose(60, 22), vx: (Math.random() - 0.5) * 110, vz: (Math.random() - 0.5) * 110, vy: 130 + Math.random() * 70, g: 600, life: 0.5, size: 3.5, color: '#8FDBFA' });
    }
    if (p.state === 'munch' && p.food) {
      p.food.bite = 1 - Math.max(0, p.stateT) / p.stateDur;
      if (Math.random() < dt * 14) {
        const n = nose(62, 34);
        spawn({ type: 'puff', ...n, vx: (Math.random() - 0.5) * 140, vz: (Math.random() - 0.5) * 140, vy: 120 + Math.random() * 80, g: 600, life: 0.5, size: 3.5, color: Art.FOOD_COLORS[p.food.kind] });
      }
    }
    if (p.state === 'rescue') {                                  // one big hop out of the water, back to where he stood
      const k = 1 - Math.max(0, p.stateT) / p.stateDur, sf = p.safe;
      p.x = lerp(p.fromX, sf.x, k); p.y = lerp(p.fromY, sf.y, k); p.z = lerp(p.fromZ, sf.z, k) + Math.sin(k * Math.PI) * 80;
    }
    if (p.state === 'count' && p.pile) {                         // eating a plate of strawberries, counting each one
      const el = p.stateDur - p.stateT, pl = p.pile;
      while (p.bites < pl.n && el >= 0.3 + p.bites * 0.6) {
        p.bites++; pl.left--; A.munch(2); A.chime(p.bites); popNum(p.bites, pl.x, 100, pl.y);
        for (let i = 0; i < 6; i++) spawn({ type: 'puff', ...nose(62, 34), vx: (Math.random() - 0.5) * 140, vz: (Math.random() - 0.5) * 140, vy: 120 + Math.random() * 80, g: 600, life: 0.5, size: 3.5, color: Art.FOOD_COLORS.strawberry });
      }
    }
    if (p.state === 'shake' && Math.random() < dt * 40) {
      const a = Math.random() * TAU;
      spawn({ type: 'puff', x: p.x, y: p.z + 40, z: p.y, vx: Math.cos(a) * 220, vz: Math.sin(a) * 220, vy: 60 + Math.random() * 120, g: 700, life: 0.45, size: 3.5, color: '#8FDBFA' });
    }
    if (p.stateT <= 0) {
      const s = p.state; p.state = 'idle';
      if (s === 'munch' || s === 'drink') finishMunch();
      if (s === 'sniff') finishSniff();
      if (s === 'count') { p.pile = null; pileDone(); }
      if (s === 'splash' || s === 'bounce') {
        if (!p.safe) p.safe = { x: world.home.x + 40, y: world.home.y + 20, z: 0, on: null };
        p.dry = s === 'bounce'; p.on = null;
        p.state = 'rescue'; p.stateT = p.stateDur = 0.55; p.fromX = p.x; p.fromY = p.y; p.fromZ = p.z;
        p.heading = Math.atan2(p.safe.y - p.y, p.safe.x - p.x); A.jump();
      }
      if (s === 'rescue') {
        p.x = p.safe.x; p.y = p.safe.y; p.z = p.safe.z; p.on = p.safe.on; A.land();
        if (!p.dry) { p.state = 'shake'; p.stateT = 0.75; A.shake(); }
      }
      if (s === 'shake') popcorn(1);
    }
    if (p.state === 'splash' || p.state === 'rescue' || p.state === 'bounce') { input.tapPending = false; return; }
  }

  let ix = 0, iy = 0, mag = 0;
  if (G.mode === 'play' && p.state === 'idle') {
    const [kx, ky] = keyVector();
    if (kx || ky) { ix = kx; iy = ky; mag = 1; input.target = null; }
    else {
      if (input.pointerDown || input.tapPending) {
        let [wx, wy] = S.screenToGround(input.sx, input.sy, p.z);      // on the log, point at the log's top, not the grass under it
        const dx = wx - p.x, dy = wy - p.y, d = Math.hypot(dx, dy);
        if (d > 1500) { wx = p.x + (dx / d) * 1500; wy = p.y + (dy / d) * 1500; }
        input.target = { x: wx, y: wy };
      }
      if (input.target) {
        const dx = input.target.x - p.x, dy = input.target.y - p.y, d = Math.hypot(dx, dy);
        if (d > 18) { ix = dx / d; iy = dy / d; mag = clamp(d / 120, 0.4, 1); }
        else if (!input.pointerDown) input.target = null;
      }
    }
  }
  input.tapPending = false;

  // zoomies: keep running for a moment and the pig takes off
  const wasZoom = p.zoom;
  if (mag > 0.85) p.runT += dt; else p.runT = Math.max(0, p.runT - dt * 4);
  p.zoom = p.runT > 1.1;
  if (p.zoom && !wasZoom) { A.whoosh(); burst(p.x, 30, p.y, 5, { speed: 90 }); }
  const speed = (p.zoom ? 470 : 270) * mag;
  const k = 1 - Math.exp(-dt * (mag ? 9 : 12));
  p.vx = lerp(p.vx, ix * speed, k); p.vy = lerp(p.vy, iy * speed, k);
  if (p.air) { p.vx = p.jvx; p.vy = p.jvy; }           // a jump flies straight

  const ox = p.x, oy = p.y;
  p.x += p.vx * dt; p.y += p.vy * dt;
  pushOut(world, p, PIG_R);
  updateHeight(dt);
  if (p.state === 'splash') return;
  const stepLen = p.air ? 0 : dist(ox, oy, p.x, p.y);
  // If something is in the way of a tap target, give up gently instead of pushing forever.
  if (input.target && !input.pointerDown && mag > 0 && stepLen < speed * dt * 0.25) { p.stuckT += dt; if (p.stuckT > 0.5) { input.target = null; p.stuckT = 0; } }
  else p.stuckT = 0;

  if (Math.hypot(p.vx, p.vy) > 30) turnToward(p, Math.atan2(p.vy, p.vx), 1 - Math.exp(-dt * 10));
  p.walkPhase += stepLen * 0.09;
  G.moved += stepLen;

  p.stepAcc += stepLen;
  if (p.stepAcc > 46 && p.hopT < 0) { p.stepAcc = 0; A.step(); }
  if (p.zoom) {
    p.dustAcc += dt;
    if (p.dustAcc > 0.05) {
      p.dustAcc = 0;
      spawn({ type: 'puff', ...nose(-45, 8), vy: 40, life: 0.5, size: 8, grow: 26, color: '#fff', alpha: 0.7 });
    }
  }

  // popcorn hops
  if (p.hopT < 0 && p.pops > 0 && !p.air) { p.pops--; p.hopT = 0; A.pop(); }
  if (p.hopT >= 0) {
    p.hopT += dt / 0.46;
    if (p.hopT >= 1) {
      p.hopT = -1;
      for (let i = 0; i < 4; i++) {
        const a = i * 1.57 + 0.7;
        spawn({ type: 'puff', x: p.x + Math.cos(a) * 30, y: p.z + 6, z: p.y + Math.sin(a) * 30, vx: Math.cos(a) * 70, vz: Math.sin(a) * 70, life: 0.4, size: 6, grow: 24, color: '#fff', alpha: 0.65 });
      }
    }
  }

  // munch any food we bump into
  if (G.mode === 'play' && p.state === 'idle' && !p.air) {
    for (const f of G.foods) {
      if (f.eaten || f.hidden || f.fall >= 0) continue;
      if (dist(p.x, p.y, f.x, f.y) < 66 && Math.abs(p.z - (f.h || 0)) < 20) { startMunch(f); break; }
    }
  }

  // walk up to a plate of strawberries
  if (G.task && G.task.type === 'piles' && G.mode === 'play' && p.state === 'idle' && G.celebT <= 0) {
    for (const pl of G.piles) {
      if (pl.left <= 0) continue;
      const d = dist(p.x, p.y, pl.x, pl.y);
      if (pl.cool) { if (d > 125) pl.cool = false; continue; }
      if (d < 80) { touchPile(pl); break; }
    }
  }

  // rustle grass and bushes
  for (const g of world.tufts) {
    if (g.w > 0) g.w = Math.max(0, g.w - dt * 2.5);
    if (stepLen > 0.5 && p.z < 10 && Math.abs(g.x - p.x) < 34 && Math.abs(g.y - p.y) < 26 && g.w < 0.3) {
      g.w = 1; A.rustle();
      for (let i = 0; i < (p.zoom ? 3 : 1); i++) spawn({ type: 'leaf', x: g.x, y: 24, z: g.y, vx: (Math.random() - 0.5) * 180, vz: (Math.random() - 0.5) * 180, vy: 170, g: 500, life: 0.7, size: 6, color: '#7FCB5B', vr: 8 });
    }
  }
  for (const b of world.bushes) {
    if (b.w > 0) b.w = Math.max(0, b.w - dt * 2.5);
    if (stepLen > 0.5 && dist(b.x, b.y - 8, p.x, p.y) < 30 * b.s + PIG_R + 6 && b.w < 0.3) { b.w = 1; A.rustle(); }
  }
}

function update(dt) {
  G.t += dt;
  const p = G.pig;
  updatePig(dt);
  updateFx(dt);

  if (G.mode === 'title' && p.hopT < 0 && p.pops === 0 && Math.floor(G.t / 2.6) !== Math.floor((G.t - dt) / 2.6)) p.pops = 1;

  // squirrel + falling apple
  const sq = G.squirrel;
  if (sq.wave > 0) sq.wave -= dt;
  if (sq.dropT >= 0) { sq.dropT -= dt; if (sq.dropT < 0) dropApple(); }
  for (const f of G.foods) {
    if (f.fall >= 0) {
      f.fall += dt / 0.7;
      if (f.fall >= 1) { f.fall = -1; f.born = G.t - 1; A.plop(); burst(f.x, 20, f.y, 8); }
    }
    // food twinkles now and then
    if (!f.eaten && !f.hidden && f.fall < 0 && Math.random() < dt * 1.2) {
      spawn({ type: 'star', x: f.x + (Math.random() - 0.5) * 60, y: (f.h || 0) + 30 + Math.random() * 60, z: f.y + (Math.random() - 0.5) * 30, vy: 30, life: 0.8, size: 6, color: '#FFF3A6' });
    }
  }

  // number games
  const tk = G.task, gd = G.gardener;
  for (const k of ['wave', 'nod', 'no', 'happy']) gd[k] = Math.max(0, gd[k] - dt);
  for (const o of world.platforms) if (o.wob > 0) o.wob = Math.max(0, o.wob - dt * 1.6);
  for (const pl of G.piles) { pl.wob = Math.max(0, pl.wob - dt * 1.4); pl.show = Math.max(0, pl.show - dt); }
  for (let i = G.nums.length - 1; i >= 0; i--) { G.nums[i].t += dt; if (G.nums[i].t > 1.1) G.nums.splice(i, 1); }
  if (tk && tk.bubble > 0) tk.bubble -= dt;
  if (tk && tk.type === 'wheeks' && tk.wait > 0 && p.state !== 'wheek') { tk.wait -= dt; if (tk.wait <= 0 && tk.count > 0) gardenerJudges(); }

  // the pond is alive: a ripple now and then
  if (Math.random() < dt * 0.9) {
    const pd = world.pond, a = Math.random() * TAU, k = Math.sqrt(Math.random()) * 0.75;
    spawn({ type: 'ring', x: pd.x + Math.cos(a) * pd.rx * k, y: 2, z: pd.y + Math.sin(a) * pd.ry * k, life: 1.6, size: 4, grow: 26, color: '#FFFFFF', alpha: 0.55 });
  }

  for (const b of G.butterflies) {
    b.a += (Math.sin(G.t * 0.7 + b.seed * 3) * 1.5) * dt;
    const sp = 40 + b.boost * 160;
    b.x += Math.cos(b.a) * sp * dt; b.y += Math.sin(b.a) * sp * dt;
    if (b.x < 200 || b.x > W - 200 || b.y < 300 || b.y > H - 250) b.a += Math.PI * dt * 2;
    b.x = clamp(b.x, 150, W - 150); b.y = clamp(b.y, 250, H - 200);
    b.boost = Math.max(0, b.boost - dt);
    b.h = 55 + Math.sin(G.t * 2 + b.seed) * 14 + b.boost * 80;
  }

  if (G.hint) { G.hint.t -= dt; if (G.hint.t <= 0) G.hint = null; }
  if (G.trail) { G.trail.t += dt; if (G.trail.t > G.trail.life) G.trail = null; }
  for (let i = 0; i < 5; i++) G.slotPop[i] = Math.max(0, G.slotPop[i] - dt * 2.5);
  G.starPop = Math.max(0, G.starPop - dt * 2);

  for (let i = G.flyers.length - 1; i >= 0; i--) {
    const f = G.flyers[i];
    f.t += dt / f.dur;
    if (f.t >= 1) {
      G.flyers.splice(i, 1);
      if (f.type === 'food') { G.slotPop[f.slot] = 1; A.tap(); }
      else {
        G.stars++; G.starPop = 1; A.chime(7);
        try { localStorage.setItem('darling.stars', String(G.stars)); } catch {}
      }
    }
  }

  if (G.celebT > 0) {
    G.celebT -= dt;
    if (G.celebT <= 0) {
      if (G.level >= 0) {
        // level finished: back to the trail, where the next stone is waiting
        if (G.level + 1 > G.done) { G.done = G.level + 1; try { localStorage.setItem('darling.level', String(G.done)); } catch {} }
        showLevels(G.level);
      } else {
        // breakfast makes you thirsty; after the drink a new breakfast round starts
        if (G.mission === 'food') G.mission = 'drink'; else { G.mission = 'food'; G.round++; }
        startRound();
      }
    }
  }

  if (G.mode === 'play') { G.idleT += dt; updateHints(); }
}

// Buttons wiggle when they are the thing to try next.
let lastNudge = '';
function updateHints() {
  const nearSq = (G.squirrel.hasApple && G.squirrel.dropT < 0 && nearSquirrel(440)) || (gardenerAsks() && G.task.count < asking() && nearGardener(650));
  const sniffHint = !nearSq && G.celebT <= 0 && G.idleT > 14 && !G.hint;
  // something to hop onto close by, and a treat still waiting up high?
  const p = G.pig;
  const jumpHint = G.jumpOn && !p.air && p.state === 'idle' && G.celebT <= 0 && G.foods.some((f) => !f.eaten && f.h > 0) &&
    !(p.on && G.foods.some((f) => !f.eaten && f.h === p.on.h && platDist(p.on, f.x, f.y) < p.on.r)) && !!jumpToGoal();
  const key = (nearSq ? 'w' : '') + (sniffHint ? 's' : '') + (jumpHint ? 'j' : '');
  if (key === lastNudge) return;
  lastNudge = key;
  $('btn-jump').classList.toggle('nudge', jumpHint);
  $('btn-wheek').classList.toggle('nudge', nearSq);
  $('btn-sniff').classList.toggle('nudge', sniffHint);
}

// ---------------------------------------------------------------- overlay --
// Everything flat is drawn on a 2D canvas on top of the 3D view:
// sparkles, the scent trail, speech bubbles and the picture HUD.
function drawTrail(c, time) {
  const tr = G.trail; if (!tr) return;
  const dx = tr.x1 - tr.x0, dy = tr.y1 - tr.y0, d = Math.hypot(dx, dy);
  if (d < 80) return;
  const len = Math.min(d, 900), fade = clamp((tr.life - tr.t) / 1.5, 0, 1);
  const reach = clamp(tr.t / 0.9, 0, 1) * len, gap = 52, off = (time * 120) % gap;
  for (let s = 60 + off; s < reach; s += gap) {
    const k = s / len;
    const [sx, sy, px, ok] = S.project(tr.x0 + (dx / d) * s, 14 + Math.sin(s * 0.05 - time * 5) * 7, tr.y0 + (dy / d) * s);
    if (!ok) continue;
    c.globalAlpha = fade * (1 - k * 0.6);
    c.fillStyle = '#FFFBE0'; Art.circ(c, sx, sy, 13 * px); c.fill();
    c.fillStyle = '#FFD23F'; Art.starPath(c, sx, sy, 11 * px); c.fill();
  }
  c.globalAlpha = 1;
}

// Numbers out in the world: on the stones, over the plates, in thought and speech bubbles.
function drawTaskWorld(c, time) {
  const t = G.task, p = G.pig, cw = view.cw, ch = view.ch;
  if (t && t.type === 'order') {
    for (const o of world.platforms) {
      if (!o.num || o.off) continue;
      const [sx, sy, k, ok] = S.project(o.ax, o.h + 26, o.ay);
      if (!ok) continue;
      const done = t.seq.slice(0, t.k).includes(o.num), next = !t.asks && o.num === t.seq[t.k];     // (in a sum level the answer is not given away)
      const r = Math.max(15, 30 * k) * (next ? 1.08 + Math.sin(time * 5) * 0.07 : 1), x = sx + (o.wob > 0 ? Math.sin(time * 40) * 6 * o.wob : 0);
      c.fillStyle = done ? '#5CCB5F' : '#fff'; Art.circ(c, x, sy, r); c.fill();
      c.lineWidth = Math.max(2, r * 0.14); c.strokeStyle = done ? '#fff' : '#6B3FA8'; c.stroke();
      Art.drawNum(c, o.num, x, sy, r * 1.35, done ? '#fff' : '#6B3FA8', null);
    }
  }
  if (t && t.type === 'piles') {
    for (const pl of G.piles) {                              // a plate that was not the one says its own number
      if (pl.show <= 0 || pl.left <= 0) continue;
      const [sx, sy, k, ok] = S.project(pl.x, 95, pl.y);
      if (!ok) continue;
      c.globalAlpha = clamp(pl.show, 0, 1);
      const r = Math.max(22, 34 * k);
      c.fillStyle = '#EDEAF2'; Art.circ(c, sx, sy, r); c.fill();
      Art.drawNum(c, pl.n, sx, sy - r * 0.12, r * 1.15, '#8E86A0', null);
      Art.drawDots(c, pl.n, pl.n, sx, sy + r * 0.58, r * 0.085, '#8E86A0');
      c.globalAlpha = 1;
    }
  }
  if (t && t.type !== 'wheeks' && asking() && t.bubble > 0 && p.state !== 'count' && G.celebT <= 0) {      // what he is thinking of: "3" and a strawberry, or a sum
      const [bx, by, k] = S.project(p.x, 130 + p.z, p.y);
      const ps = parts(askNow());
      const r = clamp(78 * k, 54, 78) * (ps.length > 1 ? 1.2 : 1), x = clamp(bx + r * (t.type === 'order' ? -0.9 : 0.9), r + 8, cw - r - 8), y = clamp(by - r * 0.4, 110 + r, ch - 200);     // (on the stones: to the left, clear of the numbers)
      c.globalAlpha = clamp(t.bubble * 2, 0, 1);
      Art.drawBubble(c, x, y, r);
      if (ps.length > 1) {
        // a sum: "2 + 3", with the strawberries to count underneath in two groups
        Art.drawNum(c, ps[0], x - r * 0.42, y - r * 0.22, r * 0.8, '#6B3FA8', null);
        Art.drawNum(c, '+', x, y - r * 0.22, r * 0.6, '#FF7FA0', null);
        Art.drawNum(c, ps[1], x + r * 0.42, y - r * 0.22, r * 0.8, '#3A8FD9', null);
        const d = r * 0.075, w = (n) => (n - 1) * d * 2.7;
        Art.drawDots(c, ps[0], ps[0], x - r * 0.1 - w(ps[0]) / 2, y + r * 0.42, d, '#6B3FA8');
        Art.drawDots(c, ps[1], ps[1], x + r * 0.1 + w(ps[1]) / 2, y + r * 0.42, d, '#3A8FD9');
        if (t.type === 'piles') Art.drawFood(c, 'strawberry', x, y + r * 0.72, r / 150);
      } else {
        Art.drawNum(c, asking(), x - r * 0.34, y - r * 0.1, r * 1.05, '#6B3FA8', null);
        Art.drawFood(c, 'strawberry', x + r * 0.4, y - r * 0.12, r / 70);
        Art.drawDots(c, asking(), asking(), x, y + r * 0.56, r * 0.07, '#F2444F');
      }
      c.globalAlpha = 1;
  }
  if (gardenerAsks() && nearGardener(1100)) {                // the gardener's bubble: wheek this many times
    const [bx, by, k, ok] = S.project(GD.x - 60, 380, GD.y);
    if (ok) {
      // the number (or the sum) on top, and under it one squeak picture for every wheek she wants:
      // grey to begin with, each one lights up as he wheeks
      const ps = parts(askNow()), n = asking(), r = clamp(120 * k, 80, 104), x = clamp(bx - r * 0.6, r + 8, cw - r - 8), y = clamp(by, 110 + r, ch - 220);
      Art.drawBubble(c, x, y, r);
      if (ps.length > 1) {
        Art.drawNum(c, ps[0], x - r * 0.36, y - r * 0.36, r * 0.66, '#6B3FA8', null);
        Art.drawNum(c, '+', x, y - r * 0.36, r * 0.5, '#FF7FA0', null);
        Art.drawNum(c, ps[1], x + r * 0.36, y - r * 0.36, r * 0.66, '#3A8FD9', null);
      } else Art.drawNum(c, n, x, y - r * 0.36, r * 0.8, '#6B3FA8', null);
      const step = Math.min(r * 0.5, (r * 1.55) / n), gap = ps.length > 1 ? step * 0.5 : 0, x0 = x - ((n - 1) * step + gap) / 2;
      for (let i = 0; i < n; i++) {
        const ix = x0 + i * step + (i >= ps[0] ? gap : 0) + step * 0.12, on = i < t.count;
        const pop = on && i === t.count - 1 ? 1 + easeOut(clamp(G.gardener.nod / 0.7, 0, 1)) * 0.35 : 1;
        c.globalAlpha = on ? 1 : 0.3;
        Art.drawWheekIcon(c, ix, y + r * 0.3, (step / 74) * pop);
        c.globalAlpha = 1;
      }
    }
    // "press this, again and again": a hand tapping at the squeak button until the first number is done
    if (t.i === 0 && t.count < asking() && nearGardener(650) && p.state !== 'wheek') {
      const b = $('btn-wheek').getBoundingClientRect(), press = Math.abs(Math.sin(time * 4.5)) * 16;
      c.save(); c.translate(b.left + b.width * 0.5, b.top - 10 - press); c.scale(1, -1);      // finger pointing down at the button
      Art.drawHand(c, 0, 0, 1.15); c.restore();
    }
  }
  for (const m of G.nums) {                                  // "1!" "2!" "3!"
    const [sx, sy, k, ok] = S.project(m.x, m.h + m.t * 60, m.z);
    if (!ok) continue;
    c.globalAlpha = clamp((1.1 - m.t) * 3, 0, 1);
    Art.drawNum(c, m.n, sx, sy, Math.max(34, 80 * k) * (0.6 + easeOut(clamp(m.t * 4, 0, 1)) * 0.5), CONFETTI[m.n % 6]);
    c.globalAlpha = 1;
  }
}

function hudLayout() {
  const cw = view.cw;
  const slot = clamp(cw / 9, 44, 66), pad = 10;
  const t = G.task;
  const n = Math.max(1, t ? (t.type === 'order' ? t.seq.length + 1 : t.asks.length) : G.foods.length);
  const w = slot * n + pad * 2, x = cw / 2 - w / 2, y = 12;
  return { slot, pad, w, x, y, h: slot + pad, starX: 30, starY: cw < 760 ? y + slot + pad + 34 : 44 };
}
const slotCenter = (L, i) => [L.x + L.pad + L.slot * (i + 0.5), L.y + L.pad / 2 + L.slot / 2];
const CONFETTI = ['#FF7FA0', '#FFC94A', '#6EC6FF', '#8EDB6A', '#C79BFF', '#FF9838'];

function drawOverlay(time) {
  const c = ctx, cw = view.cw, ch = view.ch;
  c.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  c.clearRect(0, 0, cw, ch);

  drawTrail(c, time);
  drawFx(c, S.project);

  // celebration confetti falls across the whole screen
  if (G.celebT > 2.2 && G.celebT < 5.8) {
    for (let i = 0; i < 70; i++) {
      const age = (5.8 - G.celebT) - (i % 10) * 0.12;
      if (age < 0) continue;
      const x = ((i * 0.6180339) % 1) * cw + Math.sin(age * 3 + i) * 30, y = -30 + age * (140 + (i % 7) * 30);
      if (y > ch + 20) continue;
      c.save(); c.translate(x, y); c.rotate(age * (2 + (i % 5)) + i);
      c.fillStyle = CONFETTI[i % 6];
      c.globalAlpha = clamp((G.celebT - 2.2) * 2, 0, 1);
      c.fillRect(-9, -4, 18, 8); c.restore();
    }
  }
  if (G.mode !== 'play') return;

  // squirrel's "call me!" bubble: the same picture as the pink button
  if (G.squirrel.hasApple && G.squirrel.dropT < 0 && nearSquirrel(620)) {
    const [bx, by, , ok] = S.project(squirrelPos.x, squirrelPos.y + 120, squirrelPos.z);
    if (ok) {
      const k = 1 + Math.sin(time * 5) * 0.07;
      const x = clamp(bx, 60, cw - 60), y = clamp(by, 130, ch - 200);
      Art.drawBubble(c, x, y, 44 * k);
      Art.drawWheekIcon(c, x, y, 1.2 * k);
    }
  }

  drawTaskWorld(c, time);

  const L = hudLayout();
  // what to find: pictures of the food (or a water drop) that light up when done
  c.fillStyle = 'rgba(255,255,255,.85)'; Art.rrect(c, L.x, L.y, L.w, L.h, L.h / 2); c.fill();
  const tk = G.task;
  if (tk) {
    // number levels: the numbers to do, in order; the one to do now is big and bouncing
    const list = tk.asks || tk.seq, cur = tk.type === 'order' ? tk.k : tk.i;
    list.forEach((ask, i) => {
      const n = total(ask), sum = Array.isArray(ask);
      if (tk.type === 'wheeks' && G.foods[i] && !G.foods[i].hidden) return;       // her treat takes the number's place
      const [sx, sy] = slotCenter(L, i), done = i < cur;
      const k = (i === cur ? 1.12 + Math.sin(time * 5) * 0.1 : 0.9) * (1 + easeOut(G.slotPop[i]) * 0.5);
      c.globalAlpha = done || i === cur ? 1 : 0.3;
      Art.drawNum(c, sum ? ask.join('+') : n, sx, sy - (tk.type === 'order' ? 0 : L.slot * 0.08), L.slot * (sum ? 0.4 : 0.62) * k, done ? '#5CCB5F' : '#6B3FA8', null);
      if (tk.type !== 'order') Art.drawDots(c, n, done ? n : 0, sx, sy + L.slot * 0.34, L.slot * 0.045, '#5CCB5F', '#B9A8D8');
      c.globalAlpha = 1;
    });
  }
  for (const f of G.foods) {
    if (tk && tk.type === 'wheeks' && f.hidden) continue;
    const [sx, sy] = slotCenter(L, f.slot);
    const landed = f.eaten && !G.flyers.some((fl) => fl.type === 'food' && fl.slot === f.slot);
    const pop = 1 + easeOut(G.slotPop[f.slot]) * 0.5;
    c.globalAlpha = landed ? 1 : 0.25;
    Art.drawFood(c, f.kind, sx, sy, (L.slot / 62) * pop);
    c.globalAlpha = 1;
    if (!landed) { c.strokeStyle = 'rgba(120,150,110,.5)'; c.lineWidth = 2.5; c.setLineDash([5, 6]); Art.circ(c, sx, sy, L.slot * 0.42); c.stroke(); c.setLineDash([]); }
  }

  // stars earned
  const n = Math.min(G.stars, 6);
  for (let i = 0; i < n; i++) {
    const last = i === n - 1 ? 1 + easeOut(G.starPop) * 0.8 : 1;
    Art.drawStar(c, L.starX + i * 34, L.starY, 15 * last);
  }
  if (G.stars > 6) { c.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { Art.circ(c, L.starX + 6 * 34 - 8 + i * 11, L.starY, 3.5); c.fill(); } }

  // things flying into the HUD
  for (const f of G.flyers) {
    const k = easeInOut(f.t);
    const [tx, ty] = f.type === 'food' ? slotCenter(L, f.slot) : [L.starX + Math.min(G.stars, 5) * 34, L.starY];
    const x = lerp(f.sx, tx, k), y = lerp(f.sy, ty, k) - Math.sin(k * Math.PI) * 90;
    if (f.type === 'food') Art.drawFood(c, f.kind, x, y, 1.3 - k * 0.3);
    else Art.drawStar(c, x, y, 44 - k * 26);
  }

  // sniff pointer: when the smell is off-screen, a bubble at the screen edge shows what and which way
  if (G.hint) {
    const [hx, hy, , ok] = S.project(G.hint.x, 40, G.hint.y);
    const m = 64, top = m + 70, bottom = ch - 150;
    if (!ok || hx < m || hx > cw - m || hy < top || hy > bottom) {
      const [px, py] = S.project(G.pig.x, 40, G.pig.y);
      // the camera never turns, so map directions are screen directions
      const ang = Math.atan2(G.hint.y - G.pig.y, G.hint.x - G.pig.x);
      const ux = Math.cos(ang), uy = Math.sin(ang);
      let t = 1e9;
      if (ux > 0.001) t = Math.min(t, (cw - m - px) / ux); else if (ux < -0.001) t = Math.min(t, (m - px) / ux);
      if (uy > 0.001) t = Math.min(t, (bottom - py) / uy); else if (uy < -0.001) t = Math.min(t, (top - py) / uy);
      t = Math.max(0, t) + Math.sin(time * 6) * 7;
      const bx = clamp(px + ux * t, m - 8, cw - m + 8), by = clamp(py + uy * t, top - 8, bottom + 8);
      c.save();
      c.shadowColor = 'rgba(0,0,0,.2)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
      c.fillStyle = '#fff'; Art.circ(c, bx, by, 38); c.fill();
      c.translate(bx, by); c.rotate(ang);
      c.beginPath(); c.moveTo(34, -16); c.lineTo(58, 0); c.lineTo(34, 16); c.closePath(); c.fill();
      c.restore();
      Art.drawFood(c, G.hint.kind, bx, by, 0.95);
    }
  }

  // first-time hint: "tap here" hand on the first carrot
  if (G.level <= 0 && G.round === 0 && G.mission === 'food' && G.eaten === 0 && G.moved < 120) {
    const f = G.foods[0];
    const [fx, fy] = S.project(f.x, 40, f.y);
    const k = (time * 0.9) % 1;
    c.strokeStyle = `rgba(255,255,255,${1 - k})`; c.lineWidth = 5;
    Art.circ(c, fx, fy, 30 + k * 40); c.stroke();
    const press = Math.sin(time * 0.9 * TAU) * 8;
    Art.drawHand(c, fx + 16, fy + 14 + press, 1);
  }
}

// ------------------------------------------------------------------- loop --
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  update(dt);
  S.render(G, dt);
  drawOverlay(G.t);
  requestAnimationFrame(frame);
}

// --------------------------------------------------------------------- UI --
// The trail of stones: one stone per level, plus the paw stone for "just play".
// A finished level wears a star, the next one bounces, later ones are still asleep.
const STONE_ICON = {
  free: '<svg viewBox="0 0 64 64" fill="#fff"><ellipse cx="32" cy="42" rx="14" ry="11"/><ellipse cx="14" cy="27" rx="6" ry="8"/><ellipse cx="26" cy="17" rx="6" ry="8"/><ellipse cx="40" cy="17" rx="6" ry="8"/><ellipse cx="51" cy="28" rx="6" ry="8"/></svg>',
  star: '<svg class="badge" viewBox="0 0 64 64"><path d="M32 6l8 17 18 2-13 13 3 19-16-9-16 9 3-19L6 25l18-2z" fill="#FFD23F" stroke="#E89B00" stroke-width="4" stroke-linejoin="round"/></svg>',
};
function showLevels(just = -2) {
  G.mode = 'levels'; G.celebT = 0; G.flyers.length = 0; input.target = null; lastNudge = '';
  for (const id of ['btn-wheek', 'btn-sniff', 'btn-jump']) $(id).classList.remove('nudge');
  $('title').classList.add('hidden'); $('ui').classList.add('hidden');
  document.body.classList.remove('playing');
  const el = $('trail'); el.innerHTML = '';
  const add = (lv, cls, html) => {
    const b = document.createElement('button');
    b.className = 'round stone ' + cls; b.innerHTML = html;
    b.setAttribute('aria-label', lv < 0 ? 'Just play' : 'Level ' + (lv + 1));
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation(); A.initAudio();
      if (lv > G.done) { A.tap(); b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); return; }
      A.chime(Math.max(0, lv) + 1); startLevel(lv);
    });
    el.appendChild(b);
  };
  add(-1, 'free', STONE_ICON.free);
  LEVELS.forEach((_, i) => add(i, (i < G.done ? 'done' : i === G.done ? 'next' : 'locked') + (i === just ? ' just' : ''), `<b>${i + 1}</b>` + (i < G.done ? STONE_ICON.star : '')));
  $('levels').classList.remove('hidden');
}

function startLevel(lv) {
  const p = G.pig, L = LEVELS[lv];
  G.level = lv; G.jumpOn = lv < 0 || L.jump; G.round = 0; G.mission = 'food'; G.moved = 0; G.celebT = 0; G.flyers.length = 0;
  const [x, y] = L ? L.start : [world.home.x + 40, world.home.y + 20];
  Object.assign(p, { x, y, vx: 0, vy: 0, z: 0, vz: 0, air: false, on: null, safe: null, state: 'idle', stateT: 0, food: null, pops: 0, hopT: -1, runT: 0, heading: L && L.face !== undefined ? L.face : 0.35 });
  S.snapCamera();
  startRound();
  G.mode = 'play'; G.idleT = 0;
  $('levels').classList.add('hidden'); $('title').classList.add('hidden');
  $('ui').classList.remove('hidden');
  $('btn-jump').classList.toggle('hidden', !G.jumpOn);
  document.body.classList.add('playing');
  popcorn(2);
}

function startGame() {
  if (G.mode !== 'title') return;
  A.initAudio();
  if (!titleWheeked) { titleWheeked = true; setTimeout(() => A.wheek(), 120); }
  showLevels();
}

function bindButton(id, fn) {
  const el = $(id);
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    el.classList.add('pressed'); setTimeout(() => el.classList.remove('pressed'), 140);
    fn();
  });
}
bindButton('btn-play', startGame);
bindButton('btn-sniff', () => { A.initAudio(); doSniff(); });
bindButton('btn-wheek', () => { A.initAudio(); doWheek(); });
bindButton('btn-jump', () => { A.initAudio(); doJump(); });
bindButton('btn-home', () => { A.initAudio(); A.tap(); showLevels(); });
bindButton('btn-mute', () => {
  A.initAudio();
  A.setMuted(!A.isMuted());
  $('mute-waves').style.display = A.isMuted() ? 'none' : '';
  $('mute-cross').style.display = A.isMuted() ? '' : 'none';
});
window.addEventListener('keydown', (e) => { if (G.mode === 'title' && (e.code === 'Space' || e.code === 'Enter')) { e.stopImmediatePropagation(); startGame(); } }, true);

// Title: the name pops in letter by letter with a happy wheek. Browsers only allow sound
// after the first touch or key, so if the wheek was blocked it plays (and the name pops in
// again) on the very first touch instead.
let titleWheeked = false;
function showLogo() {
  const el = $('logo'); el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
}
function titleWheek() {
  if (titleWheeked) return;
  A.initAudio();
  setTimeout(() => { if (!titleWheeked && A.audioRunning()) { titleWheeked = true; A.wheek(); } }, 120);
}
if (!params.has('auto') && !params.has('bot')) {
  showLogo(); titleWheek();
  const first = (e) => {
    if (G.mode !== 'title' || titleWheeked) return;
    if (!(e.target.closest && e.target.closest('#btn-play')) && e.code !== 'Space' && e.code !== 'Enter') showLogo();
    titleWheek();
  };
  window.addEventListener('pointerdown', first, true);
  window.addEventListener('keydown', first, true);
}

// Full screen (where the browser allows it) and "install as an app".
// These two use 'click', not 'pointerdown': browsers only allow full screen and the
// install prompt from a finished tap.
function bindClick(id, fn) {
  const el = $(id);
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  el.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
}
const fsEl = document.documentElement;
const fsOn = () => document.fullscreenElement || document.webkitFullscreenElement;
const standalone = matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone;
if ((fsEl.requestFullscreen || fsEl.webkitRequestFullscreen) && !standalone) {
  $('btn-full').classList.remove('hidden');
  bindClick('btn-full', () => {
    if (fsOn()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else { const r = (fsEl.requestFullscreen || fsEl.webkitRequestFullscreen).call(fsEl); if (r && r.catch) r.catch(() => {}); }
  });
  const sync = () => { $('full-open').style.display = fsOn() ? 'none' : ''; $('full-close').style.display = fsOn() ? '' : 'none'; };
  document.addEventListener('fullscreenchange', sync); document.addEventListener('webkitfullscreenchange', sync);
}
if ('serviceWorker' in navigator && !params.has('bot')) navigator.serviceWorker.register('sw.js').catch(() => {});
let installEvent = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; $('btn-install').classList.remove('hidden'); });
window.addEventListener('appinstalled', () => { installEvent = null; $('btn-install').classList.add('hidden'); });
// iPhone / iPad have no install prompt: show a picture of the two taps instead
const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (iOS && !standalone) $('btn-install').classList.remove('hidden');
bindClick('btn-install', () => {
  if (installEvent) { installEvent.prompt(); installEvent = null; $('btn-install').classList.add('hidden'); }
  else $('ios-install').classList.remove('hidden');
});
$('ios-install').addEventListener('pointerdown', (e) => { e.stopPropagation(); $('ios-install').classList.add('hidden'); });

initInput(canvas);
requestAnimationFrame(frame);

// Test helpers (see docs/tech.md): ?auto skips the title, ?bot plays by itself.
// ?level=1..3 jumps straight into a level (0 = just play).
G.api = { input, startGame, startLevel, showLevels, doSniff, doWheek, doJump, popcorn, nearestFood, project: S.project };
if (params.has('level')) startLevel(clamp((parseInt(params.get('level'), 10) || 0) - 1, -1, LEVELS.length - 1));
else if (params.has('auto') || params.has('bot')) startLevel(-1);
if (params.has('bot')) import('./debug.js').then((m) => m.runBot(G, input));
