# Stage 2 Scene and Screen Coverage Matrix

## Status meaning

- **PASS** — the applicable behavior was operated live or deterministically verified with direct evidence, with no finding for this item.
- **FAIL** — a confirmed defect affects the item.
- **PARTIAL** — substantial live and automated evidence exists, but at least one requested state or viewport was not operated live.
- **BLOCKED** — a required live journey could not be completed in the available environment; source/automated evidence may still exist.
- **UNTESTED** — no meaningful evidence was obtained. No production item is silently marked pass under this label.

Evidence keys:

- `R-BOOT`: fresh production boot and initial onboarding at 1280×720.
- `R-FID`: isolated development fidelity activity entry/re-entry at 1280×720.
- `R-EXIT`: normal visible exit/back/confirmation and Town return.
- `R-INPUT`: click/touch-equivalent control operation, rapid input, or leave-during-transition probe.
- `R-PANEL`: normal production modal/tab operation.
- `R-ERR`: production resource check and commerce-disabled/error operation.
- `A-611`: full 611-test suite.
- `A-PARITY`: 105,795 minigame instances and 5,850-level differential parity.
- `A-MOBILE`: responsive shell, mobile UX, gesture, touch-target, orientation, and release-gate tests.
- `S-ROUTE`: registered source route, cleanup handler, and save dependency inspection.

## Phaser scenes

| Scene | Load/assets/errors | Entry, exit, back, re-entry | Pause/cleanup | Input, movement, camera | Empty/partial/completed/locked/error | Save/leave-transition | Phone/tablet | Overall | Evidence / reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `BootScene` | PASS | PASS | PASS | N/A | PARTIAL | PASS | PARTIAL | **PARTIAL** | `R-BOOT`, `R-ERR`, `A-611`; load-error fallback is automated, not forced live |
| `TownScene` | PASS | PASS | PASS | PARTIAL | PARTIAL | PASS | PARTIAL | **FAIL** | `R-BOOT`, `R-PANEL`, `A-MOBILE`; S2-F01 exposes raw coordinates/internal copy |
| `HouseInteriorScene` | PASS | PASS | PASS | PARTIAL | PARTIAL | PASS | PARTIAL | **FAIL** | `R-FID`, `R-EXIT`, `A-611`; S2-F02 root scene marker is stale |
| `VillageGrocerScene` | PASS | PASS | PASS | PASS | PARTIAL | PASS | PARTIAL | **PARTIAL** | `R-FID`, `R-EXIT`, `R-INPUT` purchase, `A-611`; live phone/tablet and error state outstanding |
| `PawsWondersScene` | PASS | BLOCKED | PASS | PARTIAL | PARTIAL | PASS | PARTIAL | **BLOCKED** | `S-ROUTE`, `A-611`; normal live door-to-interior route not completed |
| `HarbourGeneralScene` | PASS | PASS | PASS | PARTIAL | PARTIAL | PASS | PARTIAL | **PARTIAL** | `R-FID`, `R-EXIT`, `A-611`; management edge states and mobile sizes automated only |
| `BakeryScene` | PASS | PASS | PASS | PASS | PARTIAL | PASS | PARTIAL | **PARTIAL** | Picker/shift/step/confirmed exit/re-entry live; result/failure/mobile rendering automated |
| `CafeScene` | PASS | PASS | PASS | PASS | PARTIAL | PASS | PARTIAL | **PARTIAL** | Picker/shift/step/confirmed exit/re-entry live; result/failure/mobile rendering automated |
| `MorningMugScene` | PASS | PASS | PASS | PASS | PARTIAL | PASS | PARTIAL | **PARTIAL** | Picker/shift/step/save-exit/re-entry live; result/failure/mobile rendering automated |
| `RiversideKitchenScene` | PASS | PASS | PASS | PASS | PARTIAL | PASS | PARTIAL | **PARTIAL** | Picker/shift/step/save-exit/re-entry live; heat/result/mobile rendering automated |
| `SouthShoreScoopsScene` | PASS | PASS | PASS | PASS | PARTIAL | PASS | PARTIAL | **PARTIAL** | Picker/shift/part/save-exit/re-entry live; result/failure/mobile rendering automated |
| `RiverClearoutScene` | PASS | PARTIAL | PASS | PARTIAL | PARTIAL | PASS | PARTIAL | **PARTIAL** | Landscape rotate gate live; portrait play/result and gestures pass automation only |
| `HouseRescueScene` | PASS | PASS | PASS | PASS | PARTIAL | PASS | PARTIAL | **PARTIAL** | Correct live sort action, exit/re-entry, and resumed checkpoint; vacuum/result/mobile automated |
| `WasteCollectionScene` | PASS | PASS | PASS | PASS | PARTIAL | PASS | PARTIAL | **PARTIAL** | Live board, two rapid card selections, menu exit/re-entry; result/failure/mobile automated |
| `LawnCareScene` | PASS | PASS | PASS | PASS | PARTIAL | PASS | PARTIAL | **PARTIAL** | Live board, keyboard movement, two-tap exit/re-entry; result/failure/mobile automated |
| `BeachCleanupScene` | PASS | PASS | PASS | PARTIAL | PARTIAL | PASS | PARTIAL | **PARTIAL** | Live board/menu/visible confirm/return; rake/result/mobile automated |
| `PlaygroundPowerwashScene` | PASS | PASS | PASS | PASS | PARTIAL | PASS | PARTIAL | **PARTIAL** | Live tool selection, exit/re-entry and 1280 geometry; completion/failure/mobile automated |
| `FishingScene` — fish | PASS | PASS | PASS | PASS | PARTIAL | PASS | PARTIAL | **PARTIAL** | Live cast and confirmed exit during casting; outcome limits/mobile automated |
| `FishingScene` — magnet | PASS | PASS | PASS | PASS | PARTIAL | PASS | PARTIAL | **PARTIAL** | Live cast and confirmed exit during casting; outcome/pity/mobile automated |

