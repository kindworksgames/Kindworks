# Phase 3 Minigame Logic Parity Recovery

## Verdict

**PARITY CONFIRMED WITH DOCUMENTED APPROVED EXCEPTIONS.**

This verdict is limited to gameplay logic, level/progression data, scoring, rewards, persistence, and connected-world behaviour. It does not claim that unfinished replacement artwork is pixel-identical to the legacy HTML.

The approved exceptions are Phaser-specific presentation/input adapters that preserve the same gameplay outcome: responsive targeting coordinates, Phaser scene lifecycle, touch/keyboard gesture routing, DOM-free/canvas rendering, and deterministic Phaser render grids where the HTML used a browser-specific surface. No unresolved P0, P1, or P2 minigame-logic parity defect remains in this audit.

## Protected baseline

| Item | Value |
| --- | --- |
| Working branch | `phase-2-ui-simplification` |
| Starting commit | `4625fd9f2e539639d303e7ec70b5f3774d1df6ca` |
| Authoritative source | `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html` |
| Protected SHA-256 | `0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5` |
| Production-save mutation during QA | None; the `?qa=fidelity` route uses isolated namespaced storage |

## Before-fix parity matrix

| Activity | HTML owner | Phaser owner | HTML / Phaser levels | Before-fix finding | Risk and required correction |
| --- | --- | --- | ---: | --- | --- |
| Lawn Care | `openLawnCare`, authored Lawn catalogue | `lawnCare.js`, `LawnCareService.js` | 750 / 750 | No rule/data gap found | Preserve authored boards, optimal routes, move limits, weeds, rewards, swipe input, retry and final-level behaviour |
| River Clear-Out | `openRiverGame`, authored River catalogue | `riverClearout.js`, `RiverClearoutService.js` | 750 / 750 | No rule/data gap found | Preserve piece queue, tap rotation, swipe/drop controls, heavy rubbish, hints, undo, stars and one-time rewards |
| Waste Collection | `openWasteGame`, authored Waste catalogue | `wasteCollection.js`, `CleanupJobService.js` | 750 / 750 | No rule/data gap found | Preserve every board, uncovered-card rule, triple matching, five-slot tray, rewards and town occurrence behaviour |
| House Rescue sorting + vacuuming | `openHouseRescue`, `validateHouseRescue` | `houseRescue.js`, `HouseRescueService.js` | 750 / 750 | No rule/data gap found | Preserve rubbish categories, waves, score, reachable dirt, vacuum coverage, house progression and rewards |
| Beach Cleanup | embedded protected Beach payload | `beachCleanup.js`, `BeachCleanupService.js` | 750 / 750 | No rule/data gap found | Preserve deterministic boards, obstacles, rubbish, walk/rake behaviour, complete paths, undo and cap |
| Playground Power Wash | embedded protected Power Wash payload | `playgroundPowerwash.js`, `PlaygroundPowerwashService.js` | 750 / 750 | No shared-rule gap found | Preserve nozzles, soap resistance, 97% threshold, supply behaviour, rewards and completion cleanup |
| Fishing | `openFishing`, catch tables and timed cast rules | `fishing.js`, `FishingService.js` | non-levelled / non-levelled | **Defect:** a full ordinary fish stack could remain selectable, wasting or invalidating a cast; placed-tank ornamental capacity was not applied at selection time | Filter the weighted table before the cast; block only when no valid result remains; retain safe release when no tank is placed |
| Magnet Fishing | `openMagnetFishing`, recovery table and pity rules | `fishing.js`, `FishingService.js` | non-levelled / non-levelled | No gameplay gap found | Preserve five pulls, weighted finds, 12-pull rare pity, 40-pull treasure pity, rewards and river cleanup link |
| Corner Café | `CAFE_*` data and generator | `cafe.js`, `CafeService.js` | 150 / 150 | No rule/data gap found | Preserve catalogue, chapters, generated plans, no-miss success, scores and rewards |
| Little Bakery | `BAKERY_*` data and generator | `bakery.js`, `BakeryService.js` | 150 / 150 | **Defect:** 75 of 150 levels could use shorter patience/timing than the authoritative motion-aware service budget | Restore the exact motion-aware lower bound for duration and patience in the shared generator |
| Morning Mug | `MUG_*` data and generator | `morningMug.js`, `MorningMugService.js` | 150 / 150 | No rule/data gap found | Preserve resumable stations, exact recipes, timing, no-miss success and rewards |
| Riverside Kitchen | `RIVERSIDE_*` data and generator | `riversideKitchen.js`, `RiversideKitchenService.js` | 150 / 150 | No rule/data gap found | Preserve exact-heat stations, recipes, resumable state, no-miss success and rewards |
| South Shore Scoops | `SCOOPS_*` data and generator | `southShoreScoops.js`, `SouthShoreScoopsService.js` | 750 / 750 | No gameplay gap found | Preserve unique plans, part unlocks, two-item trays, 60% rule, rewards and restoration gates |
| Harbour General | `HARBOUR_GENERAL_*` player-owned store rules | `harbourGeneral.js`, `HarbourGeneralService.js` | non-levelled / non-levelled | No gameplay gap found | Preserve all 17 products, prices, stock, demand, restocking, shelf placement, NPC sales and till collection |

