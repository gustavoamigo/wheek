// 3D models, all built from soft round primitives. No model files to load.
import * as THREE from '../vendor/three.module.min.js';
import { STYLE } from './style.js';

const TAU = Math.PI * 2;
const SPH = new THREE.SphereGeometry(1, 24, 16);
const SPH_LO = new THREE.SphereGeometry(1, 12, 9);
const matCache = new Map();
// One material factory for the whole game, so the art style can be switched in one place.
let toonRamp;
export function surf(o) {
  if (o.map === null) delete o.map;
  if (STYLE.kind === 'toon') {
    if (!toonRamp) { toonRamp = new THREE.DataTexture(new Uint8Array([150, 215, 255]), 3, 1, THREE.RedFormat); toonRamp.minFilter = toonRamp.magFilter = THREE.NearestFilter; toonRamp.needsUpdate = true; }
    return new THREE.MeshToonMaterial({ ...o, gradientMap: toonRamp });
  }
  if (STYLE.kind === 'standard') return new THREE.MeshStandardMaterial({ ...o, roughness: 0.92, metalness: 0 });
  return new THREE.MeshLambertMaterial(o);
}
export function mat(color, o) {
  if (o) return surf({ color, ...o });
  if (!matCache.has(color)) matCache.set(color, surf({ color }));
  return matCache.get(color);
}

function ball(color, sx, sy, sz, x, y, z, shadow = true) {
  const m = new THREE.Mesh(SPH, typeof color === 'string' ? mat(color) : color);
  m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.castShadow = shadow;
  return m;
}