All 18 scene files remain in the eager list or lazy loader. No new orphan scene was found.

## Town districts and continuous world areas

These are portions of `TownScene`, not separate scene classes. All share Town's mobile/manual limitation and S2-F01.

| Area | Entry/reachability | Interaction/state evidence | Overall |
| --- | --- | --- | --- |
| North Cottages | Source route and Town runtime | Houses/yards/forest counts `A-611` | **PARTIAL** |
| Old Market | Live Town plus Café/Grocer/Bakery routes | Three interiors operated | **PARTIAL** |
| Willow Commons | Live Town plus cleanup/Power Wash | Activities operated; landmarks automated | **PARTIAL** |
| Willow Cottages | Live Town and House/Lawn routes | Interiors/environment automated | **PARTIAL** |
| High Street | Live Town; venue routes source/runtime | Kitchen/Morning Mug operated; Willow Arms intentional ambient | **PARTIAL** |
| East Cottages | Source/runtime Town area | Layout and houses automated | **PARTIAL** |
| South Meadow | Source/runtime Town area | Animal rules automated; physical journey not operated | **PARTIAL** |
| Willow Allotments | Registered contextual entry | Farming screen/state automated; not opened live | **BLOCKED** |
| Reedbank | Fishing route operated | Fish/aquarium state automated | **PARTIAL** |
| South Shore | Beach/Scoops/Harbour operated | Coastal state automated | **PARTIAL** |

Camera bounds, free-browse default, explicit resident control, map dragging, pinch contracts, and pointer hit rules pass `A-611`/`A-MOBILE`. Live physical pinch and all district edge bounds remain a manual gate.

## Shops, venues, landmarks, and interiors

