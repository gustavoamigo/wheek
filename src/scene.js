// The 3D view: builds the forest from the world data and draws it every frame.
// World coordinates: x = east, world "y" = south (three.js z). Height is three.js y.
import * as THREE from '../vendor/three.module.min.js';
import * as M from './models.js';
import { paintGround } from './ground.js';
import { W, H } from './world.js';
import { clamp, lerp } from './util.js';
import { STYLE } from './style.js';

export const view = { cw: 1, ch: 1, dpr: 1, focal: 1 };

let renderer, scene, camera, sun, world;
let pig, squirrel, squirrelPos;
const trees = [];          // { t, canopy, a }
const foodMeshes = new Map();
const butterflies = [];
const camPos = new THREE.Vector3(), camAim = new THREE.Vector3();
let camReady = false, zoomK = 0.55;

const FOV = 42;
const CAM_UP = 500, CAM_BACK = 700;          // third-person: above and behind (south of) the pig, always looking north

export function initScene(canvas, w) {
  world = w;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(STYLE.bg);
  scene.fog = new THREE.Fog(STYLE.bg, 1700, 3900);
  if (STYLE.tone) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; }
  if (STYLE.vignette) { const vg = document.createElement('div'); vg.style.cssText = `position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%, transparent 45%, ${STYLE.vignette} 100%)`; canvas.after(vg); }
  camera = new THREE.PerspectiveCamera(FOV, 1, 20, 7000);

  scene.add(new THREE.HemisphereLight(...STYLE.hemi));
  sun = new THREE.DirectionalLight(...STYLE.sun);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera; sc.left = -1300; sc.right = 1300; sc.top = 1400; sc.bottom = -1100; sc.near = 100; sc.far = 3000;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 2;
  scene.add(sun, sun.target);

  // ground
  const big = new THREE.Mesh(new THREE.PlaneGeometry(14000, 12000).rotateX(-Math.PI / 2), M.surf({ color: '#9BD770' }));
  big.position.set(W / 2, -1, H / 2); big.receiveShadow = true; scene.add(big);
  const res = renderer.capabilities.maxTextureSize >= 4096 ? 1 : 0.66;
  const tex = new THREE.CanvasTexture(paintGround(world, res));
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(W, H).rotateX(-Math.PI / 2), M.surf({ map: tex }));
  ground.position.set(W / 2, 0, H / 2); ground.receiveShadow = true; scene.add(ground);

  // trees: a trunk and a leafy top each, so every tree can fade or duck out of the camera's way
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3();
  const leafTex = STYLE.plainTrees ? null : M.texture('leaf');
  const trunkMat = M.mat('#B98248', { map: STYLE.plainTrees ? null : M.texture('bark') });
  for (const t of world.trees) {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(M.trunkGeometry, trunkMat); trunk.castShadow = true;
    const canopy = new THREE.Mesh(M.canopyGeometry(t.hue, t.apple), M.surf({ vertexColors: true, map: leafTex }));
    canopy.rotation.y = t.apple ? 0 : t.seed; canopy.castShadow = true;
    group.add(trunk, canopy);
    group.position.set(t.x, 0, t.y); group.scale.setScalar(t.s);
    scene.add(group);
    trees.push({ t, group, canopy, a: 1, grow: 1 });
  }

  const bushMat = M.mat('#ffffff', { vertexColors: true, map: leafTex });
  for (const b of world.bushes) {
    const m = new THREE.Mesh(M.bushGeometry(b.berry), bushMat);
    m.position.set(b.x, 0, b.y); m.scale.setScalar(b.s * 1.15); m.castShadow = true; scene.add(m); b.mesh = m;
  }
  const rockMat = M.mat('#ffffff', { vertexColors: true, map: M.texture('stone') });
  const plainMat = M.mat('#ffffff', { vertexColors: true });
  for (const r of world.rocks) {
    const m = new THREE.Mesh(M.rockGeometry, rockMat);
    m.position.set(r.x, 0, r.y); m.scale.setScalar(r.s); m.rotation.y = r.x; m.castShadow = true; scene.add(m);
  }
  for (const mu of world.mushrooms) {
    const m = new THREE.Mesh(M.mushroomGeometry(mu.color), rockMat);
    m.position.set(mu.x, 0, mu.y); m.scale.setScalar(mu.s * 1.2); m.castShadow = true; scene.add(m);
  }
  const tufts = new THREE.InstancedMesh(M.tuftGeometry, M.surf({ color: '#ffffff' }), world.tufts.length);
  const e = new THREE.Euler(), col = new THREE.Color();
  world.tufts.forEach((g, i) => {
    mtx.compose(v.set(g.x, 0, g.y), q.setFromEuler(e.set(0, g.seed, 0)), s.setScalar(1.1)); tufts.setMatrixAt(i, mtx);
    tufts.setColorAt(i, col.set(g.dark ? '#63B84E' : '#7FCB5B'));
  });
  scene.add(tufts);
  // extra little grass blades all over (only in the richer styles)
  if (STYLE.grass) {
    let sd = 21; const rr = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const spots = [];
    for (let i = 0; i < STYLE.grass * 3 && spots.length < STYLE.grass; i++) { const x = rr() * W, y = 200 + rr() * (H - 200); if (world.freeSpot(x, y) && world.distToPath(x, y) > 62 && Math.hypot(x - world.home.x, y - world.home.y) > 130) spots.push([x, y]); }
    const blades = new THREE.InstancedMesh(M.tuftGeometry, M.surf({ color: '#ffffff' }), spots.length);
    spots.forEach(([x, y], i) => {
      mtx.compose(v.set(x, 0, y), q.setFromEuler(e.set(0, rr() * 6, 0)), s.set(0.5, 0.3 + rr() * 0.3, 0.5)); blades.setMatrixAt(i, mtx);
      blades.setColorAt(i, col.setHSL(0.26 + rr() * 0.06, 0.62, 0.36 + rr() * 0.1));
    });
    scene.add(blades);
  }

  const house = M.makeHouse(); house.position.set(world.house.x, 0, world.house.y - 30); scene.add(house);
  const gate = M.makeGate(); gate.position.set(world.gate.x, 0, world.gate.y); scene.add(gate);

  // the squirrel sits on a branch of the apple tree, on the side facing the camera
  const at = world.appleTree;
  squirrelPos = { x: at.x + 96, y: 112, z: at.y + 52 };
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(7, 9, 125, 8), M.mat('#A8743F'));
  branch.position.set(at.x + 50, 104, at.y + 27); branch.rotation.set(0, -0.5, Math.PI / 2 - 0.08); branch.castShadow = true; scene.add(branch);
  squirrel = M.makeSquirrel();
  squirrel.root.position.set(squirrelPos.x, squirrelPos.y, squirrelPos.z); squirrel.root.rotation.y = -0.9;
  scene.add(squirrel.root);

  // ---- small details ----
  // real little flowers instead of painted ones
  const byColor = new Map();
  for (const f of world.flowers) { if (!byColor.has(f.color)) byColor.set(f.color, []); byColor.get(f.color).push(f); }
  for (const [color, list] of byColor) {
    const im = new THREE.InstancedMesh(M.flowerGeometry(color), plainMat, list.length);
    list.forEach((f, i) => { mtx.compose(v.set(f.x, 0, f.y), q.setFromEuler(e.set(0, f.rot, 0)), s.setScalar(1.25 + (f.rot % 1) * 0.5)); im.setMatrixAt(i, mtx); });
    im.castShadow = true; scene.add(im);
  }
  // pebbles scattered about, a few more beside the rocks
  let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const peb = [];
  for (let i = 0; i < 400 && peb.length < 40; i++) { const x = 200 + rnd() * (W - 400), y = 300 + rnd() * (H - 500); if (world.freeSpot(x, y)) peb.push([x, y, 0.12 + rnd() * 0.14]); }
  for (const r of world.rocks) for (let k = 0; k < 2; k++) peb.push([r.x + (rnd() - 0.5) * 110, r.y + 18 + rnd() * 26, 0.2 + rnd() * 0.2]);
  const pebbles = new THREE.InstancedMesh(M.rockGeometry, rockMat, peb.length);
  peb.forEach(([x, y, sc], i) => { mtx.compose(v.set(x, 0, y), q.setFromEuler(e.set(0, x, 0)), s.setScalar(sc)); pebbles.setMatrixAt(i, mtx); });
  pebbles.castShadow = true; scene.add(pebbles);
  // the pond: reeds round the far side, lily pads on the water
  const pd = world.pond, reed = M.reedGeometry();
  for (let i = 0; i < 13; i++) {
    const a = Math.PI + 0.12 + (i / 12) * (Math.PI - 0.24) + (rnd() - 0.5) * 0.1;      // far (north) half only, so the view stays open
    const m = new THREE.Mesh(reed, plainMat);
    m.position.set(pd.x + Math.cos(a) * (pd.rx + 6), 0, pd.y + Math.sin(a) * (pd.ry + 6)); m.rotation.y = rnd() * 6; m.scale.setScalar(0.8 + rnd() * 0.5); m.castShadow = true;
    scene.add(m);
  }
  for (const [lx, ly, sc, fl] of [[-120, 30, 1, true], [70, 55, 0.82, false], [110, -40, 0.9, true], [-40, -60, 0.7, false], [10, 20, 0.6, false]]) {
    const m = new THREE.Mesh(M.lilyGeometry(fl), plainMat); m.position.set(pd.x + lx, 0.5, pd.y + ly); m.scale.setScalar(sc); m.rotation.y = lx; scene.add(m);
  }

  pig = M.makePig(); scene.add(pig.root);
  resize();
  return { squirrelPos };
}