// Merge several primitive shapes into one mesh with per-vertex colours (one draw call).
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _c = new THREE.Color();
// Each shape is shaded a little darker underneath and lighter on top, with a gentle mottle,
// so nothing looks like flat plastic.
function merged(parts) {
  const pos = [], nor = [], col = [], uv = [];
  for (const p of parts) {
    _q.setFromEuler(new THREE.Euler(...(p.rot || [0, 0, 0])));
    _m.compose(new THREE.Vector3(...p.at), _q, new THREE.Vector3(...p.scale));
    const src = (p.geo || SPH_LO).clone().toNonIndexed();
    src.computeBoundingBox();
    const y0 = src.boundingBox.min.y, yr = src.boundingBox.max.y - y0 || 1;
    const ly = Array.from({ length: src.attributes.position.count }, (_, i) => (src.attributes.position.getY(i) - y0) / yr);
    const g = src.applyMatrix4(_m), P = g.attributes.position;
    pos.push(...P.array); nor.push(...g.attributes.normal.array); uv.push(...g.attributes.uv.array);
    _c.set(p.color);
    for (let i = 0; i < P.count; i++) {
      const h = Math.sin(Math.round(P.getX(i)) * 12.9898 + Math.round(P.getY(i)) * 78.233 + Math.round(P.getZ(i)) * 37.719) * 43758.5453;
      const k = 0.8 + 0.26 * ly[i] + ((h - Math.floor(h)) - 0.5) * 0.09;
      col.push(Math.min(1, _c.r * k), Math.min(1, _c.g * k), Math.min(1, _c.b * k));
    }
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return out;
}

// Small painted textures (leaves, bark, fur, stone) that are multiplied over the colours.
const texCache = new Map();
export function texture(kind) {
  if (!STYLE.tex) return null;
  if (texCache.has(kind)) return texCache.get(kind);
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, 256, 256);
  let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const wrap = (fn) => { for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { c.save(); c.translate(ox, oy); fn(); c.restore(); } };
  if (kind === 'leaf') {
    for (let i = 0; i < 260; i++) {
      const x = r() * 256, y = r() * 256, a = r() * 6.3, w = 9 + r() * 8, dark = r() < 0.6;
      c.fillStyle = dark ? `rgba(10,70,30,${0.05 + r() * 0.07})` : 'rgba(255,255,255,.5)';
      wrap(() => { c.beginPath(); c.ellipse(x, y, w, w * 0.5, a, 0, 6.3); c.fill(); });
    }
  } else if (kind === 'bark') {
    c.lineCap = 'round';
    for (let i = 0; i < 46; i++) {
      const x = r() * 256, y = r() * 256, len = 50 + r() * 120;
      c.strokeStyle = `rgba(70,35,10,${0.12 + r() * 0.2})`; c.lineWidth = 2 + r() * 5;
      wrap(() => { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (r() - 0.5) * 16, y + len / 2, x + (r() - 0.5) * 8, y + len); c.stroke(); });
    }
  } else if (kind === 'fur') {
    c.lineCap = 'round';
    for (let i = 0; i < 900; i++) {
      const x = r() * 256, y = r() * 256, len = 8 + r() * 14;
      c.strokeStyle = `rgba(60,45,60,${0.05 + r() * 0.09})`; c.lineWidth = 1 + r() * 1.5;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y + (r() - 0.5) * 5); c.stroke();
    }
  } else {                                           // stone speckles
    for (let i = 0; i < 500; i++) {
      c.fillStyle = `rgba(40,45,60,${0.05 + r() * 0.12})`;
      c.beginPath(); c.arc(r() * 256, r() * 256, 1 + r() * 4, 0, 6.3); c.fill();
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(kind === 'leaf' ? 3 : kind === 'fur' ? 3 : 2, kind === 'bark' ? 1 : 2);
  texCache.set(kind, t);
  return t;
}
const blob = (color, x, y, z, r, ry = r, rz = r) => ({ color, at: [x, y, z], scale: [r, ry, rz] });

// ------------------------------------------------------------ guinea pig --
// Darling is modelled on a real guinea pig. He is ONE continuous shape from rump to nose
// (real pigs have no visible neck): the outline is described by a list of slices, and his
// black-and-white coat is painted on as fur and then given a fluffy pile.

// Slices from tail to nose: [position 0..1, half-width, top height, bottom height]
const SLICES = [
  [0.00, 0, 29, 29], [0.035, 15, 41, 15], [0.11, 26, 50, 7], [0.24, 31, 55, 3], [0.40, 32, 56, 3],
  [0.55, 30, 54.5, 4],                       // shoulders
  [0.66, 26.5, 52.5, 6],                     // where a neck would be – hardly narrower
  [0.76, 25, 51, 8.5],                     // cheeks and eyes: the widest part of the head
  [0.86, 21.5, 47.5, 11], [0.93, 17.5, 43, 13.5], [0.975, 12.5, 38, 16.5], [1.00, 0, 27, 27],   // blunt, sloping nose
];
const PIG_X0 = -58, PIG_LEN = 126;
function slice(t) {
  let i = 0; while (i < SLICES.length - 2 && t > SLICES[i + 1][0]) i++;
  const a = SLICES[i], b = SLICES[i + 1], p = SLICES[Math.max(0, i - 1)], n = SLICES[Math.min(SLICES.length - 1, i + 2)];
  const h = b[0] - a[0], u = (t - a[0]) / h, u2 = u * u, u3 = u2 * u, out = [];
  for (let k = 1; k < 4; k++) {            // smooth curve through the slices
    const m0 = (b[k] - p[k]) / (b[0] - p[0] || 1) * h, m1 = (n[k] - a[k]) / (n[0] - a[0] || 1) * h;
    out.push((2 * u3 - 3 * u2 + 1) * a[k] + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * b[k] + (u3 - u2) * m1);
  }
  out[0] = Math.max(0, out[0]);
  return out;
}
// A point on his skin: t along the body, a = angle round it (0 = top of the back, PI/2 = his right side)
function skin(t, a) {
  const [w, top, bot] = slice(t), c = Math.cos(a);
  return new THREE.Vector3(PIG_X0 + PIG_LEN * t, (top + bot) / 2 + (top - bot) / 2 * c, w * Math.sin(a) * (1 + 0.14 * Math.max(0, -c)));
}
function pigGeometry() {
  const NS = 60, NA = 36, pos = [], uv = [], idx = [], ts = [];
  for (let i = 0; i < NS; i++) {
    const t = 0.5 - 0.5 * Math.cos(Math.PI * i / (NS - 1));          // more slices near both ends
    for (let j = 0; j <= NA; j++) { const v = skin(t, (j / NA) * TAU); pos.push(v.x, v.y, v.z); uv.push(j / NA, t); ts.push(t); }
  }
  for (let i = 0; i < NS - 1; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + 1, c = a + NA + 1; idx.push(a, b, c, b, c + 1, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const N = g.attributes.normal;
  for (let i = 0; i < NS; i++) {           // hide the seam along the back, and tidy the two tips
    const a = i * (NA + 1), b = a + NA;
    const x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1;
    N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l);
    if (i === 0 || i === NS - 1) for (let j = 0; j <= NA; j++) N.setXYZ(a + j, i ? 1 : -1, 0, 0);
  }
  g.userData.t = ts;
  return g;
}

// Paint flat patches, then comb thousands of little hairs over them (each takes the colour
// underneath), so patch edges come out feathery like real fur. Hair runs nose -> rump.
function furMap(w, h, paint) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d', { willReadFrequently: true });
  // everything is drawn three times so the picture wraps cleanly round the body
  const wrap = (fn) => { for (const o of [-w, 0, w]) { c.save(); c.translate(o, 0); fn(); c.restore(); } };
  paint(c, w, h, wrap);
  const d = c.getImageData(0, 0, w, h).data;
  let seed = 3; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  c.lineCap = 'round';
  for (let i = 0; i < 60000; i++) {
    const x = r() * w, y = r() * h, k = ((y | 0) * w + (x | 0)) * 4;
    const dark = d[k] < 120, sh = dark ? r() * 30 : -r() * 22;
    c.strokeStyle = `rgb(${d[k] + sh},${d[k + 1] + sh},${d[k + 2] + sh * (dark ? 1.15 : 1.3)})`;
    c.lineWidth = 1.2 + r() * 1.2;
    const len = h * (0.012 + r() * 0.02), dx = (r() - 0.5) * w * 0.02;
    wrap(() => { c.beginPath(); c.moveTo(x, y - len * 0.4); c.lineTo(x + dx, y + len * 0.6); c.stroke(); });
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}
// His coat. Across: left/right edge = along the top of the back, 1/4 = his right side,
// middle = tummy, 3/4 = his left side. Down: top = nose, bottom = tail.
function paintCoat(c, W, H, wrap) {
  const Y = (t) => (1 - t) * H, el = (x, t, rx, rt, rot = 0) => { c.beginPath(); c.ellipse(x * W, Y(t), rx * W, rt * H, rot, 0, TAU); c.fill(); };
  c.fillStyle = '#FBF7EF'; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,238,214,.6)'; el(0.5, 0.4, 0.14, 0.4);                     // creamy tummy
  c.fillStyle = '#1E1A20';
  wrap(() => {
    // head: black cheeks (round the eyes and ears) joined over the back of the head and neck
    el(0.25, 0.735, 0.185, 0.135); el(0.75, 0.735, 0.185, 0.135);
    el(0.0, 0.63, 0.15, 0.07);
    el(0.16, 0.56, 0.05, 0.05, 0.5);                                                 // wispy streak on one shoulder
    // body: a long black patch along the back, off to his left, running into a black rump
    el(0.955, 0.38, 0.065, 0.25);
    el(0.93, 0.05, 0.27, 0.1);
  });
  // white blaze up the nose, narrowing between the eyes
  c.fillStyle = '#FBF7EF';
  wrap(() => { c.beginPath(); c.moveTo(-0.2 * W, Y(0.9)); c.quadraticCurveTo(-0.06 * W, Y(0.84), -0.035 * W, Y(0.69)); c.lineTo(0.035 * W, Y(0.69)); c.quadraticCurveTo(0.06 * W, Y(0.84), 0.2 * W, Y(0.9)); c.closePath(); c.fill(); });
  c.fillStyle = 'rgba(240,168,178,.6)'; c.fillRect(0, 0, W, H * 0.022);               // pink skin round the nose
}
function hairTexture() {
  const n = 256, cv = document.createElement('canvas'); cv.width = cv.height = n;
  const c = cv.getContext('2d'), img = c.createImageData(n, n);
  let seed = 9; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n * n; i++) { const v = r() * 255; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
  c.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 3);
  return t;
}

