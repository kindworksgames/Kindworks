# KindWorks Complete Game Inventory

Status vocabulary:

- **LIVE** — opened/observed in this Stage 1 browser run.
- **AUTOMATED** — covered by a passing current automated test but not manually forced open in this stage.
- **SOURCE** — registered/reachable source path confirmed; conditional surface not manually opened here.
- **AMBIENT** — visible world feature with simulation use but no player interior/action screen.
- **DEV ONLY** — deliberately unavailable in production.

## Phaser scene inventory

| Scene / identifier | Source | Player entry | Exit / return | Unlock or precondition | Durable save dependency | Reachability / current runtime |
| --- | --- | --- | --- | --- | --- | --- |
| `BootScene` | `src/scenes/BootScene.js` | Phaser boot list in `src/main.js` | Starts recovered activity or `TownScene`; failed lazy recovery returns to Town | None | Reads activity checkpoints via `PersistentActivityRecoveryService` | LIVE transiently in dev and production; registered eagerly |
| `TownScene` | `src/scenes/TownScene.js` | Boot default and return from all activities | Continuous hub | None | Player/Town position, world, NPCs, environment, placements, farming, animals, milestones | LIVE in dev and production |
| `HouseInteriorScene` | `src/scenes/HouseInteriorScene.js` | Tap any authored house; personal furniture can focus Meadowlight House | `home-interior-exit` returns to saved Town position | House exists; personal furniture is restricted to `house-20` | `homeInteriors`, `customResident`, `aquarium`, `houseRescue` visits | LIVE through fidelity harness |
| `VillageGrocerScene` | `src/scenes/VillageGrocerScene.js` | Village Grocer door | Close selected-product panel, then `grocer-exit` | None | Economy/inventory and farming seed/sapling stock | LIVE; product panel and return path operated |
| `PawsWondersScene` | `src/scenes/PawsWondersScene.js` | Paws & Wonders door | `paws-exit` | Ordinary companions available; baby triceratops requires 3 restoration milestones | Coins, adoption ownership, active companion, restoration count | SOURCE + AUTOMATED; scene registered and Town route exists; not manually entered in this stage |
| `HarbourGeneralScene` | `src/scenes/HarbourGeneralScene.js` | Harbour General door; activation can purchase deed | `harbour-exit` | Deed purchase required before normal management; QA harness prepares ownership | Coins, ownership, stock, display slots, till, sales, NPC purchase history | LIVE through fidelity harness |
| `BakeryScene` | `src/scenes/BakeryScene.js` | Little Bakery door | `bakery-exit` | None beyond normal interaction availability | 150-level progression, active shift/checkpoint, rewards | LIVE; picker observed, normal return operated |
| `CafeScene` | `src/scenes/CafeScene.js` | Corner Café door | `cafe-exit` | None | 150-level progression, active shift/checkpoint, rewards | LIVE; picker observed, normal return operated |
| `MorningMugScene` | `src/scenes/MorningMugScene.js` | Morning Mug Coffee door | `morning-mug-exit` | None | 150-level progression, appliance state, active shift, rewards | LIVE; picker observed, normal return operated |
| `RiversideKitchenScene` | `src/scenes/RiversideKitchenScene.js` | Riverside Kitchen door | `riverside-kitchen-exit` | None | 150-level progression, exact-heat/appliance state, active shift, rewards | LIVE; picker observed, normal return operated |
| `SouthShoreScoopsScene` | `src/scenes/SouthShoreScoopsScene.js` | South Shore Café/Scoops door | `south-shore-scoops-exit` | None | 750-level progression, active shift, rewards | LIVE; picker observed, normal return operated |
| `RiverClearoutScene` | `src/scenes/RiverClearoutScene.js` | River cleanup interaction/environment target | `river-exit` | Relevant river activity; map-control mode must be exited first | 750-level progress, active board/checkpoint, environment target, rewards | LIVE; landscape correctly showed portrait rotate gate; portrait gameplay is separately automated |
| `HouseRescueScene` | `src/scenes/HouseRescueScene.js` | Dirty-house marker from a house interior/exterior flow | `house-rescue-exit` | Selected home is dirty; only one saved active house session | 750-level progress, dirty homes, sort/vacuum checkpoint, gifts/rewards | LIVE; normal cancellation return operated |
| `WasteCollectionScene` | `src/scenes/WasteCollectionScene.js` | Waste campaign/current cleanup job | Menu → `waste-campaign-exit` | Current/unlocked campaign level | 750-level progress, active board/tray checkpoint, rewards | LIVE; active board and normal return operated |
| `LawnCareScene` | `src/scenes/LawnCareScene.js` | Overgrown lawn plot | `lawn-care-exit` two-tap safe cancellation | Lawn has work available; equipped mower affects performance | 750-level progress, lawn ecology, active route/checkpoint, mower, rewards | LIVE; board-only activity and return operated |
| `BeachCleanupScene` | `src/scenes/BeachCleanupScene.js` | Dirty South Shore/beach interaction | Menu → Exit → visible Confirm Exit | Beach is dirty/current level available | 750-level progress, rake run/grooves, found items, active checkpoint, rewards | LIVE; F-01 fixed and the visible two-step return operated successfully |
| `PlaygroundPowerwashScene` | `src/scenes/PlaygroundPowerwashScene.js` | Dirty Commons Playground | `powerwash-exit` two-tap safe cancellation | Playground cleanup available | 750-level progress, pixel dirt mask, tools/supplies/checkpoint, rewards | LIVE; board and normal return operated |
| `FishingScene` (`fish`) | `src/scenes/FishingScene.js` | One of 3 fishing spots | `fishing-exit` | Daily cast limit; inventory/aquarium capacity | Catches, casts/day, streak, aquarium/inventory, active cast | LIVE; normal return operated |
| `FishingScene` (`magnet`) | `src/scenes/FishingScene.js` | Mill Bridge magnet spot | `fishing-exit` | Daily magnet pulls; bridge spot | Pulls/day, pity counters, recent finds, restoration contribution | LIVE; normal return operated |