Discovered supporting activities were also checked: House Interiors, Village Grocer and Fresh Market. They are not additional numbered campaigns. Their placement, purchasing, inventory and save behaviour is protected by the complete regression suite.

## Authoritative rule specification

### Authored 750-level catalogues

Lawn Care, River Clear-Out and Waste Collection use authored 750-entry catalogues rather than a runtime difficulty formula. Parity therefore means canonical equality of every level record plus independent validation of every board:

- Lawn: sequential IDs 1–750; exact grids, family, weed band, stored optimal route, move limit, mower resistance and reward. A move slides until a hedge, cuts every crossed cell and is undoable within the five-step history. Campaign success is the authored completion target; first-clear rewards are one-time, including 170 coins at Level 750.
- River: sequential IDs 1–750; exact hydrated board, queue, goals, heavy-rubbish mechanics, hint tier and reward. Tap rotates clockwise; lateral/down swipes move; swipe up rotates; a long downward gesture hard-drops. Heavy rubbish weakens before clearing. Failure changes no durable progress; committed result Undo reverses the reward atomically.
- Waste: sequential IDs 1–750; exact card identities, positions/order and five-slot certificate. Only uncovered cards are selectable; three identical cards clear automatically. Every original certified route clears, and a first-clear reward can be granted only once.

### House Rescue

- Levels: 750.
- `index = level - 1`; `progress = index / 749`.
- `itemTier = min(7, floor(index / 94))`.
- `itemCount = 9 + 3 * itemTier`.
- `maxStainStrength = min(5, 1 + floor(index / 150))`.
- `dirtCount = min(270, 180 + 3 * floor(index / 25))`.
- `itemSpacing = round3(48 - 7 * progress)`.
- Sorting scores `+2` correct and `-1` wrong, with nine visible items per wave.
- Vacuum completion requires 95% reachable coverage; base radius is 7.2 and base power is 1 before equipped-vacuum modifiers.
- Stars: 3 for at most one mistake, 2 for at most four, otherwise 1.
- Reward: `min(170, 60 + round(40 * accuracy) + min(70, floor((level-1)/50)*5))`.
- At most five neighbour homes may be dirty; the personal home never becomes a rescue target; completed jobs respawn after three to six world days.

### Beach Cleanup

- Levels: 750; deterministic seed `level * 2654435761 + 42069` using Mulberry32.
- `p = (level - 1) / 749`.
- Width `7 + floor(8p)`; height `7 + floor(6p)`.
- Interior obstacle ceiling is `floor(interior * 0.14)`; obstacle count is `clamp(1 + floor(10p), 1, ceiling)`.
- Umbrellas are `max(1, floor(0.4 * obstacles))`; chairs are `floor(0.3 * obstacles)`; tides receive the remainder. Levels 1–3 have no chairs/tides; Levels 4–10 cap tides at one.
- Rubbish count is `clamp(1 + floor(49p), 1, 50)`.
- Generation shuffles interior cells deterministically, protects the starting approach and removes an obstacle if necessary to retain full reachability.
- Moving rakes the tile being left; the six exact groove states are horizontal, vertical, NE, NW, SE and SW. One undo restores an entire continuous swipe run.
- Every generated board is checked against a complete certified route. Reward remains capped at 170.

