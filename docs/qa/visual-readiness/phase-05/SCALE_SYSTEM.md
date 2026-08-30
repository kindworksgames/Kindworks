# KindWorks Scale, Depth and Geometry Contract

Schema version: 1  
Measured: 2026-08-29  
Pilot family: Town bins  
Representative data-driven scene: Fishing

## Canonical space

KindWorks keeps the Phaser configuration already used by the running game: **1280×720 landscape**. One Phaser world unit equals one canonical display pixel at this reference size. Town remains **4200×2800 world units**; Phase 5 does not resize the map or alter any saved coordinate.

The reference grid uses an 8-unit fine snap and a 32-unit layout module. These values describe layout authoring. They do not quantise player movement, NPC movement, collisions or saved placements.

## Artwork density and display scale

- Existing art establishes a baseline of 1 native pixel per logical unit.
- Replacement sources may be authored at 1×, 2× or 4× native density.
- Prefab logical visual bounds, not PNG dimensions, determine displayed size.
- Phaser remains configured with `pixelArt: true`, `roundPixels: true`, nearest-neighbour filtering, `FIT` and centred scaling.
- A 4096×4096 replacement house fixture still displays at 195×145 logical units. A 4096×4096 tree fixture still displays at 87×97 logical units with its independent 50-unit footprint.

## Main measuring reference

The current player is the primary scale reference because it is a stable, generated Phaser texture already present in the live game:

| Property | Measured value |
| --- | ---: |
| Native/display size | 40×54 |
| Origin | 0.5, 0.88 |
| Ground-contact offset | 0, 0 |
| Shared shadow | 31×12 at +18 Y |

The current NPC interactive body is 42×66, with a core/shadow ground offset of +19 Y. These measurements are calibration references, not permission to change resident gameplay bodies.

## Measured world references

| Surface/object | Current logical measurement |
| --- | --- |
| Roads | 50–76 wide, plus 16-unit edge treatment |
| Pavement/paths | 25–26 wide, plus 8-unit edge treatment |
| River | 188 water / 226 including banks |
| Houses | 190×140 compact; 195×145 standard |
| Personal-house scale range | 0.68–1.22 |
| Lawns | 300×290; 310×340; 310×410 |
| Town tree | 87×97 visual; +33 Y ground contact; radius-50 footprint |
| Bench | about 80×50 visual; radius-42 footprint |
| Bin pilot | 54×54 visual; radius-28 placement footprint |
| Standard displayed door | 34×61 |

The fence specimen in the calibration scene is a labelled 96×32 grid-aligned calibration-only object. It is not presented as a recovered production fence prefab.

## Depth and occlusion

Named layers replace unexplained scene-local depth numbers for migrated prefabs:

| Layer | Base | Behaviour |
| --- | ---: | --- |
| terrain | 0 | Fixed background |
| water-and-banks | 4 | Fixed world surface |
| roads-and-paths | 10 | Fixed world surface |
| ground-details | 20 | Fixed low detail |
| buildings | 60 | Fixed building layer |
| ground-sorted | 200 | `200 + groundY / 10` |
| interaction-guides | 475 | Above world visuals |
| foreground | 490 | Authored foreground masks only |
| placement-preview | 520 | Preview plus ground Y sorting |
| HUD | 1000 | Never participates in world sorting |

Ground-sorted objects compare their ground-contact world Y. An actor with a smaller ground Y renders behind; a larger ground Y renders in front. Background layers render below the prefab main layer. Foreground layers are reserved for explicitly authored occluders and must not move collision or interaction geometry.

## Ground anchors and shadows

The standard anchor is the point where an object meets the walkable ground. Prefabs may define a measured offset from their instance position. The pilot bin uses `(0,+23)` because its legacy instance position is not the bottom of the visual.

Every prefab declares exactly one shadow policy:

- `shared-ground-shadow` for the reusable resident/prop shadow treatment;
- `custom-authored-shadow` when existing presentation includes a family-specific shadow;
- `no-shadow` for flat surfaces, sockets and objects that intentionally have none.

## Five separate geometry contracts

Visual bounds, collision, navigation, interaction and touch geometry are independent fields. Changing native artwork dimensions cannot implicitly change any of the other four. A prefab may legitimately have no collision or no interaction, but that absence must be explicit.

The minimum mobile touch target remains **44 CSS pixels**. The canonical HUD inset is 16 units, with at least 4 CSS pixels after fitting, plus supported CSS safe-area environment insets.

## Device and camera fitting

The production canvas keeps its 1280×720 render buffer and uses aspect-preserving `FIT` scaling:

| Profile | Viewport | Measured fitted canvas |
| --- | ---: | ---: |
| Narrow phone | 568×320 | 568×319.5 |
| Modern phone | 844×390 | 693.333×390, centred |
| 4:3 tablet | 1024×768 | 1024×576, centred |
| Reference | 1280×720 | 1280×720 |
| Desktop QA | 1366×768 | 1365.333×768, centred |

Town retains its existing camera range of 0.28–1.3 and its existing initial 0.30 narrow-phone / 0.39 standard zoom rules. Phase 5 does not change device difficulty or world visibility.

## Development calibration route

Development only: `?qa=scale-calibration`

The route draws the actual player and NPC, both measured house sizes, oversized-source proof, tree, door, bench, pilot bin, fence, road, pavement, river, lawn, 8/32-unit ruler, five viewport frames and separate geometry overlays. Tap or arrow input moves the player; `G` toggles geometry. The route and its identifying markers are prohibited by the production-surface audit.

Authoritative executable definitions live in:

- `src/visual/scale/scaleSystem.js`
- `src/visual/scale/calibrationFixtures.js`
- `scripts/validate-scale-system.mjs`

