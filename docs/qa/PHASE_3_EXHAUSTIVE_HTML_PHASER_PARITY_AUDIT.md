# KindWorks exhaustive HTML-to-Phaser parity audit

**Audit status:** **AUDIT INCOMPLETE** — the inspected code/data scope is comprehensive, but the completion gate requires runtime operation of every reachable state and a physical-device/final-art pass that was not available in this audit.

**Audit mode:** read-only investigation. This report is the only authored file. No game code, asset, configuration, save, or protected HTML content was changed.

## 1. Executive summary

### Locked baselines

| Baseline | Exact identity |
| --- | --- |
| Authoritative HTML | `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html` |
| Repository copy | `/Users/youyoulu/Documents/GitHub/Kindworks/kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html` |
| Desktop copy | `/Users/youyoulu/Desktop/Kindworks/kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html` |
| HTML SHA-256 (both copies) | `0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5` |
| HTML size | 17,324,288 bytes; 13,381 physical lines (`split("\n")` inventory reports 13,382) |
| Phaser branch | `phase-3-legacy-fidelity-recovery` |
| Phaser commit | `020319dcc51e4d865e9c69504d7b9970609bc721` |
| Remote comparison | local HEAD exactly matched `origin/phase-3-legacy-fidelity-recovery` at audit start |
| Phaser/Vite | Phaser `^4.2.1`; Vite `^8.2.2` |
| Save versions | HTML 82; Phaser schema 37 |

The repository also contained one pre-existing untracked file, `KindWorks Migration Starter .json`. It was not opened, changed, staged, or deleted.

### What is genuinely strong

- The protected HTML checksum is pinned throughout the migrated data.
- The current 559-test suite passes in full.
- The production build and performance budget pass.
- The differential audit passes: 13 activities, all 5,850 campaign levels, 19 shared domains, 85 exact scalar comparisons across 12 legacy constants, 1,704 unique named legacy functions, 218 legacy public API entries, and 80 legacy validators.
- All enumerated level counts and major catalogue counts match: 19 houses, 12 shops, 35 ordinary residents, 37 animal species, 56 animal identities, 82 item definitions, and the complete cooking/fishing/farming catalogues.
- Power Washing's approved clean master and dirt reference, plus the protected animal reference sheet, have been extracted and hash-pinned.

### What is not equivalent

Two important behavioral differences are confirmed:

1. The player-owned resident is not part of the autonomous town-life graph. When not directly controlled it is always presented as being at home, without schedules, needs, relationships, conversations, shopping, litter/community behavior, or story-linked daily movement.
2. Legacy provides a general interrupted-mini-game recovery/result flow. Phaser boot automatically reopens only Waste, Lawn, Beach, and Power Washing. Restaurant shifts, River Clear-Out, House Rescue, and other persisted activity sessions retain data but boot to Town and require manual re-entry.

The largest remaining gap is presentation. The HTML contains 150 named `draw*` functions and four embedded image payloads. Phaser's shipped `public` directory contains only three image files: the animal reference sheet and the two Power Washing images. Many screens are therefore functional, code-driven approximations rather than source-identical presentation. The repository's own differential contract explicitly says rendering is intentionally not source-identical and names final Sprite AI art, audio/animation feel, physical touch ergonomics, and pixel-level composition as manual gates.

### Parity percentages

No honest single overall percentage can be reported from this audit. The completion rules prohibit inventing a number while runtime and final-art scope remains unverified.

| Dimension | Defensible result |
| --- | --- |
| Overall parity | **Not reportable yet.** Runtime/manual/final-art coverage is incomplete. |
| Functional parity | **Verified scope:** 559/559 automated checks pass; 13/13 activity contracts are owned; two confirmed behavioral differences remain. This is not a percentage of every runtime path. |
| Content/data parity | **Verified enumerated scope:** 5,850/5,850 campaign entries and every count in `PARITY_EXPECTED_COUNTS` match. Only 85 scalar rules are directly source-compared; unprobed constants are not claimed exact merely because tests pass. |
| Visual/layout parity | **Not quantifiable.** Confirmed visual differences remain in Town, NPCs, houses/interiors, Harbour General, River, Waste, Beach, Lawn, Fishing/Magnet Fishing, and the five restaurants. |
| Persistence parity | **Automated state integrity passes**, including schema upgrades, legacy import, checksums, backups, rollback, and replay protection. Exact boot-to-scene recovery differs for several activities and real crash/OS lifecycle behavior is unverified. |

### Difference severity count

This report records **0 Blocker, 0 Critical, 10 High, 12 Medium, and 1 Low** differences or explicit unverified risks. Intentional changes are counted at their player-facing severity even when they are approved; severity does not mean they should automatically be reverted.

### Largest gaps

1. Final source-faithful art, animation, and moment-to-moment feedback.
2. Owned-resident autonomous life integration.
3. General interrupted-session boot recovery.
4. River, Waste, Beach, Lawn, and House Interior presentation fidelity.
5. Physical multi-touch, orientation, safe-area, audio/haptics, and endurance verification.

## 2. Coverage report

### Static inspection coverage

| Scope | Inspected result |
| --- | --- |
| HTML markup/CSS/JavaScript/data | Entire immutable file read and indexed; 548 unique DOM IDs, 718 unique classes, 204 button declarations, 13 canvas declarations, 1,716 named-function occurrences / 1,704 unique names, 161 getters, 80 validators, 65 major configuration constants, 218 public API keys |
| Phaser source | 170 `src` files: 18 scenes, state owners, services, UI controllers, data modules, responsive/input code, QA harness, rendering and asset labelling |
| Tests | 77 test files; 559 tests executed and passed |
| Public assets | All four files inspected: three PNGs and one Power Washing manifest |
| Documentation/evidence | Phase 1, Phase 2, all Phase 3 reports, and existing baseline/restaurant/Power Washing screenshots inspected |
| Build/runtime entry | HTML direct document; Phaser `src/main.js` → `BootScene` → `TownScene` or selected persisted activity |

### Runtime coverage in this audit

- Both builds loaded from local HTTP on the same exact source revision.
- Legacy reached the fresh "Name your town" state with the authored Town visible behind it.
- Phaser reached its isolated `?qa=fidelity` Town state.
- Baseline console logs were clean at initial load.
- Existing committed Phase 3 evidence was inspected for Town, all five restaurants, Power Washing, phone/tablet checks, orientation, animals, houses/lawns, gestures, and NPC/camera/business work.
- A later attempt to continue semantic browser inspection was denied by the browser security policy. No workaround was attempted.
- No save was inspected or mutated during this audit.

### Automated coverage completed now

| Check | Result |
| --- | --- |
| Complete test suite | 559 passed; 0 failed, skipped, cancelled, or todo; 161.1 seconds |
| Differential parity | PASS; protected checksum unchanged; 13 activities; 5,850 levels; 19 domains; 85 scalar rules |
| Production build | PASS; 175 modules transformed |
| Performance budget | PASS; initial app 3,002,796 bytes; Phaser 1,374,829; 20 lazy chunks; total JS 4,755,759 |

### Runtime scope still not completed

- Every matrix feature was not replayed from a truly clean save in both versions.
- Minimum/middle/maximum levels were not manually completed for every campaign.
- Every failure, restart, exit, reload, insufficient-funds, ownership-limit, and cross-system sequence was not operated side by side.
- All ten required viewports were not rerun for every scene in this audit.
- No physical phone/tablet multi-touch, notch/safe-area, OS background, native audio, or 30-minute endurance run was available.
- Final Sprite AI assets do not exist, so final art parity cannot be tested.

## 3. HTML-derived feature inventory

The inventory was derived from the HTML, not from Phaser filenames.

### World, hubs, and overlays

