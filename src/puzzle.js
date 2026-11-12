// Popup puzzles: a big card that opens over the forest when Darling wheeks at a friend.
// No words, no timer, no failing: a wrong pick wobbles and nothing is lost.
// Two kinds so far: 'pattern' (what comes next?) and 'memory' (find the pairs).
import { TAU, clamp, lerp, easeOut, easeInOut } from './util.js';
import * as A from './audio.js';
import * as Art from './art.js';

const KINDS = [...Art.FOOD_KINDS, 'water'];
const CONFETTI = ['#FF7FA0', '#FFC94A', '#6EC6FF', '#8EDB6A', '#C79BFF', '#FF9838'];
// what comes next? each round a harder rhythm; the last picture of the row is the one to find
const PATTERNS = [['ABABA', 'B'], ['AABAA', 'B'], ['ABBAB', 'B'], ['ABCAB', 'C']];
const PATTERN_ROUNDS = [[0], [1, 2], [3]];
const MEMORY_ROUNDS = [3, 6];                  // pairs: 3 x 2 cards, then 4 x 3

let el, c, P = null;                           // the canvas, its context, the open puzzle
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[(Math.random() * a.length) | 0];

export const puzzleOpen = () => !!P;
export const puzzleCloseAt = () => { const o = P && P.hit.find((q) => q.close); return o && [o.x + o.w / 2, o.y + o.h / 2]; };
// for automated playthroughs: where a right (and a wrong) touch would be just now
export function puzzleProbe() {
  if (!P || P.open < 1 || P.closing > 0 || P.doneT >= 0) return null;
  const mid = (o) => o && [o.x + o.w / 2, o.y + o.h / 2], at = (i) => mid(P.hit.find((o) => o.i === i));
  const out = { kind: P.kind, round: P.round, rounds: P.rounds };
  if (P.kind === 'pattern') {
    if (P.fly) return out;
    out.tap = at(P.choices.findIndex((o) => o.kind === P.answer)); out.wrong = at(P.choices.findIndex((o) => o.kind !== P.answer));
  } else {
    const up = P.cards.filter((o) => o.up && !o.matched);
    if (up.length >= 2 || P.match) return out;
    const i = up.length ? P.cards.findIndex((o) => o !== up[0] && !o.matched && o.kind === up[0].kind) : P.cards.findIndex((o) => !o.matched);
    out.tap = at(i);
  }
  return out;
}

// kind: 'pattern' | 'memory'. round: where to go on (if it was closed half-way).
// onDone() when every round is solved; onClose(round) if it is put away before that.
export function openPuzzle(kind, { round = 0, onDone, onClose } = {}) {
  if (!el) {
    el = document.getElementById('puzzle'); c = el.getContext('2d');
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (P) tap(e.clientX, e.clientY); });
  }
  P = { kind, round, rounds: kind === 'pattern' ? PATTERN_ROUNDS.length : MEMORY_ROUNDS.length, t: 0, open: 0, closing: 0, doneT: -1, onDone, onClose, bits: [], hit: [] };
  startRound();
  el.classList.remove('hidden');
  A.chime(3);
}

function startRound() {
  P.doneT = -1; P.roundT = 0;
  if (P.kind === 'pattern') {
    const [shape, ans] = PATTERNS[pick(PATTERN_ROUNDS[P.round])];
    const k = shuffle(KINDS.slice(0, 5)), map = { A: k[0], B: k[1], C: k[2] };
    P.seq = [...shape].map((ch) => map[ch]);
    P.answer = map[ans];
    P.choices = shuffle([k[0], k[1], k[2]]).map((kind) => ({ kind, wob: 0 }));
    P.tries = 0; P.fly = null; P.filled = false;
  } else {
    const n = MEMORY_ROUNDS[P.round];
    P.cards = shuffle(shuffle(KINDS.slice()).slice(0, n).flatMap((kind) => [kind, kind])).map((kind) => ({ kind, up: false, face: 0, matched: false, pop: 0 }));
    P.back = 0; P.found = 0;
  }
}