Every `*Scene.js` file is either in the eager Phaser scene list or in `LAZY_SCENE_LOADERS`. No orphan scene file was found.

## World areas and continuous Town spaces

All areas are data-driven portions of `TownScene`, sourced from `src/data/town.js`; they do not load separate scenes. Entry/exit is free camera browsing or owned-resident movement. World, NPC, environment, placement and restoration state are their shared save dependencies.

| District | Principal authored content | Unlock | Runtime status |
| --- | --- | --- | --- |
| North Cottages | Northern houses/yards and forest edge | None | LIVE as part of Town; layout count automated |
| Old Market | Corner Café, Village Grocer, Little Bakery and parking/road loop | None | LIVE; all three interiors have routes |
| Willow Commons | pond, playground, cleanup job, paths and park | None; activity state controls job availability | LIVE; cleanup and Power Wash routes exist |
| Willow Cottages | central/southern residential row | None | LIVE; house/interior/lawn routes exist |
| High Street | Riverside Kitchen, Willow Arms, Morning Mug and commercial frontage | None | LIVE; two game venues plus one ambient pub |
| East Cottages | eastern houses and access roads | None | LIVE |
| South Meadow | companion meadow, animal activity and nearby homes | None; individual animal rules gate interactions | LIVE + automated animal coverage |
| Willow Allotments | six growing beds and farming interaction | Bed unlock progression | SOURCE + automated farming coverage |
| Reedbank | wetland, fishing, pond/aquarium catches and water edge | Fishing limits/capacity | LIVE via Fishing route |
| South Shore | harbour, beach, South Shore Café/Scoops and coastal activity | Activity state | LIVE via Beach and Scoops routes |

Supporting world inventory: 4,200×2,800 world; 19 physical houses using 5 architecture kits; 20 lawn plots; 9 roads; 3 bridges; 6 landmarks; 35 authored residents plus the optional owned resident; 37 animal species/56 animal identities; 5 public bins; 8 restoration milestones.

## Shops, venue exteriors, and interiors

