# Kindworks Phaser farming, Grocer, and orchard contract

Milestone 26 completes the agricultural loop from the protected HTML game. It
extends the existing Milestone 10 allotment and lawn foundation without
changing the original HTML source or its storage keys.

## Village Grocer

Village Grocer is a real top-down Phaser interior rather than a menu-only shop.
The player can enter from the authored town door, walk with keyboard or shared
touch controls, collide with walls and furniture, approach a shelf and press
the interaction control, or tap a product display directly. Leaving restores
the exact town return point.

The room has exactly nine original physical displays, in original order:

1. Carrot Seeds
2. Greens Seeds
3. Berry Starters
4. Apple Sapling
5. Mixed Seeds
6. Sunflower Seeds
7. Mealworms
8. Fresh Greens
9. Wild Berries

The first three displays form the allotment-seed shelf, the sapling has its own
island, and the remaining five form the animal-food display. Mara operates the
checkout and Ben is the browsing customer. Every display focuses the same safe
shop transaction path used elsewhere; it does not maintain a second wallet or
inventory.

## Allotment contract

The allotment retains six separately saved beds. One is unlocked for a fresh
game and the remaining five cost 1,000, 2,500, 4,500, 7,000, and 10,000
KindlyCoins. Each empty unlocked bed accepts one owned packet of the selected
crop:

| Crop | Seed price | Growth | Harvest |
| --- | ---: | ---: | ---: |
| Carrots | 30 | 360 game minutes | 6 carrots |
| Fresh Greens | 80 | 420 game minutes | 4 greens |
| Wild Berries | 120 | 540 game minutes | 4 berries |

Planting, unlocking, and harvesting are complete-state transactions. Inventory
is changed only in the candidate save, and any failed persistence restores the
bed, wallet, produce, seed, and ledger to the exact prior checkpoint.

## Positioned orchard contract

The Community Orchard contains at most 24 apple trees: one starter tree plus
up to 23 additionally purchased and positioned saplings. Trees are not fixed
slots. Each record owns:

- a stable, never-reused tree ID;
- exact finite town `x` and `y` coordinates;
- growing or mature status;
- maturity and fruit-production progress;
- zero or one available apple;
- harvest count and total harvested; and
- the game minute when it was planted.

An Apple Sapling costs exactly 2,800 KindlyCoins. Buying it at Village Grocer
adds one orchard-owned sapling, subject to the combined tree-plus-sapling limit
of 24. The player then positions it in the town using the shared placement
preview. The complete footprint must stay within the world and clear of water,
roads, buildings, entrances, lawns, permanent fixtures, placed objects, and
other trees. Apple trees do not rotate.

Confirmation consumes one owned sapling only after validation and a successful
safe save. Cancellation or an invalid position consumes nothing. A persistence
failure restores the exact wallet, owned-sapling count, serial, tree list, and
active preview.

## Time, weather, and harvesting

A sapling matures after 4,320 effective game minutes. Once mature, it produces
one apple after 720 effective game minutes and pauses while that apple remains
unharvested. Harvesting affects only the selected tree, adds one apple to shared
inventory, resets that tree's fruit cycle, and saves immediately.

Growth and fruit production use the same authoritative world clock as the rest
of Willowmere. Daily weather modifies effective progress, so rain helps and
snow slows growth. When the player returns after time away, elapsed world time
is resolved before the orchard is displayed or harvested; offline progress does
not use a parallel timer.

## Save migration and compatibility

Milestone 26 advances the game-state and envelope schema from 22 to 23 and the
farming-domain schema from 1 to 2. Existing Phaser saves receive a normalized
positioned starter tree. An original HTML import projects all six crop beds,
every known orchard slot, exact saved tree positions, growing and fruit state,
harvest history, and purchased saplings. Older fixed-slot orchard records use
the protected original fallback positions.

The import reads the preserved legacy snapshot only. It never writes to
`kindworks_living_town_v38`, its backup/recovery keys, or any earlier HTML save
key. If modern Phaser crop or lawn progress already exists, schema 23 preserves
it while importing a more complete legacy orchard collection.

## Verification boundary

Automated tests pin the exact Grocer display list and layout groups, crop
economy and growth rules, sapling transaction, precise coordinate persistence,
invalid-placement rollback, capacity limit, individual harvesting, weather and
offline maturation, legacy multi-tree import, save-schema upgrade, and safe
checkout routing. Production build and live browser checks cover entrance,
walking, shelf selection, purchase, placement, reload, and the saved two-tree
orchard flow.