export function makePig() {
  const root = new THREE.Group();      // position + heading
  const tilt = new THREE.Group();      // squash, hop tilt
  root.add(tilt);
  const S = 1.08; tilt.scale.setScalar(S);

  const geo = pigGeometry(), coat = furMap(512, 1024, paintCoat);
  const fluffy = STYLE.fur > 0;
  const body = new THREE.Mesh(geo, surf({ map: coat, color: fluffy ? '#B8B8B8' : '#FFFFFF' }));
  body.castShadow = true; body.frustumCulled = false; tilt.add(body);
  // fluffy coat: thin layers of hair tips stacked just above the skin (shorter on the face)
  if (fluffy) {
    const hairs = hairTexture();
    for (let i = 1; i <= STYLE.fur; i++) {
      const k = i / STYLE.fur;
      const m = surf({ map: coat, alphaMap: hairs, alphaTest: 0.18 + k * 0.62, color: new THREE.Color().setScalar(0.72 + 0.28 * k) });
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uShell = { value: k * 3.6 };
        sh.vertexShader = 'uniform float uShell;\n' + sh.vertexShader.replace('#include <begin_vertex>',
          'vec3 transformed = position + normal * uShell * (1.0 - 0.72 * smoothstep(24.0, 64.0, position.x));');
      };
      const shell = new THREE.Mesh(geo, m); shell.frustumCulled = false; tilt.add(shell);
    }
  }

  // small paws with toes, mostly tucked under the body
  const feet = [], paw = '#F0D2C8';
  for (const [fx, fz, len] of [[20, 14, 9], [20, -14, 9], [-32, 17, 12], [-32, -17, 12]]) {
    const f = new THREE.Group(); f.position.set(fx, 4, fz); f.userData = { x: fx };
    f.add(ball(paw, len, 3.4, 4.6, 0, 0, 0));
    for (const tz of [-2.6, 0, 2.6]) f.add(ball(paw, 3.4, 1.6, 1.3, len - 1, -1, tz, false));
    feet.push(f); tilt.add(f);
  }

  // everything on his face rides on a pivot at the shoulders, so it follows when he nods
  const PX = 14, PY = 28;
  const head = new THREE.Group(); head.position.set(PX, PY, 0); tilt.add(head);
  const at = (m, t, a, out = 0) => { const v = skin(t, a); m.position.set(v.x - PX, v.y - PY, v.z + Math.sign(Math.sin(a)) * out); return m; };

  const eyes = [];
  const eyeMat = new THREE.MeshPhongMaterial({ color: '#160C0A', shininess: 120, specular: '#AAAAAA' });
  for (const s of [-1, 1]) {
    // thin, soft, drooping ears – pinkish grey and hairless
    const ear = at(new THREE.Group(), 0.695, s * 0.78, 2.5); ear.position.y += 1.5; ear.rotation.set(s * 1.05, s * -0.5, -0.25);
    ear.add(ball('#7B5B63', 8.5, 1.2, 5.6, -1, 0, s * 4));              // a soft petal, folded down and back
    ear.add(ball('#B88790', 6, 1.1, 3.6, -0.6, 0.5, s * 4.3, false));
    head.add(ear);
    // big round dark eyes on the sides of the head
    const e = at(new THREE.Group(), 0.8, s * 1.05, -1);
    e.add(ball(eyeMat, 5.2, 5.2, 3.4, 0, 0, 0, false));
    const hl = new THREE.Mesh(SPH, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    hl.scale.setScalar(1.05); hl.position.set(1.6, 1.9, s * 2.5); e.add(hl);
    eyes.push(e); head.add(e);
    // nostrils and whiskers
    head.add(at(ball('#5A3038', 0.9, 1.1, 0.9, 0, 0, 0, false), 0.992, s * 1.2, 0.3));
    for (const a of [-0.3, 0, 0.3]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.05, 15, 4).translate(0, 7.5, 0), mat('#FFFFFF'));
      at(w, 0.955, s * 1.75); w.rotation.set(s * (Math.PI / 2 - 0.2), 0, -0.45 + a); head.add(w);
    }
  }
  const nose = at(ball('#E59AA6', 2.6, 2.4, 4.2, 0, 0, 0, false), 0.997, 0); head.add(nose);
  const noseY0 = nose.position.y - 1.2;
  const cleft = at(ball('#B26A78', 0.8, 3, 0.9, 0, 0, 0, false), 0.992, Math.PI); cleft.position.y += 3.5; head.add(cleft);
  const mouth = at(ball('#8E2F45', 3, 4, 3.6, 0, 0, 0, false), 0.955, Math.PI); mouth.position.y += 1; head.add(mouth);

  // nodding bends the front of the body itself, so there is never a joint at the neck
  const P = geo.attributes.position, N = geo.attributes.normal;
  const P0 = P.array.slice(), N0 = N.array.slice(), T = geo.userData.t;
  let lastHz = 0;
  function bend(hz) {
    if (Math.abs(hz - lastHz) < 0.002) return;
    lastHz = hz;
    for (let i = 0; i < T.length; i++) {
      const u = clamp01((T[i] - 0.5) / 0.3), a = hz * u * u * (3 - 2 * u), c = Math.cos(a), s = Math.sin(a), k = i * 3;
      const x = P0[k] - PX, y = P0[k + 1] - PY;
      P.array[k] = PX + x * c - y * s; P.array[k + 1] = PY + x * s + y * c;
      N.array[k] = N0[k] * c - N0[k + 1] * s; N.array[k + 1] = N0[k] * s + N0[k + 1] * c;
    }
    P.needsUpdate = true; N.needsUpdate = true;
  }

  function update(p, t) {
    const moving = Math.min(1, Math.hypot(p.vx, p.vy) / 200);
    const hopping = p.hopT >= 0;
    const hop = hopping ? Math.sin(Math.PI * p.hopT) : 0;
    root.position.set(p.x, hop * 88 + Math.abs(Math.sin(p.walkPhase)) * 2 * moving, p.y);
    root.rotation.y = -p.heading + (hopping ? Math.sin(p.hopT * TAU) * 0.75 : 0);   // the popcorn twist

    const breathe = Math.sin(t * 2.4) * 0.012;
    let sx = 1 + breathe, sy = 1 - breathe;
    if (hopping) { const k = Math.cos(p.hopT * TAU); sx -= k * 0.06; sy += k * 0.08; }
    if (p.zoom) { sx += 0.07; sy -= 0.06; }
    tilt.scale.set(S * sx, S * sy, S);
    tilt.rotation.z = hopping ? Math.sin(p.hopT * TAU) * 0.28 : (p.zoom ? -0.05 : 0);
    tilt.rotation.x = Math.sin(p.walkPhase) * 0.045 * moving;                       // waddle

    feet.forEach((f, i) => {
      const ph = p.walkPhase + (i === 0 || i === 3 ? 0 : Math.PI);
      f.position.x = f.userData.x + Math.cos(ph) * 7 * moving;
      f.position.y = 4 + (hopping ? -2 : Math.max(0, Math.sin(ph)) * 5 * moving);
    });

    let hz = Math.sin(t * 1.3) * 0.025, ny = 0;
    mouth.visible = false;
    if (p.state === 'sniff') { hz = 0.24 + Math.sin(t * 20) * 0.04; ny = Math.sin(t * 40) * 0.9; }
    else if (p.state === 'wheek') { hz = 0.32; mouth.visible = true; mouth.scale.set(3, 5, 4); }
    else if (p.state === 'drink') { hz = -0.3 + Math.sin(t * 11) * 0.05; mouth.visible = true; mouth.scale.set(2.6, 1.8 + Math.abs(Math.sin(t * 11)) * 1.6, 3.2); }
    else if (p.state === 'munch') { hz = -0.16 + Math.sin(t * 26) * 0.06; mouth.visible = true; mouth.scale.set(3, 2 + Math.abs(Math.sin(t * 26)) * 2.4, 3.6); }
    head.rotation.z = hz; nose.position.y = noseY0 + 1.2 + ny;
    bend(hz);

    const happy = hopping || p.state === 'munch' || p.state === 'drink';
    const blink = !happy && (t + p.blinkSeed) % 3.7 < 0.12;
    for (const e of eyes) e.scale.y = happy ? 0.5 : blink ? 0.1 : 1;
  }
  return { root, update };
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// ---------------------------------------------------------------- nature --
const CANOPY = [
  ['#4FAE55', '#66C463', '#8ADB78'],
  ['#57B56B', '#74CF82', '#9BE39C'],
  ['#3FA36A', '#5CC088', '#86DBA6'],
  ['#62B84A', '#82D160', '#A9E684'],
];
const canopyGeo = new Map();
export function canopyGeometry(hue, apple) {
  const key = hue + (apple ? 'a' : '');
  if (!canopyGeo.has(key)) {
    const [d, m, l] = CANOPY[hue % CANOPY.length];
    const parts = [
      blob(d, -50, 168, 0, 56), blob(d, 50, 168, 0, 56), blob(d, 0, 165, -34, 58),
      blob(m, 0, 222, 0, 68), blob(m, 0, 162, 32, 60), blob(l, -20, 262, 22, 30), blob(l, 30, 215, 44, 17),
    ];
    if (apple) for (const [x, y, z] of [[-62, 150, 46], [-20, 235, 62], [38, 250, 40], [78, 150, 34], [-4, 150, 88], [22, 120, 68], [-80, 190, 10], [60, 205, 52]]) parts.push(blob('#F0483E', x, y, z, 11));
    canopyGeo.set(key, merged(parts));
  }
  return canopyGeo.get(key);
}
export const trunkGeometry = new THREE.CylinderGeometry(14, 19, 140, 10).translate(0, 70, 0);