- 4,200 × 2,800 Willowmere world; 10 districts; 9 roads; 3 bridges; 19 physical cottages; 12 businesses; 6 landmarks.
- Town browsing, pinch/drag camera, optional direct control of the owned resident, interaction priority, collisions, object placement, weather, lighting, clock, seasons, river pollution, land litter, weekly refuse collection, and eight permanent restoration milestones.
- Player/town setup, personal resident creator, personal-home design/upgrades, jobs panel, campaign panel, farming, economy/shop/inventory, Impact, NPC stories, resident locator, Animal Friends, homeowner gifts, milestone reveals, interrupted-game recovery, and rewarded-ad retry preview.
- Village Grocer, Paws & Wonders, Harbour General, house interiors, cinema/Impact access, ordinary shops, and the high-street food venues.

### Activities

- Waste Collection, Lawn Care, River Clear-Out, House Rescue, Beach Cleanup, Playground Power Washing, Fishing, Magnet Fishing.
- Little Bakery, Corner Café, Morning Mug Coffee, Riverside Kitchen, South Shore Scoops.
- Farming/allotment, orchard/apple harvesting, animal feeding/adoption/following/release, aquarium stocking, furniture placement, town-object placement, resident conversation/story progression, NPC commerce/community behaviors, and Harbour General ownership/stock/sales.

### Persistent systems

- Shared coins, ledger, inventory, equipment, shops, gifts, farming output, caught fish, aquarium, pets, follower, custom resident/home, NPC schedules/relationships/stories, world environment, restoration, completed jobs/levels, active sessions, town objects, furniture, commerce, onboarding, and backup/recovery metadata.

## 4. Master parity matrix

`Runtime verified` means direct current or preserved Phase 3 runtime evidence exists. Automated-only rows are not mislabeled as runtime verified.