### Playground Power Wash

- Levels: 750; 48×24 gameplay grid over the 1536×1024 source surface.
- `t = (level - 1) / 749`.
- Blobs `round(4 + 296t)`; grit `round(40 + 5960t)`; base radius `round(48 - 20t)`.
- Regeneration `6 - 3.2t`; opacity `0.34 + 0.18t`; clean strength `1 - 0.62t`; drain multiplier `0.9 + 0.55t`.
- Resistant stain zones `min(10, 5 + floor(5t))`.
- Precision: radius 0.64, drain 8.5, power 1.15. Standard: 1 / 12 / 1. Wide: 1.48 / 17 / 0.82. Soap radius/drain: 1.18 / 8.5.
- Plain water cannot clear soap-resistant stains; soap plus rinse can. Continuous interpolation prevents gaps between pointer samples.
- 97% clean clears residual dirt and completes at 100%.
- Native reward: `clamp(round(100 + level * 20/24), 0, 170)`; a replay cannot claim first-clear coins again.

### Restaurant engine shared rules

All four indoor venues use three preparation trays, at most three visible customers and a three-second grace period. Recipe steps must be completed in order. An appliance step uses its authored run time and burn window. Undo/discard only affects its selected tray. A missed customer violates the authored `maxMisses = 0` condition. Shared scoring is:

- `accuracy = served / max(1, served + missed + mistakes*0.25)`;
- `happiness = mean(customer happiness)`;
- `speed = clamp(served / target)`;
- `wasteScore = max(0, 1 - waste / max(3,target))`;
- `score = round(50*accuracy + 25*happiness + 15*speed + 10*wasteScore)`;
- stars are 3 at score ≥90, 2 at ≥75, otherwise 1 after a win.

Motion-aware service budget is the exact lower bound for time/patience: start at 0.4 seconds per order, add 0.78 seconds per ingredient, add `max(0.25, appliance.seconds)+1.32` per appliance and 0.25 after each recipe; queue each order at `max(serviceClock, arrival)`, then add eight seconds to both final duration and worst-wait patience.

#### Corner Café

- 150 levels, 15 chapters of 10.
- Target `min(6, 3 + floor((level-1)/45))`.
- Dish count: one through Level 35; mixed one/two through 70; mainly two through 120; two through 140; then two/three.
- Arrival gap `max(12, 16 - floor(level/55))`.
- Duration is at least 105 seconds and at least the motion budget. Patience is at least `82 + 3*floor((level-1)/30)` and at least the motion budget.
- First-clear coins: `20 + 3*level + 12*stars`.

#### Little Bakery

- 150 levels, 15 chapters of 10, 24 recipes and exact family/menu rotations.
- Workload tiers `(customers,dishes)`: 1–5 `(3,3)`, 6–10 `(3,4)`, 11–15 `(4,4)`, 16–20 `(4,5)`, 21–30 `(5,6)`, 31–40 `(5,7)`, 41–60 `(6,8)`, 61–80 `(6,9)`, 81–100 `(6,10)`, 101–120 `(6,11)`, 121–150 `(6,12)`.
- Arrival gaps: 24 through 20; then 22/21/20/19/18/17 in successive 20-level bands; 16 for 141–150.
- Duration is `max(100, ceil(estimated service + round(48-28p)), motion duration)`.
- Patience is `max(55, ceil(worst wait + round(36-22p)), motion patience)`.
- First-clear coins: `min(170, 35 + round((level-1)*85/149) + 15*stars)`.

#### Morning Mug and Riverside Kitchen

