# Phase 8B — Premium Vertical-Slice Artwork Intake

Date: 2026-08-30  
Verdict: **BLOCKED — NO APPROVED PHASE 8A ARTWORK WAS SUPPLIED**

Architecture update (2026-08-30): the production-safe Town/Lawn semantic scene-instance runtime is now implemented and regression-tested. This intake remains blocked only because 0/22 artworks have human approval; registration, production loading and normal gameplay instantiation are no longer conflated. No disposable proof was promoted.

## Outcome

Phase 8B cannot be integrated without violating the instruction to use only approved generated artwork. The repository contains the complete Phase 8A contracts and 22 development placeholders, but contains none of the 22 expected Phase 8A staging files.

No placeholder was promoted to production, no reference mockup was treated as an asset, no arbitrary offset or resampling correction was applied, and no Town or Lawn Care gameplay code was changed.

## Repository and Asset Lab evidence

- `artwork/staging/phase-8a/` does not exist.
- `public/assets/runtime/phase-8a/` does not exist.
- The development Asset Lab reports 37 registry entries: 15 existing production entries and exactly 22 entries with status `phase-8a-specified-placeholder`.
- The Phase 8A entries still resolve to `procedural` placeholder sources rather than approved image files.
- Asset Lab inspection produced no console warning or error. This confirms the placeholder architecture is healthy; it does not constitute artwork approval.

## Required intake — every asset reported separately

| # | Semantic asset ID | Required staging file | Exact contract | Intake result |
| ---: | --- | --- | --- | --- |
| 1 | `terrain.town.slice.grass` | `artwork/staging/phase-8a/town-grass-tile/v1/town-grass-tile.v1.png` | 64×64 PNG | NOT SUPPLIED |
| 2 | `terrain.town.slice.pavement` | `artwork/staging/phase-8a/town-pavement-tile/v1/town-pavement-tile.v1.png` | 64×64 PNG | NOT SUPPLIED |
| 3 | `terrain.town.slice.road` | `artwork/staging/phase-8a/town-road-tile/v1/town-road-tile.v1.png` | 64×64 PNG | NOT SUPPLIED |
| 4 | `terrain.town.slice.river-edge` | `artwork/staging/phase-8a/town-river-edge-sheet/v1/town-river-edge-sheet.v1.png` | 512×64 PNG, 4×1 | NOT SUPPLIED |
| 5 | `building.town.slice.house-6-bay-cottage` | `artwork/staging/phase-8a/house-6-bay-cottage-states/v1/house-6-bay-cottage-states.v1.png` | 1024×192 PNG, 4×1 | NOT SUPPLIED |
| 6 | `terrain.town.slice.lawn-house-6` | `artwork/staging/phase-8a/lawn-house-6-growth-states/v1/lawn-house-6-growth-states.v1.png` | 1280×352 PNG, 4×1 | NOT SUPPLIED |
| 7 | `prop.town.slice.large-oak.shadow` | `artwork/staging/phase-8a/large-oak-shadow/v1/large-oak-shadow.v1.png` | 128×160 PNG | NOT SUPPLIED |
| 8 | `prop.town.slice.large-oak.trunk` | `artwork/staging/phase-8a/large-oak-trunk/v1/large-oak-trunk.v1.png` | 128×160 PNG | NOT SUPPLIED |
| 9 | `prop.town.slice.large-oak.canopy` | `artwork/staging/phase-8a/large-oak-canopy/v1/large-oak-canopy.v1.png` | 128×160 PNG | NOT SUPPLIED |
| 10 | `prop.town.slice.public-bin` | `artwork/staging/phase-8a/public-bin-states/v1/public-bin-states.v1.png` | 192×80 PNG, 3×1 | NOT SUPPLIED |
| 11 | `prop.town.slice.white-fence` | `artwork/staging/phase-8a/white-fence-segment/v1/white-fence-segment.v1.png` | 256×64 PNG, 2×1 | NOT SUPPLIED |
| 12 | `prop.town.slice.rubbish-can` | `artwork/staging/phase-8a/rubbish-crushed-can/v1/rubbish-crushed-can.v1.png` | 64×64 PNG | NOT SUPPLIED |
| 13 | `prop.town.slice.flower-planter` | `artwork/staging/phase-8a/flower-planter/v1/flower-planter.v1.png` | 64×64 PNG | NOT SUPPLIED |
| 14 | `character.player.slice.resident` | `artwork/staging/phase-8a/player-resident-walk/v1/player-resident-walk.v1.png` | 256×256 PNG, 4×4 | NOT SUPPLIED |
| 15 | `character.npc.slice.resident-a` | `artwork/staging/phase-8a/npc-resident-a-walk/v1/npc-resident-a-walk.v1.png` | 256×256 PNG, 4×4 | NOT SUPPLIED |
| 16 | `character.animal.slice.dog` | `artwork/staging/phase-8a/animal-dog-walk/v1/animal-dog-walk.v1.png` | 192×160 PNG, 4×4 | NOT SUPPLIED |
| 17 | `ui.town.slice.lawn-interaction` | `artwork/staging/phase-8a/lawn-interaction-prompt/v1/lawn-interaction-prompt.v1.png` | 128×64 PNG, 2×1 | NOT SUPPLIED |
| 18 | `ui.town.slice.coin-reward-burst` | `artwork/staging/phase-8a/coin-reward-burst/v1/coin-reward-burst.v1.png` | 384×64 PNG, 6×1 | NOT SUPPLIED |
| 19 | `minigame.lawn.slice.board-tiles` | `artwork/staging/phase-8a/lawn-care-board-tiles/v1/lawn-care-board-tiles.v1.png` | 256×64 PNG, 4×1 | NOT SUPPLIED |
| 20 | `minigame.lawn.slice.weed-tiles` | `artwork/staging/phase-8a/lawn-care-weed-tiles/v1/lawn-care-weed-tiles.v1.png` | 192×64 PNG, 3×1 | NOT SUPPLIED |
| 21 | `minigame.lawn.slice.mower` | `artwork/staging/phase-8a/lawn-care-mower/v1/lawn-care-mower.v1.png` | 256×64 PNG, 4×1 | NOT SUPPLIED |
| 22 | `ui.lawn.slice.controls` | `artwork/staging/phase-8a/lawn-care-essential-controls/v1/lawn-care-essential-controls.v1.png` | 192×64 PNG, 3×1 | NOT SUPPLIED |