| ID | Category | Feature | HTML source | Phaser source | Status | Severity | Summary | Runtime verified |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MAT-001 | Boot | Initial load | HTML document boot; save load around 11864–12043 | `src/main.js:67-128`; `BootScene.js` | Functionally equivalent | Low | Both boot; Phaser uses modular/lazy scenes | Yes, baseline |
| MAT-002 | Boot | Loading/error state | Embedded mini-game shell around HTML 1512–1516 | `src/scenes/lazyScenes.js:33-48`; `SharedOverlayController` | Phaser-only addition | Low | Phaser adds shared loading and recoverable load error | Existing Phase 2 evidence |
| MAT-003 | Boot | Interrupted activity recovery | HTML 4515–4524, 11976–12026 | `BootScene.js:19-28` plus per-service persisted sessions | Present but behaviorally different | High | General legacy recovery vs four auto-reopened Phaser activities | Static evidence |
| MAT-004 | Setup | Town naming | HTML player setup/creator | `OnboardingService`, `OnboardingController` | Functionally equivalent | Low | Saved identity and sanitisation retained | Existing runtime/tests |
| MAT-005 | Setup | Personal resident creation | HTML creator profile/hobbies/home | `CustomResidentService`, `customResidentState` | Functionally equivalent | Low | Stable ID, appearance, hobbies, free home retained | Existing runtime/tests |
| MAT-006 | Town | World dimensions/layout counts | HTML world/layout validators | `src/data/town.js`; `parityCertification.js` | Exact match | — | 4,200×2,800, 19 homes, 12 shops, 9 roads, 3 bridges, 10 districts | Automated |
| MAT-007 | Town | Default free browsing | HTML pointer/pinch behavior near 11723 | `TownCameraController`; `TownScene` | Functionally equivalent | Low | Browse-first, drag, wheel/focal pinch; no default avatar control | Existing runtime |
| MAT-008 | Town | Physical pinch zoom | HTML pointer handling | `TownCameraController` | Unverified | High | Implemented but never operated with true simultaneous touch | No |
| MAT-009 | Town | HUD/title/zoom controls | HTML top HUD | `index.html`; `TownMenuController` | Intentional change with evidence | Medium | Phaser removes large title/zoom controls and consolidates secondary controls | Existing runtime |
| MAT-010 | Town | Accessible comprehensive jobs list | HTML `accessibleJobsPanel`, 3182 | Contextual Town interactions and first-session find action | Intentional change with evidence | Medium | No equivalent always-available full Jobs list was located | Partial |
| MAT-011 | Town | Buildings and business entrances | HTML houses/shops/hit testing | `town.js`, `TownScene`, lazy scenes | Functionally equivalent | Low | Counts and scene owners match; not every doorway manually traversed | Partial |
| MAT-012 | Town | Business exterior presentation | HTML protected kits around 11353–11465 | `TownScene` business kit renderer | Partial migration | Medium | Venue-specific code-driven kits restored; final raster/shop detail differs | Existing runtime/code |
| MAT-013 | Town | Town art and environmental composition | HTML 150 draw functions, static/mid/foreground layers | `TownScene`, `legacyVisualStates.js` | Visual mismatch | High | Many states exist but composition is not pixel/source identical | Existing evidence |
| MAT-014 | Town | Town placement | HTML placement logic/save | `TownPlacementService`, `townPlacementState` | Exact/functional match | — | 35 definitions, 32 released, 500-object cap, rotate/move/store/collision | Automated |
| MAT-015 | World | Time/seasons/weather/lighting | HTML clock/weather configs | `WorldSimulationService`, `worldSimulation.js` | Exact/functional match | — | 24-real-minute day, 28-day seasons and deterministic weather pinned | Automated |
| MAT-016 | World | Living environment and cleanup effects | HTML litter/river/lawn runtime | `LivingEnvironmentService` | Functionally equivalent | Low | Persistent causal environment and restoration links present | Automated/partial runtime |
| MAT-017 | NPC | 35 ordinary residents | HTML `NPC_PROFILES` and runtime | `NPC_RESIDENTS`, `NpcTownLifeService` | Exact/functional match | — | Homes, routes, schedules, needs, relationships, conversations, litter, care, shopping | Automated/runtime diagnostics |
| MAT-018 | NPC | NPC narratives/thoughts | HTML narrative catalogue/story stages | `npcNarratives.js`, `NpcNarrativeService` | Exact/functional match | — | 35 profiles, 19 home narratives, four stages | Automated |
| MAT-019 | NPC | Owned resident autonomy | HTML creator NPC integrated into life helpers around 4074–4089 | `CustomResidentService.js:80-99` | Missing | High | Static at home unless directly controlled; absent from life graph | Static/diagnostic |
| MAT-020 | NPC | Direct owned-resident control | HTML Walk Mode | `TownScene`, `CustomResidentService` | Functionally equivalent | Low | Explicit Take a walk / Return to map flow restored | Existing runtime |
| MAT-021 | NPC | Expressive/weather animation | HTML `drawNpcActivityProp`, `drawNpcWeatherClothing`, hair/accessory functions | `NpcCharacter`, `TownScene` code-driven characters | Partial migration | Medium | Core states exist; final expression/weather frames remain production art | Existing evidence |
| MAT-022 | Animals | Species/identities/rules | HTML animal catalogues | `animals.js`, `AnimalService` | Exact/functional match | — | 37 species, 56 identities, diets, schedules, rarity, care/adoption/follower rules | Automated |
| MAT-023 | Animals | Paws & Wonders | HTML pet-shop system | `PawsWondersService`, `PawsWondersScene` | Exact/functional match | — | 11 permanent companions and protected adoption behavior | Automated/runtime |
| MAT-024 | Animals | Reference art | HTML v44 43-cell sheet | `public/assets/animals/reference-master-v44.png` | Exact asset match | — | Extracted and hash-tested | Existing runtime/tests |
| MAT-025 | Animals | Full motion nuance | Later HTML code-driven leg/wing/tail/idle rig | `AnimalCharacter` and shared sheet frames | Partial migration | Medium | Identity art present; later procedural motion nuances simplified | Existing evidence |
| MAT-026 | Farming | Allotment | HTML six-bed farming | `FarmingService`, `farmingState` | Exact/functional match | — | Six beds, three crops, purchase/plant/grow/harvest/offline rules | Automated |
| MAT-027 | Farming | Orchard | HTML starter six positions / 24-tree system | `FarmingService`, `townPlacement` | Exact/functional match | — | One starter tree, purchased placements, capacity 24, one-apple cycles | Automated |
| MAT-028 | Homes | 19 house identities/architecture | HTML five Phase 6 kits | `town.js`, `homeInteriors.js`, `TownScene` | Exact data / adapted visual | Medium | Position/size/interior footprint restored; renderer remains code-driven | Existing runtime/tests |
| MAT-029 | Homes | Progressive exterior dirt | HTML House Rescue dirt stages | `houseRescue.js`, `TownScene` | Functionally equivalent | Low | Time/job-ready appearance restored | Existing runtime/tests |
| MAT-030 | Homes | Grass/weed regrowth | HTML lawn ecology | `farming.js`, `TownScene` | Functionally equivalent | Low | Four live visual stages and active-lawn filtering restored | Existing runtime/tests |
| MAT-031 | Homes | Interior layout/collision | HTML house-aware layouts | `homeInteriors.js`, `HouseInteriorScene` | Functionally equivalent | Low | Six themes, architecture-sized footprint, furniture collision | Automated/runtime |
| MAT-032 | Homes | Interior presentation/occupants | HTML detailed draw functions | `HouseInteriorScene.js:131-274` | Placeholder implementation | High | Furniture uses rectangles/emoji; human occupants are static `🧑`; animals largely static | Existing runtime/code |
| MAT-033 | Homes | Furniture/aquarium | HTML furniture and fish tank | `HomeInteriorService`, `AquariumService` | Exact/functional match | — | 10 furniture products, 60-item cap, four species, 99/species, safe release | Automated |
| MAT-034 | Economy | Shared wallet/ledger | HTML economy | `EconomyService`, `economyState` | Exact/functional match | — | Starting 100, earned/spent, atomic rollback and reconciliation | Automated/runtime sample |
| MAT-035 | Economy | Item catalogue/prices | HTML catalogue/farming additions | `items.js`, `shops.js` | Exact enumerated match | — | 82 definitions, exact tested ordinary stock/equipment prices | Automated |
| MAT-036 | Economy | Commerce | HTML coin packs/KindlyClub/prototype providers | `CommerceService`, billing verifier | Intentional change with evidence | Medium | Same 6 packs/3 tiers; web checkout disabled without verified platform/server authority | Automated |
| MAT-037 | Economy | Rewarded-ad retry | HTML 228–237, 1638–1644, 4561–4596 | No Phaser ad flow; Phase 3 explicitly excludes ads | Intentional change with evidence | Medium | Legacy test ad retry omitted by product decision | Static |
| MAT-038 | Shops | Village Grocer | HTML top-down market | `VillageGrocerScene`, `FarmingService` | Functionally equivalent | Low | Nine displays and farming transactions retained | Automated/runtime |
| MAT-039 | Shops | Harbour General rules | HTML owner shop | `HarbourGeneralService` | Exact/functional match | — | 17 products, six slots, stock/sales/NPC purchasing | Automated |
| MAT-040 | Shops | Harbour General art | HTML embedded WebP at line 986 | `HarbourGeneralScene.js:66-145` | Visual mismatch | High | Exact 1536×1024 reference background is not shipped; procedural rectangles/emoji replace it | Existing runtime/code |
| MAT-041 | Restoration | Eight milestones/festival/cinema | HTML milestone system | `RestorationMilestoneService`, `ImpactProjectService` | Functionally equivalent | Low | Unlocks, rewards, transforms, Impact access persist | Automated/runtime |
| MAT-042 | Gifts | Homeowner gift odds/queue | HTML gift config | `HomeownerGiftService` | Exact scalar/functional match | — | Cooldowns, pity, tiers, queue and use retained | Automated |
| MAT-043 | Municipal | Weekly refuse collection | HTML garbage vehicle/runtime | `MunicipalCollectionService` | Functionally equivalent | Low | Five bins, route, overflow/spills and pause/persist behavior | Automated |
| MAT-044 | Mini-game | Waste rules/data | HTML embedded Waste payload | `wasteCollection.js`, `CleanupJobService` | Exact data/functional match | — | 750 boards, 40 rubbish types, certificates, tray/first-clear rules | Automated |
| MAT-045 | Mini-game | Waste presentation | HTML authored card art/park/flight/burst | `WasteCollectionScene.js:50-62,304-319` | Partial migration | High | Colored rectangles/emoji substitute authored rubbish and several effects | Existing runtime/code |
| MAT-046 | Mini-game | Lawn rules/data | HTML lawn payload | `lawnCareData.js`, `LawnCareService` | Exact data/functional match | — | 750 unique levels, six mowers, timing, weeds, undo/stars/rewards | Automated/runtime |
| MAT-047 | Mini-game | Lawn presentation | HTML pixel-garden/mower/clipping/feedback | `LawnCareScene.js:56-69` | Partial migration | Medium | Directional cuts restored; final garden/mower/clipping/audio/haptics absent | Existing runtime/code |
| MAT-048 | Mini-game | River rules/data/input | HTML River payload; swipe/tap instruction at 4652 | `riverClearout.js`, service/scene | Exact/functional match | — | 750 levels; swipe left/right/down; tap rotate; hint/undo/reward restored | Automated/runtime |
| MAT-049 | Mini-game | River presentation/feedback | HTML authored rubbish, waves, cascades, flush/results | `RiverClearoutScene.js:41-55` | Partial migration | High | Simplified backdrop/icons; missing authored rubbish preview, cascade/gravity/final flush, sound/haptics, grade flow | Existing runtime/code |
| MAT-050 | Mini-game | House Rescue rules/data | HTML 8026–8149, 13068–13360 | `houseRescue.js`, geometry/service/scene | Exact/functional match | — | 750 levels, 15 objects, three categories, furniture-aware geometry, 95%, rewards/gifts | Automated/runtime |
| MAT-051 | Mini-game | House Rescue haptics | HTML 8131, 8137, 8149 | No vibration call in `HouseRescueScene` | Missing | Medium | Sorting wave, cleaning pulse and completion vibration are absent | Static |
| MAT-052 | Mini-game | Beach rules/input/grooves | HTML embedded Beach payload | `beachCleanup.js`, `BeachRakePattern`, scene | Exact/functional match | — | 750 levels, 19 rubbish items, six groove patterns, swipe/continuous-run undo | Automated/runtime |
| MAT-053 | Mini-game | Beach presentation | HTML authored sand/player/rake/collection/celebration | `BeachCleanupScene.js:30-38,159-170` | Partial migration | High | Groove semantics exist; world/player/rake/walk/flight/sound/celebration remain simplified | Existing runtime/code |
| MAT-054 | Mini-game | Power Washing rules | HTML Power Washing payload | data/service/full-resolution renderer | Exact/functional match | — | 750, three nozzles, soap, interpolation, masks, supplies, 97%, reward cap | Automated/runtime |
| MAT-055 | Mini-game | Power Washing art | Protected clean/dirt payloads | two public 1536×1024 PNGs, `LegacyPowerwashRenderer` | Exact asset/composition recovery | — | Approved artwork and full-resolution mask restored | Existing runtime/tests |
| MAT-056 | Mini-game | Fishing rules | HTML fishing config/tables | `fishing.js`, `FishingService` | Exact/functional match | — | Three spots, 10 catches, five casts, windows, inventory/aquarium, haptics | Automated/runtime |
| MAT-057 | Mini-game | Fishing art | HTML embedded fish WebP and dynamic rig at 3460, 3799–3840 | `FishingScene.js:52-113,283-302` | Visual mismatch | Medium | Procedural bank plus emoji person/rod; exact embedded fish reference is not shipped | Existing runtime/code |
| MAT-058 | Mini-game | Magnet Fishing rules | HTML magnet config/catalogue | shared Fishing service/scene | Exact/functional match | — | Eight finds, five casts, pity, river cleanup link, sink/settle/retrieve | Automated/runtime |
| MAT-059 | Mini-game | Magnet art | HTML embedded magnet WebP at 3461 | `FishingScene.js` procedural bridge/emoji | Visual mismatch | Medium | Exact embedded reference is not shipped | Existing runtime/code |
| MAT-060 | Restaurants | Little Bakery rules/content | HTML Bakery config | Bakery data/service/scene | Exact/functional match | — | 150 shifts, 24 recipes, 50 ingredients, seven appliances, concurrent customers/trays | Automated/runtime |
| MAT-061 | Restaurants | Corner Café rules/content | HTML Café config | Café data/service/scene | Exact/functional match | — | 150 shifts, 64 recipes, 75 ingredients, 13 appliances | Automated/runtime |
| MAT-062 | Restaurants | Morning Mug rules/content | HTML Mug config | Morning Mug data/service/scene | Exact/functional match | — | 150 shifts, 54 recipes, 28 ingredients, five appliances | Automated/runtime |
| MAT-063 | Restaurants | Riverside Kitchen rules/content | HTML Riverside config | Riverside data/service/scene | Exact/functional match | — | 150 shifts, 32 recipes, 58 ingredients, nine appliances | Automated/runtime |
| MAT-064 | Restaurants | South Shore Scoops rules/content | HTML Scoops config | Scoops data/service/scene | Exact/functional match | — | 750 shifts, 24 parts, 19 families, 60% rule, reward cap | Automated/runtime |
| MAT-065 | Restaurants | Five venue presentations | HTML venue-specific pixel compositions | shared `RestaurantPresentation` and five scenes | Intentional change with evidence | Medium | Protected spatial meaning restored, but code-driven figures/products remain non-identical final art | Existing screenshots/runtime |
| MAT-066 | Input | Gesture-only movement | HTML direct swipe/tap | `mobileGestures.js` and scenes | Functionally equivalent | Low | Town/Beach/Lawn swipe; River swipe plus tap rotate; no direction pad | Existing runtime/tests |
| MAT-067 | Input | Orientation policy | User-approved landscape shell; River portrait exception | `ResponsiveShellController.js:1-105` | Intentional change with evidence | Low | Landscape for all except portrait-only River; pauses/resumes safely in tests | Existing browser tests, physical unverified |
| MAT-068 | Persistence | Save format/keys | HTML v82 key/backup/recovery | Phaser schema 37 envelope/key/backup/recovery | Phaser-only addition | Low | Separate checksummed save with legacy import; does not overwrite HTML key | Automated |
| MAT-069 | Persistence | Domain/state preservation | HTML serialized domains around 11872–11905 | `GameState.js:183-234`, state modules | Functionally equivalent | Low | Major domains are projected and reconciled | Automated |
| MAT-070 | Persistence | Real crash/write interruption | HTML/Phaser recovery logic | Save repositories and pagehide handlers | Unverified | High | Fault injection exists in tests, not real browser/native termination | No |
| MAT-071 | Audio | Restoration chime | HTML 2958–2997 | `RestorationMilestoneController.js:84-99` | Functionally equivalent | Low | Both oscillator based; actual audible timing not operated | No |
| MAT-072 | Audio | Broader audio/haptics | HTML has selected haptics, no full mixer | Phaser has selected haptics, no audio library | Partial migration | Medium | House Rescue haptics differ; no final sound asset pass | No |
| MAT-073 | QA | Developer API surface | 218 legacy public API keys | 72 top-level `__KINDWORKS_PHASER__` keys | Intentional/partial tooling change | Low | Domains mapped, but one-for-one debug/test APIs are not reproduced | Static |
| MAT-074 | QA | Isolated fidelity harness | No equivalent namespace | `FidelityQaHarness`, `fidelityContract` | Phaser-only addition | Low | Safer dev-only levels/replays/screenshots without production-save mutation | Existing runtime/tests |
| MAT-075 | Technical | Endurance/leaks/device performance | Monolithic HTML vs lazy Phaser scenes | shutdown handlers, performance budget | Unverified | Medium | Static cleanup/budgets pass; no 30-minute minimum-device session | No |

