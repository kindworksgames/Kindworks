# Hard-coded placement inventory

The machine-readable inventory is [EVIDENCE.json](EVIDENCE.json), under `hardCodedInventory.recordsDetail`. It records file, line, category, occurrence count, scope, migration classification and source snippet for every matched production/development candidate.

## Method and limits

The audit scanned every JavaScript and CSS source under `src/` plus `index.html` for:

- Phaser creation coordinates;
- `setPosition`, origin, scale/display size, angle/rotation/flip, depth, visibility, alpha, tint and animation calls;
- procedural drawing geometry;
- interaction/hit-area geometry;
- CSS placement properties;
- all responsive media queries.

The result is deliberately over-inclusive. Gameplay coordinates in `src/data/town.js`, board coordinates and CSS typographic spacing are evidence that must be classified, not instructions to move every number into one scene JSON file. The repair must retain protected gameplay geometry and move only presentation ownership.

## Totals

| Category | Occurrences |
| --- | ---: |
| Position | 1,479 |
| Scale or size | 617 |
| Origin | 151 |
| Rotation or flip | 58 |
| Depth | 274 |
| Appearance state (visible/alpha/tint/animation/state) | 194 |
| Procedural graphics geometry | 789 |
| Interaction/collision/navigation/touch review | 146 |
| CSS placement | 3,775 |
| Responsive breakpoints | 82 |
| **Total** | **7,565** |

There are 5,288 line-level records and 7,320 occurrences in production scope. Development calibration/overlay tools account for the balance.

## Highest-coupling production files

| File | Occurrences | Classification |
| --- | ---: | --- |
| `src/style.css` | 3,522 | DOM/HUD visual layout and 77 responsive-breakpoint occurrences; migrate by component tokens/layout definitions, not one monolithic scene file. |
| `src/scenes/TownScene.js` | 537 | Highest-priority scene extraction; mixes procedural visuals, state presentation, depth and gameplay-adjacent geometry. |
| `src/data/town.js` | 367 | Mixed authored world layout and protected gameplay coordinates; requires an explicit geometry boundary before extraction. |
| `src/shop-reference.css` | 335 | Shop/reference DOM composition and five breakpoint occurrences. |
| `src/ui/RestaurantPresentation.js` | 283 | Shared but hard-coded venue composition; should become venue layout recipes with semantic stations. |
| `src/scenes/HarbourGeneralScene.js` | 142 | Procedural shop layout. |
| `src/scenes/FishingScene.js` | 126 | Partly layout-driven, but still contains runtime offsets/effects and manual property consumption. |
| `src/scenes/PawsWondersScene.js` | 108 | Procedural shop layout. |
| `src/scenes/HouseInteriorScene.js` | 90 | Data-mapped room plan plus hard-coded projection/drawing. |
| `src/entities/AnimalCharacter.js` | 86 | Entity presentation, movement/depth and procedural fallback rendering. |
| `src/rendering/LegacyPowerwashRenderer.js` | 84 | Custom-canvas visual/gameplay geometry boundary. |
| `src/entities/TownPlacedObject.js` | 74 | Persistent transform plus procedural visual geometry; needs strict transform ownership. |

## Exact scene-level counts

| Scene file | Occurrences | Current scene layout |
| --- | ---: | --- |
| `TownScene` | 537 | None |
| `HarbourGeneralScene` | 142 | None |
| `FishingScene` | 126 | Fishing pilot |
| `PawsWondersScene` | 108 | None |
| `HouseInteriorScene` | 90 | None |
| `ScaleCalibrationScene` | 97 | Development calibration only |
| `VillageGrocerScene` | 59 | None |
| `WasteCollectionScene` | 24 | Deterministic visual scatter helper only |
| `RiverClearoutScene` | 21 | None |
| `PlaygroundPowerwashScene` | 18 | None |
| `HouseRescueScene` | 16 | Gameplay geometry helper only |
| `LawnCareScene` | 16 | None |
| `BeachCleanupScene` | 11 | None |
| `MorningMugScene` | 5 | Shared renderer only |
| `RiversideKitchenScene` | 5 | Shared renderer only |
| `SouthShoreScoopsScene` | 5 | Shared renderer only |
| `BakeryScene` | 4 | Shared renderer only |
| `CafeScene` | 4 | Shared renderer only |
| `BootScene` | 0 | N/A |

The full file/line inventory is kept in JSON so repair work can mark entries as `visual-layout`, `prefab`, `responsive-component`, `protected-gameplay`, or `justified-local-effect` without losing traceability.
