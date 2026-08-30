# Visual Surface Inventory

## Inventory rules

A surface is counted when it is player-visible, changes presentation state, or exists as a development-only screen capable of entering/inspecting production scenes. Runtime status is based on the existing Stage 2 matrix, current source inspection, tests and the Phase 0 smoke run. “Accounted” does not mean pixel-perfect.

## Phaser scenes

| Scene key | Source | Principal visual surfaces | Entry / exit | Current status |
| --- | --- | --- | --- | --- |
| `BootScene` | `src/scenes/BootScene.js` | Loading canvas, generated resident textures, animal sheet preload, interrupted-activity recovery | Application start → Town/resumed activity | Accounted; runtime PASS |
| `TownScene` | `src/scenes/TownScene.js` | Whole Willowmere map, player, NPCs, animals, municipal vehicle, houses/lawns, shops, landmarks, environment, interactions | Boot/interior/minigame returns; enters all connected content | Accounted; runtime PASS with Stage 2 presentation finding |
| `HouseInteriorScene` | `src/scenes/HouseInteriorScene.js` | NPC and personal-home room plans, furniture placement/tray, resident/pet presence | Town house door ↔ Town | Accounted; Stage 2 P3 root-marker defect open |
| `VillageGrocerScene` | `src/scenes/VillageGrocerScene.js` | Shelf/category interior and shared item-detail/purchase panel | Town Grocer ↔ Town | Accounted; runtime smoke PASS |
| `PawsWondersScene` | `src/scenes/PawsWondersScene.js` | Pet shop floor, species fixtures, selected-pet UI | Town Paws & Wonders ↔ Town | Accounted; normal doorway runtime path remains partially covered |
| `HarbourGeneralScene` | `src/scenes/HarbourGeneralScene.js` | Seaside shop, shelf/restock loop, selected-item panel | Town Harbour General ↔ Town | Accounted; test/source PASS |
| `BakeryScene` | `src/scenes/BakeryScene.js` | Level picker, service shift, result | Town Little Bakery ↔ Town | Accounted; tests/source PASS |
| `CafeScene` | `src/scenes/CafeScene.js` | Level picker, dining/order/kitchen shift, result | Town Corner Café ↔ Town | Accounted; runtime smoke PASS |
| `MorningMugScene` | `src/scenes/MorningMugScene.js` | Level picker, coffee service shift, result | Town Morning Mug ↔ Town | Accounted; tests/source PASS |
| `RiversideKitchenScene` | `src/scenes/RiversideKitchenScene.js` | Level picker, preparation/heat/plating shift, result | Town Riverside Kitchen ↔ Town | Accounted; tests/source PASS |
| `SouthShoreScoopsScene` | `src/scenes/SouthShoreScoopsScene.js` | Level picker, ice-cream counter shift, result | Town Scoops ↔ Town | Accounted; tests/source PASS; explicit 100-item visual manifest exists |
| `RiverClearoutScene` | `src/scenes/RiverClearoutScene.js` | Portrait falling-piece board, HUD, result, rotate-upright gate | Town river job ↔ Town | Accounted; portrait/landscape smoke PASS |
| `HouseRescueScene` | `src/scenes/HouseRescueScene.js` | Room board, sort phase, vacuum phase, result | Town house job ↔ Town | Accounted; runtime smoke PASS |
| `WasteCollectionScene` | `src/scenes/WasteCollectionScene.js` | Scattered cards, five-slot tray, HUD/result | Town cleanup job ↔ Town | Accounted; tests/source PASS |
| `LawnCareScene` | `src/scenes/LawnCareScene.js` | Full board, mower, board-bottom undo/hint, exit | Town lawn job ↔ Town | Accounted; 568×320 smoke PASS |
| `BeachCleanupScene` | `src/scenes/BeachCleanupScene.js` | Boardwalk/sand board, rake pattern, litter, result | Town beach job ↔ Town | Accounted; tests/source PASS |
| `PlaygroundPowerwashScene` | `src/scenes/PlaygroundPowerwashScene.js` | Full-screen layered wash canvas, in-board tools, result | Town playground job ↔ Town | Accounted; 1024×768 smoke PASS |
| `FishingScene` | `src/scenes/FishingScene.js` | Reedbank fishing, magnet fishing, casting/reeling, result/reward states | Town fishing spots ↔ Town | Accounted; tests/source PASS |

All scene registrations were found in `src/main.js` and `src/scenes/lazyScenes.js`; no additional scene file is unregistered.

## Town world areas and landmarks