## 5. Complete difference register

### KW-XAUD-001 — owned resident is not autonomous

- **System / classification / severity:** NPCs; **Missing**; **High**.
- **HTML behavior:** the created resident is rebuilt with its hobbies/home and participates in the living-town NPC path (`kindworks…html:4074-4089`, plus Walk Mode/life integration).
- **Phaser behavior:** `CustomResidentService.getResident()` returns `phase: "home"` and `At home in Meadowlight House` whenever direct control is inactive (`src/systems/CustomResidentService.js:80-99`). `NpcTownLifeService` constructs its definition and resident maps only from `NPC_RESIDENTS`, the 35 ordinary residents (`src/systems/NpcTownLifeService.js:97-109,429-435`).
- **Reproduction/evidence:** repository trace and the dedicated NPC audit. The 35-resident service has schedules, conversations, disposal, litter, community care and shopping; the owned resident is absent from those maps.
- **Impact / related systems:** the most personal character does not live the same sophisticated life as other residents; hobbies do not drive daily routine; no autonomous relationships, visits, conversations, shopping or community behavior. Save migration, direct control, home occupants and duplicate rendering are implicated.
- **Confidence:** High.
- **Correction direction:** additive owned-resident simulation state and schema migration; deterministic hobby-derived schedule; pause/resume around direct control; prevent duplicate rendering/events; test existing saves and all resident graphs.

### KW-XAUD-002 — incomplete automatic interrupted-session recovery

- **System / classification / severity:** Boot/persistence; **Partial migration**; **High**.
- **HTML behavior:** generic `miniGames.active`, recovery prompt, pending-result restore and retry flow are serialized and restored (`HTML:4515-4524,11892,11976-12026`).
- **Phaser behavior:** `BootScene` checks only active Power Washing, Lawn, Beach and generic Waste sessions (`src/scenes/BootScene.js:19-28`). Restaurant, River, House Rescue and other services can preserve an active session, but boot returns to Town and the player must manually re-enter the activity.
- **Reproduction/evidence:** static boot-flow trace; service tests prove session data can survive, but there is no matching boot router or global recovery prompt.
- **Impact / related systems:** a reload changes context and can make an interrupted activity appear lost even when the checkpoint remains; pending results are less discoverable.
- **Confidence:** High.
- **Correction direction:** one authoritative active-session resolver with conflict detection and a non-mutating recovery prompt; auto-open or explicitly offer Resume for every persistent activity.

### KW-XAUD-003 — Town presentation is not source-identical

- **System / classification / severity:** Town; **Visual mismatch**; **High**.
- **HTML behavior:** layered pixel composition with authored cottage silhouettes, roads, fences, street furniture, river/bridge details, dirt/grass states, NPC props, lighting, and 150 named `draw*` functions across the file.
- **Phaser behavior:** state language and five house/twelve business kits are restored, but most rendering remains Phaser shapes/text/code-driven figures; the repository itself classifies final bespoke raster buildings/props as pending Sprite AI production work.
- **Evidence:** legacy Town baseline; current Town code; `docs/qa/PHASE_3_LEGACY_FIDELITY_RECOVERY.md` P2 ledger; public assets contain no Town textures.
- **Impact:** the hub can feel like a different game even when coordinates and interactions match.
- **Confidence:** High.
- **Correction direction:** asset-by-asset labelled replacement against same camera state, with pixel/depth/scale acceptance screenshots before changing geometry.

### KW-XAUD-004 — business exteriors are adapted code art, not final source art

