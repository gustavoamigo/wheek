// 2D drawing: HUD icons and the painted ground texture. (3D models live in models.js)
import { TAU } from './util.js';

export function ell(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); }
export function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.max(0.1, r), 0, TAU); }
export function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }

export function starPath(c, x, y, r) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.5 : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
}
export function heartPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.9);
  c.bezierCurveTo(x - s * 1.5, y - s * 0.1, x - s * 0.8, y - s * 1.2, x, y - s * 0.35);
  c.bezierCurveTo(x + s * 0.8, y - s * 1.2, x + s * 1.5, y - s * 0.1, x, y + s * 0.9);
  c.closePath();
}

export function drawStar(c, x, y, r, filled = true) {
  c.save();
  c.lineJoin = 'round';
  starPath(c, x, y, r);
  c.lineWidth = r * 0.28; c.strokeStyle = filled ? '#E89B00' : 'rgba(255,255,255,.7)';
  c.stroke();
  c.fillStyle = filled ? '#FFD23F' : 'rgba(255,255,255,.35)'; c.fill();
  if (filled) { c.fillStyle = 'rgba(255,255,255,.6)'; circ(c, x - r * 0.2, y - r * 0.2, r * 0.16); c.fill(); }
  c.restore();
}

// ---------------------------------------------------------------- food ----
export const FOOD_KINDS = ['carrot', 'strawberry', 'dandelion', 'lettuce', 'apple'];
export const FOOD_COLORS = { carrot: '#FF9838', strawberry: '#F2444F', dandelion: '#FFD43B', lettuce: '#8EDB6A', apple: '#F0483E', water: '#4DBDF2' };

// Icon centred on (x, y), fits in roughly a 50x50 box at s = 1.
export function drawFood(c, kind, x, y, s = 1) {
  c.save();
  c.translate(x, y); c.scale(s, s);
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (kind === 'water') {                            // a big water drop
    c.fillStyle = '#4DBDF2';
    c.beginPath(); c.moveTo(0, -24); c.bezierCurveTo(4, -10, 18, -2, 18, 9); c.arc(0, 9, 18, 0, Math.PI); c.bezierCurveTo(-18, -2, -4, -10, 0, -24); c.fill();
    c.strokeStyle = '#E4F7FF'; c.lineWidth = 4; c.beginPath(); c.arc(0, 9, 11, 2.2, 3.4); c.stroke();
    c.restore(); return;
  }
  switch (kind) {
    case 'carrot':
      c.rotate(0.55);
      c.fillStyle = '#5DBB4B';
      for (const a of [-0.6, 0, 0.6]) { ell(c, Math.sin(a) * 9, -22 - Math.cos(a) * 5, 5, 11, a); c.fill(); }
      c.fillStyle = '#FF9838';
      c.beginPath(); c.moveTo(-12, -13); c.quadraticCurveTo(0, -21, 12, -13);
      c.quadraticCurveTo(9, 10, 0, 25); c.quadraticCurveTo(-9, 10, -12, -13); c.fill();
      c.strokeStyle = '#E57E1F'; c.lineWidth = 2.2;
      for (const [yy, w] of [[-6, 5], [3, 4], [11, 3]]) { c.beginPath(); c.moveTo(-w, yy); c.lineTo(w * 0.2, yy + 1); c.stroke(); }
      break;
    case 'strawberry':
      c.fillStyle = '#F2444F';
      c.beginPath(); c.moveTo(0, 23);
      c.bezierCurveTo(-26, 6, -23, -17, -8, -16); c.quadraticCurveTo(0, -12, 8, -16);
      c.bezierCurveTo(23, -17, 26, 6, 0, 23); c.fill();
      c.fillStyle = '#FFE28A';
      for (const [sx, sy] of [[-9, -5], [6, -6], [-1, 3], [-10, 6], [9, 5], [0, 13]]) { ell(c, sx, sy, 1.8, 2.6); c.fill(); }
      c.fillStyle = '#4FB04A';
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.55; ell(c, Math.cos(a) * 9, -15 + Math.sin(a) * 4 + 4, 8, 3.6, a); c.fill(); }
      break;
    case 'dandelion':
      c.strokeStyle = '#5DBB4B'; c.lineWidth = 4.5;
      c.beginPath(); c.moveTo(0, 23); c.quadraticCurveTo(3, 8, 0, -4); c.stroke();
      c.fillStyle = '#5DBB4B';
      ell(c, -10, 17, 11, 4.5, 0.5); c.fill(); ell(c, 10, 17, 11, 4.5, -0.5); c.fill();
      c.fillStyle = '#FFD43B';
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ell(c, Math.cos(a) * 10, -9 + Math.sin(a) * 10, 8, 4, a); c.fill(); }
      c.fillStyle = '#FFB300'; circ(c, 0, -9, 7.5); c.fill();
      break;
    case 'lettuce':
      c.fillStyle = '#6FCB55';
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; circ(c, Math.cos(a) * 13, 2 + Math.sin(a) * 11, 11); c.fill(); }
      c.fillStyle = '#A5E87C';
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + 0.4; circ(c, Math.cos(a) * 7, 1 + Math.sin(a) * 6, 8); c.fill(); }
      c.fillStyle = '#D4F7A8'; circ(c, 0, 0, 6.5); c.fill();
      c.strokeStyle = '#6FCB55'; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(-3, 2); c.quadraticCurveTo(0, -3, 3, 2); c.stroke();
      break;
    case 'apple':
      c.fillStyle = '#F0483E';
      circ(c, -6.5, 3, 15.5); c.fill(); circ(c, 6.5, 3, 15.5); c.fill();
      c.fillStyle = 'rgba(255,255,255,.5)'; ell(c, -11, -3, 4, 6.5, 0.5); c.fill();
      c.strokeStyle = '#7A4A2A'; c.lineWidth = 3.2;
      c.beginPath(); c.moveTo(0, -9); c.quadraticCurveTo(0, -16, 3, -20); c.stroke();
      c.fillStyle = '#5DBB4B'; ell(c, 10, -18, 8, 4, -0.5); c.fill();
      break;
  }
  c.restore();
}