| Map shop / venue | Source and identifier | Entry / unlock | Save dependency | Reachability / status |
| --- | --- | --- | --- | --- |
| Corner Café | `SHOPS[0]`, `CORNER_CAFE`, `CafeScene` | Door interaction | Café progress/economy | LIVE |
| Village Grocer | `SHOPS[1]`, `VILLAGE_GROCER`, `VillageGrocerScene` | Door interaction | Economy, inventory, farming | LIVE purchase view |
| Little Bakery | `SHOPS[2]`, `LITTLE_BAKERY`, `BakeryScene` | Door interaction | Bakery progress/economy | LIVE |
| Riverside Kitchen | `SHOPS[3]`, `RIVERSIDE_KITCHEN`, `RiversideKitchenScene` | Door interaction | Kitchen progress/economy | LIVE |
| The Willow Arms | `SHOPS[4]`; NPC business node | No player interior | NPC business/litter simulation | AMBIENT; protected HTML also models it as a business/navigation destination, not a migrated minigame |
| Morning Mug Coffee | `SHOPS[5]`, `MORNING_MUG`, `MorningMugScene` | Door interaction | Mug progress/economy | LIVE |
| Harbour General | `SHOPS[6]`, `HARBOUR_GENERAL`, `HarbourGeneralScene` | Buy deed, then manage | Ownership, stock, till, sales, economy | LIVE |
| Riverstone Restaurant | `SHOPS[7]`; NPC business node | No player interior | NPC business/litter simulation | AMBIENT; protected HTML has the same ambient business destination |
| Fresh Market | `SHOPS[8]`, `FRESH_MARKET`; Town-owned `ShopController` modal | Door interaction opens full-screen market | Economy/inventory/animal food | LIVE; Town remains active behind modal |
| Paws & Wonders | `SHOPS[9]`, `PAWS_WONDERS`, `PawsWondersScene` | Door; milestone-specific pet gate | Adoption/animals/economy | SOURCE + AUTOMATED |
| South Shore Café / South Shore Scoops | `SHOPS[10]`, `SOUTH_SHORE_SCOOPS`, `SouthShoreScoopsScene` | Door interaction | Scoops progress/economy | LIVE; naming bridge recorded as O-05 |
| KindWorks Cinema | `SHOPS[11]`, `KINDWORKS_CINEMA`; `ImpactController` modal | Station restoration milestone | Restoration and impact preferences only | SOURCE + AUTOMATED; conditional modal not manually opened here |
| Willowmere Shop | `ShopController`, `ShopService`, `src/data/items.js` | Town menu → Shop | Economy, inventory, equipment, placed items | SOURCE + full commerce/placement tests |

Other interiors: 19 house instances use 6 interior themes/variants; Meadowlight House (`house-20`) is the personal interior, starts with the protected starter contents, and stores placed furniture and aquarium state.

## Minigames and campaigns

| Activity | Levels | Core mechanic | Orientation | Runtime / exhaustive status |
| --- | ---: | --- | --- | --- |
| Waste Collection | 750 | scattered-card match-three with 5-slot tray | Landscape | LIVE; exhaustive parity PASS |
| Lawn Care | 750 | swipe/queued route mowing with mower performance | Landscape | LIVE; exhaustive parity PASS |
| River Clear-Out | 750 | tap/swipe falling-block river restoration | Portrait only | Scene LIVE behind correct rotate gate; exhaustive parity PASS |
| House Rescue | 750 | rubbish sorting then obstacle-aware vacuuming | Landscape | LIVE; exhaustive parity PASS |
| Beach Cleanup | 750 | directional swipe raking, groove runs, hidden finds | Landscape | LIVE; exhaustive parity PASS; F-01 exit UX repair verified |
| Playground Power Wash | 750 | continuous pixel-mask washing, soap/nozzles/pressure | Landscape | LIVE; exhaustive parity PASS |
| Little Bakery | 150 | concurrent orders, recipes, trays, appliances | Landscape | LIVE picker; exhaustive parity PASS |
| Corner Café | 150 | concurrent service/preparation | Landscape | LIVE picker; exhaustive parity PASS |
| Morning Mug | 150 | coffee preparation, independent appliances/burn state | Landscape | LIVE picker; exhaustive parity PASS |
| Riverside Kitchen | 150 | preparation, exact heat and appliances | Landscape | LIVE picker; exhaustive parity PASS |
| South Shore Scoops | 750 | picture-order assembly and sequential service | Landscape | LIVE picker; exhaustive parity PASS |
| Fishing | — | target cast, bite window, reel and inventory/aquarium | Landscape | LIVE; deterministic service tests PASS |
| Magnet Fishing | — | target cast, sink/settle/retrieve, pity system | Landscape | LIVE; deterministic service tests PASS |
| Local Town Cleanup | Generated jobs, not a campaign selector | collect nearby rubbish and complete current town job | Landscape/Town | SOURCE + automated cleanup integration; represented by `cleanup-hud` rather than a scene |

## UI, HUD, modal, dialog, tutorial, and progression surfaces

