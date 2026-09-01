# KindWorks Phase 8A Dependency-Ordered Production List

Foundational assets must be approved before dependent variants. A failed wave returns to revision without advancing later waves.

## Wave 1 — foundation-and-calibration

- `terrain.town.slice.grass` → `public/assets/runtime/phase-8a/town-grass-tile.v1.png` (depends on: none)
- `terrain.town.slice.pavement` → `public/assets/runtime/phase-8a/town-pavement-tile.v1.png` (depends on: `terrain.town.slice.grass`)
- `terrain.town.slice.road` → `public/assets/runtime/phase-8a/town-road-set.v1.png` (depends on: `terrain.town.slice.pavement`)

## Wave 2 — river-and-world-footprints

- `terrain.town.slice.river-edge` → `public/assets/runtime/phase-8a/town-river-edge-sheet.v1.png` (depends on: `terrain.town.slice.grass`)
- `terrain.town.slice.lawn-house-6` → `public/assets/runtime/phase-8a/lawn-house-6-growth-states.v1.png` (depends on: `terrain.town.slice.grass`)
- `building.town.slice.house-6-bay-cottage` → `public/assets/runtime/phase-8a/house-6-bay-cottage-states.v1.png` (depends on: `terrain.town.slice.grass`, `terrain.town.slice.pavement`)

## Wave 3 — occlusion-and-props

- `prop.town.slice.large-oak.shadow` → `public/assets/runtime/phase-8a/large-oak-shadow.v1.png` (depends on: `terrain.town.slice.grass`)
- `prop.town.slice.large-oak.trunk` → `public/assets/runtime/phase-8a/large-oak-trunk.v1.png` (depends on: `prop.town.slice.large-oak.shadow`)
- `prop.town.slice.large-oak.canopy` → `public/assets/runtime/phase-8a/large-oak-canopy.v1.png` (depends on: `prop.town.slice.large-oak.trunk`)
- `prop.town.slice.white-fence` → `public/assets/runtime/phase-8a/white-fence-segment.v1.png` (depends on: `terrain.town.slice.lawn-house-6`)
- `prop.town.slice.public-bin` → `public/assets/runtime/phase-8a/public-bin-states.v1.png` (depends on: `terrain.town.slice.pavement`)
- `prop.town.slice.rubbish-can` → `public/assets/runtime/phase-8a/rubbish-crushed-can.v1.png` (depends on: `prop.town.slice.public-bin`)
- `prop.town.slice.flower-planter` → `public/assets/runtime/phase-8a/flower-planter.v1.png` (depends on: `terrain.town.slice.lawn-house-6`)

## Wave 4 — characters-and-animal

- `character.player.slice.resident` → `public/assets/runtime/phase-8a/player-resident-walk.v1.png` (depends on: `terrain.town.slice.grass`)
- `character.npc.slice.resident-a` → `public/assets/runtime/phase-8a/npc-resident-a-walk.v1.png` (depends on: `character.player.slice.resident`)
- `character.animal.slice.dog` → `public/assets/runtime/phase-8a/animal-dog-walk.v1.png` (depends on: `character.player.slice.resident`)

## Wave 5 — interaction-and-reward

- `ui.town.slice.lawn-interaction` → `public/assets/runtime/phase-8a/lawn-interaction-prompt.v1.png` (depends on: `terrain.town.slice.lawn-house-6`)
- `ui.town.slice.coin-reward-burst` → `public/assets/runtime/phase-8a/coin-reward-burst.v1.png` (depends on: `ui.town.slice.lawn-interaction`)

## Wave 6 — lawn-care-screen

- `minigame.lawn.slice.board-tiles` → `public/assets/runtime/phase-8a/lawn-care-board-tiles.v1.png` (depends on: `terrain.town.slice.grass`)
- `minigame.lawn.slice.weed-tiles` → `public/assets/runtime/phase-8a/lawn-care-weed-tiles.v1.png` (depends on: `minigame.lawn.slice.board-tiles`)
- `minigame.lawn.slice.mower` → `public/assets/runtime/phase-8a/lawn-care-mower.v1.png` (depends on: `minigame.lawn.slice.board-tiles`)
- `ui.lawn.slice.controls` → `public/assets/runtime/phase-8a/lawn-care-essential-controls.v1.png` (depends on: `minigame.lawn.slice.board-tiles`)

## Approval sequence

1. Validate exact file, alpha, dimensions, grid, and frame order in staging.
2. Review native size and intended gameplay size in Asset Lab.
3. Check anchor, sockets, geometry overlays, state alignment, directions, animation, and occlusion.
4. Approve the wave; copy approved masters to the runtime export step.
5. Change central semantic registry metadata only. Do not edit gameplay scenes per asset.
6. Run Phase 8A, visual registry, regression, build, and screenshot checks before the next wave.