const bushGeo = new Map();
export function bushGeometry(berry) {
  if (!bushGeo.has(berry)) {
    const parts = [blob('#4FAE55', -24, 20, 0, 25), blob('#4FAE55', 24, 20, 0, 25), blob('#6CC864', 0, 32, 0, 29), blob('#6CC864', 0, 20, 18, 22), blob('#93E07E', -8, 48, 10, 12)];
    for (const [x, y, z] of [[-26, 28, 20], [6, 48, 22], [28, 22, 20], [-2, 22, 38], [-34, 36, -4], [34, 38, 0], [10, 60, 4]]) parts.push(blob(berry, x, y, z, 5.5));
    bushGeo.set(berry, merged(parts));
  }
  return bushGeo.get(berry);
}
export const rockGeometry = merged([blob('#B9BEC9', 0, 14, 0, 33, 22, 27), blob('#D5D9E2', -8, 24, 4, 17, 11, 15), blob('#8EDB6A', 16, 6, 14, 13, 6, 10)]);

// ---- small details: flowers, reeds, lily pads ----
const petalGeo = new THREE.SphereGeometry(1, 6, 4);
const flowerGeo = new Map();
export function flowerGeometry(color) {
  if (!flowerGeo.has(color)) {
    const parts = [{ geo: stemGeo, color: '#5DBB4B', at: [0, 5, 0], scale: [1, 10, 1] }, { geo: petalGeo, color: '#FFE066', at: [0, 12, 0], scale: [3, 2.4, 3] }];
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; parts.push({ geo: petalGeo, color, at: [Math.cos(a) * 5, 11, Math.sin(a) * 5], scale: [4.2, 1.8, 4.2] }); }
    flowerGeo.set(color, merged(parts));
  }
  return flowerGeo.get(color);
}
export function reedGeometry() {
  const parts = [];
  for (const [x, z, h, lean] of [[0, 0, 96, 0.04], [9, 5, 74, -0.12], [-8, 3, 84, 0.14]]) {
    parts.push({ geo: stemGeo, color: '#6FAE4A', at: [x + lean * h / 2, h / 2, z], scale: [1.6, h, 1.6], rot: [0, 0, -lean] });
    parts.push({ geo: petalGeo, color: '#8A5A34', at: [x + lean * h, h, z], scale: [4, 12, 4], rot: [0, 0, -lean] });
  }
  for (const [x, a] of [[-14, 0.5], [15, -0.45], [3, 0.2]]) parts.push({ geo: coneGeo, color: '#7CC257', at: [x, 0, -3], scale: [4, 62, 2], rot: [0, 0, a] });
  return merged(parts);
}
export function lilyGeometry(flower) {
  const parts = [{ geo: stemGeo, color: '#58B24A', at: [0, 1.5, 0], scale: [1, 2, 1] }];
  parts[0].geo = new THREE.CylinderGeometry(1, 1, 1, 14, 1, false, 0.5, TAU - 0.8); parts[0].scale = [22, 2.5, 22];
  if (flower) {
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; parts.push({ geo: petalGeo, color: '#FF9EC4', at: [Math.cos(a) * 6, 6, Math.sin(a) * 6], scale: [5, 4, 3], rot: [0, -a, 0.5] }); }
    parts.push({ geo: petalGeo, color: '#FFE066', at: [0, 7, 0], scale: [3.5, 3.5, 3.5] });
  }
  return merged(parts);
}