function roundDone(x, y) {
  P.doneT = 1.3; A.chime(6);
  for (let i = 0; i < 26; i++) { const a = Math.random() * TAU, v = 120 + Math.random() * 260; P.bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 160, t: 0, color: CONFETTI[i % 6], r: Math.random() * 6 }); }
}

function tap(x, y) {
  if (P.closing > 0 || P.open < 0.6) return;
  const h = P.hit.find((o) => x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h);
  if (!h) return;
  if (h.close) { A.tap(); P.closing = 0.001; P.result = 'close'; return; }
  if (P.doneT >= 0) return;
  if (P.kind === 'pattern') {
    if (P.fly) return;
    const ch = P.choices[h.i];
    if (ch.kind === P.answer) { A.tap(); P.fly = { i: h.i, t: 0 }; }
    else { ch.wob = 1; P.tries++; A.nope(); }
  } else {
    const cd = P.cards[h.i];
    if (cd.up || cd.matched) return;
    let up = P.cards.filter((o) => o.up && !o.matched);
    if (up.length >= 2) { for (const o of up) o.up = false; up = []; P.back = 0; }       // no waiting: a third touch turns the two back
    cd.up = true; A.tap();
    if (up.length === 1) {
      if (up[0].kind === cd.kind) { P.match = [up[0], cd]; P.matchT = 0.32; }
      else P.back = 1.1;
    }
  }
}

export function updatePuzzle(dt) {
  if (!P) return;
  P.t += dt; P.roundT += dt;
  P.open = Math.min(1, P.open + dt * 3.5);
  for (let i = P.bits.length - 1; i >= 0; i--) { const b = P.bits[i]; b.t += dt; b.vy += 700 * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.t > 1.2) P.bits.splice(i, 1); }
  if (P.kind === 'pattern') {
    for (const ch of P.choices) ch.wob = Math.max(0, ch.wob - dt * 2.2);
    if (P.fly && !P.filled) { P.fly.t += dt / 0.45; if (P.fly.t >= 1) { P.filled = true; roundDone(P.slotX, P.slotY); } }
  } else {
    for (const cd of P.cards) { cd.face = clamp(cd.face + (cd.up ? dt : -dt) * 5, 0, 1); cd.pop = Math.max(0, cd.pop - dt * 2.5); }
    if (P.match) {
      P.matchT -= dt;
      if (P.matchT <= 0) {
        for (const o of P.match) { o.matched = true; o.pop = 1; }
        P.match = null; P.found++; A.chime(P.found);
        if (P.found === P.cards.length / 2) roundDone(innerWidth / 2, innerHeight / 2);
      }
    }
    if (P.back > 0) { P.back -= dt; if (P.back <= 0) for (const o of P.cards) if (!o.matched) o.up = false; }
  }
  if (P.doneT >= 0) {
    P.doneT -= dt;
    if (P.doneT < 0) {
      if (P.round + 1 < P.rounds) { P.round++; startRound(); }
      else { P.closing = 0.001; P.result = 'done'; }
    }
  }
  if (P.closing > 0) {
    P.closing += dt * 4;
    if (P.closing >= 1) {
      const q = P; P = null; el.classList.add('hidden');
      if (q.result === 'done') q.onDone && q.onDone(); else q.onClose && q.onClose(q.round);
    }
  }
}

function tile(x, y, s, fill, stroke, dash) {
  c.fillStyle = fill; Art.rrect(c, x - s / 2, y - s / 2, s, s, s * 0.22); c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = Math.max(3, s * 0.06); if (dash) c.setLineDash([s * 0.14, s * 0.12]); c.stroke(); c.setLineDash([]); }
}

