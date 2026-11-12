# Wheek! Darling's Great Adventures

A cosy 3D browser game for children aged 5 to 8. The player is Darling, a black-and-white guinea pig (a **he**, modelled on a real pig; his look is settled, do not restyle him).

Live: https://gustavoamigo.github.io/wheek/ (GitHub Pages serves `main` directly).

## How we work

The game is built in small iterations with the owner as beta tester.

1. **Talk first for anything new.** New mechanics, levels or a change of direction are discussed before code: propose options with a recommendation, ask the few questions that change the design, and wait for the answers. Small fixes and tuning from feedback go straight to code.
2. **Build one playable slice.** Each iteration ends in something that can be played from the title screen, not a half-wired feature.
3. **Check it by script before handing over** (see Testing). Say plainly what was checked and what was not: scripts cannot judge feel, sound, real-device frame rate or whether a child understands.
4. **Hand over a build and a test focus.** Give the local address, then a short numbered list of what to try and what to watch for. Then stop and wait for feedback.
5. **Write it down.** Every iteration gets an entry in `docs/iterations.md`: what was built, what was checked, the test focus, the feedback in the tester's words, and the decisions taken. Keep the other docs in step with the code in the same change.
6. **Commit and publish only when asked.** Publishing is a push to `main`. Bump the cache name in `sw.js` when shipped files change, so installed copies update.

Feedback is usually short ("level 8 is silly"). Work out the reason behind it, fix that, and record the lesson, rather than asking for a specification.

## Design rules

These came from the tester and from play; do not break them without asking.

- **No failing.** Nothing is lost, no timers, no game over. A mistake is a funny moment (falling in the pond is fun: splash, shake, carry on).
- **Pictures, not words.** Guidance is a pointing hand, picture bubbles, the HUD and sounds. Numbers and single letters are fine; sentences are not.
- **The camera never turns** and the player never controls it. Up on the screen always means "away".
- **Controls must work with one finger, a mouse and keys.** If an action needs precision, snap to the likely target (jumps aim at the next treat or the tapped platform).
- **One new idea per level**, and the ladder must rise evenly. If a later level tests easier than an earlier one, fix the earlier one.
- **Number levels need a real choice** (which pile, which stone). Repeating an action N times with nothing to choose reads as silly.
- **When something must be done several times, show each one** (one picture per wheek), so the child sees progress.
- **Free roaming always stays** as the "just play" stone.

## Code

- Three.js r170, vendored in `vendor/`. Plain ES modules, **no build step, no asset files**: models are assembled in code, the ground is painted into a texture, sound is synthesised.
- Game logic lives on a flat map (`x` east, `y` south) plus the pig's height `z`; `src/scene.js` turns it into 3D. A 2D overlay canvas carries the HUD, bubbles and hints.
- File map, camera rules, URL parameters and keys are in `docs/tech.md`. Levels are the `LEVELS` array in `src/main.js`; the ladder is described in `docs/missions.md`.

Run locally:

```
python3 tools/serve.py 8765     # http://localhost:8765/
```

## Testing

- Drive the game with headless Chromium (Python Playwright). Keep the scripts in the scratch directory, not in the repo.
- Use `?style=toon` in tests: software rendering is too slow for the default style.
- Jump straight to what you are testing with `?level=N`, `?unlock`, `?auto`, `?bot`; read state from `window.__G` and act through `window.__G.api`.
- Wait on conditions (a state value), never on fixed sleeps. Run one browser job at a time.
- A change is checked when every affected level can be played to its star with no console errors, and free play still works.
- After publishing, load the live page once and confirm the new code is there.

## Docs

| File | Holds |
|---|---|
| `docs/game-design.md` | The spec: pig, world, behaviours, controls |
| `docs/missions.md` | Level ladder and missions |
| `docs/story.md` | Story |
| `docs/iterations.md` | Iteration log, test focus, feedback, decisions |
| `docs/tech.md` | Tech choices, files, test helpers |