const capGeo = new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2);
const stemGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const mushGeo = new Map();
export function mushroomGeometry(color) {
  if (!mushGeo.has(color)) {
    mushGeo.set(color, merged([
      { geo: stemGeo, color: '#FFF4E0', at: [0, 9, 0], scale: [6, 18, 6] },
      { geo: capGeo, color, at: [0, 15, 0], scale: [17, 14, 17] },
      blob('#ffffff', -8, 24, 6, 3.4), blob('#ffffff', 6, 26, 2, 3), blob('#ffffff', 0, 21, 13, 2.6), blob('#ffffff', 9, 20, -9, 3),
    ]));
  }
  return mushGeo.get(color);
}

const coneGeo = new THREE.ConeGeometry(1, 1, 5).translate(0, 0.5, 0);
export const tuftGeometry = merged([-2, -1, 0, 1, 2].map((i) => ({
  geo: coneGeo, color: '#ffffff', at: [i * 6, 0, (i % 2) * 5 - 2], scale: [5, 36 - Math.abs(i) * 7, 3.5], rot: [0, 0, -i * 0.22],
})));

export function makeHouse() {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.CylinderGeometry(64, 64, 120, 24), mat('#D69A5B'));
  dome.rotation.x = Math.PI / 2; dome.castShadow = true; g.add(dome);
  for (const z of [-40, 0, 40]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(64.5, 2.2, 6, 24), mat('#B97B40')); ring.position.z = z; g.add(ring);
  }
  const door = new THREE.Mesh(new THREE.CircleGeometry(30, 24), new THREE.MeshBasicMaterial({ color: '#6B4226' }));
  door.position.set(0, 0, 60.6); g.add(door);
  const s = new THREE.Shape();
  s.moveTo(0, -10); s.bezierCurveTo(-18, 2, -10, 15, 0, 5); s.bezierCurveTo(10, 15, 18, 2, 0, -10);
  const heart = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({ color: '#FF7FA0' }));
  heart.position.set(0, 44, 60.8); g.add(heart);
  return g;
}