- Each has 150 levels and exact authored introductory plans through Level 20.
- Generated tiers: Levels 21–40 target 5 with 6 or 7 total drinks/meals; 41–100 target 6 with 8–10 total; 101–150 target 6 with 11 or 12 total.
- Generated arrival gap `max(9, 15 - floor(level/38))`.
- Morning Mug generated patience is at least `112 + 4*floor((level-1)/30)`; Riverside is at least `128 + 5*floor((level-1)/30)`; both also obey the motion budget.
- Morning Mug first-clear reward: `min(170, 25 + level + 12*stars)`.
- Riverside first-clear reward: `min(170, 35 + level + 15*stars)`.
- Their in-progress appliance/station state is resumable and is restored exactly after save/reload.

### South Shore Scoops

- 750 levels, 75 chapters of 10, all plans unique.
- Customer target: 4 through Level 25; 5 through 75; 6 through 150; 7 through 250; 8 through 375; 9 through 500; 10 through 620; 11 through 700; 12 through 750.
- Patience: `max(26, 50 - (level-1)*24/749)`.
- Two-item orders unlock at Level 8; share is `min(0.62, 0.18 + (level-8)/704)` and quota is `min(target-1, max(1, floor(target*share)))`.
- Orders are sequential; every level uses a unique deterministic family/parts signature and respects its unlock table.
- Win requires accuracy ≥60 and served ≥`ceil(target*0.6)`.
- Stars: 3 at ≥95 accuracy with zero waste, 2 at ≥78, otherwise 1.
- Reward below 60 accuracy is zero; otherwise `min(45, 18 + round((accuracy-60)*0.3) + min(15, floor((level-1)/100)*3))`.
- Restoration milestones: 10, 35, 75, 120, 200, 300, 425, 550, 650 and 750 distinct first clears.

### Fishing and Magnet Fishing

- Both have five daily casts/pulls.
- Fishing timings: 620 ms cast, 850–1750 ms bite delay, 1800 ms bite window, 760 ms reel; excellent timing is the best 20% of the window.
- Three hidden zones are generated per session. Phaser uses proportionally adapted 1280×720 coordinates; the HTML interaction zones and semantic hit rules are unchanged.
- Catch-table weights are modified by reel quality: legendary `0.3 + 2.15q`, rare/premium `0.65 + 1.45q`, uncommon `0.9 + 0.35q`, common `1.18 - 0.3q`.
- Ordinary fish stacks cap at 99. A placed aquarium caps each ornamental species at 99. Without a placed tank, ornamental fish remain catchable and are safely released exactly as in HTML.
- Magnet timings: 920 ms cast, 720 ms sink, 360 ms settle and 980 ms reel. Finds use the exact eight-item weighted catalogue and coin values. Pull 12 guarantees rare-or-better after the configured dry streak; pull 40 guarantees treasure-or-better. Cleanup targets respawn after 180 game minutes.

### Harbour General

- Non-levelled player-owned shop with the exact 17-product catalogue, buy/sell prices, base demand and weather multipliers.
- Purchase of the 5,000-coin deed creates six displays with four starter items each.
- Restocking buys cases of four and never exceeds 24 stock per product.
- Display assignment swaps duplicates safely; clearing a display never deletes stock.
- Each NPC sale reduces stock once, records the sale and adds coins to the till. Till collection is atomic and idempotent.

## Root causes and corrections

| Root cause | Correction | Files |
| --- | --- | --- |
| Bakery's generated duration/patience used an estimate that did not include the authoritative Phaser-motion interaction allowance | Added the exact protected motion service budget and made it a lower bound; all 150 levels now match | `src/data/bakery.js` |
| Fishing selected from the complete weighted table before checking destination capacity | Added a pre-cast catchable-entry filter for ordinary inventory and placed-aquarium capacity; no valid table now blocks without consuming a cast | `src/systems/FishingService.js` |
| Fidelity launcher selected the first active Phaser scene, could leave the old scene visible, cancelled a newly created magnet session when restarting Fishing, and carried a shop overlay into later scenes | Select the actual visible scene, stop/start through the Scene Manager, stop Fishing before creating the replacement session, and close the shop overlay before routing | `src/qa/FidelityQaHarness.js` |

## Permanent test protection

Added:

- `scripts/minigame-parity-lib.mjs`: executes protected data/generator slices in an isolated VM and compares canonical outputs against Phaser modules.
- `scripts/verify-minigame-parity.mjs`: command-line parity gate.
- `tests/minigame-parity.test.js`: makes the full parity gate part of the normal regression suite.
- `pnpm parity:minigames`: repeatable explicit audit command.
- Fishing tests for mixed/full inventory, no-valid-catch cast protection, no-tank ornamental release and placed-tank species capacity.
- Fidelity-route tests for reliable cross-scene routing, same-scene fishing-mode changes and overlay cleanup.

## Complete validation results

| Validation | Result |
| --- | --- |
| Campaign level records data-validated | 5,850 / 5,850 |
| Deterministic/procedural campaign levels generated or validated | 5,850 / 5,850 |
| Canonical rule/data comparisons | 75 / 75 passed |
| Compared level/reward/seeded instances | 105,795 |
| Restaurant level outputs | 600 exact (4 × 150) |
| Restaurant reward cases | 2,400 exact |
| Scoops levels | 750 exact and unique |
| Scoops reward cases | 75,750 exact (750 levels × 101 accuracies) |
| Beach difficulty + full boards | 750 + 750 exact |
| House Rescue generated levels | 750 exact |
| Power Wash shared difficulty/rewards | 750 + 750 exact |
| Waste/Lawn/River full catalogue validators | 750 each passed |
| Fishing seeded selections | 15,000 matched |
| Magnet seeded/pity selections | 3,000 matched |
| Harbour products/validator | 17 / 17 passed |
| Full automated suite | 610 passed, 0 failed, 0 skipped |

“Algorithmically simulated” means the relevant engine or generator was run, not merely counted. Certified-solvability validators passed for every authored Waste board and all stored Lawn routes, all River levels were hydrated/validated with representative certified solutions, every Beach board received a complete route, every House dirt field was checked for reachability, and every Scoops plan was checked for finishability and uniqueness. Power Wash uses continuous freehand input, so mathematical proof of every possible pointer path is not meaningful; every generated grid was validated and the exact completion/residue rules are regression-tested.

## Runtime evidence

Browser-operated checks used the isolated development fidelity route and did not touch production saves.

### Progression checkpoints rendered

- Every 750-level campaign: Levels 1–10, 11, 20, 50, 100, 150, 250, 500, 749 and 750.
- River additional mechanic boundaries: 55, 56, 57 and 63.
- Every 150-level restaurant campaign: Levels 1–10, 11, 20, 50, 100, 149 and 150.
- Fishing, Magnet Fishing, House Interiors, Village Grocer, Fresh Market and Harbour General were each opened through the runtime harness.

Every requested level opened its intended Phaser scene with a visible play region and no console error. Behavioural success, failure, restart, reward, save/reload and duplicate-reward paths are covered by the corresponding service/scene integration tests in the 610-test suite; the browser run was used to verify the real scene lifecycle, responsive shell, visible interaction surface and live input.

### Live input and orientation

- Lawn swipe changed a Level 1 board from 7% cut / 11 moves to 29% cut / 10 moves.
- Fishing cast advanced from “Tap water to cast” to “Float settled. Wait for a bite.”
- Magnet cast advanced from “Tap water to place the magnet” to “Waiting for the riverbed…”.
- Switching Fishing → Magnet → Fishing retained the correct scene and changed the actual heading Reedbank Pond → Mill Bridge → Reedbank Pond.
- Lawn Level 750 retained the identical 2%-cut / 27-moves board state through portrait pause and landscape resume.
- River Level 750 played at 390×844 with 44 original rubbish pieces and no viewport overflow.
- Bakery and Power Wash paused in portrait with the one-sentence rotate message; Power Wash resumed its live playfield in landscape.

### Viewports