export function addButterfly(b) {
  const m = M.makeButterfly(b.color); scene.add(m); butterflies.push([b, m]);
}

export function resize() {
  view.dpr = Math.min(window.devicePixelRatio || 1, 2);
  view.cw = window.innerWidth; view.ch = window.innerHeight;
  renderer.setPixelRatio(view.dpr);
  renderer.setSize(view.cw, view.ch, false);
  camera.aspect = view.cw / view.ch;
  camera.updateProjectionMatrix();
  view.focal = view.ch / 2 / Math.tan((FOV * Math.PI) / 360);
}

// (Re)create the 3D food for a new round.
export function setFoods(foods) {
  for (const [, o] of foodMeshes) scene.remove(o.group);
  foodMeshes.clear();
  for (const f of foods) {
    const group = new THREE.Group();
    const model = M.makeFood(f.kind); model.scale.setScalar(1.25);
    const holder = new THREE.Group(); holder.add(model);
    const beacon = M.makeBeacon();
    group.add(holder, beacon);
    scene.add(group);
    foodMeshes.set(f, { group, holder, beacon });
  }
}

const _v = new THREE.Vector3();
// World point -> [screen x, screen y, pixels per world unit there, is in front of camera]
export function project(x, h, z) {
  _v.set(x, h, z).applyMatrix4(camera.matrixWorldInverse);
  const depth = -_v.z;
  _v.applyMatrix4(camera.projectionMatrix);
  return [(_v.x * 0.5 + 0.5) * view.cw, (-_v.y * 0.5 + 0.5) * view.ch, view.focal / Math.max(depth, 1), depth > 1];
}

