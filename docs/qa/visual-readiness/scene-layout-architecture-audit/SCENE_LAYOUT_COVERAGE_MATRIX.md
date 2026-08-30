# Scene-layout coverage matrix

Audit date: 2026-08-30  
Baseline: branch `phase-2-ui-simplification`, commit `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`

Status meaning:

- **PASS**: placement is controlled by a validated scene-layout contract and the runtime consumes it without duplicating the values.
- **PARTIAL**: some authored data exists, but presentation still depends on scene/UI literals or the contract is not enforceable.
- **FAIL**: there is no versioned scene layout capable of controlling the requested presentation properties.
- **N/A**: no persistent artwork placement is expected for that surface.

## Phaser scene coverage

| Scene/surface | Current placement source | Stateful variants covered | Layout status | Evidence / principal gap |
| --- | --- | --- | --- | --- |
| `BootScene` | Loader and generated-player code | Loading, recovery | N/A | Transitional scene has no persistent composition; asset pack only. |
| `TownScene` | `src/data/town.js`, scene literals, entity literals, visual factories, DOM/CSS | Day/night/weather, house dirt/clean, four lawn states, restoration, pollution, farming, placed objects | **FAIL** | No scene-layout definition. 537 scene-level transform/geometry occurrences; town data mixes authored visual regions with protected gameplay doors, roads, routes and radii. Only bins use prefabs. |
| `HouseInteriorScene` | `src/data/homeInteriors.js`, `HomeInteriorService`, scene literals, DOM/CSS | Personal/NPC plans, clean/dirty entry, furniture placement, house upgrades | **FAIL** | Useful room-plan data exists but is not scene-layout schema validated; scene maps and draws it with 90 transform/geometry occurrences. Personal furniture coordinates are persistent gameplay data and need a visual-offset layer, not migration into presentation data. |
| `VillageGrocerScene` | `src/data/villageGrocer.js`, scene literals, DOM/CSS | Selected product, owned/affordable states | **FAIL** | Product data exists; fixture/shelf/detail-panel placement is not a scene layout. 59 scene-level occurrences. |
| `PawsWondersScene` | `src/data/pawsWonders.js`, scene literals, DOM/CSS | Species/selection/adoption states | **FAIL** | Stock data exists; shop floor and fixtures remain procedural. 108 scene-level occurrences. |
| `HarbourGeneralScene` | `src/data/harbourGeneral.js`, scene literals, DOM/CSS | Stock, shelf, selected product, sales | **FAIL** | Catalogue data exists; shop floor, shelves, counter and panel remain procedural. 142 scene-level occurrences. |
| `BakeryScene` | Shared `RestaurantPresentation.js`, HTML/CSS | Picker/shift/result, order and appliance states | **FAIL** | Scene file delegates visuals, but shared renderer contains 283 hard-coded transform/geometry occurrences and has no scene layout. |
| `CafeScene` | Shared `RestaurantPresentation.js`, HTML/CSS | Picker/shift/result, customers/orders/trays | **FAIL** | Same shared hard-coded restaurant composition; no semantic stations/sockets layout. |
| `MorningMugScene` | Shared `RestaurantPresentation.js`, HTML/CSS | Picker/shift/result, drink/appliance states | **FAIL** | Same shared hard-coded composition; no versioned venue layout. |
| `RiversideKitchenScene` | Shared `RestaurantPresentation.js`, HTML/CSS | Picker/shift/result, heat/plating states | **FAIL** | Same shared hard-coded composition; stations and navigation visuals are not layout-controlled. |
| `SouthShoreScoopsScene` | Shared/bespoke `RestaurantPresentation.js`, HTML/CSS | Picker/shift/result, customer/build/order states | **FAIL** | Asset labels exist, but composition and repeated objects are hard-coded and not schema validated. |
| `RiverClearoutScene` | Scene literals, HTML/CSS | Tutorial, play, pause/result, portrait orientation | **FAIL** | Board and UI are not represented as layout instances/zones; 21 scene-level occurrences plus CSS. |
| `HouseRescueScene` | `houseRescueGeometry.js`, generated DOM markup, CSS, scene literals | Room sizes, sort/vacuum, clean/dirty, result | **FAIL** | Gameplay room geometry is data-driven, but display mapping and responsive composition are not in a visual layout; no enforced separation contract. |
| `WasteCollectionScene` | Engine coordinates, `WasteCardLayout.js`, DOM/CSS | Covered/exposed/selected/removed cards, tray/result | **PARTIAL** | Visual scatter is intentionally separated from engine coordinates and deterministic. It is not versioned, schema validated or integrated with the scene-layout catalogue. |
| `LawnCareScene` | Level board data, scene literals, DOM/CSS | Mower facing, cut/uncut/weed, undo/hint/result | **FAIL** | Board geometry is gameplay data; presentation, HUD anchors and object visuals have no scene layout. 16 scene-level occurrences plus CSS. |
| `BeachCleanupScene` | Level data, scene literals, DOM/CSS | Rake path, rubbish reveal, tutorial/result | **FAIL** | Board data is gameplay-authoritative; visual composition and HUD remain procedural/CSS. |
| `PlaygroundPowerwashScene` | Scene literals, `LegacyPowerwashRenderer`, HTML/CSS | Dirt layers, nozzle/tool, progress/result | **FAIL** | Custom canvas renderer has 84 additional geometry occurrences; visual masks and gameplay wash geometry require explicit distinct contracts. |
| `FishingScene` | `FISHING_SCENE_LAYOUT`, manual scene consumer, DOM/CSS | Fishing/magnet variants, cast/reel/result | **PARTIAL** | Only production scene with a versioned layout. Position/origin/depth/angle are manually consumed. Validator accepts nine unsafe mutations and does not cover most requested properties. |
| `ScaleCalibrationScene` (development) | Scene literals plus scale contracts | Supported profiles/geometry overlays | **PARTIAL** | Correctly development-only, but is a calibration renderer rather than a reusable scene-layout consumer. |
| `AssetLabScene` (development) | Semantic registry/prefabs | Asset state/variant/facing/layers | **PARTIAL** | Strong asset/prefab inspection, not scene composition; it does not prove scene layout coverage. |