- **System / classification / severity:** Town shops; **Partial migration**; **Medium**.
- **HTML behavior:** twelve venue-specific exterior kits and fixture compositions around HTML 11353–11465.
- **Phaser behavior:** venue-specific kits exist after FID-020, but final raster shelves, merchandise, staff and sign art remain labels/code shapes.
- **Impact:** identity is improved but not visually exact.
- **Confidence:** High.
- **Correction direction:** replace each labelled kit independently, preserving bounds, door hit areas and navigation.

### KW-XAUD-005 — house interiors use placeholder furniture and static people

- **System / classification / severity:** Homes; **Placeholder implementation**; **High**.
- **HTML behavior:** detailed room, furniture, resident and animal draw functions with authored composition.
- **Phaser behavior:** furniture is drawn as graphics plus emoji (`HouseInteriorScene.js:165-176`); human occupants are a static `🧑` glyph (`:242-252`); the remaining ledger explicitly calls residents/animals static and furniture generic.
- **Impact:** interiors do not visually express house size, occupants and the player's furniture collection with the same richness.
- **Confidence:** High.
- **Correction direction:** keep collision/layout data; replace labelled visual owners and add non-invasive idle/occupant animation.

### KW-XAUD-006 — Harbour General omits its exact embedded reference background

- **System / classification / severity:** Harbour General; **Visual mismatch**; **High**.
- **HTML behavior:** a large embedded WebP is the 1536×1024 shop background (`HTML:986`).
- **Phaser behavior:** `HarbourGeneralScene.js:66-145` constructs floor, fixtures, clerk, displays and management panel from rectangles/text/emoji; no Harbour texture is present in `public`.
- **Impact:** the player-owned shop looks substantially different despite matching sales rules.
- **Confidence:** High.
- **Correction direction:** extract/hash the protected reference and layer interactive stock state above it, as done for Power Washing.

### KW-XAUD-007 — Waste authored presentation/effects are incomplete

- **System / classification / severity:** Waste Collection; **Partial migration**; **High**.
- **HTML behavior:** 40 authored rubbish visual families, park cleanliness progression, capacity affordance, collection flights/triple burst and transition locking.
- **Phaser behavior:** cards use colored rectangles and emoji (`WasteCollectionScene.js:304-319`); the board fit is functionally safe but the detailed art/effects are not equivalent.
- **Impact:** high-level boards remain playable, but recognition, satisfaction and visual identity differ.
- **Confidence:** High.
- **Correction direction:** preserve exact card bounds/certificates; replace visual renderer and add the protected transition/feedback sequence.

### KW-XAUD-008 — River visual/game-feel layer is incomplete

- **System / classification / severity:** River Clear-Out; **Partial migration**; **High**.
- **HTML behavior:** authored rubbish preview, gravity/cascade/row-clear water effects, final flush, sounds/haptics and grade-specific result presentation.
- **Phaser behavior:** background is a rectangle plus icon decorations (`RiverClearoutScene.js:41-55`); interaction/rules are recovered, but the effects above are not located.
- **Impact:** major moment-to-moment feedback and the reward climax differ.
- **Confidence:** High.
- **Correction direction:** port effects in isolated layers after locking board geometry and reward transaction.

### KW-XAUD-009 — Beach presentation is only partially recovered

- **System / classification / severity:** Beach Cleanup; **Partial migration**; **High**.
- **HTML behavior:** authored sand/world/player/rake, synchronized groove reveal, walk cycle, collection flight, sound and celebration.
- **Phaser behavior:** six rake-pattern semantics and continuous-run Undo are correct, but the backdrop is simplified geometry/emoji (`BeachCleanupScene.js:30-38`) and board/player content is DOM tiles (`:159-170`).
- **Impact:** the important groove pattern is present, but the full visual reward of raking/collecting differs.
- **Confidence:** High.
- **Correction direction:** retain groove metadata and service state; replace only presentation/animation layers.

### KW-XAUD-010 — Lawn final art, clipping, audio and haptics are absent

- **System / classification / severity:** Lawn Care; **Partial migration**; **Medium**.
- **HTML behavior:** pixel-garden, mower, cutting/clipping and feedback presentation.
- **Phaser behavior:** correct routes, timing, strain and directional cuts; generic garden backdrop (`LawnCareScene.js:56-69`) and no scene haptics/audio.
- **Impact:** rules match, but mowing lacks source-identical feel.
- **Confidence:** High.
- **Correction direction:** add visual/audio layer without altering the certified movement engine.

### KW-XAUD-011 — House Rescue haptics are missing

- **System / classification / severity:** House Rescue; **Missing**; **Medium**.
- **HTML behavior:** vibration at sorting-wave transitions, cleaning layers and completion (`HTML:8131,8137,8149`).
- **Phaser behavior:** no `navigator.vibrate` call exists in `HouseRescueScene`.
- **Impact:** touch feedback is weaker during a precision-heavy mobile activity.
- **Confidence:** High.
- **Correction direction:** add reduced-motion/device-safe optional haptics using the exact protected patterns; no rule/state changes.

### KW-XAUD-012 — Fishing exact reference art is not migrated

- **System / classification / severity:** Fishing; **Visual mismatch**; **Medium**.
- **HTML behavior:** embedded fish WebP and dynamic fishing rig (`HTML:3460,3799-3840`).
- **Phaser behavior:** code-driven bank/rod/line/ripples plus emoji player/rod (`FishingScene.js:52-113,283-302`); no fishing texture is shipped.
- **Impact:** timing and catches match, but the scene does not look like the approved source.
- **Confidence:** High.
- **Correction direction:** extract/hash reference asset and bind the same cast/bite/reel state machine to final frames.

### KW-XAUD-013 — Magnet Fishing exact reference art is not migrated

- **System / classification / severity:** Magnet Fishing; **Visual mismatch**; **Medium**.
- **HTML behavior:** separate embedded magnet WebP and bank/rock/reference overlays (`HTML:3461` and related draw functions).
- **Phaser behavior:** procedural bridge plus emoji rope/magnet; no exact texture shipped.
- **Impact:** distinct mode logic exists, but its authored visual identity differs.
- **Confidence:** High.
- **Correction direction:** same extraction/state-binding process as Fishing.

### KW-XAUD-014 — restaurant art is an approved adaptation, not exact parity

- **System / classification / severity:** five food venues; **Intentional change with evidence**; **Medium**.
- **HTML behavior:** venue-specific pixel rooms, workers, customers, foods, tickets, appliances and counters.
- **Phaser behavior:** the protected dining/counter/kitchen composition is restored through shared procedural presentation, but final labelled Sprite AI characters/products/fixtures remain pending.
- **Evidence:** all ten before/after/legacy restaurant screenshots; `PHASE_3_RESTAURANT_VISUAL_FIDELITY_REVIEW.md`.
- **Impact:** function and spatial meaning are strong; visual identity remains visibly different.
- **Confidence:** High.
- **Correction direction:** asset replacement per venue after shared layout is frozen.

### KW-XAUD-015 — NPC expressive/weather frames remain simplified

- **System / classification / severity:** NPC presentation; **Partial migration**; **Medium**.
- **HTML behavior:** dedicated activity prop, hair/accessory, weather-clothing and weather-gear drawing.
- **Phaser behavior:** action states/props exist, but final weather clothing and expressive portrait frames remain labelled production art.
- **Impact:** sophisticated NPC logic is not always visibly communicated.
- **Confidence:** High.
- **Correction direction:** animate from saved action/weather state, never add a second behavior owner.

### KW-XAUD-016 — later animal animation nuances are simplified

- **System / classification / severity:** Animals; **Partial migration**; **Medium**.
- **HTML behavior:** later code-driven leg, wing, tail, water/aerial and idle nuances beyond the 43-cell master.
- **Phaser behavior:** the exact master covers all identities, but later procedural motion nuances are not all reproduced.
- **Impact:** animal identity is preserved; liveliness/species-specific motion differs.
- **Confidence:** High.
- **Correction direction:** extend animation metadata around the exact sheet without altering schedules/adoption state.

