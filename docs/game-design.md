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
| **A 5-year-old can do it** | One finger (or arrow keys) to move. Two big buttons. Nothing needs timing or precision. |
| **No reading** | No text anywhere in the game (the only words are the game's name on the title screen). Goals, hints and rewards are pictures, sounds and animation. |
| **Nothing bad can happen** | No enemies, timers, health, falling, losing, or "wrong" answers. The worst outcome is "nothing happened yet". |
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
| **Wheek** | Loud squeak to demand food/attention | Calls friends. Animals and humans who hear it react: wave, come over, give a treat, lift you up | Pink **squeak button** (key: Space) | ✅ squirrel · 🔜 humans |
| **Climb** | (Game licence – real pigs are poor climbers!) | Walk up ramps, logs, stairs and crates to reach high spots. Just walking – no jump button, cannot fall | Walk onto a ramp | 🔜 |
| **Purr / rumble** | Content noise when stroked | Being petted by a human friend | 💭 | 💭 |
| **Hide** | Loves tunnels and hidey houses | Tunnels as shortcuts; hidey house as home/save point | 💭 | 💭 |

### Controls summary

- **Move:** press and hold anywhere → the pig walks toward your finger and keeps following it.
  A single tap also works: the pig walks to that spot. Arrow keys / WASD on keyboard.
- **Two buttons**, bottom right, big and round: 👃 sniff (yellow), 🔊 wheek (pink).
- **Tap the pig:** popcorn! (a toy, never required)
- Top-right small button: sound on/off (for parents).
- Small **full-screen** button (top-left on the title screen, bottom-left while playing; hidden where the browser has no full screen, e.g. iPhone).
- Small **install** button on the title screen: adds the game to the home screen as an app that opens full screen and works offline. Only shown when the device can install it.

Forgiveness rules:
- The pig slides around trees, rocks and the pond – it can never get stuck or trapped.
- Food is eaten when the pig is merely *near* it (generous radius).
- If a tree would hide the pig or some food, its top turns see-through; trees right in front of the camera shrink out of the way.
- Buttons can be mashed; extra presses are simply ignored.

## 4. Guidance without words

| Need | Solution | Status |
|---|---|---|
| "What am I looking for?" | Picture bar at the top: five foods, faded until eaten, then they light up | ✅ |
| "How do I move?" | A tapping hand on the first carrot until the pig first moves | ✅ |
| "Where is it?" | Every food stands in a soft beam of light that can be seen from far away. Sniff → scent trail of stars on the ground + a bubble at the screen edge showing the food and pointing the way. | ✅ |
| "I'm lost / idle" | After ~14 s with no progress the sniff button bounces | ✅ |
| "What do I do with this friend?" | Friend shows a speech bubble with the *same picture as the wheek button*, and the wheek button bounces | ✅ |
| "Did I do it right?" | Chime that rises in pitch with each food, popcorn jumps, stars, confetti, fanfare | ✅ |
| Spoken encouragement / narrator | 💭 Optional voice ("Yum!") – needs recording, decide later | 💭 |

## 5. Camera

Third-person, 3D, fully automatic. It sits above and behind the pig, always looking the same way ("north"), and glides along with it. There is nothing to steer: up on the screen always means "further away". See [tech.md](tech.md) for the exact rules.

## 6. World

One continuous outdoor world in two halves, joined by a dirt path and a garden gate.

### 6.1 Forest ✅ (iteration 1)

- **Nest** – hay bed and wooden hidey house with a heart. Start point. 🔜 later: a place to nap / show collected stars.
- **Dirt path** – winds east from the nest to the town gate. A natural guide line.
- **Pond** – lily pads, reeds, ripples. Cannot be walked into (soft edge). Darling drinks here (mission M2).
- **Apple tree with the squirrel** – first "ask a friend for help" moment.
- Trees, berry bushes, rocks, mushrooms, tall grass that rustles, flowers, butterflies.
- **Town gate** at the east end – closed for now.

### 6.2 Town 🔜

Small, safe, car-free village square. Planned landmarks:
- **Market stall** with a greengrocer (treats for wheeking)
- **Garden** with vegetable beds and a ramp of flower pots to climb
- **Bench + picnic** – a child with a snack
- **Stairs / crates** to a sunny window sill or bakery roof
- Humans are huge, gentle, seen from guinea-pig height (mostly legs, hands and smiling faces when they crouch).

## 7. Missions

See [missions.md](missions.md). Each mission is a short loop of *find → do a guinea-pig thing → celebrate → star*.

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
