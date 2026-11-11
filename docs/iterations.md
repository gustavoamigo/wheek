# Iteration log

Each iteration: what was built → what to test → feedback received → what that changes.

---

## Iteration 5 – realistic Darling, chosen look (2026-11-11)

**Built**
- Default look = Natural, with the smooth untextured trees and bushes of Cartoon. The other styles stay available with `?style=` for comparison.
- Darling rebuilt again: one continuous body (no separate head ball), guinea-pig proportions, blunt muzzle, petal ears, bigger eyes, paws with toes, fluffy fur in layers, markings redrawn from the second photo. Nodding bends the body itself, so there is no joint at the neck.

**Please test**
1. **Darling** – realistic enough now? Compare `styles/darling.png` (four angles) with the real one: shape, face, ears, markings.
2. **Look** – is Natural + smooth trees right? Anything else that still looks raw?
3. **Performance** – still smooth? (Fluffy fur and extra grass are the heaviest parts.)

**Feedback**

_(to be filled in)_

---

## Iteration 4 – realistic Darling, natural look with more detail, drink mission (2026-11-11)

**Built**
- Glow layer removed (fireflies, glowing mushrooms, crystals, sparkle trails, halos); original green forest colours restored.
- More texture and detail: leafy tree tops and bushes, bark, speckled stone, soft top-to-bottom shading on every shape, grass blades and clover on the ground, 3D flowers, pebbles, reeds and lily pads at the pond, pond ripples.
- Darling rebuilt as a realistic guinea pig: one smooth body, blunt head, drooping ears, whiskers, painted fur with his real markings (no body stripes).
- Mission M2 "A drink at the pond" – runs after each breakfast.
- Four art styles to choose from (tester's suggestion): A Soft toy, B Cartoon, C Storybook, D Natural – gallery at `/styles.html`, each playable with `?style=`.

**Checked automatically**: breakfast → star → drink → star → next round, played by the autopilot; no script errors. **Not checked**: real devices, sounds by ear.

**Please test**
0. **Pick a style** from `/styles.html` (or mix: e.g. fur from one, light from another).
1. **Darling** – does he look like himself now? Shape, face, markings, ears.
2. **Texture level** – enough detail, or still too raw / now too busy? Which things most need more work?
3. **Drink mission** – is it clear that the water drop means "go to the pond"? Is the drinking nice to watch and hear?
4. **Performance** – still smooth with the extra detail?

**Feedback**

- "Darling is not realistic yet."
- Likes the **Natural** look and the **Cartoon** look; does **not** like the tree texture in Natural.

**Decisions** → iteration 5.

---

## Iteration 3 – Darling's real look, fairy-tale glow, game title (2026-11-11)

**Feedback that triggered it**: a photo of the real Darling ("here's how it should look"), *"make it a more fantasy, glowy kind, more effects"*, and the name: *"Wheek! Darling's Great Adventures" on the title screen with a happy wheek sound when it appears.*

**Built**
- Pig repainted black and white after the photo (black eye/ear patches, white blaze, pink nose, black saddle and rump).
- Fairy-tale forest: teal / pink / lilac trees, lavender haze, pink path, fireflies, glowing mushrooms, crystals by the rocks, lit flowers, shining pond, gate lanterns.
- Effects: pig's pool of light, magic-dust trail (rainbow stars in zoomies), halos on stars / hearts / notes / wheek rings, glowing scent trail.
- Title screen with the game's name and a wheek.

**Checked automatically**: full mission by autopilot, no script errors, desktop and phone layouts. **Not checked**: real-device frame rate with the extra effects, the title wheek by ear.

**Please test**
1. **Darling** – close enough to the real one? What should change (patches, face, size)?
2. **Glow level** – magical enough, or too much / too busy? Can the food still be spotted easily?
3. **Title** – look of the name; does the wheek play when it appears on your device, or only on first touch?
4. **Performance** – still smooth with fireflies and trails?
5. Everything still open from iteration 2 (camera, movement feel, first 30 seconds with a child).

**Feedback**

- Sparkles don't look good; the previous colours were better. The 3D is "too raw" – add a little texture / detail.
- New mission idea: drink water at the pond.
- The pig doesn't look like the real one: the body "looks like a bee in black and white". Darling is a **he**. Aim for a more realistic guinea pig (second photo, showing the whole body).
- Performance is smooth. Not tested with a child yet – **refine the graphics first**.

**Decisions** → iteration 4.

---

## Iteration 2 – "Breakfast in the forest", now in 3D (2026-11-11)

**Feedback that triggered it** (tester, after seeing iteration 1): *"This needs to be a 3D game, not 2D. Third-person camera that follows the guinea pig and that kids can't get lost with. Keep everything else the same. Use a browser 3D engine. Keep the slice small: movement and one mission first."*

**Built**
- Rendering rebuilt in 3D with Three.js: 3D pig, trees, bushes, rocks, mushrooms, food, squirrel, butterflies, nest house, gate; sunlight and soft shadows.
- Third-person follow camera with no controls and a fixed direction (see tech.md, "Camera").
- Trees that would block the view fade or shrink away.
- Food stands in a beam of light so it can be spotted through the forest.
- Unchanged: mission M1, all guinea-pig behaviours, controls, sounds, wordless hints.

**Not yet**: climbing, the town, humans.

**Checked automatically**: full mission played through by the autopilot in the 3D build; tap, click and keyboard movement; sniff; squirrel apple drop; desktop and phone-portrait layouts; no script errors.
**Not checked**: frame rate on real devices (the test machine renders in software), how it sounds, and how it feels in a child's hands.

**Please test**
1. **Camera** – does it feel 3D enough? Too high / too low / too far? Does the pig ever get hidden or lost? Is the fixed direction right, or did you expect it to swing behind the pig?
2. **Movement feel** – hold-to-follow, speed, zoomies (kick in after ~1 s of running).
3. **Performance** – is it smooth on the device(s) your kids will use? Which devices?
4. **First 30 seconds without help** – does a child follow the tapping hand to the first carrot?
5. **Sniff** – is the star trail + picture bubble understood as "go this way"?
6. **Squirrel** – is the squeak bubble → pink button link understood?
7. **Look and sound** – the pig model, trees fading/shrinking, light beams, wheek, munching, music.

**Open questions**
- Next step: climbing (M2) and the town gate with the first human (M3), or more polish on the forest first?
- Munching is automatic. Would a child prefer to *press* something to munch?
- Want a spoken voice / narrator at some point, or keep it purely sounds?

**Feedback**

- Pig should look like the real Darling (photo); more fantasy and glow; game title given. → iteration 3.

---

## Iteration 1 – "Breakfast in the forest", 2D prototype (2026-11-11)

**Built**
- Forest area with nest, path, pond, apple tree, closed town gate.
- Guinea pig: walk (touch / mouse / keys), automatic zoomies, automatic munching, popcorn (auto + tap the pig).
- Sniff button (scent trail + pointer bubble) and wheek button (squirrel drops an apple, butterflies scatter).
- Mission M1: eat five foods → celebration → star → new round with food in new places.
- Wordless guidance: tapping hand, picture goal bar, bouncing buttons, squirrel's squeak bubble.
- Synthesised sounds and a quiet music loop; mute button.

**Not yet**: climbing, the town, humans.

**Checked automatically**: full mission playthrough by autopilot, tap, click-hold, keyboard, phone-portrait and desktop layouts, no script errors. *Not* checked: how it sounds, and how it feels in a child's hands.

**Please test**
1. **Movement feel** – is hold-to-follow natural? Speed right? Do zoomies kick in too early / late / are they fun?
2. **First 30 seconds without help** – does a child understand the tapping hand and find the first carrot?
3. **Sniff** – is the star trail + bubble understood as "go this way"?
4. **Squirrel** – is the squeak bubble → pink button link understood?
5. **Sounds** – wheek, munch, music: charming or annoying? Volume balance?
6. **Look** – the pig, the forest density (too many trees hiding things?), sizes on your device.
7. **Devices** – which device(s) did you use? Any lag, any touch problems?

**Open questions**
- Is "Darling" the pig's name, or should it be something else / chosen by the child?
- After the first star: is "same five foods in new places" enough of a loop for now, or should the next iteration go straight to climbing (M2) and the town gate (M3)?
- Munching is automatic. Would a child prefer to *press* something to munch?
- Want a spoken voice / narrator at some point, or keep it purely sounds?

**Feedback**

- "I was hoping this would be a 3D game." → rebuild in 3D (see iteration 2).

**Decisions for iteration 2**

- Replace the 2D renderer with a 3D one; keep mission, behaviours, controls and sounds.
