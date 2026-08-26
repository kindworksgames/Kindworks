# Kindworks migration audit

## Source of truth

The preserved legacy game is `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`.
It must remain runnable and unchanged while the Phaser version is built alongside it.

## Current structure

- 17,324,288 bytes across 13,381 lines.
- Four style blocks and one main JavaScript block.
- One embedded JSON data block.
- Five embedded image data URLs: one PNG and four WebP images.
- 1,716 named functions, 548 `getElementById` lookups, and 274 event listeners.
- Canvas-rendered town and mini-games combined with a large DOM-based interface.
- A 750-level River game and a 750-level House Rescue progression are explicitly protected by runtime checks.

## Persistence contract

The game stores its current save, backup, and recovery data in `localStorage`:

- `kindworks_living_town_v38`
- `kindworks_living_town_v38_backup`
- `kindworks_living_town_v38_recovery`

Older save keys from versions 12 through 37 are accepted for migration. The Phaser build must preserve this compatibility until a tested save migration is introduced.

## Migration boundaries

The safest extraction order is:

1. Shared data and save-schema adapters.
2. Town rendering and camera input.
3. Player movement and interactions.
4. Economy, inventory, shops, farming, NPCs, animals, and pets.
5. Each mini-game as a separate Phaser scene.
6. Mobile controls, accessibility, performance checks, and Capacitor packaging.

## Current milestone

Milestone 1 established the playable Willowmere town foundation, including
camera follow/zoom, keyboard and touch movement, and initial collision bounds.

Milestone 2 adds the reusable four-direction character animation,
proximity-interaction, and scene-transition foundations. The Little Bakery now
has a safe enter/exit interior shell that returns the player to its authored
door position. Bakery gameplay, economy, inventory, saves, NPCs, and
progression remain intentionally unmigrated.

Milestone 3 establishes shared state and safe persistence. Phaser uses a new
`kindworks_phaser_v1` current/backup/recovery namespace, validates checksummed
schema-1 envelopes, and can inspect legacy versions 12 through 82 without
writing to any `kindworks_living_town_*` key. A legacy copy is created only
after explicit confirmation and retains the complete source snapshot for later
domain-by-domain migration. Economy, inventory, NPCs, animals, shops, farming,
rewards, and mini-game behavior remain intentionally unmigrated.

Milestone 4 extracts the shared 76-item catalogue, four inventory buckets,
KindlyCoin wallet, bounded transaction ledger, and rollback-safe persistence.
Milestone 5 proves the first complete retailer through Fresh Market's exact
seven-product catalogue and purchase flow.

Milestone 6 proves the first complete cleanup vertical slice. A persistent
six-piece rubbish cluster in Willow Commons creates a saved job session,
launches `WasteCollectionScene`, accepts one exact 100% result, awards the
legacy-compatible 100-coin Level 1 reward, removes only that target, and
survives reload without duplicate payment. Dynamic litter, repeat cycles, and
the remaining 749 Waste Collection layouts remain intentionally unmigrated.

Milestones 7 through 15 expanded the shared world simulation, resident creator,
farming, animals and adoption, fishing and magnet fishing, Little Bakery,
Corner Café, and the complete 750-level River Clear-Out campaign.

Milestone 16 migrates the protected House Rescue campaign. All 750 original
difficulty configurations are generated from the preserved formulas: 9–30
rubbish items in waves of nine, three exact sorting categories, 180–267 floor
stains, one to five stain layers, +2/−1 sorting scores, 95% vacuum completion,
and the original 60 + accuracy + level-bonus reward capped at 170 coins. Four
original starter cottages are dirty, no more than five jobs can be active,
completed homes respawn after three to six game days, and the personal home is
never selected. Active work resumes from the Phaser save, completion is atomic,
and House Rescue requires landscape orientation on mobile. The protected HTML
source remains unchanged.

Milestone 17 completes Waste Collection. The exact protected payload now backs
750 authored compact matching boards, 40 rubbish types, 15 checkpoints, and
750 verified five-slot solution certificates in Phaser. Only uncovered cards
can enter the tray, triples clear automatically, five unmatched cards fail the
attempt, and every card/tray move persists for reload. All levels are
selectable; first clears award the original percentage-plus-level coins once,
while replays cannot duplicate rewards and campaign play does not change the
town. The Milestone 6 six-piece Willow Commons occurrence remains intact and
becomes the permanent campaign entrance after its first restoration. The new
schema-14 state upgrades schema 13 safely, and Waste Collection requires
landscape orientation on mobile. The protected HTML source remains unchanged.