### KW-XAUD-017 — Jobs navigation differs

- **System / classification / severity:** Town navigation; **Intentional change with evidence**; **Medium**.
- **HTML behavior:** a player-accessible jobs panel can list available work (`HTML:3182`).
- **Phaser behavior:** reduced HUD, contextual entrances and first-session find/focus actions replace the persistent/comprehensive list.
- **Impact:** fewer buttons, but later players may have less direct visibility into all ready work.
- **Confidence:** Medium-high.
- **Correction direction:** product decision: retain the mobile menu philosophy while optionally adding one concise Jobs destination inside the menu, not a permanent HUD panel.

### KW-XAUD-018 — rewarded-ad retry is intentionally omitted

- **System / classification / severity:** Monetization/retry; **Intentional change with evidence**; **Medium**.
- **HTML behavior:** test rewarded-ad overlay and provider hook grant a retry after a completed ad (`HTML:228-237,1638-1644,4561-4596`).
- **Phaser behavior:** no ad retry; Phase 3 documentation explicitly says not to restore advertisements without a separate product decision.
- **Impact:** retry economics/flow differ, though the omission avoids shipping a prototype ad system.
- **Confidence:** High.
- **Correction direction:** do nothing unless the product owner explicitly approves an age/privacy/platform-compliant ad design.

### KW-XAUD-019 — physical pinch remains unverified

- **System / classification / severity:** Mobile input; **Unverified**; **High**.
- **HTML behavior:** two-pointer pinch/drag browsing.
- **Phaser behavior:** focal two-pointer code exists; desktop browser control cannot emit a genuine simultaneous device gesture.
- **Impact:** a core navigation gesture could still have device-specific defects.
- **Confidence:** High that verification is missing; no claim of a defect.
- **Correction direction:** operate on iOS and Android phone/tablet with notch/safe-area coverage and record focal-point/limit behavior.

### KW-XAUD-020 — real crash/save interruption remains unverified

- **System / classification / severity:** Persistence; **Unverified**; **High**.
- **HTML/Phaser behavior:** both implement backup/recovery; Phaser adds checksummed envelopes and read-back verification.
- **Evidence:** executable fault-injection tests pass, but no browser/native process termination during write was performed.
- **Impact:** last-mile durability is not proven on target platforms.
- **Confidence:** High that verification is missing.
- **Correction direction:** approved disposable test saves; terminate during each critical transaction; verify current/backup/recovery selection and no duplicate rewards.

### KW-XAUD-021 — audio/haptics timing is not fully verified

- **System / classification / severity:** Feedback; **Unverified / Partial migration**; **Medium**.
- **HTML behavior:** restoration oscillator and selected vibration events; no broad music/audio library.
- **Phaser behavior:** restoration oscillator, fishing/gift/milestone vibrations, but House Rescue haptics differ and no final sound asset pass exists.
- **Impact:** feedback may be inconsistent across activities and browsers.
- **Confidence:** High.
- **Correction direction:** physical-device sound/haptic matrix; document unsupported APIs as graceful no-op.

### KW-XAUD-022 — one-for-one legacy developer API is not retained

- **System / classification / severity:** QA/developer tooling; **Partial migration**; **Low**.
- **HTML behavior:** 218 public API keys and 80 validators.
- **Phaser behavior:** 72 top-level `window.__KINDWORKS_PHASER__` keys plus automated tests/harness; the differential mapper assigns every legacy key to a domain but does not recreate every callable API.
- **Impact:** some original diagnostic workflows cannot be invoked identically; player gameplay is not directly affected.
- **Confidence:** High.
- **Correction direction:** only port tools needed for deterministic parity/release checks; keep them development-only.

### KW-XAUD-023 — endurance and repeated-scene cleanup are unverified

- **System / classification / severity:** Technical runtime; **Unverified**; **Medium**.
- **HTML/Phaser behavior:** Phaser uses 20 lazy chunks and scene shutdown handlers; build budget passes.
- **Evidence:** no 30-minute minimum-device run, repeated all-scene loop, memory profile or thermal/FPS capture.
- **Impact:** leaks or slowdown can remain invisible to functional tests.
- **Confidence:** High that verification is missing.
- **Correction direction:** scripted scene loop plus physical-device performance trace and console/memory checkpoints.

## 6. Missing-feature register

| Missing ID | HTML feature with no full Phaser equivalent | Classification | Evidence |
| --- | --- | --- | --- |
| MISS-001 | Autonomous life for the owned resident | Missing | KW-XAUD-001 |
| MISS-002 | Universal interrupted-mini-game boot recovery/prompt | Partial/missing global coordinator | KW-XAUD-002 |
| MISS-003 | Harbour General embedded reference background | Missing visual asset | KW-XAUD-006 |
| MISS-004 | Fishing embedded reference image | Missing visual asset | KW-XAUD-012 |
| MISS-005 | Magnet Fishing embedded reference image | Missing visual asset | KW-XAUD-013 |
| MISS-006 | House Rescue protected vibration patterns | Missing feedback | KW-XAUD-011 |
| MISS-007 | Rewarded-ad retry | Intentional change with evidence | KW-XAUD-018 |
| MISS-008 | One-for-one 218-key legacy QA API | Partial tooling change | KW-XAUD-022 |

No evidence was found that a whole named core mini-game, shop, economy domain, farming domain, animal catalogue, ordinary-NPC catalogue, or campaign level range is entirely absent.

## 7. Partial and disconnected-feature register

| ID | Feature | What exists | What is partial/disconnected |
| --- | --- | --- | --- |
| PART-001 | Owned resident | Profile, appearance, home, locate, direct control | Not connected to `NpcTownLifeService` autonomy/social graph |
| PART-002 | Persisted sessions | Each major service owns resumable state | Boot/global UI does not discover every persisted activity |
| PART-003 | Town visual states | Houses, shops, dirt, grass, weather, wildlife, props | Final pixel composition/assets/animation are not source identical |
| PART-004 | House interiors | Accurate footprint/collision/furniture state | Generic rectangles/emoji and static occupants |
| PART-005 | River | Complete rules/input/rewards | Simplified art/effects/audio/result flow |
| PART-006 | Waste | Exact boards/certificates/rewards | Simplified 40-item art and transition/game-feel layer |
| PART-007 | Beach | Exact board/groove/undo/rules | Simplified world/player/rake/collection/celebration |
| PART-008 | Lawn | Exact routes/levels/cuts/tools/rewards | Simplified garden/mower/clipping/audio/haptics |
| PART-009 | Fishing/Magnet | Exact state/timing/catalogues | Exact embedded reference images/frames absent |
| PART-010 | Restaurants | Exact services and protected spatial composition | Final per-venue character/food/fixture art absent |
| PART-011 | NPC/animal visuals | Correct action/species state and protected animal sheet | Expressive/weather/species motion nuances incomplete |
| PART-012 | Developer tooling | Strong tests/certifications and isolated harness | Not one-for-one with legacy public APIs |

## 8. Exact data comparison

### Campaign and content counts