| Profile | Coverage | Result |
| --- | --- | --- |
| 568×320 landscape phone | Every game type at its highest representative level | PASS; no document overflow, all landscape activities active, River correctly requested portrait |
| 1024×768 tablet | Every game type at its highest representative level | PASS; no document overflow, all landscape activities active, River correctly requested portrait |
| 1366×768 development | Full progression checkpoint list above | PASS; intended scene and play region for every checkpoint |
| 390×844 portrait | Lawn, River, Bakery and Power Wash orientation paths | PASS; River active, landscape games paused, exact state resumed |

## Save and cross-system regression

- No state schema or completed-level identifier changed.
- Existing level numbers, best scores/stars, tutorial flags, rewards claimed, inventory, house state and equipment IDs remain valid.
- Bakery timing is generated when a new transient shift begins; no durable player progress requires migration.
- Fishing capacity filtering consumes no cast when no valid destination remains and does not duplicate or discard a valid catch.
- Production and legacy save keys were not written by the live fidelity route.
- Tests cover fresh, early, middle, late, final and legacy saves; repeated loading is idempotent.
- Tests cover first clear, replay, failure, restart/cancel, persistence failure rollback, exit during activity, final-level completion and one-time reward accounting.
- Shop purchases, inventory caps, all 67 product destinations, mower/vacuum effects, town job cleanup, aquarium storage/release, NPC sales, restoration gates and return-to-town positions remain passing.

## Build result

- Vite production build: PASS (178 modules, 872 ms in the final run).
- Performance budget: PASS.
- Initial application: 3,040,719 bytes.
- Phaser engine: 1,374,829 bytes.
- Lazy chunks: 19.
- Total JavaScript: 4,811,996 bytes.

## After-fix parity matrix

| Activity | Level count | Rules/data | Progression/reward/save | Final status |
| --- | ---: | --- | --- | --- |
| Lawn Care | 750 | Full authored catalogue validated | Passing | Exact |
| River Clear-Out | 750 | Full authored catalogue validated | Passing | Exact |
| Waste Collection | 750 | Full authored catalogue validated | Passing | Exact |
| House Rescue | 750 | All generated parameters exact | Passing | Exact |
| Beach Cleanup | 750 | All difficulty outputs and boards exact | Passing | Exact |
| Playground Power Wash | 750 | Shared difficulty, tools, threshold and rewards exact | Passing | Adapted-approved render/simulation surface |
| Fishing | non-levelled | Config, tables and 15,000 seeded selections exact; capacity defect fixed | Passing | Adapted-approved responsive coordinates |
| Magnet Fishing | non-levelled | Config, catalogue, pity and 3,000 seeded selections exact | Passing | Adapted-approved responsive coordinates |
| Corner Café | 150 | All levels/catalogues/rewards exact | Passing | Exact |
| Little Bakery | 150 | All levels/catalogues/rewards exact after pacing repair | Passing | Exact |
| Morning Mug | 150 | All levels/catalogues/rewards exact | Passing | Exact |
| Riverside Kitchen | 150 | All levels/catalogues/rewards exact | Passing | Exact |
| South Shore Scoops | 750 | All levels/catalogues/rewards exact | Passing | Adapted-approved nine-part UI safety guard |
| Harbour General | non-levelled | All 17 products and operating rules validated | Passing | Exact |

## Remaining deviations

| Difference | Classification | Justification |
| --- | --- | --- |
| Phaser uses 1280×720 responsive fishing/magnet targeting coordinates rather than the HTML surface coordinates | Intentionally Phaser-specific and gameplay-equivalent | Water bounds, three hidden zones, proportional radii, timing, catch quality and probability rules are preserved |
| Power Wash uses a deterministic Phaser grid/layer simulation beneath the protected full-resolution mask | Intentionally Phaser-specific and gameplay-equivalent | Shared difficulty, tools, resistant stains, continuous interpolation, supplies, 97→100 completion and rewards are exact |
| Scoops includes `maxBuildParts: 9` | Intentionally Phaser-specific and gameplay-equivalent | It is a UI/input safety guard derived from the largest authoritative recipe and does not alter any generated order |
| Artwork that is still awaiting Sprite AI replacement | User decision / separate visual workstream | Outside this gameplay-logic task; no gameplay rule was changed to conceal visual differences |

No item is classified as blocked or still defective.