| Class | Accounted surfaces |
| --- | --- |
| Districts / named areas | North Cottages, Old Market, Willow Commons, Willow Cottages, High Street, East Cottages, South Meadow, Willow Allotments, Reedbank, South Shore |
| Terrain and traversal | Grass, roads, pavements/paths, river, river banks and rocks, three bridges, ponds, beach, harbour/dock, forest boundary, allotment plots, house lawns |
| Residential | 19 authored physical houses plus reserved personal-home identity/placement; house-size and room-plan variants |
| Active shops / venues | Corner Café, Village Grocer, Little Bakery, Riverside Kitchen, Morning Mug, Harbour General, Fresh Market interface, Paws & Wonders, South Shore Scoops |
| Ambient / non-minigame venues | Willow Arms, Riverstone, KindWorks Cinema |
| Restoration / job landmarks | Willow Commons fountain/playground, river job, beach cleanup, fishing spots, hidden fishing zone, waste/environment jobs, house and lawn jobs |
| World systems with visuals | NPC routes/thoughts/selection, pet follower/roaming animals, municipal collection, litter/pollution, farming/orchard, day/weather lighting, restoration milestones, placed town objects |

The authoritative geometry and object coordinates are primarily in `src/data/town.js`; additional presentation geometry remains embedded in `TownScene.js`.

## DOM interfaces, panels, dialogs and overlays

The root `index.html` contains 592 element IDs. The following 73 major section/aside/dialog/nav surfaces were individually identified:

### Global and town

- Town menu panel.
- Onboarding panel and first-session checklist.
- Login reward toast.
- NPC story panel and story list.
- Interaction prompt.
- Town placement banner and placed-object panel.
- Resident-control banner.
- Restoration milestone reveal.
- Homeowner gift panel.
- Save panel.
- Economy panel, wallet view, inventory view and commerce view.
- Shop panel.
- Custom-resident creator.
- Personal-home progression.
- Farming panel.
- Animal-friends panel and animal list.
- Landscape/portrait rotate-device screen.

### Shop and interior HUD roots

- Village Grocer HUD.
- Paws & Wonders HUD.
- Harbour General HUD.
- Home Interior HUD.
- Home furniture placement overlay and furniture tray.

### Minigame HUD / gameplay / result groups

- Playground Power Wash: HUD, gameplay, result.
- Beach Cleanup: HUD, gameplay, result.
- Lawn Care: HUD, gameplay, result.
- House Rescue: HUD, gameplay, sort, vacuum, result.
- River Restoration: HUD, gameplay, result.
- Corner Café: HUD, picker, shift, result.
- Morning Mug: HUD, picker, shift, result.
- Riverside Kitchen: HUD, picker, shift, result.
- South Shore Scoops: HUD, picker, shift, result.
- Little Bakery: HUD, picker, shift, result.
- Fishing HUD and its scene-rendered mode/result surfaces.
- Waste campaign: HUD, gameplay, result.
- Shared cleanup HUD and cleanup result.

The remaining IDs are controls, counters, text nodes, lists, cards and subcontainers owned by these surfaces. They are covered by the DOM label inventory and CSS selector audit.

## Shared loading, error, notification and dialog systems

| Surface | Owner |
| --- | --- |
| Loading and error overlays | `src/ui/SharedOverlayController.js` |
| Orientation gate | `index.html`, `src/ui/ResponsiveShellController.js`, `src/style.css` |
| Interaction feedback | `src/ui/InteractionFeedbackController.js` |
| Save status | `src/ui/SaveStatusController.js` |
| Resource/world HUD | `src/ui/EconomyHudController.js`, `src/ui/WorldHudController.js` |
| Town menu and context panels | `src/ui/TownMenuController.js`, `src/ui/ShopController.js`, related controllers |
| Narrative / onboarding / gifts | `NpcNarrativeController`, `OnboardingController`, `HomeownerGiftController` |
| Milestone / impact | `RestorationMilestoneController`, `ImpactController` |
| Restaurant visuals | `src/ui/RestaurantPresentation.js` plus scene-specific DOM roots |

## Development-only screens and controls

| Surface | Activation | Production requirement |
| --- | --- | --- |
| Fidelity QA activity/level panel | `?qa=fidelity`, `src/qa/FidelityQaHarness.js` | Must remain opt-in and absent from normal production UI |
| Narrative/fixture routes | QA query modes used by automated tests | Must remain isolated from real saves |
| Development commerce bridge | Local development billing path | Must never be treated as external billing |
| Sprite AI inventory API | `window.KindWorksSpriteAI` | Development/export utility; labels may exist in production DOM but tooling must not expose player controls |
| Diagnostic data attributes | Body/root datasets | May support tests; raw IDs/statistics must not be player-visible |

## Reachability and completeness notes

- No Phaser scene is absent from the registration inventory.
- Some venue labels in Town are ambient rather than separate playable scenes; this is a product/parity distinction, not an omitted scene registration.
- Fresh Market is a shared modal/interface, not a dedicated Phaser scene.
- Personal-home interior deliberately begins with a bed-only configuration; ordinary NPC houses use authored room plans.
- Existing Stage 2 QA has one partial normal doorway check for Paws & Wonders and broader physical-device coverage gaps. These do not hide any additional scene from the inventory.

