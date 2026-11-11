# Missions

Every mission follows the same child-friendly shape:

1. **See** – a picture shows what is wanted (no words).
2. **Seek** – wander; sniff if unsure.
3. **Do** – one guinea-pig behaviour solves it (munch, wheek, climb, zoom).
4. **Yay** – popcorn, sparkles, a star.

There is no failing. A mission simply stays open until it is done, and the world keeps being fun to roam meanwhile.

Status: ✅ built · 🔜 next · 💭 idea

---

## M1 – Breakfast in the forest ✅

*Teaches: moving, munching, sniffing, wheeking.*

| | |
|---|---|
| **Goal picture** | Top bar with five foods: carrot, strawberry, dandelion, lettuce, apple |
| **Where** | Forest |
| **Steps** | 1. A tapping hand points at a carrot right next to the nest → walk there → *munch*.<br>2. Strawberry and dandelion are in sight of the nest → easy wins.<br>3. Lettuce is further along the path → wander or *sniff*.<br>4. The apple is held by a **squirrel** up in the apple tree. Near the tree the squirrel shows a squeak bubble and the pink button bounces → *wheek* → the squirrel waves and drops the apple → munch. |
| **Celebration** | Confetti, fanfare, four popcorns, a big star flies to the star row |
| **After** | Darling is thirsty → M2. After the drink, new food appears in new, further-away places (same five foods, same squirrel). Replayable forever; each mission = one more star. |

Tuning values (in `src/main.js`): first-round food positions `FIRST_SPOTS`, eat radius 62, squirrel hearing radius 460, sniff-hint delay 14 s.

---

## M2 – A drink at the pond ✅

*Teaches: finding a place rather than a food; the pond as a landmark.*

| | |
|---|---|
| **Goal picture** | The top bar shows a single **water drop** |
| **Where** | The pond, on the shore nearest the camera |
| **Steps** | After breakfast the food bar is replaced by a water drop, and a big drop floats in a beam of light at the pond's edge. Walk there (or *sniff* – the trail and bubble point to the pond). Darling lowers his head and laps: lapping sounds, ripples, little splashes. |
| **Celebration** | Same as M1: confetti, fanfare, popcorns, a star |
| **After** | A new breakfast round (M1) starts. |

Reeds stand round the far side of the pond only, so the drinking spot is never hidden.

---

## M3 – The high-up treat (climbing) 🔜

*Teaches: climbing = just walking up things.*

| | |
|---|---|
| **Goal picture** | A blueberry bunch on top of a big fallen log / tree stump, glowing |
| **Where** | Forest, near the pond |
| **Steps** | A mossy ramp (fallen branch) leads up onto the log. Walk up it – the pig's little legs scrabble, camera rises a bit. Walk along the log to the treat. Walking off the edge just hops gently down. |
| **Twist** | From the top you can *see the town* over the trees – a teaser. |

## M4 – Open the gate (first human) 🔜

*Teaches: wheeking at humans.*

| | |
|---|---|
| **Goal picture** | The town gate with a squeak bubble |
| **Where** | East end of the forest path |
| **Steps** | A gardener is working behind the gate, back turned. Wheek → she turns, smiles, crouches down, opens the gate, and gives a parsley sprig. The town is now open. |

## M5 – Market treats 🔜

*Teaches: popcorning as a "gesture", humans react to different behaviours.*

| | |
|---|---|
| **Goal picture** | Three humans' faces, each with an empty treat slot |
| **Where** | Town square |
| **Steps** | Three friendly humans (greengrocer, child on a bench, baker). Each needs to *notice* you: wheek near them. Each then holds out a treat – but the baker's is up on a window sill → climb the crates (uses M2 skill). |

## M5 – Zoomies delivery 💭

A child drops their flower/hat; it blows along the street. Zoom after it (it always waits for you), bring it back by walking into the child. No timer.

## M6 – Picnic friends 💭

Find three forest friends (squirrel, hedgehog, duck) by sniffing, wheek to invite each one; they follow you back to a picnic blanket. Ends with everyone munching together.

---

## Mission order in the vertical slice

`M1 (forest food)` → `M2 (climb)` → `M3 (gate / first human)` → `M4 (market)`; M5/M6 only if testing shows appetite for more.