| Item | Runtime coverage | Overall | Evidence / qualification |
| --- | --- | --- | --- |
| Corner Café | Entry, picker, shift, step, confirmed exit, re-entry | **PARTIAL** | Result and mobile layouts automated |
| Village Grocer | Product modal, purchase, close, exit, re-entry | **PARTIAL** | Locked/insufficient funds automated |
| Little Bakery | Entry, picker, shift, step, confirmed exit, re-entry | **PARTIAL** | Result and mobile layouts automated |
| Riverside Kitchen | Entry, picker, shift, step, save-exit, re-entry | **PARTIAL** | Heat/result and mobile layouts automated |
| The Willow Arms | Intentional ambient business node | **PASS** | Same non-minigame classification as protected HTML |
| Morning Mug Coffee | Entry, picker, shift, step, save-exit, re-entry | **PARTIAL** | Appliance/result and mobile layouts automated |
| Harbour General | Entry, HUD, exit, re-entry | **PARTIAL** | Product/business edge states automated |
| Riverstone Restaurant | Intentional ambient business node | **PASS** | Riverside Kitchen is the authored campaign |
| Fresh Market | Town modal open/close/re-entry | **PARTIAL** | Purchase edge states automated |
| Paws & Wonders | Source and automated only | **BLOCKED** | Live normal doorway journey not completed |
| South Shore Café / Scoops | Entry, picker, shift, part, save-exit, re-entry | **PARTIAL** | Naming bridge remains Stage 1 observation O-05 |
| KindWorks Cinema | Impact panel operated through menu; unlock route automated | **PARTIAL** | Conditional cinema-door journey not live |
| Willowmere Shop | Modal, categories, close | **FAIL** | Functional tests pass; S2-F01 internal milestone copy is visible |
| 19 authored house interiors | One representative interior operated | **PARTIAL** | Six variants and all state combinations automated/source only |
| Meadowlight personal home | Creation and progression editor operated | **PARTIAL** | Furniture placement and mobile rendering automated |

## UI, HUD, modal, dialog, tutorial, and progression surfaces

