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
| 6 | Count your wheeks | The gardener by the town gate shows a number in her speech bubble, and under it **one grey squeak picture per wheek she wants**. Each wheek lights one up and she nods. Right → she cheers and throws a treat. Asked: 2, then 4, then 3. After the third the gate swings open. | ✅ |
| 7 | Adding (plates) | Like level 4, but the thought bubble shows a sum – "2 + 1" with two groups of dots. Find the plate with that many altogether. Sums: 2+1, 2+3, 3+3; plates of 3, 4, 5, 6. | ✅ |
| 8 | Adding (stones) | The numbered stones of level 5 again, but now a thought bubble shows a sum – "1 + 1" – and he must hop onto the stone with the **answer** (2, then 2+2 → 4, then 2+3 → 5), then the lily pad for a strawberry. Any other stone wobbles and bounces him back. The answer stone is not highlighted. | ✅ |

How the number levels stay "no failing":
- **Wrong plate (4):** he shakes his head, the plate wobbles and shows its own number in grey, nothing is lost. After two wrong plates the right one shines brighter and sniffing leads to it. Sniffing always brings the thought bubble back.
- **Wrong stone (5):** a wobble, an "uh-uh" sound and a hop back. Touching a stone jumps to it; with keys, steer and press jump. The jump button alone does *not* pick the stone here – choosing is the game.
- **Wrong count (6, 8):** too few is never wrong – she just keeps waiting, the count stays, and the pink button keeps bouncing. A hand taps at the button until the first number is done. Only when the number is reached does she wait a second (in case another wheek comes); one too many → she shakes her head and the pictures go grey again.

Later number ideas for 7–8 year olds: "which pile has more?", sharing carrots equally between two friends, numbers up to 10, first letters.

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