Milestone 18 completes Lawn Care. The protected `lawn-care` payload is
extracted read-only into 750 unique authored grids with 750 unique source IDs
and families, then all stored optimal routes are replay-verified. The mower
slides until a hedge, gets exactly two moves above par, retains five undo
states, and uses the original 50/85/100 percent star thresholds. Tough weeds
begin at Level 10, woody weeds at Level 50, clusters never exceed six cells,
and mower upgrades alter animation timing only. Campaign attempts resume from
the shared save; first clears award the original percentage-plus-level reward
once and replays pay zero. The same engine now powers neighbourhood jobs, where
the cut percentage is applied proportionally to the real town lawn and each
new regrown occurrence pays atomically. Lawn Care requires landscape on mobile,
leaving River Clear-Out as the only portrait-friendly migrated mini-game. The
new game-state/envelope schema is 15 and the protected HTML remains unchanged.

Milestone 19 completes Beach Cleanup. The protected embedded package's exact
`1.0.0-kindworks-integrated` rules now run natively in Phaser: all 750 levels
use the original seeded 7×7-to-15×13 generator, obstacle bands, one-to-50
rubbish curve, 19-item reward catalogue, leave-a-tile raking rule, undo, swipe
and keyboard controls, and optional No Undo, Light Foot, and Clean Sweep
bonuses. Every generated level has a deterministic certified full clear.
Campaign first clears use the shared percentage-plus-level formula once;
replays pay zero. The town-job entrance at South Shore instead banks the
package's native rubbish finds and bonuses up to 170 coins, atomically removes
the visible shoreline litter, and allows it to return after a calm interval.
Active boards, finds, coins, challenge flags, and the exact town return point
resume from schema 16 saves. Beach Cleanup requires landscape on mobile, so
River Clear-Out remains the only portrait-friendly migrated mini-game. The
protected HTML remains unchanged.

Milestone 20 completes Playground Power Wash. The protected payload's actual
`1.1.0-kindworks-soap-restored` build and `v33-pixel-soap-stains` visual
revision are pinned alongside the source, payload, approved master-art, and
reference-dirt hashes. Phaser now runs all 750 seeded difficulty levels with
the exact three nozzle profiles, water/soap supplies, five-to-ten resistant
stain zones, soap-then-water rule, progressive cleaning strength, and original
97-percent completion tolerance. The native canvas reconstructs the approved
playground composition without modifying the embedded artwork. Campaign first
clears award the shared level-band reward once and replays pay zero. A dirty
Commons Playground instead launches a recurring town occurrence, awards the
native projected reward up to 170 coins, removes its visible grime, and returns
after a deterministic two or three game days. Exact active grime, soap, tool,
supply, and return-position state resumes from schema 17 saves. Playground
Power Wash requires landscape on mobile, so River Clear-Out remains the only
portrait-friendly migrated mini-game. The protected HTML remains unchanged.

Milestone 21 completes Morning Mug Coffee. Its protected catalogue now runs as
a separate Phaser venue with all 54 exact drinks, 28 ingredients, five barista
stations, four cup sizes, 15 chapters, the original first 20 pilot shifts, and
the deterministic Level 21–150 difficulty tiers. Every shift is no-miss, uses
three preparation trays, and validates the complete grind, espresso, water,
milk, foam, syrup, topping, iced-drink, alternative-milk, and tea sequences.
First clears award the original 25 + level + star formula once, capped at 170
coins, through a Morning Mug-specific ledger entry; Corner Café progress is
never changed. Active time, customer patience, orders, trays, completed steps,
return position, and exact next step checkpoint into schema 18 so Save & exit,
page exit, and a complete reload resume safely. Legacy `morningMug` progress is
projected separately, including the original completed-pilot Level 21 unlock.
Morning Mug requires landscape orientation on mobile. The protected HTML source
remains unchanged.