Production scene-layout coverage is **1 of 18 scenes (5.6%)**, and that one scene is PARTIAL rather than a closed-contract PASS.

## Overlays, HUDs, popups, tutorials and transitions

| Surface family | Current owner | Layout status | Finding |
| --- | --- | --- | --- |
| Global loading/error/notification | `SharedOverlayController`, HTML/CSS | **FAIL** | No versioned instances, safe-area anchors or layout validation. |
| Landscape/portrait orientation gate | `ResponsiveShellController`, HTML/CSS | **PARTIAL** | Functional orientation policy exists; geometry is CSS-only and not tied to layout safe-area data. |
| Town HUD/menu/interaction prompt | `TownMenuController`, `InteractionFeedbackController`, HTML/CSS | **FAIL** | Responsive placement lives in CSS; no semantic HUD layout. |
| Economy/inventory/shop/save panels | UI controllers, HTML/CSS | **FAIL** | Data-driven content but fixed DOM structure and CSS composition. |
| NPC narrative/onboarding/gifts/restoration/impact | UI controllers, HTML/CSS | **FAIL** | Conditional logic is testable, but presentation conditions/anchors are outside the scene-layout system. |
| Placement banner/object popup | `TownScene`, HTML/CSS | **FAIL** | Visual UI and persistent object coordinates meet in scene code; no explicit visual-offset contract. |
| Grocer/Paws/Harbour/Home HUDs | Scene controllers, HTML/CSS | **FAIL** | No scene-layout definitions. |
| Restaurant picker/shift/result shells | Five scene controllers, `RestaurantPresentation`, HTML/CSS | **FAIL** | Shared renderer reduces duplication but remains hard-coded rather than data-driven. |
| Cleanup/action HUD/result shells | Scene controllers, HTML/CSS | **FAIL** | No versioned UI layout or responsive-anchor schema. |
| Fishing HUD | `FishingScene`, HTML/CSS | **FAIL** | Fishing canvas has a layout; its HUD does not. |
| Reference Overlay Mode | `ReferenceOverlayController` | **PARTIAL** | Works only with Fishing and exposes the validator's incomplete contract. |
| Scene QA Overlay | `SceneQaOverlayController` | **PARTIAL** | Useful debugging labels/geometry, but not a general layout editor/catalogue. |

## State-selection coverage

| State family | Current selection mechanism | Layout readiness |
| --- | --- | --- |
| Town day/night/weather | `WorldSimulationService`, `WorldHudController`, `TownScene` alpha/lighting calls | State is deterministic, but visual mapping is not a layout/state-map contract. |
| House dirty/clean | Save/progression data plus `TownScene` procedural drawing | Gameplay state is protected; visual selection remains scene-coupled. |
| Lawn four-stage growth | Living environment data plus `TownScene` drawing | State source is sound; presentation is not semantic-layout controlled. |
| Restoration/pollution | Persistent systems plus procedural Town layers | State transitions are protected; coordinates and drawing are hard-coded. |
| Personal-house upgrades | Personal-home state plus scale/style branches | Upgrade state is persistent; visuals are not resolved through scene-layout variants. |
| Minigame play/result/tutorial | Scene/service state plus DOM class toggles | Deterministic runtime state, but no validated presentation-state definitions. |
