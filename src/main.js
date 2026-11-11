// Game logic: the pig, the mission, hints and the picture HUD.
// The 3D view lives in scene.js; here the world is a flat map (x = east, y = south).
import { TAU, clamp, lerp, dist, easeOut, easeInOut } from './util.js';
import * as A from './audio.js';
import * as Art from './art.js';
import { buildForest, pushOut, W, H } from './world.js';
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
  },
  foods: [], eaten: 0, round: 0, stars: 0,
  mission: 'food',   // 'food' = breakfast (five foods), then 'drink' = a drink at the pond
  slotPop: [0, 0, 0, 0, 0],
  flyers: [],
  hint: null,        // { x, y, kind, t } – where the last sniff pointed
  trail: null,       // scent trail on the ground
  idleT: 0, moved: 0, celebT: 0, starPop: 0,
  squirrel: { hasApple: true, wave: 0, dropT: -1 },
  butterflies: [],
};
window.__G = G;
try { G.stars = Math.min(99, parseInt(localStorage.getItem('darling.stars') || '0', 10) || 0); } catch {}

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

function startRound() {
  G.foods = []; G.eaten = 0; G.hint = null; G.trail = null; G.idleT = 0;
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
    const tx = f.hidden ? world.appleTree.x + 90 : f.x, ty = f.hidden ? world.appleTree.y + 130 : f.y;
    const d = dist(G.pig.x, G.pig.y, tx, ty);
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
  const [sx, sy] = S.project(f.x, 40, f.y);
  G.flyers.push({ type: 'food', kind: f.kind, slot: f.slot, sx, sy, t: 0, dur: 0.75 });
  if (G.eaten === G.foods.length) celebrate();
}

function celebrate() {
  G.celebT = 6.5;
  setTimeout(() => { A.fanfare(); popcorn(4); }, 700);
  setTimeout(() => {
    const [sx, sy] = S.project(G.pig.x, 110, G.pig.y);
    G.flyers.push({ type: 'star', sx, sy, t: 0, dur: 1.1 });
  }, 1500);
}

input.onAction = (a) => { A.initAudio(); (a === 'sniff' ? doSniff : doWheek)(); };
input.onTap = (sx, sy) => {
  if (G.mode !== 'play') return true;
  const [px, py, k] = S.project(G.pig.x, 40, G.pig.y);
  if (Math.hypot(sx - px, sy - py) < Math.max(36, 62 * k)) { popcorn(1); return true; }   // tickle the pig!
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
    if (p.stateT <= 0) {
      const s = p.state; p.state = 'idle';
      if (s === 'munch' || s === 'drink') finishMunch();
      if (s === 'sniff') finishSniff();
    }
  }

  let ix = 0, iy = 0, mag = 0;
  if (G.mode === 'play' && p.state === 'idle') {
    const [kx, ky] = keyVector();
    if (kx || ky) { ix = kx; iy = ky; mag = 1; input.target = null; }
    else {
      if (input.pointerDown || input.tapPending) {
        let [wx, wy] = S.screenToGround(input.sx, input.sy);
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

  const ox = p.x, oy = p.y;
  p.x += p.vx * dt; p.y += p.vy * dt;
  pushOut(world, p, PIG_R);
  const stepLen = dist(ox, oy, p.x, p.y);
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
  if (p.hopT < 0 && p.pops > 0) { p.pops--; p.hopT = 0; A.pop(); }
  if (p.hopT >= 0) {
    p.hopT += dt / 0.46;
    if (p.hopT >= 1) {
      p.hopT = -1;
      for (let i = 0; i < 4; i++) {
        const a = i * 1.57 + 0.7;
        spawn({ type: 'puff', x: p.x + Math.cos(a) * 30, y: 6, z: p.y + Math.sin(a) * 30, vx: Math.cos(a) * 70, vz: Math.sin(a) * 70, life: 0.4, size: 6, grow: 24, color: '#fff', alpha: 0.65 });
      }
    }
  }

  // munch any food we bump into
  if (G.mode === 'play' && p.state === 'idle') {
    for (const f of G.foods) {
      if (f.eaten || f.hidden || f.fall >= 0) continue;
      if (dist(p.x, p.y, f.x, f.y) < 66) { startMunch(f); break; }
    }
  }

  // rustle grass and bushes
  for (const g of world.tufts) {
    if (g.w > 0) g.w = Math.max(0, g.w - dt * 2.5);
    if (stepLen > 0.5 && Math.abs(g.x - p.x) < 34 && Math.abs(g.y - p.y) < 26 && g.w < 0.3) {
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
      spawn({ type: 'star', x: f.x + (Math.random() - 0.5) * 60, y: 30 + Math.random() * 60, z: f.y + (Math.random() - 0.5) * 30, vy: 30, life: 0.8, size: 6, color: '#FFF3A6' });
    }
  }

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
      // breakfast makes you thirsty; after the drink a new breakfast round starts
      if (G.mission === 'food') G.mission = 'drink'; else { G.mission = 'food'; G.round++; }
      startRound();
    }
  }

  if (G.mode === 'play') { G.idleT += dt; updateHints(); }
}

// Buttons wiggle when they are the thing to try next.
let lastNudge = '';
function updateHints() {
  const nearSq = G.squirrel.hasApple && G.squirrel.dropT < 0 && nearSquirrel(440);
  const sniffHint = !nearSq && G.celebT <= 0 && G.idleT > 14 && !G.hint;
  const key = (nearSq ? 'w' : '') + (sniffHint ? 's' : '');
  if (key === lastNudge) return;
  lastNudge = key;
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

function hudLayout() {
  const cw = view.cw;
  const slot = clamp(cw / 9, 44, 66), pad = 10;
  const n = Math.max(1, G.foods.length);
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

  const L = hudLayout();
  // what to find: pictures of the food (or a water drop) that light up when done
  c.fillStyle = 'rgba(255,255,255,.85)'; Art.rrect(c, L.x, L.y, L.w, L.h, L.h / 2); c.fill();
  for (const f of G.foods) {
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
  if (G.round === 0 && G.mission === 'food' && G.eaten === 0 && G.moved < 120) {
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
function startGame() {
  if (G.mode === 'play') return;
  A.initAudio();
  if (!titleWheeked) { titleWheeked = true; setTimeout(() => A.wheek(), 120); }
  G.mode = 'play'; G.idleT = 0;
  $('title').classList.add('hidden');
  $('ui').classList.remove('hidden');
  document.body.classList.add('playing');
  popcorn(2);
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
G.api = { startGame, doSniff, doWheek, popcorn, nearestFood, project: S.project };
if (params.has('auto') || params.has('bot')) startGame();
if (params.has('bot')) import('./debug.js').then((m) => m.runBot(G, input));