export function makeGate() {
  const g = new THREE.Group();
  const wood = mat('#C98F54'), light = mat('#E0AC72'), dark = mat('#A8743F');
  const box = (m, w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; g.add(b); return b; };
  for (let z = -230; z <= 230; z += 46) box(wood, 12, 74, 14, 0, 37, z);
  box(light, 8, 12, 480, 0, 26, 0); box(light, 8, 12, 480, 0, 56, 0);
  for (const z of [-70, 70]) { box(dark, 22, 104, 22, 0, 52, z); const k = ball('#E0AC72', 14, 14, 14, 0, 110, z); g.add(k); }
  return g;
}

// ------------------------------------------------------------------ food --
export function makeFood(kind) {
  const g = new THREE.Group();
  const add = (m) => { g.add(m); return m; };
  switch (kind) {
    case 'carrot': {
      const body = new THREE.Mesh(new THREE.ConeGeometry(13, 46, 14), mat('#FF9838'));
      body.rotation.z = Math.PI; body.position.y = 0; body.castShadow = true; add(body);
      add(ball('#FF9838', 13, 6, 13, 0, 23, 0));
      for (const a of [-0.5, 0, 0.5]) { const l = ball('#5DBB4B', 5, 13, 5, Math.sin(a) * 9, 36, 0); l.rotation.z = -a; add(l); }
      g.rotation.z = -0.5;
      break;
    }
    case 'strawberry': {
      const body = new THREE.Mesh(new THREE.ConeGeometry(20, 34, 16), mat('#F2444F'));
      body.rotation.z = Math.PI; body.position.y = -6; body.castShadow = true; add(body);
      add(ball('#F2444F', 20, 13, 20, 0, 11, 0));
      for (let i = 0; i < 9; i++) { const a = i * 2.4, y = -12 + (i % 3) * 9, r = 9 + (y + 12) * 0.5; add(ball('#FFE28A', 2, 2.6, 2, Math.cos(a) * r, y, Math.sin(a) * r, false)); }
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; const l = ball('#4FB04A', 9, 2.5, 4.5, Math.cos(a) * 8, 22, Math.sin(a) * 8); l.rotation.y = -a; add(l); }
      break;
    }
    case 'dandelion': {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 40, 6), mat('#5DBB4B')); stem.position.y = -4; add(stem);
      for (const s of [-1, 1]) { const l = ball('#5DBB4B', 13, 3, 6, s * 11, -20, 0); l.rotation.z = s * 0.4; add(l); }
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; const p = ball('#FFD43B', 9, 3.5, 4.5, Math.cos(a) * 10, 18, Math.sin(a) * 10); p.rotation.y = -a; add(p); }
      add(ball('#FFB300', 9, 6, 9, 0, 20, 0));
      break;
    }
    case 'lettuce': {
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; add(ball('#6FCB55', 12, 13, 12, Math.cos(a) * 12, 0, Math.sin(a) * 12)); }
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + 0.4; add(ball('#A5E87C', 9, 11, 9, Math.cos(a) * 7, 8, Math.sin(a) * 7)); }
      add(ball('#D4F7A8', 8, 9, 8, 0, 14, 0));
      break;
    }
    case 'water': {
      const drop = new THREE.Mesh(new THREE.ConeGeometry(15.5, 30, 16), mat('#4DBDF2')); drop.position.y = 19; drop.castShadow = true; add(drop);
      add(ball('#4DBDF2', 18, 18, 18, 0, 0, 0));
      add(ball('#DFF6FF', 5, 7, 3, -8, 4, 13, false));
      break;
    }
    case 'apple': {
      add(ball('#F0483E', 21, 19, 21, 0, 0, 0));
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 12, 6), mat('#7A4A2A')); stem.position.set(1, 21, 0); stem.rotation.z = -0.25; add(stem);
      const leaf = ball('#5DBB4B', 9, 2.5, 5, 10, 24, 0); leaf.rotation.z = 0.4; add(leaf);
      break;
    }
  }
  return g;
}