| Surface | Overall | Evidence / limitation |
| --- | --- | --- |
| Town HUD | **FAIL** | Live; S2-F01 raw coordinates are player-visible |
| Town menu | **PASS** | Open/close and every visible destination operated |
| First-run onboarding | **PASS** | Fresh production Name Town and Welcome steps operated |
| First-session checklist | **PARTIAL** | Step 1 live; later contextual steps automated |
| Login reward toast | **PASS** | Live dismissible return-reward toast plus automated date/reward rules |
| Custom resident three-page flow | **FAIL** | All pages/back/create live; internal milestone label is visible (S2-F01) |
| Personal-home progression | **PARTIAL** | Live current/locked upgrades; purchase edge states automated |
| NPC story panel | **FAIL** | Live via menu/dev fixture; internal milestone label visible |
| Resident control banner | **PARTIAL** | Source/tests; not operated live in this stage |
| Interaction prompt | **PARTIAL** | Source/tests and scene interactions; all Town targets not live |
| Impact/Cinema panel | **PASS** | Menu open/close live; data fallback automated |
| Restoration reveal | **PASS** | Live reveal and dismissal |
| Homeowner gift panel | **FAIL** | Both phases/keep live; internal milestone label visible |
| Save panel | **FAIL** | Live open/close; internal safe-save milestone label visible |
| Economy panel | **FAIL** | Wallet/Inventory/Support live; internal migration/catalogue copy visible |
| Wallet tab | **PARTIAL** | Live balance/history; failure rollback automated |
| Inventory tab | **FAIL** | Live; `legacy item definitions ready` diagnostic exposed |
| Commerce tab | **PASS** | Live disabled bridge state; grants fail closed |
| Willowmere Shop | **FAIL** | Live open/categories/close; internal milestone label visible |
| Fresh Market panel | **PASS** | Live open/close/re-entry |
| Grocer HUD/product | **PASS** | Live select, purchase, close, exit, re-entry |
| Paws HUD/product | **BLOCKED** | Automated/source only |
| Harbour HUD/product/business | **PARTIAL** | HUD/entry/exit live; product/till edge states automated |
| Farming panel | **BLOCKED** | Automated/source only in this stage |
| Animal Friends panel | **FAIL** | Live menu open/close; internal milestone label visible |
| Town placement banner | **PARTIAL** | Automated/source only |
| Placed-object panel | **PARTIAL** | Automated/source only |
| Home Interior HUD/readout | **FAIL** | Live; S2-F01 copy and S2-F02 stale root marker |
| Furniture tray/placement | **PARTIAL** | Automated/source only |
| House Rescue gameplay | **PASS** | Live item/bin action and checkpoint resume |
| House Rescue sort stage | **PASS** | Live correct sort feedback |
| House Rescue vacuum stage | **PARTIAL** | Automated, not reached live |
| House Rescue result | **PARTIAL** | Automated, not rendered live |
| Waste gameplay/menu | **PASS** | Live rapid input and normal menu exit |
| Waste result | **PARTIAL** | Automated, not rendered live |
| Lawn gameplay | **PASS** | Live movement and safe exit |
| Lawn result | **PARTIAL** | Automated, not rendered live |
| River gameplay | **BLOCKED** | Landscape correctly blocked; portrait gameplay automated only |
| River result | **PARTIAL** | Automated, not rendered live |
| Beach gameplay/menu | **PASS** | Live visible two-step exit and return |
| Beach result | **PARTIAL** | Automated, not rendered live |
| Power Wash gameplay | **PASS** | Live board/tool/exit plus 1280 containment check |
| Power Wash result | **PARTIAL** | Automated, not rendered live |
| Café picker | **FAIL** | Live; internal vertical-slice/milestone copy visible |
| Café shift | **PARTIAL** | Live step/exit; success/failure/mobile automated |
| Café result | **PARTIAL** | Automated, not rendered live |
| Bakery picker | **FAIL** | Live; internal vertical-slice/milestone copy visible |
| Bakery shift | **PARTIAL** | Live step/exit; success/failure/mobile automated |
| Bakery result | **PARTIAL** | Automated, not rendered live |
| Morning Mug picker | **FAIL** | Live; internal campaign/milestone copy visible |
| Morning Mug shift | **PARTIAL** | Live step/save-exit; success/failure/mobile automated |
| Morning Mug result | **PARTIAL** | Automated, not rendered live |
| Riverside picker | **FAIL** | Live; internal campaign/milestone copy visible |
| Riverside shift | **PARTIAL** | Live step/save-exit; heat/success/failure/mobile automated |
| Riverside result | **PARTIAL** | Automated, not rendered live |
| Scoops picker | **FAIL** | Live; internal campaign/milestone copy visible |
| Scoops shift | **PARTIAL** | Live part/save-exit; success/failure/mobile automated |
| Scoops result | **PARTIAL** | Automated, not rendered live |
| Fishing HUD — fish | **PASS** | Live cast and leave-during-cast confirmation |
| Fishing HUD — magnet | **PASS** | Live cast and leave-during-cast confirmation |
| Local cleanup HUD/result | **PARTIAL** | Source/service tests; not rendered live |
| Rotate-device screen | **PARTIAL** | River landscape gate live; full orientation matrix automated |
| Loading state | **PASS** | Fresh dev/production boot plus lazy-loader tests |
| Load error state | **PARTIAL** | Deterministic tests only; not forced live |
| Short toast/feedback | **PASS** | Login reward and contextual status feedback operated |

## Hidden, conditional, reserved, or unreachable items

| Item | Overall | Disposition |
| --- | --- | --- |
| `house-19` | **PASS** | Intentional reserved data slot, not a missing scene |
| Willow Arms interior | **PASS** | Intentional ambient-only destination |
| Riverstone Restaurant interior | **PASS** | Intentional ambient-only destination |
| `kindly-heart-planter` | **PASS** | Conditional verified-membership grant; placeable tests pass |
| `__qa-young-tree`, `__qa-town-bin` | **PASS** | Development-only fixtures, excluded from released catalogue |
| Fidelity panel and certified-completion buttons | **PASS** | Confirmed absent from production preview |
| Real-money completion | **PARTIAL** | Correct fail-closed screen live; external billing/receipt authority still absent by design |
| Final bespoke art/audio | **UNTESTED** | Outside this functional Stage 2 scope and explicitly not generated/changed |

No new production scene that exists in code but lacks registration was found. The intentionally ambient and conditional entries remain separated from genuinely unreachable content.
