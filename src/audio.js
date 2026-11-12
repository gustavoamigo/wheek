// All sounds are synthesised with WebAudio: no asset files to load.
let ac = null, master, sfx, music, noiseBuf;
let muted = false;

export function initAudio() {
  if (ac) { ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  master = ac.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ac.destination);
  sfx = ac.createGain(); sfx.gain.value = 0.8; sfx.connect(master);
  music = ac.createGain(); music.gain.value = 0.16; music.connect(master);
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  startMusic();
  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (document.hidden) ac.suspend(); else ac.resume();
  });
}

// iPhone and iPad are strict about sound:
// - it may only start from a finished touch (touchend / click), not from the touch going down, which is
//   what the game's buttons listen to. So every finished touch, click and key also wakes the sound up.
// - by default a web page counts as "background sound", which the ring/silent switch on the side of the
//   phone mutes. Asking for the "playback" kind makes it sound like any other game; the volume buttons
//   and the game's own mute button still work.
function unlock() {
  try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch {}
  initAudio();
  if (!ac || ac.state === 'running') return;
  ac.resume();
  const src = ac.createBufferSource(); src.buffer = ac.createBuffer(1, 1, 22050); src.connect(ac.destination); src.start(0);     // one silent sample: older iPhones need a sound started by the touch itself
}
for (const ev of ['touchend', 'click', 'keydown']) window.addEventListener(ev, unlock, true);

export const audioRunning = () => !!ac && ac.state === 'running';

export function setMuted(m) {
  muted = m;
  if (ac) master.gain.setTargetAtTime(m ? 0 : 1, ac.currentTime, 0.03);
}
export const isMuted = () => muted;

function tone(freq, when, dur, o = {}) {
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator(), g = ac.createGain();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + (o.sweep || dur));
  const vol = o.vol ?? 0.3, att = o.attack ?? 0.012;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(o.dest || sfx);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

function noise(when, dur, o = {}) {
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f = ac.createBiquadFilter(); f.type = o.type || 'bandpass';
  f.frequency.setValueAtTime(o.freq || 1200, t0);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
  f.Q.value = o.q ?? 1;
  const g = ac.createGain(), vol = o.vol ?? 0.25;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + (o.attack ?? 0.01));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(sfx);
  src.start(t0, Math.random() * 0.5); src.stop(t0 + dur + 0.05);
}

// "Wheek wheek wheek!" – rising whistles.
export function wheek() {
  for (let i = 0; i < 3; i++) {
    const w = i * 0.24;
    tone(780, w, 0.22, { type: 'triangle', to: 2300, sweep: 0.17, vol: 0.26, attack: 0.03 });
    tone(1560, w, 0.2, { type: 'sine', to: 4400, sweep: 0.17, vol: 0.06, attack: 0.03 });
  }
}

export function sniff() {
  noise(0, 0.13, { type: 'highpass', freq: 2500, vol: 0.16, attack: 0.04 });
  noise(0.2, 0.13, { type: 'highpass', freq: 2800, vol: 0.16, attack: 0.04 });
  noise(0.4, 0.2, { type: 'highpass', freq: 3000, vol: 0.18, attack: 0.06 });
}

export function munch(n = 5) {
  for (let i = 0; i < n; i++) {
    noise(i * 0.21, 0.07, { freq: 1500 + Math.random() * 900, q: 2.5, vol: 0.4 });
    tone(190, i * 0.21, 0.06, { type: 'square', vol: 0.05 });
  }
}

// lap, lap, lap – drinking at the pond
export function drink(n = 6) {
  for (let i = 0; i < n; i++) {
    tone(620 + Math.random() * 160, i * 0.3, 0.11, { to: 300, sweep: 0.09, vol: 0.17 });
    noise(i * 0.3 + 0.02, 0.07, { freq: 1100, q: 1.5, vol: 0.09 });
  }
}

