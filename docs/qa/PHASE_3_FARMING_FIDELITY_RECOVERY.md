# Phase 3 Farming Fidelity Recovery

Date: 2026-08-28  
Protected reference: `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`  
Phaser branch: `phase-2-ui-simplification`
Implementation commit: `a0721a0`

## Verdict

**PASS for the audited farming layer.** The full seed, allotment, crop, apple and positioned-sapling loop is present in Phaser and reachable through normal town play. The audit found and corrected one gameplay-rule mismatch, one town-interaction gap and several presentation gaps. No save schema, price, growth duration, yield, tree capacity or unlock price changed.

## Protected requirement map

| Farming requirement | Protected HTML rule | Phaser owner | Result |
| --- | --- | --- | --- |
| Buy planting stock | Village Grocer sells Carrot Seeds, Greens Seeds, Berry Starters and Apple Saplings | `src/data/villageGrocer.js`, `src/systems/ShopService.js`, `src/scenes/VillageGrocerScene.js` | PASS |
| Six saved allotment beds | One starter bed; five unlocks cost 1,000 / 2,500 / 4,500 / 7,000 / 10,000 | `src/state/farmingState.js`, `src/systems/FarmingService.js` | PASS |
| Original crops | Carrots: 30 / 360 min / yield 6; greens: 80 / 420 min / yield 4; berries: 120 / 540 min / yield 4 | `src/data/farming.js` | PASS |
| Plant owned seeds | One packet is consumed only after a valid unlocked empty bed is selected | `FarmingService.plant` | PASS |
| Growing food | World time and weather advance each bed independently; offline time resolves on return | `FarmingService.resolveInto`, world simulation | PASS |
| Harvest crops | Ready produce enters shared bounded inventory and the harvested bed resets | `FarmingService.harvest` | PASS after recovery |
| Partial final harvest | If inventory has less room than the normal yield, collect only the remaining room | `FarmingService.harvest` | FIXED: Phaser previously rejected the entire harvest |
| Full inventory | Do not consume/reset a ready crop when no produce space remains | `FarmingService.harvest` | PASS |
| Starter apple tree | One positioned mature tree begins with one apple ready | `createFreshFarmingState` | PASS |
| Harvest apples | Harvest exactly one apple from the selected tree; no duplicate before regrowth | `FarmingService.harvestApple` | PASS |
| Apple regrowth | One mature tree produces one apple after 720 effective game minutes and pauses while fruit is waiting | `FarmingService.resolveInto` | PASS |
| Buy and plant apple trees | A 2,800-coin Grocer sapling becomes an orchard-owned placement; confirmation consumes it | `ShopService`, `FarmingService.begin/preview/confirmAppleTreePlacement`, `TownScene` | PASS |
| Positioned tree safety | Placement rejects roads, water, buildings, entrances, lawns, permanent fixtures, other objects and trees | `validateAppleTreePlacement` | PASS |
| Orchard capacity | Placed trees plus owned unplaced saplings cannot exceed 24 | `FarmingService.purchaseSapling`, `ShopService.getProduct` | PASS |
| Legacy saves | Six crop rows, positioned trees, progress, fruit, harvest history and owned saplings migrate without touching the HTML save | `projectLegacyFarming`, `GameState` import | PASS |
| Atomic saving | Failed planting, harvest, purchase, placement or unlock saves restore the prior state | `FarmingService.commit` | PASS |

“Plant apples” is represented by buying an **Apple Sapling** at Village Grocer and placing that tree on valid town ground. Apples themselves remain harvested food; they are not treated as seed packets, matching the protected HTML.

## Recovery changes

1. Restored the original one-column, six-row allotment footprint at `1080,2155`, size `510×52`, with a `70`-pixel row gap.
2. Added an individual town tap target for every allotment bed. A tapped row now opens the allotment panel with that exact bed highlighted and scrolled into view.
3. Added matching focus for an individually selected apple tree and removed raw world coordinates from player-facing tree cards.
4. Corrected crop harvesting near the 99-item inventory limit. For example, 98 carrots plus a ready six-carrot bed now collects one carrot and safely resets that bed, exactly like the HTML.
5. Preserved a ready bed unchanged when inventory is already full.
6. Replaced generic orchard emoji map objects with staged code-native trees: sapling, young, mature, fruiting and picked. Tree scale follows saved growth; visible apples only appear while fruit is ready.
7. Removed development milestone labels from the farming and Village Grocer headers.
8. Shortened farming instructions, removed raw tree coordinates and reset the status line when changing farming areas so an old crop message never appears in the orchard.

## Automated verification

Focused suites:

- `tests/farming-service.test.js`
- `tests/village-grocer.test.js`

New regression cases cover:

- partial final-yield harvest at 98/99 inventory;
- full-inventory harvest protection; and
- all six exact protected allotment row rectangles;
- direct map interaction wiring for every bed;
- staged, fruit-aware orchard town artwork; and
- removal of migration metadata and raw coordinates from production farming UI.

The existing suite additionally covers seed purchase and consumption, weather differences, normal harvest yields, one-apple harvesting, duplicate prevention, exact sapling purchase and placement, invalid-placement rollback, offline maturation, 24-tree capacity, legacy multi-tree import, failed-save rollback and Grocer stock routing.

Whole-project regression: **579/579 tests pass**. Production build and performance budget also pass.

## Live browser verification

| Journey | Viewport | Result |
| --- | ---: | --- |
| Tap an individual allotment row from the normal town map | 844×390 | PASS: exact bed opened and highlighted |
| Plant the starter carrot packet | 844×390 | PASS: packet consumed; Bed 1 changed to growing and reported weather/time growth |
| Inspect planted row artwork in town | 844×390 | PASS: original six-row footprint and planted-stage marks visible |
| Open Community Orchard and harvest starter apple | 844×390 | PASS: exactly one apple entered inventory; tree returned to production |
| Orchard → Buy Sapling → Village Grocer | 844×390 | PASS: Grocer opened with Apple Sapling selected, price 2,800 and capacity 24 |
| Buy Carrot Seeds at the physical Grocer | 844×390 | PASS: one packet added, 30 coins deducted, balance changed 100→70 |
| Focused allotment row and scroll-safe farming panel | 568×320 | PASS: focused row remained visible; no horizontal clipping |
| Farming stock and product detail | 568×320 | PASS: all four farming products and purchase detail fit the viewport |
| Orchard management panel | 1024×768 | PASS: tree progress, inventory, buy and place actions visible without clipping |
| Portrait interruption | 390×844 | PASS: one-sentence rotate-device screen covered gameplay; landscape restored the same Grocer selection and balance |

## Protected values unchanged

- Save schema: unchanged
- Seed prices: 30 / 80 / 120
- Crop growth: 360 / 420 / 540 game minutes
- Crop yields: 6 / 4 / 4, except the protected partial final harvest when inventory space is smaller
- Bed count and unlock prices: unchanged
- Apple harvest: exactly 1
- Sapling price: 2,800
- Sapling maturity: 4,320 effective game minutes
- Apple production: 720 effective game minutes
- Orchard capacity: 24 placed plus unplaced trees
- Coin ledger, inventory ownership, weather, offline progress and legacy-import rules: unchanged

## Remaining release boundary

Browser viewport verification is complete for this farming recovery. Physical iOS/Android safe-area, lifecycle and endurance testing remains part of the overall release gate, not a farming-code gap.