// Where on the ground is the finger pointing?
export function screenToGround(sx, sy) {
  _v.set((sx / view.cw) * 2 - 1, -(sy / view.ch) * 2 + 1, 0.5).unproject(camera).sub(camera.position).normalize();
  const t = _v.y < -0.02 ? -camera.position.y / _v.y : 4000;
  return [camera.position.x + _v.x * t, camera.position.z + _v.z * t];
}

function updateCamera(G, dt) {
  const p = G.pig;
  // portrait screens pull the camera back so there is still room to see sideways
  const fit = clamp(1.3 / camera.aspect, 1, 2.1);
  zoomK = lerp(zoomK, G.mode === 'title' ? 0.55 : 1, 1 - Math.exp(-dt * 2));
  const d = fit * zoomK;
  const lead = G.mode === 'title' ? 0 : 0.3;
  const halfW = Math.tan((FOV * Math.PI) / 360) * Math.hypot(CAM_UP, CAM_BACK) * d * camera.aspect;
  const mx = Math.min(520, halfW * 0.55);
  const tx = clamp(p.x + p.vx * lead, mx, W - mx), tz = clamp(p.y + p.vy * lead, 300, H - 60);
  const k = camReady ? 1 - Math.exp(-dt * 4) : 1;
  camReady = true;
  camAim.x = lerp(camAim.x, tx, k); camAim.z = lerp(camAim.z, tz, k); camAim.y = 30;
  camPos.set(camAim.x, CAM_UP * d, camAim.z + CAM_BACK * d);
  camera.position.copy(camPos);
  camera.lookAt(camAim.x, camAim.y, camAim.z - 70 * d);
  camera.updateMatrixWorld();
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

  sun.target.position.set(camAim.x, 0, camAim.z - 200);
  sun.position.set(camAim.x + STYLE.sunAt[0], STYLE.sunAt[1], camAim.z + STYLE.sunAt[2]);
}