// A soft light beam + ground glow so food can be spotted from far away.
const beamGeo = new THREE.CylinderGeometry(10, 26, 300, 16, 1, true).translate(0, 150, 0);
const discGeo = new THREE.CircleGeometry(46, 24).rotateX(-Math.PI / 2);
export function makeBeacon() {
  const g = new THREE.Group();
  const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: '#FFF6B0', transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  const disc = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: '#FFFBD0', transparent: true, opacity: 0.45, depthWrite: false }));
  disc.position.y = 1.5; beam.renderOrder = 2;
  g.add(beam, disc); g.userData = { beam, disc };
  return g;
}

// -------------------------------------------------------------- friends ---
export function makeSquirrel() {
  const g = new THREE.Group();
  const fur = '#C8703A', cream = '#F6DDBE';
  g.add(ball(fur, 15, 20, 15, 0, 20, 0));
  g.add(ball(cream, 9, 13, 6, 7, 20, 0)).position.x = 8;
  const head = new THREE.Group(); head.position.set(5, 46, 0); g.add(head);
  head.add(ball(fur, 14, 13, 13, 0, 0, 0));
  head.add(ball(cream, 8, 6.5, 8, 9, -3, 0));
  head.add(ball('#2B1D16', 2, 2, 2, 16.5, -2, 0, false));
  for (const s of [-1, 1]) {
    head.add(ball(fur, 4, 8, 3, -4, 13, s * 7));
    head.add(ball('#2B1D16', 2.8, 2.8, 2, 8, 3, s * 10.5, false));
  }
  // big curly tail
  g.add(ball(fur, 12, 16, 11, -18, 16, 0)); g.add(ball(fur, 13, 17, 12, -27, 36, 0)); g.add(ball(fur, 11, 12, 10, -22, 56, 0));
  g.add(ball('#E39A62', 6, 12, 6, -33, 38, 0));
  const arm = new THREE.Group(); arm.position.set(6, 30, 12);
  arm.add(ball(fur, 4, 9, 4, 0, -7, 0)); g.add(arm);
  const arm2 = new THREE.Group(); arm2.position.set(6, 30, -12);
  arm2.add(ball(fur, 4, 9, 4, 0, -7, 0)); arm2.rotation.z = 1.1; g.add(arm2);
  const apple = makeFood('apple'); apple.scale.setScalar(0.55); apple.position.set(22, 22, 0); g.add(apple);
  g.scale.setScalar(1.35);
  function update(t, o) {
    head.position.y = 46 + Math.sin(t * 3) * 1.2;
    apple.visible = o.apple;
    arm.rotation.z = o.wave > 0 ? 2.4 + Math.sin(t * 16) * 0.5 : 1.1;
    arm.rotation.x = 0;
  }
  return { root: g, update };
}

const wingGeo = new THREE.CircleGeometry(1, 10).rotateX(-Math.PI / 2);
export function makeButterfly(color) {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  const wings = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    const w = new THREE.Mesh(wingGeo, m); w.scale.set(9, 1, 11); w.position.x = s * 9; pivot.add(w);
    g.add(pivot); wings.push([pivot, s]);
  }
  g.add(ball('#5A4636', 2, 2, 8, 0, 0, 0, false));
  g.userData.flap = (t, seed) => { const a = Math.sin(t * 14 + seed) * 0.9; for (const [p, s] of wings) p.rotation.z = s * a; };
  return g;
}