| Surface / DOM identifier | Kind | Source owner | Entry / exit | Unlock/save dependency | Reachability / status |
| --- | --- | --- | --- | --- | --- |
| Town HUD (`.town-hud`) | HUD | `index.html`, `WorldHudController` | Always in Town | World clock/weather, economy | LIVE |
| Town menu (`town-menu-panel`) | Modal/menu | `TownMenuController` | Town Menu / Close or Escape | None | SOURCE; automated mobile/controller tests |
| First-run onboarding (`onboarding-panel`) | Onboarding dialog | `OnboardingController`, `OnboardingService` | Automatic or Welcome menu / close | Town name, onboarding steps, login rewards | LIVE in production preview |
| First-session checklist | Tutorial/progression | `OnboardingController` | Contextual first-session state | Saved journey steps | SOURCE + automated onboarding tests |
| Login reward toast | Reward dialog | `OnboardingController` | Due login reward / dismiss | Trusted/local time policy and reward history | SOURCE + automated tests |
| Custom resident panel | Three-page onboarding/editor | `CustomResidentController` | Resident/Welcome menu / close | Appearance, hobbies, starter home, profile/autonomy | SOURCE + automated creation/autonomy tests |
| Personal-home progression | Progression sub-screen | `CustomResidentController` | Resident home editor | Home level/design and economy | SOURCE + automated home tests |
| NPC story panel | Dialog/list | `NpcNarrativeController` | Select resident or Stories / close | Narrative stage/history | SOURCE + automated narrative tests |
| Resident control banner | Context HUD | `TownScene`, `CustomResidentController` | Explicit Take a walk / Return to map | Owned resident runtime position/control | SOURCE + automated camera/control tests |
| Interaction prompt | Context HUD | `TownScene`, `InteractionSystem` | Nearby/tapped target / movement or action | Target-specific | SOURCE + automated interaction tests |
| Impact / Cinema panel | Modal/progression | `ImpactController` | Impact menu or unlocked cinema / close | Restoration gate for cinema | SOURCE + automated tests |
| Restoration reveal | Modal/reward | `RestorationMilestoneController` | Milestone completion / continue | 8-stage restoration progress | SOURCE + automated tests |
| Homeowner gift panel | Modal/reward | `HomeownerGiftController` | Queued eligible gift / keep/use/continue | Care history, probability/pity, queue, inventory | SOURCE + automated probability/persistence tests |
| Save panel | Error/recovery dialog | `SaveStatusController` | Save/import/recovery condition / close | Save diagnostics | SOURCE + automated save tests |
| Economy panel | Inventory/progression modal | `EconomyHudController` | Coin or Inventory / close | Wallet, ledger, inventory, equipment | SOURCE + automated economy/inventory tests |
| Wallet tab | Progression sub-screen | `EconomyHudController` | Economy modal tab | Balance/lifetime/ledger | SOURCE + automated |
| Inventory tab | Inventory screen | `EconomyHudController` | Economy modal tab | All inventory categories/equipment | SOURCE + automated |
| Commerce tab | Optional commerce screen | `CommerceController` | Economy modal when bridge available | Verified receipts/subscription state | Conditional; production fails closed without bridge |
| Willowmere Shop panel | Shop modal | `ShopController`, `ShopService` | Town menu Shop / close | Coins, inventory, ownership/equipment | SOURCE + all-item purchase/place tests |
| Fresh Market panel | Shop interior/modal | `ShopController` | Fresh Market door / close | Seven food products, inventory, coins | LIVE |
| Grocer HUD and selected product | Interior HUD/shop modal | `VillageGrocerScene`, `ShopController` | Grocer door/product / close product then exit | Nine products, farming, economy | LIVE |
| Paws HUD/product detail | Interior HUD/pet screen | `PawsWondersScene` | Paws door/product / exit | Eleven companions, milestone/ownership | SOURCE + automated |
| Harbour HUD/product/business panel | Interior HUD/progression | `HarbourGeneralScene` | Harbour door/display / exit | Deed, 17 products, stock, till, sales | LIVE |
| Farming panel | Farming screen | `FarmingController` | Allotment/orchard/lawn interaction / close | Seeds, beds, crops, saplings, apple trees, lawns | SOURCE + automated |
| Animal Friends panel | Pet/animal screen | `AnimalFriendsController` | Animals menu or animal selection / close | 56 identities, trust, diet, companion state | SOURCE + automated |
| Town placement banner | Context HUD | `TownScene`, `TownPlacementService` | Use placeable item / confirm/cancel | Inventory and placed coordinates | SOURCE + automated |
| Placed-object panel | Context panel | `TownScene`, `TownPlacementService` | Select placed object / close/store/move | Object ownership/coordinates | SOURCE + automated |
| Home interior HUD/readout | Interior HUD | `HouseInteriorScene` | House entry / exit | House identity, residents, dirty state | LIVE |
| Furniture tray/placement | Inventory/context sub-screen | `HouseInteriorScene`, `HomeInteriorService` | Furnish action / confirm/cancel/store | Furniture inventory/placements | SOURCE + automated |
| House Rescue gameplay | Minigame HUD | `HouseRescueScene` | Dirty house | Active sort/vacuum state | LIVE |
| House Rescue sort/vacuum stages | Minigame sub-screens | `HouseRescueScene` | Sequential within activity | Active checkpoint | SOURCE + exhaustive automated |
| House Rescue result | Result modal | `HouseRescueScene` | Successful completion | Rewards/gifts/progression | SOURCE + automated |
| Waste gameplay/result/menu | Minigame HUD/sub-screens | `WasteCollectionScene` | Campaign entry / return | Board/tray/reward state | LIVE gameplay; result automated |
| Lawn gameplay/result | Minigame HUD/sub-screens | `LawnCareScene` | Lawn entry / return | Route/reward state | LIVE gameplay; result automated |
| River gameplay/result | Minigame HUD/sub-screens | `RiverClearoutScene` | River entry / return | Board/reward state | Scene LIVE; portrait gameplay/result automated |
| Beach gameplay/result/menu | Minigame HUD/sub-screens | `BeachCleanupScene` | Beach entry / visible two-step return | Rake/reward state | LIVE gameplay; result automated; F-01 FIXED |
| Power Wash gameplay/result | Minigame HUD/sub-screens | `PlaygroundPowerwashScene` | Playground entry / return | Pixel mask/tools/reward | LIVE gameplay; result automated |
| Café picker/shift/result | Level/progression/gameplay/result | `CafeScene` | Venue entry / exit | 150-level state | LIVE picker; shift/result automated |
| Bakery picker/shift/result | Level/progression/gameplay/result | `BakeryScene` | Venue entry / exit | 150-level state | LIVE picker; shift/result automated |
| Morning Mug picker/shift/result | Level/progression/gameplay/result | `MorningMugScene` | Venue entry / exit | 150-level state | LIVE picker; shift/result automated |
| Riverside picker/shift/result | Level/progression/gameplay/result | `RiversideKitchenScene` | Venue entry / exit | 150-level state | LIVE picker; shift/result automated |
| Scoops picker/shift/result | Level/progression/gameplay/result | `SouthShoreScoopsScene` | Venue entry / exit | 750-level state | LIVE picker; shift/result automated |
| Fishing HUD | Minigame HUD | `FishingScene` | Fish/magnet spot / exit | Casts, catches, pity, aquarium | LIVE both modes |
| Local cleanup HUD/result | Town job HUD/result dialog | `TownScene`, `CleanupJobService` | Current rubbish job / finish/return | Job/environment/economy | SOURCE + automated |
| Rotate-device screen (`landscape-required`) | Global error/pause state | `ResponsiveShellController` | Wrong orientation / rotate back | Pauses simulation without restart/reward | LIVE for River in landscape; automated for all scenes |
| Loading state | Global overlay | `SharedOverlayController`, `lazyScenes.js` | Lazy scene load | None | SOURCE + tests |
| Load error state | Global error overlay | `SharedOverlayController`, `lazyScenes.js` | Lazy scene import failure | None; returns safely | SOURCE + tests |
| Short toast/feedback | Global/context notification | `InteractionFeedbackController`, controllers | Contextual action | Varies | SOURCE + tests |

