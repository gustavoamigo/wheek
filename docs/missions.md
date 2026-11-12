# Missions

Every mission follows the same child-friendly shape:

1. **See** – a picture shows what is wanted (no words).
2. **Seek** – wander; sniff if unsure.
3. **Do** – one guinea-pig behaviour solves it (munch, wheek, climb, zoom).
4. **Yay** – popcorn, sparkles, a star.

There is no failing. A mission simply stays open until it is done, and the world keeps being fun to roam meanwhile.

Status: ✅ built · 🔜 next · 💭 idea

---

## The ladder of levels

Decided with the tester in iteration 6: levels in the same forest, each adding **one** new idea; jumping first, numbers second. Picked from a trail of stones after the title screen. Finishing a level opens the next one.

| Level | New idea | What Darling does | Status |
|---|---|---|---|
| 🐾 | Just play | Endless: breakfast (five foods) → a drink at the pond → breakfast in new places… | ✅ |
| 1 | Three things | Eat a carrot, drink at the pond, wheek at the squirrel for an apple. No jump button yet. | ✅ |
| 2 | Jump | Hop onto the fallen log (dandelion), then from the log onto the stump (strawberry). The stump is too high from the ground. | ✅ |
| 3 | Jumps in a row | Over three stepping stones (a carrot on the middle one) to the big lily pad (lettuce). Miss = splash. | ✅ |
| 4 | Counting | Four plates with 2, 3, 4 and 5 strawberries. A thought bubble shows "3 🍓" with three dots: find the plate with three. Then five, then four. He eats them one by one, and each one counts out loud ("1, 2, 3" pop up with rising notes). | ✅ |
| 5 | Number order | Five stones numbered 1–5 zig-zag across the pond, so there is always a choice of two or three. Hop them in order, then onto the big lily pad for the lettuce. A stone that is not next wobbles and bounces him back to where he was. | ✅ |
| 6 | The gardener's puzzle | The gardener by the town gate shows the squeak bubble. A wheek opens a **popup puzzle**: *what comes next?* – a row of foods in a rhythm (🥬🍓🥬🍓🥬 ❓), three to choose from. Three rounds: AB, then AAB or ABB, then ABC. Solved → the gate swings open and she throws a carrot. | ✅ |
| 7 | Adding (plates) | Like level 4, but the thought bubble shows a sum – "2 + 1" with two groups of dots. Find the plate with that many altogether. Sums: 2+1, 2+3, 3+3; plates of 3, 4, 5, 6. The bubble stays; the bar at the top is only three small pips. | ✅ |
| 8 | Adding (stones) | The numbered stones of level 5 again, but now a thought bubble shows a sum – "1 + 1" – and he must hop onto the stone with the **answer** (2, then 2+2 → 4, then 2+3 → 5), then the lily pad for a strawberry. Any other stone wobbles and bounces him back. The answer stone is not highlighted. | ✅ |
| 9 | The squirrel's puzzle | Wheek at the squirrel and a game of **pairs** opens: 6 cards (3 pairs), then 12 cards (6 pairs). Solved → he drops the apple. | ✅ |
| 10 | The hedge maze | A place of its own: a 5 × 5 hedge maze seen from high up. A carrot waits down a blind alley, the lettuce in the far corner. Touching a treat does not walk him there – the hedges stop him, so the way has to be found. Sniffing shows only the next three steps of the way. | ✅ |

The pond levels (3, 5, 8) have their own camera: closer, a little from above, and held on the pond instead of on the pig, so the stones and their numbers are big (`POND_CAM` in `src/main.js`).

How the number levels stay "no failing":
- **Wrong plate (4):** he shakes his head, the plate wobbles and shows its own number in grey, nothing is lost. After two wrong plates the right one shines brighter and sniffing leads to it. Sniffing always brings the thought bubble back.
- **Wrong stone (5):** a wobble, an "uh-uh" sound and a hop back. Touching a stone jumps to it; with keys, steer and press jump. The jump button alone does *not* pick the stone here – choosing is the game.
- **Popup puzzles (6, 9):** a wrong choice wobbles with the "uh-uh" sound; after two wrong choices the right one glows. Cards that do not match turn back by themselves. The ✕ puts the puzzle away and keeps the round reached; a wheek brings it back.