// Tree tops that would hide the pig or a piece of food turn see-through.
function hides(t, x, z) {
  const dz = t.y - x.z, dx = Math.abs(t.x - x.x);
  return dx < 125 * t.s && dz > 40 * t.s && dz < 500 + z;
}

export function render(G, dt) {
  const time = G.t, p = G.pig;
  pig.update(p, time);
  updateCamera(G, dt);

  const focus = [{ x: p.x, z: p.y }];
  for (const f of G.foods) if (!f.eaten && !f.hidden) focus.push({ x: f.x, z: f.y });
  for (const tr of trees) {
    let hide = false;
    for (const f of focus) if (hides(tr.t, f, 0)) { hide = true; break; }
    const target = hide ? 0.1 : 1;
    if (Math.abs(tr.a - target) > 0.005) {
      tr.a = lerp(tr.a, target, 1 - Math.exp(-dt * 8));
      const m = tr.canopy.material, wasT = m.transparent;
      m.transparent = tr.a < 0.98; m.opacity = tr.a; m.depthWrite = tr.a > 0.6;
      tr.canopy.castShadow = tr.a > 0.6;
      if (wasT !== m.transparent) m.needsUpdate = true;
    }
    // trees right in front of the camera shrink into the ground so they never block the view
    const near = tr.t.y - camAim.z, g = near > 430 ? 0 : 1;
    if (Math.abs(tr.grow - g) > 0.002) {
      tr.grow = lerp(tr.grow, g, 1 - Math.exp(-dt * 7));
      tr.group.scale.setScalar(Math.max(0.001, tr.t.s * tr.grow));
      tr.group.visible = tr.grow > 0.01;
    }
  }

  for (const [f, o] of foodMeshes) {
    const show = !f.eaten && !f.hidden;
    o.group.visible = show;
    if (!show) continue;
    const hinted = G.hint && G.hint.kind === f.kind;
    if (f.fall >= 0) {
      const k = f.fall;
      o.group.position.set(lerp(f.fx, f.x, k), 0, lerp(f.fz, f.y, k));
      o.holder.position.y = lerp(f.fy, 26, k * k) + Math.sin(k * Math.PI) * 50;
      o.holder.rotation.z = k * 6; o.beacon.visible = false;
      continue;
    }
    const age = time - f.born, appear = age < 0.4 ? 1 - (1 - age / 0.4) ** 3 : 1;
    o.group.position.set(f.x, 0, f.y);
    o.holder.rotation.z = 0;
    o.holder.position.y = 34 + Math.sin(time * 2.2 + f.seed) * 5;
    o.holder.rotation.y = time * 0.9 + f.seed;
    o.holder.scale.setScalar(Math.max(0.01, appear * (1 - f.bite * 0.75)));
    o.beacon.visible = true;
    const pulse = 0.5 + Math.sin(time * 3 + f.seed) * 0.5;
    o.beacon.userData.beam.material.opacity = (hinted ? 0.34 : 0.17) + pulse * 0.07;
    o.beacon.userData.disc.material.opacity = (hinted ? 0.6 : 0.38) + pulse * 0.1;
    o.beacon.userData.disc.scale.setScalar((hinted ? 1.25 : 1) + pulse * 0.08);
  }

  squirrel.update(time, { apple: G.squirrel.hasApple, wave: G.squirrel.wave });
  for (const [b, m] of butterflies) {
    m.position.set(b.x, b.h, b.y); m.rotation.y = -b.a + Math.PI / 2; m.userData.flap(time, b.seed);
  }
  for (const b of world.bushes) {
    const w = b.w > 0 ? Math.sin(time * 30) * 0.06 * b.w : 0;
    b.mesh.rotation.z = w; b.mesh.scale.y = b.s * 1.15 * (1 + Math.abs(w));
  }
  renderer.render(scene, camera);
}
