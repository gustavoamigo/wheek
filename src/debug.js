// Autopilot used for automated smoke tests (?bot). Plays like a child would:
// sniff, follow the smell, wheek at the squirrel. Not loaded in normal play.
export function runBot(G, input) {
  const log = [];
  G.botLog = log;
  let lastEaten = 0;
  setInterval(() => {
    const p = G.pig, n = G.api.nearestFood();
    if (G.eaten !== lastEaten) { lastEaten = G.eaten; log.push(`t=${G.t.toFixed(1)} eaten=${G.eaten} round=${G.round}`); }
    if (!n || p.state !== 'idle') return;
    if (!G.hint) { G.api.doSniff(); return; }
    if (n.food.hidden) {
      if (Math.hypot(n.x - p.x, n.y - p.y) < 120) { input.target = null; G.api.doWheek(); return; }
    }
    input.target = { x: n.x, y: n.y };
  }, 150);
}