export function drawPuzzle() {
  if (!P) return;
  const cw = innerWidth, ch = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
  if (el.width !== Math.round(cw * dpr) || el.height !== Math.round(ch * dpr)) { el.width = Math.round(cw * dpr); el.height = Math.round(ch * dpr); }
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, cw, ch);
  const show = easeOut(P.open) * (1 - clamp(P.closing, 0, 1));
  c.fillStyle = `rgba(40,60,40,${0.5 * show})`; c.fillRect(0, 0, cw, ch);

  // the card
  const w = Math.min(cw - 20, 880), h = Math.min(ch - 20, 640), x0 = (cw - w) / 2, y0 = (ch - h) / 2;
  const pop = 0.8 + 0.2 * easeOut(P.open) - 0.2 * clamp(P.closing, 0, 1);
  c.save();
  c.globalAlpha = show;
  c.translate(cw / 2, ch / 2); c.scale(pop, pop); c.translate(-cw / 2, -ch / 2);
  c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 30; c.shadowOffsetY = 10;
  c.fillStyle = '#FFFBEF'; Art.rrect(c, x0, y0, w, h, 34); c.fill();
  c.shadowColor = 'transparent';
  c.strokeStyle = '#fff'; c.lineWidth = 8; c.stroke();

  P.hit = [];
  // how far along: one star per round
  const top = clamp(h * 0.13, 50, 76), sr = top * 0.3;
  for (let i = 0; i < P.rounds; i++) {
    const sx = cw / 2 + (i - (P.rounds - 1) / 2) * sr * 3, done = i < P.round || (i === P.round && P.doneT >= 0);
    c.globalAlpha = show * (done ? 1 : 0.28);
    Art.drawStar(c, sx, y0 + top * 0.55, sr * (done && i === P.round ? 1 + easeOut(clamp(P.doneT - 0.6, 0, 1)) * 0.6 : 1));
  }
  c.globalAlpha = show;
  // put it away (nothing is lost)
  const cr = 22, cx = x0 + w - cr - 14, cy = y0 + cr + 14;
  c.fillStyle = '#D9D4C6'; Art.circ(c, cx, cy, cr); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(cx - 8, cy - 8); c.lineTo(cx + 8, cy + 8); c.moveTo(cx + 8, cy - 8); c.lineTo(cx - 8, cy + 8); c.stroke();
  P.hit.push({ close: true, x: cx - cr - 8, y: cy - cr - 8, w: cr * 2 + 16, h: cr * 2 + 16 });

  const ax = x0 + 18, ay = y0 + top, aw = w - 36, ah = h - top - 18;       // the room for the puzzle itself
  if (P.kind === 'pattern') drawPattern(ax, ay, aw, ah); else drawMemory(ax, ay, aw, ah);
  c.restore();

  for (const b of P.bits) {
    c.save(); c.translate(b.x, b.y); c.rotate(b.r + b.t * 6); c.globalAlpha = clamp((1.2 - b.t) * 2, 0, 1);
    c.fillStyle = b.color; c.fillRect(-8, -4, 16, 8); c.restore();
  }
}

