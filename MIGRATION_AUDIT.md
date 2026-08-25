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