| Dataset | HTML | Phaser | Result/evidence |
| --- | ---: | ---: | --- |
| Waste Collection levels | 750 | 750 | Exact count; source hash/certificates; all validate |
| Lawn Care levels | 750 | 750 | Exact count; 750 source families; stored solutions validate |
| River Clear-Out levels | 750 | 750 | Exact count; catalogue validation |
| House Rescue levels | 750 | 750 | Exact count; deterministic item/dirt generation |
| Beach Cleanup levels | 750 | 750 | Exact count; source SHA and certified routes |
| Power Washing levels | 750 | 750 | Exact count; source SHA and deterministic generator |
| Little Bakery shifts | 150 | 150 | Exact count; 24 recipes, 50 ingredients, 7 appliances |
| Corner Café shifts | 150 | 150 | Exact count; 64 recipes, 75 ingredients, 13 appliances |
| Morning Mug shifts | 150 | 150 | Exact count; 54 recipes, 28 ingredients, 5 appliances |
| Riverside Kitchen shifts | 150 | 150 | Exact count; 32 recipes, 58 ingredients, 9 appliances |
| South Shore Scoops shifts | 750 | 750 | Exact count; 24 parts, 19 families, 48 customer names |
| **Campaign total** | **5,850** | **5,850** | Differential audit PASS |
| Houses | 19 | 19 | Exact positions/identities |
| Architecture/interior themes | 5 exterior kit families / 6 interior themes | Same | Tests pin assignment/footprint |
| Shops/businesses | 12 | 12 | Exact count/entrances |
| Roads / bridges / districts | 9 / 3 / 10 | 9 / 3 / 10 | Exact |
| Ordinary residents | 35 | 35 | Exact; 19 homes, 67 friend pairs, 133 nav nodes, 138 links |
| NPC narrative profiles | 35 | 35 | Four stages; 19 home narratives |
| Animal species / identities | 37 / 56 | 37 / 56 | Exact |
| Wild / shop animals | 45 / 11 | 45 / 11 | Exact |
| Rare encounters | 5 | 5 | Exact |
| Animal reference frames | 43 | 43 | Exact extracted sheet |
| Fishing spots / catches | 3 / 10 | 3 / 10 | Exact |
| Magnet finds | 8 | 8 | Exact |
| Aquarium species | 4 | 4 | Exact |
| Item definitions | 82 | 82 | 76 legacy catalogue entries plus 6 farming-era additions |
| Inventory buckets | 4 | 4 | Equipment, placeables, consumables, furniture |
| Placeables / released | 35 / 32 | 35 / 32 | Exact; 500 placement cap |
| Furniture products | 10 | 10 | Exact; 60 interior placement cap |
| Paws companions | 11 | 11 | Exact |
| Harbour products / starter slots | 17 / 6 | 17 / 6 | Exact |
| Allotment beds / crops | 6 / 3 | 6 / 3 | Exact |
| Orchard initial positions / capacity | 6 / 24 | 6 / 24 | Exact |
| Lawn records / active physical lawns | 20 / 19 | 20 / 19 | Slot 19 reserved; 19 player-visible |
| Waste rubbish types | 40 | 40 | Exact catalogue |
| Beach rubbish types | 19 | 19 | Exact catalogue |
| House Rescue rubbish types/categories | 15 / 3 | 15 / 3 | Exact |
| River rubbish types | 7 | 7 | Exact |
| Mower profiles | 6 | 6 | Exact |
| Power Washing nozzles | 3 | 3 | Exact |
| Restoration milestones | 8 | 8 | Exact |
| Coin packs / club tiers | 6 / 3 | 6 / 3 | Exact content; purchase authority intentionally differs |

### Exact scalar comparison boundary

The differential script directly parses and compares 85 scalar properties from Café, Morning Mug, Riverside Kitchen, Bakery, Scoops, House Rescue, Fishing, Magnet Fishing, Harbour General and Homeowner Gifts. It does **not** directly compare every property in all 65 major legacy constants. Passing owner tests is strong evidence, but it must not be described as a literal field-by-field source comparison beyond those 85 values.

## 9. Screen and scene flow comparison

### Legacy

`HTML load → validate/load current, backup, or compatible v12–82 save → town setup/creator when fresh → Town`.

Town uses DOM overlays and canvases for setup, jobs, campaign, farming, inventory/shop, Impact, stories, resident/pet/home management, and several games. The older cleanup games run inside a managed embedded frame; restaurants, fishing, House Rescue, interiors and world systems are integrated in the main document. A generic `activeMiniGameSession` / `miniGameRecoveryState` protects interrupted cleanup results and retries.

### Phaser

`src/main.js → state/bootstrap/services/controllers → BootScene → TownScene or one of four auto-detected active cleanup scenes`.

Town is the only eagerly registered gameplay scene. Sixteen additional scenes are lazy-loaded: House Interior, Village Grocer, Paws & Wonders, Harbour General, Bakery, Café, Morning Mug, Riverside Kitchen, Scoops, River, House Rescue, Waste, Lawn, Beach, Power Washing, and Fishing. A shared loading/error overlay wraps lazy transitions.

### Flow differences

- Phaser adds a global landscape/portrait shell and pauses the world/game loop during the wrong orientation.
- River is intentionally portrait-only; all other play is landscape-only.
- Phaser consolidates secondary Town controls into one menu and removes visible zoom buttons/title banner.
- Phaser uses contextual Town entry instead of the legacy comprehensive Jobs panel.
- Phaser has safer development-only QA routes and an isolated fidelity storage namespace.
- Legacy has a generic interrupted-game recovery prompt; Phaser's BootScene only auto-routes four activity types.
- Phaser's web commerce refuses local checkout without a connected verified authority; legacy contains a standalone prototype/provider surface.
- Legacy rewarded-ad retry is intentionally not present in Phaser.

## 10. Save-system comparison

### Storage/envelope

| Concern | HTML | Phaser | Parity result |
| --- | --- | --- | --- |
| Current key | `kindworks_living_town_v38` | `kindworks_phaser_v1` | Intentional separate namespace |
| Backup key | `_v38_backup` | `_v1_backup` | Equivalent |
| Recovery key | `_v38_recovery` | `_v1_recovery` | Equivalent |
| Version | 82 | schema 37 | Different internal schema |
| Integrity | `integritySeal` | checksummed `kindworks-phaser` envelope | Phaser-only hardening |
| Compatible old saves | HTML v12–82 | Phaser schema 1–37 plus legacy v12–82 importer | Functional coverage passes |
| Read-back verification | HTML writes and backs up prior compatible payload | Phaser validates, writes, rereads, validates checksum/state | Phaser-only hardening |
| Legacy overwrite | HTML writes its own key | Phaser importer never writes legacy key | PASS |

### Field/domain mapping

| HTML save field/domain | Phaser owner | Status/notes |
| --- | --- | --- |
| `version`, `savedAt`, `integritySeal` | envelope + `schemaVersion`, timestamps, source metadata | Renamed/hardened |
| `worldDay`, `worldClockMinutes`, `weather` | `world` | Mapped/normalized |
| `completedJobCount`, `miniGames.progress` | `progress.cleanup` and activity domains | Mapped |
| `playerSetup` | `identity`, `customResident`, `onboarding` | Split into explicit owners |
| player/camera transient state | `player`; Town camera runtime | Player return state stored; camera parity not field-identical |
| `economy` | `economy`, `inventory`, `commerce` | Split/reconciled; atomic ledger |
| `animals` | `animals` | Mapped/expanded |
| `fishing`, `magnetFishing` | `fishing` | Combined owner, distinct branches |
| `allotment`, `orchard`, `farmingFoundation` | `farming`, inventory and town placement | Reconciled |
| `lawns` | `farming.lawns` and `lawnCare` campaign | World/campaign separated |
| `riverGarbage`, `riverRuntime` | `environment.river` and `river` campaign | World/campaign separated |
| `litter`, `landRuntime` | `environment.land` | Mapped |
| `garbageCollection` | `municipalCollection` | Mapped |
| `socialRestorationRuntime`, `npcs` | `npcs` | Mapped; 35 residents only |
| `npcNarratives` | `npcs`/narrative state | Mapped |
| `businesses` | environment/Harbour/restoration state | Reconciled by owner |
| `homeFurniture` | `homeInteriors` | Mapped |
| `houseRescue` | `houseRescue` | Mapped |
| `homeownerGifts` | `homeownerGifts` | Mapped |
| `cafe`, `bakery`, `morningMug`, `riversideKitchen`, `southShoreScoops` | same-named Phaser domains | Mapped |
| `playgroundCleanup` | `playgroundPowerwash` | Renamed owner |
| `milestones` | `restorationMilestones` | Mapped |
| `harbourGeneral` | `harbourGeneral` | Mapped |
| `onboarding` | `onboarding` | Mapped |
| `miniGames.active`, `miniGames.recovery`, `miniGames.history` | per-activity active sessions; no single complete global boot recovery owner | **Partial flow parity** |
| unknown known items | `inventory.unresolvedLegacy` | Preserved for reconciliation |
| original entire payload | `legacySnapshot`, `legacyReconciliation` | Phaser-only loss-audit safety |