export function jump() { tone(300, 0, 0.2, { to: 760, sweep: 0.16, vol: 0.2 }); }
export function land() { tone(170, 0, 0.1, { to: 90, vol: 0.22 }); noise(0, 0.06, { freq: 500, q: 1.2, vol: 0.1 }); }
export function splash() {
  noise(0, 0.5, { freq: 900, to: 2600, q: 0.7, vol: 0.3, attack: 0.02 });
  tone(240, 0, 0.3, { to: 70, vol: 0.3 });
  for (let i = 0; i < 4; i++) tone(700 + Math.random() * 500, 0.12 + i * 0.07, 0.09, { to: 320, sweep: 0.07, vol: 0.1 });
}
export function shake() { for (let i = 0; i < 7; i++) noise(i * 0.085, 0.07, { freq: 2600 + (i % 2) * 900, q: 1.2, vol: 0.11 }); }

export function nope() { tone(330, 0, 0.16, { to: 300, type: 'triangle', vol: 0.22 }); tone(262, 0.19, 0.24, { to: 225, type: 'triangle', vol: 0.22 }); }

export function pop() {
  tone(420, 0, 0.16, { to: 980, sweep: 0.1, vol: 0.22 });
  tone(840, 0.02, 0.1, { to: 1700, sweep: 0.08, vol: 0.07 });
}

const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];
export function chime(i = 0) {
  const f = PENTA[Math.min(i, PENTA.length - 1)];
  tone(f, 0, 0.7, { vol: 0.25 });
  tone(f * 2, 0, 0.4, { vol: 0.08 });
  tone(f * 1.5, 0.09, 0.6, { vol: 0.14 });
}

export function fanfare() {
  [0, 2, 3, 5, 3, 5, 7].forEach((n, i) => {
    const w = i * 0.14;
    tone(PENTA[n], w, 0.6, { vol: 0.24, type: 'triangle' });
    tone(PENTA[n] * 2, w, 0.3, { vol: 0.06 });
  });
  tone(261.63, 0, 1.4, { vol: 0.16, type: 'triangle' });
  tone(392, 0.56, 1.2, { vol: 0.14, type: 'triangle' });
}

export function whoosh() { noise(0, 0.35, { freq: 500, to: 2200, q: 1.2, vol: 0.14, attack: 0.1 }); }
export function rustle() { noise(0, 0.16, { freq: 3800, q: 0.8, vol: 0.07, attack: 0.03 }); }
export function step() { noise(0, 0.035, { freq: 420, q: 1.5, vol: 0.05 }); }
export function plop() { tone(300, 0, 0.18, { to: 120, vol: 0.3 }); noise(0, 0.08, { freq: 800, vol: 0.12 }); }
export function tap() { tone(660, 0, 0.09, { vol: 0.12 }); }

export function chirp(vol = 0.08) {
  const base = 2600 + Math.random() * 1200;
  const n = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    tone(base, i * 0.11, 0.08, { to: base * (1.15 + Math.random() * 0.25), sweep: 0.06, vol, attack: 0.015 });
  }
}

export function squirrelChatter() {
  for (let i = 0; i < 4; i++) tone(1200 + (i % 2) * 300, i * 0.07, 0.06, { type: 'square', vol: 0.05 });
}

// --- Gentle generative music-box loop -------------------------------------
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
const BASS = [130.81, 174.61, 196.0, 220.0];
function startMusic() {
  const beat = 0.46;
  let next = ac.currentTime + 0.3, step = 0, idx = 4;
  setInterval(() => {
    if (!ac || ac.state !== 'running') { next = ac ? ac.currentTime + 0.3 : 0; return; }
    while (next < ac.currentTime + 0.6) {
      const when = next - ac.currentTime;
      if (step % 8 === 0) tone(BASS[(step / 8) % BASS.length | 0], when, beat * 7, { type: 'triangle', vol: 0.5, attack: 0.08, dest: music });
      const rest = step % 2 === 1 && Math.random() < 0.55;
      if (!rest) {
        idx = Math.max(0, Math.min(SCALE.length - 1, idx + Math.floor(Math.random() * 5) - 2));
        tone(SCALE[idx], when, 1.3, { vol: 0.5, dest: music });
        tone(SCALE[idx] * 2, when, 0.5, { vol: 0.1, dest: music });
      }
      step++; next += beat;
    }
    if (Math.random() < 0.03) chirp(0.035);
  }, 200);
}
