# Iteration log

Each iteration: what was built → what to test → feedback received → what that changes.

---

## Iteration 8 – popup puzzles, a closer pond (2026-11-12)

**Feedback that triggered it** (tester's 6-year-old in mind)
- "Level 6 is really dummy. We can remove it."
- "Level 7, the banner is too big and I think the 5 strawberries is behind a tree."
- "It needs more challenges for a 6-year-old. Maybe when the gardener is activated, a puzzle opens up."
- "On the levels focused on the pond, it needs to zoom in more."
- "I would add popup puzzles and a labyrinth as well. The scenery is shared among the levels, that's really boring."

**Built**
- Level 6 (count your wheeks) is gone. In its place: wheek at the gardener and a popup puzzle opens – *what comes next?*, three rounds. Solved → gate open, a carrot.
- New level 9: the squirrel's puzzle – pairs, 6 cards and then 12. Solved → he drops the apple.
- Level 7 and 8: the top bar no longer repeats the three sums; it is three small pips (a star for each one done). The thought bubble is smaller and, in the adding levels, stays up.
- No tree, bush or rock may stand between a plate of strawberries and the camera (same rule as for the nest and the log).
- Pond levels 3, 5 and 8: the camera comes closer, looks a little from above and stays on the pond. On an upright phone it is narrower still and follows the pig.
- New level 10: the hedge maze, the first place that is not the forest. Seen from high up; a carrot down a blind alley and the lettuce in the far corner; sniffing shows only the next three steps.
- Saved progress keeps working: the new puzzle level sits in the old level 6's place, levels 9 and 10 are added at the end.

- Level finished (from feedback on the test build, see below): no more five-second wait. As soon as the fanfare has begun (1.7 s) a big star comes up over the dancing pig, with a green **next level** button (showing its number) and a small one back to the stones. It waits as long as the child likes; Space or Enter also go on. After the last level only the stones button is there.

**Checked automatically**: levels 6, 9 and 10 played to the star by script (real taps in the puzzles, wrong picks, closing and reopening; in the maze a walk straight at the treat is stopped by the hedges, then the real way is walked); every level and free play start and end with no script errors; screenshots in landscape, 4:3 and upright phone. **Not checked**: real fingers, sound, frame rate on a real device, whether a child understands.

**Feedback on the test build**
- "When you complete a level, it takes like 5 seconds to go back to the screen for the next level. Maybe you could show a panel with congrats or something exciting, and a button to play next level." → the big star panel above. Lesson: a celebration must not be a wait; hand the child the next thing to press at once.

**Not built yet** (planned, see [missions.md](missions.md)): the gardener's garden and the town as places, a bigger maze with number gates, three more puzzle kinds, numbers up to 10.

**Please test**
1. **Level 6** – is the squeak bubble at the gardener enough to make a child wheek at her? Is the pattern puzzle the right difficulty; is the third round (three foods) too easy?
2. **Level 9** – 12 cards: fun or too long?
3. **Pond levels** – is the pond big enough now on your device? Anything cut off?
4. **Level 7** – all four plates easy to see?
5. **Level 10** – is steering through the maze comfortable with a finger held down? Too easy, too hard? Is the sniff trail (three steps) the right amount of help?

---

## Iteration 7 – number levels (2026-11-11)

**Feedback that triggered it**: levels 1–3 with the snapping jump – *"you can move to the next levels, it's good."*

**Built**
- Level 4 – find the plate with that many strawberries (3, then 5, then 4).
- Level 5 – hop the numbered stones 1 to 5 in order, then the lily pad.
- Level 6 – wheek as many times as the gardener's number (2, 4, 3); the gate opens at the end.
- The gardener, the first human, now always stands near the gate (she waves if wheeked at in other levels). The gate has a door.
- Touching a stone / the log / the stump in reach now jumps onto it.
- Changed from the plan: level 4 is "pick the plate with three" rather than "eat exactly three of many", because picking needs real counting and cannot be done by accident.

**Checked automatically**: levels 4, 5 and 6 played to the end by script, including wrong plates (head shake, hint after two), wrong stones (bounce back), too many and too few wheeks; no script errors. **Not checked**: touching stones with a real finger or mouse, sounds, whether the pictures are understood without explanation.

**Please test**
1. **Level 4** – does a child understand the thought bubble ("3" + strawberry + dots) without help? Is the head shake at a wrong plate clear and kind?
2. **Level 5** – touching the stones: easy with mouse and finger? Is bouncing back from a wrong stone understood?
3. **Level 6** – is the gardener's bubble understood? Is the pause before she counts (about two seconds) too long or too short?
4. **The gardener** – does she look friendly?
5. **Difficulty** of 4–6 for the 5-year-old and for the 7–8-year-old; which numbers should come next (up to 10? adding?).

**Feedback**

- "The numbers could have sum plays as well." → levels 7 (adding, plates) and 8 (adding, wheeks).
- Level 6: "kind of hard to get that you need to call the gardener multiple times." → her bubble now shows one squeak picture per wheek wanted, lighting up one by one; a hand taps at the wheek button and the button keeps bouncing until the number is reached; stopping early is no longer judged (the old two-second pause is gone).

- "Level 8 is silly." (It was the gardener asking for "2 + 1" wheeks – but her bubble already showed one picture per wheek, so there was nothing to add up: just press until the pictures are lit.) → replaced by sums on the stepping stones, where the answer has to be chosen. Lesson: a number level needs a **choice**; filling up a row of pictures is not adding.

**Please test next**: is level 6 clear now? Are the sums (7, 8) readable – numbers, plus sign, two groups of dots? Next number ideas: sums up to 10, taking away, numbered stones that are answers to sums.

---

## Iteration 6 – levels and jumping (2026-11-11)

**Feedback that triggered it**: *"The gameplay is good. Darling could try some challenges? We can have levels, the first is very easy, it just needs to do 3 things. The next one could be a little harder, maybe he needs to jump somewhere to get his treat. Or maybe play with numbers? 5 to 6 years old are capable of doing more things."*

**Decided together before building**
- Jump: a **button**, not automatic. Numbers **and letters** are acceptable. Falling in the pond is fine – "getting wet is fun". Free roaming stays as a "just play" stone. Players are **5 to 7–8**.
- Ladder of six levels (see missions.md); levels 1–3 (structure + jumping) first, the number levels 4–6 next.

**Built**
- Trail of level stones after the title screen; progress is saved; a small button in play goes back to the trail.
- Level 1 (three things), level 2 (log and stump), level 3 (stepping stones to the big lily pad); "just play" is the old endless game, now with jumping too.
- Green jump button (Space). Jumps are aimed at whatever is roughly ahead; splash, hop back and shake dry when he lands in the water.
- New in the forest: fallen log, tree stump, three stepping stones, a big lily pad. Three trees that stood in front of them were removed.
- Keyboard: Space is now jump (it still wheeks in level 1); wheek moved to Q, Z or C.
- Also published since iteration 5: https://gustavoamigo.github.io/wheek/ (this iteration is not published yet).

**Checked automatically**: levels 1, 2 and 3 played to the end by script; the stump cannot be reached from the ground; walking off the log; a splash and the hop back to the stone; free play through breakfast and drink; desktop and phone layouts; no script errors. **Not checked**: how jumping feels with real fingers, sounds by ear, frame rate on real devices.

**Please test**
1. **Jump feel** – height, distance, speed. Is the automatic aiming helpful, or does it take the challenge away for the older child?
2. **Level 2** – does a child work out "log first, then stump" alone? Does the bouncing green button help?
3. **Level 3** – stones: too easy / too hard? Is the splash funny? Is going back to the last stone right, or should he go back to the shore?
4. **Trail of stones** – is it clear which stone to press, and what the paw is?
5. **Difficulty step** from level 1 → 2 → 3 for a 5-year-old and for a 7–8-year-old.
6. Whether to go on to the number levels (4–6) as planned.

**Feedback**

- Tree fade "not 100% consistent: sometimes, when something happens, the fade disappears and the tree appears again". → fade now tests the real line of sight from the camera, with hysteresis; trees near the camera no longer pop back when he stops.
- Jumping with the mouse (and probably touch) is "a little hard"; keys are easier. "Maybe the jump needs to snap to the target more." Level 2 felt harder than level 3.
  → Cause: aiming used the way he happened to face, and on the log a click sent him off the side. Now the button alone snaps to the next useful thing (log → along the log → stump; stone → stone → lily pad), he cannot walk off the log or stump, and pointing while up on something aims at its top.
  → Open: this makes levels 2–3 very easy for a 7–8-year-old; later levels must carry the challenge.

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

- Darling: "it's much better, leave it like this."
- Asked for a full-screen button and install-as-app (built), and for the game to be published on GitHub Pages (done).
- "The gameplay is good." → wants challenges and levels → iteration 6.

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