// ------------------------------------------------- ground decorations ---

export function drawFlower(c, f) {
  c.fillStyle = f.color;
  for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + f.rot; circ(c, f.x + Math.cos(a) * 5, f.y + Math.sin(a) * 5, 4.2); c.fill(); }
  c.fillStyle = '#FFE066'; circ(c, f.x, f.y, 3.4); c.fill();
}

export function drawPond(c, p, t) {
  c.fillStyle = '#C9E7A0'; ell(c, p.x, p.y, p.rx + 16, p.ry + 13); c.fill();
  c.fillStyle = '#7CCBEE'; ell(c, p.x, p.y, p.rx, p.ry); c.fill();
  c.fillStyle = '#9ADBF5'; ell(c, p.x - 20, p.y - 14, p.rx * 0.72, p.ry * 0.6); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const wx = p.x - 110 + i * 70 + Math.sin(t * 0.7 + i) * 10, wy = p.y - 40 + (i % 2) * 55;
    c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 12, wy - 6, wx + 24, wy); c.stroke();
  }
  for (const [lx, ly, r] of [[-120, 30, 22], [70, 55, 18], [110, -40, 20]]) {
    c.fillStyle = '#5DBB4B'; c.beginPath(); c.moveTo(p.x + lx, p.y + ly); c.arc(p.x + lx, p.y + ly, r, 0.4, TAU - 0.2); c.fill();
  }
  c.fillStyle = '#FF9EC4'; circ(c, p.x - 120, p.y + 26, 7); c.fill();
  c.fillStyle = '#FFE066'; circ(c, p.x - 120, p.y + 26, 3); c.fill();
}

export function drawNest(c, h) {
  // hay bed on the ground
  c.fillStyle = '#E9C46A'; ell(c, h.x, h.y, 105, 52); c.fill();
  c.fillStyle = '#F6DC8C'; ell(c, h.x - 6, h.y - 5, 84, 38); c.fill();
  c.strokeStyle = '#D9A93E'; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4, r = 30 + ((i * 37) % 55);
    const x = h.x + Math.cos(a) * r, y = h.y + Math.sin(a) * r * 0.45;
    c.beginPath(); c.moveTo(x - 9, y + ((i % 3) - 1) * 4); c.lineTo(x + 9, y - ((i % 3) - 1) * 4); c.stroke();
  }
}

// Open mouth + sound waves: the same picture as the wheek button.
export function drawWheekIcon(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = '#A8344F'; ell(c, -15, 0, 11, 14); c.fill();
  c.fillStyle = '#FF9DB0'; ell(c, -15, 7, 7, 6); c.fill();
  c.strokeStyle = '#FF7FA0'; c.lineWidth = 4.5; c.lineCap = 'round';
  for (const [x0, r] of [[-2, 9], [5, 16], [12, 23]]) { c.beginPath(); c.arc(x0, 0, r, -0.75, 0.75); c.stroke(); }
  c.restore();
}

export function drawBubble(c, x, y, r) {
  c.save();
  c.fillStyle = '#fff'; c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
  circ(c, x, y, r); c.fill();
  c.shadowColor = 'transparent';
  c.beginPath(); c.moveTo(x - r * 0.3, y + r * 0.85); c.lineTo(x - r * 0.5, y + r * 1.4); c.lineTo(x + r * 0.15, y + r * 0.95); c.fill();
  c.restore();
}

// A little pointing hand, used as a "tap here" hint.
export function drawHand(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-0.35);
  c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = '#6B4A3A'; c.fillStyle = '#fff';
  c.beginPath();
  c.roundRect(-8, 0, 16, 40, 8);
  c.roundRect(-10, 26, 38, 34, 12);
  c.stroke(); c.fill();
  c.restore();
}