Later number ideas: numbers up to 10, taking away ("5 − 2" as he eats), doubles, "which pile has more?", sharing carrots equally between two friends, first letters.

Tuning values (in `src/main.js`): `LEVELS` (start place and goals of each level), `JUMP_V` and `GRAV` (jump height ≈ 52, so the log at 36 is reachable from the ground and the stump at 66 only from the log), `JUMP_REACH` (how far an aimed jump may go), target choice in `jumpToGoal` / `jumpToward`, landing margin 46 in `updateHeight`. Platform places and sizes are in `src/world.js`.

---

## The pieces the levels are made of

### Breakfast ✅

*Teaches: moving, munching, sniffing, wheeking.* Top bar with five foods: carrot, strawberry, dandelion, lettuce, apple. A tapping hand points at the first carrot. The apple is held by a **squirrel** in the apple tree: near the tree the squirrel shows a squeak bubble and the pink button bounces → *wheek* → the squirrel drops the apple. Celebration: confetti, fanfare, popcorns, a big star.

Tuning: first-round food positions `FIRST_SPOTS`, eat radius 66, squirrel hearing radius 480, sniff-hint delay 14 s.

### A drink at the pond ✅

*Teaches: finding a place rather than a food.* A big water drop floats in a beam of light at the pond's near shore. Darling lowers his head and laps: lapping sounds, ripples, little splashes. Reeds stand round the far side only, so the spot is never hidden.

### Jumping ✅

See "Jump" in [game-design.md](game-design.md). A treat that is up high can only be eaten when he is standing at that height.

---

## Popup puzzles ✅ (two kinds so far)

A big card over the forest, opened by wheeking at a friend who shows the squeak bubble. No words, no timer, no failing; a star per round at the top of the card. Code: `src/puzzle.js` (`PATTERNS`, `PATTERN_ROUNDS`, `MEMORY_ROUNDS`).

| Puzzle | What the child does | Status |
|---|---|---|
| What comes next? | Pick the food that continues the row | ✅ |
| Pairs | Turn cards over to find two the same | ✅ |
| Jigsaw | Drag 4 → 6 → 9 pieces into a picture of Darling | 🔜 |
| Fill the basket | "Make 7": drag strawberries in until the number is right; later up to 10 and taking away | 🔜 |
| Which has more? | Tap the bigger pile; later close numbers and sums | 🔜 |

## The hedge maze ✅ (first one)

Built as level 10 (`buildMaze` in `src/world.js`: seed, cells per side, cell size). Still to come: a bigger one (7 × 7), and number gates – a hedge door shows "3 + 2" and the two ways on are marked 5 and 6.

## Next: a different place for every level 🔜

Levels 1–9 still share the forest. Done: the pond close-up (a camera, see above) and the hedge maze (a real separate place). Planned: the gardener's vegetable garden (plates, counting, sums among the rows) and the town square behind the gate. A different time of day or season (sunset, autumn, rain) makes a place that is visited again feel new.

## Later: through the gate (the town) 🔜

Level 6 ends with the gate open. The town behind it does not exist yet.

## Later: market treats 🔜

*Teaches: popcorning as a "gesture", humans react to different behaviours.*

| | |
|---|---|
| **Goal picture** | Three humans' faces, each with an empty treat slot |
| **Where** | Town square |
| **Steps** | Three friendly humans (greengrocer, child on a bench, baker). Each needs to *notice* you: wheek near them. Each then holds out a treat – but the baker's is up on a window sill → jump up the crates. |

## M5 – Zoomies delivery 💭

A child drops their flower/hat; it blows along the street. Zoom after it (it always waits for you), bring it back by walking into the child. No timer.

## M6 – Picnic friends 💭

Find three forest friends (squirrel, hedgehog, duck) by sniffing, wheek to invite each one; they follow you back to a picnic blanket. Ends with everyone munching together.