The automated importer and reconciliation tests are extensive, but a literal nested-field comparison of every dynamically serialized NPC/animal/world record was not manually inspected after a real browser import in this audit. That remains unverified rather than silently assumed.

## 11. Visual comparison report

### Evidence inspected

- `phase3-evidence/baseline/legacy-town-1280x720-setup-complete.png`
- `phase3-evidence/baseline/phaser-town-1280x720-before.png` (historical pre-FID-020 baseline, not the latest HUD)
- `phase3-evidence/restaurants/legacy-*.jpg`
- `phase3-evidence/restaurants/phaser-*.jpg`
- `phase3-evidence/restaurants/after-phase3-*.jpg`
- `phase3-evidence/powerwash/*.jpg`
- `phase3-evidence/bakery/bakery-independent-trays.jpg`

| Screen/family | Comparable result |
| --- | --- |
| Town | Latest logic/layout fixes remove the outdated title/zoom UI shown in the historical Phaser baseline. Even after those fixes, the HTML uses richer pixel architecture, terrain, fencing, roads and character detail. Final Town texture parity is not approved. |
| Business exteriors | Twelve identities are now compositionally distinct, but final source-faithful textures/merchandise/staff art are not installed. |
| Five restaurants | After-Phase-3 images are materially closer in spatial hierarchy than pre-recovery Phaser images. They remain visibly code-driven versus the HTML pixel-art source. |
| Power Washing | Strongest visual recovery: exact clean/dirt sources, 3:2 canvas, full-resolution mask, wand/foam/mist/wetness behavior. Existing evidence supports source composition parity. |
| Animals | Exact v44 reference master is shipped and shared across relevant screens. Later procedural motion nuance remains partial. |
| Houses/lawns | Exact identities/architecture/growth/dirt state are represented; final bespoke surface/prop art remains pending. |
| House interiors | Geometry/state are strong; generic furniture/emoji/static occupants are visibly non-equivalent. |
| River/Waste/Beach/Lawn | Rules and mobile layout are strong; authored art, transition and feedback layers remain incomplete as detailed in KW-XAUD-007 through 010. |
| Fishing/Magnet | Restored rod/line/float/ripple/magnet phases are code-driven; exact embedded reference art is absent. |
| Mobile/tablet | Earlier Phase 2/3 evidence covers the required matrix for important families, but this audit did not recreate every screen at all ten sizes. Final assets may change fit and must trigger a new matrix. |

## 12. Unverified items and blockers

| Unverified scope | Exact reason | Required evidence |
| --- | --- | --- |
| Every feature runtime path | Browser semantic inspection was later denied; audit prohibited save mutation | Approved isolated QA origin/save and browser access |
| Clean/existing-save side-by-side | No user/production save inspection or mutation allowed | Disposable legacy and Phaser fixtures with deterministic state |
| All representative levels manually | 5,850-level campaigns cannot be honestly UI-played in one read-only audit | Approved non-production level-select harness, recorded boundary/random sweep |
| Physical pinch/swipe | Desktop automation is not a true multi-touch device | iOS/Android phone and tablet evidence |
| Safe areas/notches | Desktop viewport emulation cannot prove native insets | Devices with notch/home indicator |
| Audio/haptics | Browser permission/device hardware unavailable | Physical-device cue matrix |
| OS background/crash recovery | No process termination/fault during actual native write | Packaged-build destructive test on disposable saves |
| Endurance/performance | No 30-minute minimum-device session | FPS/memory/thermal trace and repeated scene loop |
| Final art | Sprite AI production assets do not yet exist | Final atlases/assets, pivots, scale/depth/animation acceptance |
| Visual Bible/reference | Visual Style Bible v4 and `KW-REF-HOUSE-A-V4` are not present in the inspected repository | Attach authoritative files before final-art approval |

## 13. Prioritised correction backlog (recommendations only)

No corrections were made in this audit.

### 1. Foundation and architecture

1. Add one authoritative persistent-activity resolver and recovery prompt for every service.
2. Add an additive owned-resident autonomous-state owner integrated with, but not duplicating, the 35-resident graph.
3. Preserve immutable HTML hashes and expand scalar source probes beyond the current 85 high-value fields.

### 2. Broken progression or save behavior

1. Prove pending-result and interrupted-session recovery for every activity after reload/process death.
2. Prove existing schema-37 and imported v12–82 saves through the new owned-resident migration.
3. Preserve exactly-once rewards and return positions when introducing the universal recovery coordinator.

### 3. Missing core gameplay

No whole core game is currently proven missing. The owned-resident autonomy feature is the only confirmed major behavioral omission.

### 4. Partial systems and integrations

1. Owned-resident schedules, needs, relationships, conversations, business visits and community behavior.
2. Universal resume UX for River, House Rescue, all restaurants and any other persisted activity.
3. Optional Jobs discoverability decision inside the consolidated Town menu.

### 5. Data/content parity

1. Generate a machine-readable full constant/array diff for all safely parseable legacy catalogues, not just counts and 85 scalars.
2. Add duplicate/semantic-distance reporting for generated level families where "unique" does not automatically mean meaningfully different.
3. Retain provenance hashes for every extracted embedded asset.

### 6. UI and layout parity

1. Re-run every important screen at all ten required viewports after final assets.
2. Verify Town pinch, direct resident control, every entrance, contextual panel placement and Jobs discoverability on physical devices.

### 7. Visual assets and animation

1. Extract/hash Harbour General, Fishing and Magnet reference images.
2. Replace Town/business/house/interior labels in small, separately verified batches.
3. Recover River, Waste, Beach and Lawn presentation/effect layers without touching their certified engines.
4. Replace five restaurant visual families one venue at a time.
5. Complete NPC weather/expression and animal species-motion frames.

### 8. Polish and low-severity differences

1. Restore House Rescue haptic cues.
2. Run audio timing/stacking/background tests.
3. Decide which legacy diagnostic APIs remain valuable and keep only development-safe equivalents.
4. Complete 30-minute endurance, repeated scene-entry, accessibility and reduced-motion passes.

## 14. Verdict

**Audit incomplete.**

The inspected static scope is comprehensive and has produced a complete status matrix for the feature families derived from the HTML. The current evidence strongly supports data, rule, reward, economy and save-model preservation across the automated scope. It also proves that the Phaser game is **not yet a complete visual/behavioral duplicate** of the HTML: owned-resident autonomy and universal interrupted-session recovery are real behavioral gaps, and substantial presentation work remains.

The exact remaining scope required before the phrase "Exhaustive audit completed against the inspected scope" can be used is:

1. Operate every reachable matrix feature in both versions from approved disposable clean/existing saves.
2. Complete success, failure, restart, exit, reload and cross-system paths for every activity.
3. Complete the required level/viewpoint sweep through an approved isolated QA harness.
4. Test physical phone/tablet touch, orientation, safe areas, audio/haptics, process recovery and endurance.
5. Install final Sprite AI art and repeat pixel/depth/animation comparison.
6. Supply the Visual Style Bible v4 and `KW-REF-HOUSE-A-V4` for final visual acceptance.
