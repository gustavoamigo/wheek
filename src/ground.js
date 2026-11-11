// The forest floor is painted once into a big picture and laid flat under the 3D world:
// grass, light and dark patches, the dirt path, the pond, flowers and the hay nest.
import * as Art from './art.js';
import { W, H, PATH } from './world.js';

export function paintGround(world, res) {
  const cv = document.createElement('canvas');
  cv.width = Math.round(W * res); cv.height = Math.round(H * res);
  const c = cv.getContext('2d');
  c.scale(res, res);
  c.fillStyle = '#9BD770'; c.fillRect(0, 0, W, H);
  for (const p of world.patches) {
    c.fillStyle = p.light ? 'rgba(190,240,140,.45)' : 'rgba(110,190,90,.3)';
    Art.ell(c, p.x, p.y, p.rx, p.ry); c.fill();
  }
  // lots of tiny grass blades so the floor is not one flat colour
  let seed = 11; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  c.lineCap = 'round';
  for (let i = 0; i < 26000; i++) {
    const x = r() * W, y = r() * H, l = 5 + r() * 9;
    c.strokeStyle = r() < 0.5 ? `rgba(70,150,60,${0.1 + r() * 0.16})` : `rgba(215,250,160,${0.14 + r() * 0.2})`;
    c.lineWidth = 1.6 + r() * 1.4;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 6, y - l); c.stroke();
  }
  for (let i = 0; i < 700; i++) {                    // clover dots
    c.fillStyle = `rgba(90,175,80,${0.25 + r() * 0.2})`;
    const x = r() * W, y = r() * H;
    for (let k = 0; k < 3; k++) { Art.circ(c, x + Math.cos(k * 2.1) * 4, y + Math.sin(k * 2.1) * 4, 3.4); c.fill(); }
  }
  // fade the edges into the plain grass outside the map
  for (const [x, y, w, h, x0, y0, x1, y1] of [[0, 0, W, 80, 0, 0, 0, 80], [0, H - 80, W, 80, 0, H, 0, H - 80], [0, 0, 80, H, 0, 0, 80, 0], [W - 80, 0, 80, H, W, 0, W - 80, 0]]) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, '#9BD770'); g.addColorStop(1, 'rgba(155,215,112,0)');
    c.fillStyle = g; c.fillRect(x, y, w, h);
  }
  c.lineCap = 'round'; c.lineJoin = 'round';
  const trace = () => {
    c.beginPath(); c.moveTo(PATH[0][0], PATH[0][1]);
    for (let i = 1; i < PATH.length - 1; i++) {
      const mx = (PATH[i][0] + PATH[i + 1][0]) / 2, my = (PATH[i][1] + PATH[i + 1][1]) / 2;
      c.quadraticCurveTo(PATH[i][0], PATH[i][1], mx, my);
    }
    c.lineTo(PATH[PATH.length - 1][0], PATH[PATH.length - 1][1]);
  };
  c.strokeStyle = '#D9C28C'; c.lineWidth = 104; trace(); c.stroke();
  c.strokeStyle = '#EBD9A8'; c.lineWidth = 88; trace(); c.stroke();
  // pebbles and soft speckles on the path
  c.save(); trace(); c.lineWidth = 80; c.strokeStyle = 'rgba(0,0,0,0)';
  for (let i = 0; i < 2600; i++) {
    const x = r() * W, y = r() * H;
    if (!c.isPointInStroke(x * res, y * res)) continue;
    const big = r() < 0.12;
    c.fillStyle = big ? (r() < 0.5 ? '#CDB98A' : '#F6EBC8') : `rgba(150,120,70,${0.12 + r() * 0.18})`;
    Art.ell(c, x, y, big ? 5 + r() * 4 : 1.5 + r() * 2, big ? 3.5 + r() * 2 : 1.5 + r() * 1.5); c.fill();
  }
  c.restore();
  Art.drawPond(c, world.pond, 0);
  Art.drawNest(c, world.home);
  return cv;
}