## Hidden, unfinished, reserved, or unreachable inventory

| Item | Classification | Evidence / disposition |
| --- | --- | --- |
| `house-19` | Intentional reserved data slot | Comment in `src/data/town.js`; the nineteenth physical property is `house-20`. It is not an orphan scene or missing reachable house. |
| The Willow Arms interior | Intentional ambient-only | Present in both HTML and Phaser business/navigation simulation; no protected playable minigame contract exists. |
| Riverstone Restaurant interior | Intentional ambient-only | Present in both HTML and Phaser business/navigation simulation; Riverside Kitchen is the authored playable restaurant campaign. |
| `kindly-heart-planter` | Conditional, not ordinary shop stock | Subscription-only Champion gift; placeable when legitimately granted. |
| `__qa-young-tree`, `__qa-town-bin` | DEV ONLY | Hidden deterministic placement fixtures; excluded from released placeables. |
| Fidelity panel and certified-completion buttons | DEV ONLY | Guarded by `import.meta.env.DEV`/QA query and hidden from production. |
| Real-money coin/subscription completion | External integration incomplete by design | Service and screens exist; production requires trusted billing/receipt/time authority and fails closed without it. |
| Final bespoke sprite/art/audio layer | Visual-only incomplete | Stable labels and code-driven layouts exist; final production assets and manual feel checks remain outside functional parity. |

No hidden production Phaser scene was found that could not be registered. Conditional content is distinguished from genuinely unreachable content above.
