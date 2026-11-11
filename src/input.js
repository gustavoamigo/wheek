// Input: touch / mouse "go where I point", keyboard arrows or WASD.
export const input = {
  keys: new Set(),
  pointerDown: false,
  tapPending: false,     // a quick tap that still has to become a walk target
  sx: 0, sy: 0,          // last pointer position (CSS px)
  target: null,          // world-space point the pig is walking to
  onTap: null,           // (sx, sy) => true if the tap was consumed
  onAction: null,        // ('sniff' | 'wheek')
};

const MOVE_KEYS = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
  KeyA: [-1, 0], KeyD: [1, 0], KeyW: [0, -1], KeyS: [0, 1],
};

export function keyVector() {
  let x = 0, y = 0;
  for (const k of input.keys) { const v = MOVE_KEYS[k]; if (v) { x += v[0]; y += v[1]; } }
  const m = Math.hypot(x, y);
  return m ? [x / m, y / m] : [0, 0];
}

export function initInput(canvas) {
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    input.sx = e.clientX; input.sy = e.clientY;
    if (input.onTap && input.onTap(e.clientX, e.clientY)) return;
    input.pointerDown = true; input.tapPending = true;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
  });
  canvas.addEventListener('pointermove', (e) => {
    if (input.pointerDown) { input.sx = e.clientX; input.sy = e.clientY; }
  });
  const up = () => { input.pointerDown = false; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  window.addEventListener('blur', () => { input.keys.clear(); input.pointerDown = false; });
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    if (MOVE_KEYS[e.code]) { input.keys.add(e.code); e.preventDefault(); return; }
    if (e.repeat) return;
    if (e.code === 'Space') { e.preventDefault(); input.onAction?.('wheek'); }
    if (e.code === 'KeyX' || e.code === 'KeyE' || e.code === 'Enter') { e.preventDefault(); input.onAction?.('sniff'); }
  });
  window.addEventListener('keyup', (e) => input.keys.delete(e.code));
}
