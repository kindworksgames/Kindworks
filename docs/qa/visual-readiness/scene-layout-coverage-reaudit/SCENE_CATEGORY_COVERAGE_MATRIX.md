# Independent Scene-Layout Coverage Matrix

`Surface-only` means the catalogue identifies a canvas/HUD boundary but has no stable object-level instances for the scene. Literal counts are heuristic occurrences in the production scene file; restaurant scenes additionally inherit the shared renderer's 276 occurrences.

| Scene | Category | Layout kind | Stable instances | Direct literals | Inherited literals | Independent status |
| --- | --- | --- | ---: | ---: | ---: | --- |
| BootScene | Transition | legacy-boundary | 0 | 0 | 0 | ACCEPTABLE TRANSITION BOUNDARY |
| TownScene | World | legacy-boundary | 0 | 310 | 0 | FAIL — surface-only; visual/collision coupling confirmed |
| HouseInteriorScene | Interior | legacy-boundary | 0 | 67 | 0 | FAIL — surface-only; room/persistent furniture placement remains local |
| VillageGrocerScene | Shop | legacy-boundary | 0 | 44 | 0 | FAIL — visual fixtures also define interaction geometry |
| PawsWondersScene | Shop | legacy-boundary | 0 | 80 | 0 | FAIL — surface-only interior/shop placement |
| HarbourGeneralScene | Shop/business | legacy-boundary | 0 | 114 | 0 | FAIL — surface-only interior/business placement |
| BakeryScene | Restaurant/service | legacy-boundary | 0 | 0 | 276 | FAIL — shared hard-coded renderer |
| CafeScene | Restaurant/service | legacy-boundary | 0 | 0 | 276 | FAIL — shared hard-coded renderer |
| MorningMugScene | Restaurant/service | legacy-boundary | 0 | 0 | 276 | FAIL — shared hard-coded renderer |
| RiversideKitchenScene | Restaurant/service | legacy-boundary | 0 | 0 | 276 | FAIL — shared hard-coded renderer |
| SouthShoreScoopsScene | Restaurant/service | legacy-boundary | 0 | 0 | 0 | FAIL — scene-specific surface-only presentation |
| RiverClearoutScene | Cleanup minigame | legacy-boundary | 0 | 13 | 0 | FAIL — procedural board shell; no exception inventory |
| HouseRescueScene | Cleanup minigame | legacy-boundary | 0 | 11 | 0 | FAIL — procedural interior shell; no exception inventory |
| WasteCollectionScene | Cleanup minigame | legacy-boundary | 0 | 14 | 0 | FAIL — procedural board/card presentation |
| LawnCareScene | Cleanup minigame | legacy-boundary | 0 | 8 | 0 | FAIL — procedural board presentation |
| BeachCleanupScene | Cleanup minigame | legacy-boundary | 0 | 3 | 0 | FAIL — procedural board presentation |
| PlaygroundPowerwashScene | Cleanup/action minigame | legacy-boundary | 0 | 9 | 0 | FAIL — procedural board and separate canvas presentation |
| FishingScene | Action minigame | object-layout | 12 | 38 | 0 | PARTIAL — valid pilot, remaining literals need disposition |

## Global and overlay surfaces

The global catalogue lists thirteen selector boundaries: Town menu, onboarding, Impact, NPC story, placed-object, homeowner gift, save, economy, shop, custom resident, farming, animal friends, and world lighting. They have no object-level layout definitions. The global stylesheet contains 2,040 numeric placement/sizing lines; these require classification rather than automatic migration because many are legitimate responsive UI rules.

## Approval rule for the next re-audit

A scene can pass when either:

1. its stable visual objects use validated object-level layout data and production consumes those definitions; or
2. every remaining placement is explicitly classified as prefab-internal, responsive UI, gameplay-derived, dynamic/transient, or a reviewed intentional coupling, with tests that protect collision, navigation, interaction, and persistent state.

A catalogue surface entry by itself is not sufficient.
