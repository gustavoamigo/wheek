# Tech notes

## Choices

- **3D in the browser with [Three.js](https://threejs.org)** (r170, vendored in `vendor/` so the game works with no internet). No build step: plain ES modules.
- **No asset files.** Every 3D model is assembled in code from soft round shapes (`src/models.js`); the forest floor is painted once into a texture (`src/ground.js`); all sound is synthesised with WebAudio.
- **Flat 2D overlay canvas on top of the 3D view** for everything that should always be readable: picture HUD, sparkles, scent trail, speech bubbles, pointing hand.
- Game logic treats the world as a flat map (`x` = east, `y` = south) plus the pig's height `z`. Things he can stand on are `world.platforms` (a point or a line with a radius and a top height). `src/scene.js` turns it into 3D (map `y` becomes 3D `z`, height is 3D `y`).

## Camera (the "can't get lost" rules)

- Third-person: above and behind the pig, following it smoothly.
- **The camera never turns and the player never controls it.** Up on the screen is always "away", so a child cannot get disoriented, and "touch where you want to go" always means the same thing.
- Looks a little ahead in the direction the pig is running.
- Tree tops that would hide the pig or a piece of food turn see-through; trees right in front of the lens shrink into the ground.
- Portrait phones pull the camera back so there is room to see sideways.
- A level can have its own view (`cam` in `LEVELS`, read as `G.cam` in `updateCamera`): how much world must fit across the screen, how steep, and how much it follows the pig rather than a fixed place. The pond levels and the maze use it.
- A level can be in another **place** (`place` in `LEVELS`, kept in `world.place`). The maze stands far to the east of the forest on the same map; while he is there only the maze's hedges and edges are solid.
- Tuning values at the top of `src/scene.js`: `FOV`, `CAM_UP`, `CAM_BACK`.

## Run it

```
python3 tools/serve.py 8765
```

Then open `http://linuxpc.local:8765/` (or `http://localhost:8765/`). The server sends no-cache headers, so a reload always gets the latest build.

## Install as an app

`manifest.webmanifest`, `sw.js` (offline copy, network first) and `icons/` make the game installable.
Browsers only allow installing (and the offline copy) from a **secure address**: `https://…` or `http://localhost`. Over plain `http://linuxpc.local:8765` the install button does not appear on Android / desktop Chrome. On iPhone / iPad the button shows the two taps for "Add to Home Screen", which works over plain http too. Putting the game on any HTTPS host makes install work everywhere.

## Files

| File | What |
|---|---|
| `index.html`, `style.css` | Page, title screen, trail of level stones, action buttons, mute button |
| `src/main.js` | Game state, update loop, levels, jumping, hints, 2D overlay + HUD |
| `src/scene.js` | Three.js scene: lights, shadows, camera, building the forest, per-frame sync |
| `src/models.js` | 3D models: pig, trees, bushes, food, squirrel, butterflies, nest house, gate |
| `src/ground.js` | Paints the forest floor texture (grass, path, pond, flowers, hay) |
| `src/style.js` | Art-style presets: material type, light, fur fluffiness, extra grass |
| `src/world.js` | Forest layout and the hedge maze (both seeded, so they are the same every time), collision |
| `src/art.js` | 2D drawing: HUD food pictures, stars, bubbles, hand; ground decorations |
| `src/audio.js` | All sounds and the music loop |
| `src/fx.js` | Particles (stars, puffs, hearts, notes), positioned in 3D, drawn on the overlay |
| `src/puzzle.js` | Popup puzzles (what comes next?, pairs): own canvas on top of everything |
| `src/input.js` | Touch / mouse / keyboard |
| `src/gamepad.js` | Game controller |
| `src/debug.js` | Autopilot for smoke tests (only loaded with `?bot`) |
| `vendor/three.module.min.js` | Three.js (MIT licence, see `vendor/three.LICENSE`) |
| `tools/serve.py` | Static file server |

## Test helpers

- `?style=soft|toon|story|real` – art-style presets (`src/style.js`); gallery with screenshots at `/styles.html`. Default is `real` (Natural with smooth trees), chosen by the tester.
- `?auto` – skip the title screen and the trail (starts "just play").
- `?level=1` … `?level=10` – start straight in that level. `?unlock` – all level stones open.
- `?bot` – the pig plays by itself (sniffs, follows the smell, wheeks at the squirrel). Used for automated playthroughs.
- `window.__G` – the whole game state, in the browser console. `window.__puzzle()` – where a right (and a wrong) touch would be in the open popup puzzle.
- Stars are stored in `localStorage` under `darling.stars`, finished levels under `darling.level`. To reset: `localStorage.clear()`.

## Keyboard

Arrows / WASD move · Space jump (wheek in level 1, where there is no jumping yet) · Q, Z or C wheek · X, E or Enter sniff.

## Game controller

`src/gamepad.js`, read once a frame. Made for an Xbox pad in Edge; any pad with the standard layout works.

| Control | In play | Elsewhere |
|---|---|---|
| Left stick / D-pad | Walk (a full push runs, and kept up becomes zoomies) | Moves the ring over the stones, and over the choices or cards of a popup puzzle |
| A | Jump (wheek in levels without jumping, like Space) | Play / pick / next level |
| X | Wheek | |
| Y | Sniff | |
| B | | Puts a puzzle away; on the star panel, back to the stones |
| Menu (☰) | Back to the stones | Starts the game on the title screen |

While an Xbox pad is in use the on-screen buttons wear its letters (`body.pad.xbox`); a touch or a mouse click hides them again. Other pads work the same but show no letters, since theirs differ. The page asks Edge on Xbox for the real pad instead of its stick-driven mouse pointer (`navigator.gamepadInputEmulation`).