## Rejected candidates

| Candidate | Intended contract | Finding | Disposition |
| --- | --- | --- | --- |
| `/Users/youyoulu/Desktop/Kindworks/lawn-mower,-top-down-view-frames.zip` | `minigame.lawn.slice.mower` | Four separate 64×64 RGBA PNG files dated 2026-08-18. Phase 8A requires one approved 256×64, four-frame sheet in down/left/right/up order. The archive has no Phase 8A semantic ID, contract filename, approval record, or generator provenance. | REJECTED — not copied, combined, renamed, resampled, or integrated. It may be resubmitted as an explicitly approved Phase 8A candidate after review. |
| `/Users/youyoulu/Desktop/Willowmere Shop_ Mower Collection.png` | none | 1448×1086 RGB shop-reference composition. It is a reference screen, not an isolated vertical-slice runtime asset and matches no Phase 8A canvas contract. | REJECTED — remains reference-only. |

## Acceptance-gate status

| Phase 8B requirement | Status |
| --- | --- |
| Contract validation before integration | BLOCKED — 0/22 supplied |
| Staging and automated image validation | BLOCKED — no Phase 8A files to stage |
| Asset Lab review of valid outputs | BLOCKED — placeholders only |
| Semantic manifest/prefab/layout integration | NOT STARTED — prevents placeholder promotion |
| House/lawn/terrain/tree/animation checks | BLOCKED — replacement artwork absent |
| Viewport, overlay, old-save and gameplay regression | DEFERRED — no valid integration exists to test |
| No missing textures or fallbacks | CANNOT PASS — all 22 would currently use placeholders/fallbacks |

**Phase 8B verdict: FAIL — APPROVED ARTWORK INPUT REQUIRED.**

To resume safely, supply the contract-named Phase 8A PNG files, or attach the generated candidates and explicitly identify which are approved. Each supplied file will then be staged, validated, reviewed in Asset Lab, and either integrated or reported separately as failed/revised.