function drawPattern(ax, ay, aw, ah) {
  const n = P.seq.length + 1;
  const s = Math.min(aw / (n + 0.3), ah * 0.36, 120), gap = s * 1.04;
  const rowY = ay + ah * 0.27, rx = ax + aw / 2 - ((n - 1) * gap) / 2;
  P.seq.forEach((kind, i) => {
    const k = 1 + easeOut(clamp(1 - (P.roundT - i * 0.09) * 4, 0, 1)) * -0.6;      // the row pops in one by one
    if (k <= 0.45) return;
    tile(rx + i * gap, rowY, s * 0.92 * k, '#fff', '#E8E0CC');
    Art.drawFood(c, kind, rx + i * gap, rowY, (s / 74) * k);
  });
  // the empty place at the end
  const qx = rx + (n - 1) * gap, pulse = P.filled ? 1 : 1 + Math.sin(P.t * 5) * 0.05;
  P.slotX = qx; P.slotY = rowY;
  tile(qx, rowY, s * 0.92 * pulse, P.filled ? '#E3F7D9' : '#F3ECFF', P.filled ? '#5CCB5F' : '#A98BFF', !P.filled);
  if (P.filled) Art.drawFood(c, P.answer, qx, rowY, s / 74);
  else Art.drawNum(c, '?', qx, rowY, s * 0.6 * pulse, '#A98BFF', null);

  // three to choose from
  const m = P.choices.length, bs = Math.min(aw / (m + 0.6), ah * 0.42, 150), bgap = bs * 1.18, by = ay + ah * 0.72, bx = ax + aw / 2 - ((m - 1) * bgap) / 2;
  P.choices.forEach((ch, i) => {
    let x = bx + i * bgap, y = by, k = 1;
    const flying = P.fly && P.fly.i === i;
    if (flying) { const f = easeInOut(clamp(P.fly.t, 0, 1)); x = lerp(x, qx, f); y = lerp(y, rowY, f) - Math.sin(f * Math.PI) * 50; k = lerp(1, (s * 0.92) / bs, f); if (P.filled) return; }
    if (ch.wob > 0) x += Math.sin(P.t * 38) * 9 * ch.wob;
    const hint = !P.fly && P.tries >= 2 && ch.kind === P.answer;                     // after two goes the right one glows
    if (hint) { c.fillStyle = `rgba(255,210,63,${0.5 + Math.sin(P.t * 6) * 0.25})`; Art.circ(c, x, y, bs * 0.58); c.fill(); }
    c.save();
    c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowOffsetY = 6; c.shadowBlur = 0;
    c.fillStyle = '#fff'; Art.circ(c, x, y, (bs / 2) * k); c.fill();
    c.restore();
    c.strokeStyle = ['#FF7FA0', '#FFC94A', '#6EC6FF'][i]; c.lineWidth = Math.max(4, bs * 0.06); Art.circ(c, x, y, (bs / 2) * k); c.stroke();
    Art.drawFood(c, ch.kind, x, y, (bs / 78) * k);
    if (!flying) P.hit.push({ i, x: bx + i * bgap - bgap / 2, y: by - bs * 0.6, w: bgap, h: bs * 1.2 });
  });
  // a hand shows where to touch, the very first time
  if (P.round === 0 && P.tries === 0 && !P.fly && P.roundT > 2.5) {
    const i = P.choices.findIndex((o) => o.kind === P.answer);
    Art.drawHand(c, bx + i * bgap + bs * 0.2, by + bs * 0.2 + Math.sin(P.t * 5) * 7, bs / 110);
  }
}

function drawMemory(ax, ay, aw, ah) {
  const n = P.cards.length, wide = aw > ah * 1.15;
  const cols = n <= 6 ? (wide ? 3 : 2) : (wide ? 4 : 3), rows = n / cols;
  const s = Math.min(aw / cols, ah / rows) * 0.9, gx = Math.min(aw / cols, s * 1.12), gy = Math.min(ah / rows, s * 1.12);
  const x0 = ax + aw / 2 - ((cols - 1) * gx) / 2, y0 = ay + ah / 2 - ((rows - 1) * gy) / 2;
  P.cards.forEach((cd, i) => {
    const x = x0 + (i % cols) * gx, y = y0 + ((i / cols) | 0) * gy;
    const deal = easeOut(clamp((P.roundT - i * 0.05) * 3.5, 0, 1));
    const f = cd.face, sx = Math.abs(Math.cos(f * Math.PI)), up = f > 0.5, k = deal * (1 + easeOut(cd.pop) * 0.18);
    c.save(); c.translate(x, y); c.scale(Math.max(0.02, sx) * k, k);
    c.shadowColor = 'rgba(0,0,0,.16)'; c.shadowOffsetY = 5;
    if (up) tile(0, 0, s, cd.matched ? '#E3F7D9' : '#fff', cd.matched ? '#5CCB5F' : '#E8E0CC');
    else tile(0, 0, s, '#A98BFF', '#fff');
    c.shadowColor = 'transparent';
    if (up) Art.drawFood(c, cd.kind, 0, 0, s / 78);
    else { c.globalAlpha *= 0.55; Art.drawStar(c, 0, 0, s * 0.22); }
    c.restore();
    P.hit.push({ i, x: x - gx / 2, y: y - gy / 2, w: gx, h: gy });
  });
}
