// Game controller (an Xbox pad in Edge, or any pad with the standard layout).
// Stick or D-pad walks, A / X / Y are jump / wheek / sniff, and the same stick steps through
// the stones and the popup puzzles. Read once a frame; nothing happens if no pad is there.
import { input } from './input.js';

const DEAD = 0.28;                                   // a resting stick is never quite at zero
const BUTTONS = { 0: 'a', 1: 'b', 2: 'x', 3: 'y', 9: 'menu' };
let prev = {}, navKey = '', navT = 0;

export const pad = {
  on: false,          // a pad is being used right now (touch or mouse turns this off again)
  xbox: false,        // ...and it is an Xbox one, so the buttons can wear its letters
  onButton: null,     // ('a' | 'b' | 'x' | 'y' | 'menu') once per press
  onNav: null,        // (dx, dy) one step per push of the stick or D-pad, repeating while held
};

// On an Xbox, Edge otherwise turns the stick into a mouse pointer; ask for the real pad instead (ignored elsewhere).
try { navigator.gamepadInputEmulation = 'gamepad'; } catch {}

function setOn(on, g) {
  if (on === pad.on) return;
  pad.on = on;
  pad.xbox = on && (/xbox|xinput|045e/i.test(g.id) || /xbox/i.test(navigator.userAgent));
  document.body.classList.toggle('pad', pad.on);
  document.body.classList.toggle('xbox', pad.xbox);
}
window.addEventListener('pointerdown', () => setOn(false), true);

export function pollPad(dt) {
  let g = null;
  try { for (const q of navigator.getGamepads ? navigator.getGamepads() : []) if (q && q.connected && q.buttons.length >= 4) { g = q; break; } } catch {}
  if (!g) { input.stick = null; prev = {}; navKey = ''; return; }
  const down = (i) => !!(g.buttons[i] && g.buttons[i].pressed);
  let x = g.axes[0] || 0, y = g.axes[1] || 0;
  if (down(14)) x = -1; if (down(15)) x = 1; if (down(12)) y = -1; if (down(13)) y = 1;
  const m = Math.hypot(x, y);
  // a full push is a run (and, kept up, zoomies); a gentle one is a walk
  input.stick = m > DEAD ? { x: x / m, y: y / m, mag: m > 0.9 ? 1 : 0.4 + (0.5 * (m - DEAD)) / (0.9 - DEAD) } : null;
  let used = !!input.stick;
  const pressed = [];
  for (const i in BUTTONS) { const d = down(i); if (d && !prev[i]) pressed.push(BUTTONS[i]); prev[i] = d; }
  if (pressed.length) used = true;
  if (used) setOn(true, g);
  for (const b of pressed) pad.onButton && pad.onButton(b);

  const dir = m > 0.6 ? (Math.abs(x) > Math.abs(y) ? [Math.sign(x), 0] : [0, Math.sign(y)]) : null, key = dir ? dir.join() : '';
  if (key !== navKey) { navKey = key; navT = 0.42; if (dir && pad.onNav) pad.onNav(dir[0], dir[1]); }
  else if (dir) { navT -= dt; if (navT <= 0) { navT = 0.2; pad.onNav && pad.onNav(dir[0], dir[1]); } }
}
