# Wheek! Darling's Great Adventures – Game Design Spec

*Darling is the guinea pig – a black-and-white boy, modelled on the tester's real pig.*

Status: **living document**. Sections marked ✅ are in the current build, 🔜 are planned, 💭 are ideas to decide on.

## 1. One-line pitch

You are a small, round, happy guinea pig. Wander a sunny forest and a friendly little town,
sniff out yummy food, climb to cosy places, and squeak at big friendly humans until they give you treats.

## 2. Who it is for

Children aged **5–8**, playing alone or with a parent next to them, on a tablet, phone or computer.

Design pillars – every feature is checked against these:

| Pillar | What it means in practice |
|---|---|
| **A 5-year-old can do it** | One finger (or arrow keys) to move. Two big buttons, three once jumping is learnt. Jumps are aimed for the child, so nothing needs precision. |
| **No reading needed** | No sentences to read. Goals, hints and rewards are pictures, sounds and animation. Single **numbers and letters are fine** (tester's decision, iteration 6): level stones carry numerals, and later levels will play with counting. |
| **Challenge, but nothing bad can happen** | Levels get harder one new idea at a time (players are 5 to 7–8). Still no enemies, timers, health or losing: a missed jump is a funny splash and another go. |
| **Being a guinea pig is the fun** | Popcorning, zoomies, wheeking, sniffing and munching are the verbs. They should be delightful even with no mission. |
| **3D, but you can't get lost** | A real 3D world seen from a third-person camera that follows the pig by itself. The camera never turns and has no controls. |
| **Small and polished** | One forest, one town, a handful of missions. Depth comes from charm, not content volume. |

## 3. Guinea pig behaviours = game mechanics

| Behaviour | What the real animal does | In the game | How it is triggered | Status |
|---|---|---|---|---|
| **Walk** | Trundles about | Move around the world | Touch/click/hold where you want to go, or arrow keys / WASD | ✅ |
| **Zoomies** | Sudden bursts of fast running | Run fast with dust puffs and a whoosh | Automatic: keep moving for about a second | ✅ |
| **Munch** | Eats constantly, loudly | Eat a food item with crunchy sounds and wobbling cheeks | Automatic: walk into food | ✅ |
| **Drink** | Laps water | Head down at the pond's edge, lapping sounds and ripples | Automatic: walk to the water drop at the pond | ✅ |
| **Popcorn** | Jumps and twists in the air when happy | The universal "yay!" – after eating, when a mission is done | Automatic on happy moments; also **tap the pig** any time | ✅ |
| **Sniff** | Nose always twitching, finds food by smell | Shows a sparkly scent trail on the ground and a picture bubble pointing to the nearest goal | Yellow **nose button** (keys: X, E or Enter) | ✅ |
| **Wheek** | Loud squeak to demand food/attention | Calls friends. Animals and humans who hear it react: the squirrel drops an apple, the gardener waves – and a friend who shows the squeak bubble opens a popup puzzle (levels 6 and 9) | Pink **squeak button** (keys: Q, Z or C) | ✅ |
| **Jump** | (Game licence – a popcorn that goes somewhere) | Hop onto a log, a stump, stepping stones. The jump **snaps to a target**: with no steering (just the button, by mouse or one finger) it goes to whatever leads towards the next treat, whichever way he faces – and along the log if the stump is still out of reach. While steering (keys, or a finger held down) it goes to whatever is roughly that way, so a deliberate jump into the pond is still possible. A near miss still lands. Too high from the ground means finding a lower step first. Missing over water = **splash**, a hop back to where he stood, and a shake dry (the tester: "getting wet is fun") | Green **jump button** (key: Space). Appears from level 2 | ✅ |
| **Purr / rumble** | Content noise when stroked | Being petted by a human friend | 💭 | 💭 |
| **Hide** | Loves tunnels and hidey houses | Tunnels as shortcuts; hidey house as home/save point | 💭 | 💭 |

### Controls summary

- **Move:** press and hold anywhere → the pig walks toward your finger and keeps following it.
  A single tap also works: the pig walks to that spot. Arrow keys / WASD on keyboard.
- **Buttons**, bottom right, big and round: 👃 sniff (yellow), 🔊 wheek (pink), and from level 2 ⤴ jump (green).
- Top-right small button with three dots: back to the trail of levels.
- **Tap the pig:** popcorn! (a toy, never required)
- **Touch a stone, the log or the stump** that is in reach: he jumps onto it (same as the jump button, but you choose the target).
- Top-right small button: sound on/off (for parents).
- Small **full-screen** button (top-left on the title screen, bottom-left while playing; hidden where the browser has no full screen, e.g. iPhone).
- Small **install** button on the title screen: adds the game to the home screen as an app that opens full screen and works offline. Only shown when the device can install it.

Forgiveness rules:
- The pig slides around trees, rocks and the pond – it can never get stuck or trapped.
- Food is eaten when the pig is merely *near* it (generous radius).
- If a tree would hide the pig or some food, its top turns see-through; trees right in front of the camera shrink out of the way.
- Buttons can be mashed; extra presses are simply ignored.
- He cannot slip off the log, the stump or a stepping stone by walking – only a jump leaves them.
- After a splash he goes back to the last place he stood (the last stone, not the start).

## 4. Guidance without words

| Need | Solution | Status |
|---|---|---|
| "What am I looking for?" | Picture bar at the top: five foods, faded until eaten, then they light up | ✅ |
| "How do I move?" | A tapping hand on the first carrot until the pig first moves | ✅ |
| "Where is it?" | Every food stands in a soft beam of light that can be seen from far away. Sniff → scent trail of stars on the ground + a bubble at the screen edge showing the food and pointing the way. | ✅ |
| "I'm lost / idle" | After ~14 s with no progress the sniff button bounces | ✅ |
| "How do I get up there?" | The jump button bounces whenever a treat is waiting up high and there is something in reach to hop onto | ✅ |
| "Which level?" | Trail of round stones: orange paw = just play, numbered stones = levels. Finished = blue with a star, next = green and bouncing, later ones grey (they only wiggle) | ✅ |
| "What do I do with this friend?" | Friend shows a speech bubble with the *same picture as the wheek button*, and the wheek button bounces | ✅ |
| "How many?" | Numbers always come with that many dots. Thought bubble over Darling (plates and sums), round badges on the numbered stones; the top bar shows the numbers of the level, the current one big and bouncing (for sums: only small pips, the sum is in the bubble) | ✅ |
| "Did I do it right?" | Chime that rises in pitch with each food, popcorn jumps, stars, confetti, fanfare | ✅ |
| Spoken encouragement / narrator | 💭 Optional voice ("Yum!") – needs recording, decide later | 💭 |

## 5. Camera

Third-person, 3D, fully automatic. It sits above and behind the pig, always looking the same way ("north"), and glides along with it. There is nothing to steer: up on the screen always means "further away". See [tech.md](tech.md) for the exact rules.

## 6. World

One continuous outdoor world in two halves, joined by a dirt path and a garden gate.

### 6.1 Forest ✅ (iteration 1)

- **Nest** – hay bed and wooden hidey house with a heart. Start point. 🔜 later: a place to nap / show collected stars.
- **Dirt path** – winds east from the nest to the town gate. A natural guide line.
- **Pond** – lily pads, reeds, ripples. Cannot be walked into (soft edge), but can be jumped into. Darling drinks here. Three **stepping stones** lead from the west shore to a **big lily pad**.
- **Fallen log and tree stump** – south of the nest; the first things to jump onto.
- **Apple tree with the squirrel** – first "ask a friend for help" moment.
- Trees, berry bushes, rocks, mushrooms, tall grass that rustles, flowers, butterflies.
- **Town gate** at the east end, with a door that opens at the end of level 6. The **gardener** (the first human: straw hat, pink dress, apron – big and gentle) stands by the path in front of it.

### 6.2 Town 🔜

Small, safe, car-free village square. Planned landmarks:
- **Market stall** with a greengrocer (treats for wheeking)
- **Garden** with vegetable beds and a ramp of flower pots to climb
- **Bench + picnic** – a child with a snack
- **Stairs / crates** to a sunny window sill or bakery roof
- Humans are huge, gentle, seen from guinea-pig height (mostly legs, hands and smiling faces when they crouch).

## 7. Missions

See [missions.md](missions.md). The game is a ladder of **levels** in the same forest; each level adds exactly one new idea and is a short loop of *find → do a guinea-pig thing → celebrate → star*. "Just play" (endless breakfast and a drink) is always available.

## 8. Rewards

- **Stars**: one per completed mission. Shown top-left, saved in the browser.
- No score, no counters with numbers, no time.
- 💭 Later: stars decorate the nest (flowers, toys, a friend moving in) so progress is visible in the world rather than as a number.

## 9. Look and sound

- **Art (chosen by the tester from four trial styles):** the **"Natural" look** – strong warm sunlight with real shade, lots of little grass blades, 3D flowers, pebbles, reeds and lily pads – combined with the **smooth, untextured trees and bushes of the "Cartoon" look**. The tester disliked the leafy/bark texture on trees. Sunny greens, bright food colours, no dark areas.
- **No glow effects.** A fairy-tale version (fireflies, glowing mushrooms, sparkle trails, pastel trees) was tried in iteration 3 and rejected: sparkles looked bad and the natural colours were better.
- **Pig (Darling, a boy):** must look like a **real guinea pig**, modelled on the tester's own. One continuous body from rump to blunt nose with no neck or separate head, widest at the hips, flat underneath; thin drooping pinkish ears; big dark glossy eyes on the sides of the head; pink nose with a cleft; whiskers; small pale paws with toes. Fluffy fur. Coat: black cheeks round the eyes and ears, a white blaze up the nose, white body, a black stripe along the back (off to his left) into a black rump, a wisp of black on one shoulder. **No bands round the body** (an earlier version "looked like a bee").
- **Title screen:** the name "Wheek!" pops in letter by letter in rainbow colours over "Darling's Great Adventures", with a happy wheek. (Browsers block sound until the first touch or key press, so if the wheek cannot play straight away it plays on the first touch.)
- **Sound:** all synthesised. Wheek = three rising whistles. Crunchy munching. Soft "pop" on popcorn. Bells for rewards. A quiet, slow music-box loop and occasional bird chirps.
- Every action makes a sound and a visual response within a fraction of a second.

## 10. Out of scope (for the vertical slice)

Saving anything beyond stars, multiple pigs / customisation, day-night, inventory, text or dialogue, shops, anything competitive.

## 11. Open questions for the beta tester

Tracked in [iterations.md](iterations.md).
