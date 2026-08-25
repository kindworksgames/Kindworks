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
