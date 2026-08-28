# KindWorks Phase 2 — Production UI Simplification Report

## Working baseline

- Working branch: `phase-2-ui-simplification`
- Starting branch: `phase-3-legacy-fidelity-recovery`
- Starting commit: `0fdd102` (`Bound Town diagnostic cloning`)
- Functional contract: `docs/qa/PHASE_1_MIGRATION_PARITY_AUDIT.md`
- Legacy reference: `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`
- Protected unrelated work: untracked `KindWorks Migration Starter .json` (not modified or staged)
- Visual reference available in the earlier Phase 2 record: KindWorks Visual Style Bible v3; v4 and `KW-REF-HOUSE-A-V4` are not present in the repository.

This report treats Phase 1 behaviour as the contract. UI structure, copy, and navigation may change; level data, unlocks, rewards, saves, ownership, world simulation, completion rules, and town integrations may not change without a documented gameplay defect.

## UI philosophy

KindWorks production UI follows four rules:

1. The world or playable board is the dominant visual.
2. Each screen has one player purpose and one primary action.
3. Technical evidence stays available to development automation but is never visible player copy.
4. A town interaction starts the correct current activity immediately; optional replay and level inspection are development tools, not normal navigation.

## Screen inventory

### Phaser scenes

| Screen | Purpose | Reachability | Current problems | Decision | Replacement flow | Status |
| ------ | ------- | ------------ | ---------------- | -------- | ---------------- | ------ |
| BootScene | Load state, register services, enter town | Automatic | No dedicated player loading presentation; shared loading overlay covers lazy scenes | KEEP | Boot directly into the saved town; show only the shared loading/error state when required | Inventoried |
| TownScene | Explore, select people/places/jobs | Primary hub | QA data is written to DOM attributes; contextual and secondary systems can compete | SIMPLIFY | Map + compact resources + contextual action + one menu | Inventoried |
| VillageGrocerScene | Walk the shop and buy food/seeds | Town building | Milestone/developer heading and keyboard-heavy instructions | SIMPLIFY | Shop name, balance, nearby shelf action, Exit | Inventoried |
| PawsWondersScene | Browse/adopt companions | Town building | Milestone/developer heading and keyboard instruction | SIMPLIFY | Habitat interaction, price/adoption feedback, Exit | Inventoried |
| HarbourGeneralScene | Operate the owned shop | Town building | Milestone label and raw keyboard command list dominate | SIMPLIFY | Contextual display action, compact till/sales, Exit; help in menu | Inventoried |
| HouseInteriorScene | Inspect/use/place furniture and aquarium; enter house rescue | Town house | Dense badges, internal ownership/house detail, separate rescue start copy | SIMPLIFY | Room remains dominant; contextual furniture/occupant action; rescue starts directly when selected | Inventoried |
| LawnCareScene | Clear a lawn with slide movement | Town lawn/campaign | Player level picker, level/campaign labels, board metadata, multi-stat result | CONVERT TO CONTEXTUAL UI | Load current unlocked or assigned job immediately; objective + moves/progress; brief reward then town | Complete |
| RiverClearoutScene | Portrait falling-piece river cleanup | Town river/campaign | Player level picker, level/campaign metadata, technical result stats | CONVERT TO CONTEXTUAL UI | Load current level immediately; board + next/remaining + pause; brief result | Complete |
| WasteCollectionScene | First cleanup and 750-board triple match | Town rubbish/campaign | Campaign picker, level/board-generation metadata, detailed result; first-job and campaign HUDs overlap conceptually | CONVERT TO CONTEXTUAL UI | Assigned/current board begins immediately; board + tray + contextual hint/restart; brief result | Complete |
| HouseRescueScene | Sort rubbish then vacuum dirt | Dirty house | Player picker, level/tier metadata, technical result detail | CONVERT TO CONTEXTUAL UI | Correct house/current rescue starts immediately; current tool/progress + pause; brief result | Complete |
| BeachCleanupScene | Walk/rake South Shore | Town beach/campaign | Player picker, level/grid metadata, persistent challenge detail, multi-stat result | CONVERT TO CONTEXTUAL UI | Start assigned/current beach immediately; raked/found progress + contextual bonus; brief result | Complete |
| PlaygroundPowerwashScene | Wash the playground | Town playground/campaign | Player picker, 750-level/development copy, mask/tolerance/stroke result detail | CONVERT TO CONTEXTUAL UI | Start assigned/current playground immediately; nozzle/pressure/cleaning + pause; brief reward | Inventoried |
| FishingScene | Fish or magnet-fish at selected water | Town water | Catch-list/streak information is more than the immediate action needs | SIMPLIFY | Water/cast state + one Cast/Reel/Pull action + last catch + Exit | Inventoried |
| BakeryScene | Prepare bakery orders | Town bakery | Player shift picker, level/progress totals, repeated recipe labels, four-stat result | CONVERT TO CONTEXTUAL UI | Current shift opens immediately; current order/worktop/serve + pause; brief reward | Inventoried |
| CafeScene | Prepare café orders | Town café | Player shift picker, level/progress totals, repeated order/tray information, four-stat result | CONVERT TO CONTEXTUAL UI | Current shift opens immediately; order/worktop/serve + pause; brief reward | Inventoried |
| MorningMugScene | Prepare coffee orders | Town coffee shop | Player shift picker, level/progress totals, repeated order/tray information, four-stat result | CONVERT TO CONTEXTUAL UI | Current shift opens immediately; drink/worktop/serve + pause; brief reward | Inventoried |
| RiversideKitchenScene | Prepare restaurant meals | Town restaurant | Player shift picker, level/progress totals, repeated order/tray information, four-stat result | CONVERT TO CONTEXTUAL UI | Current shift opens immediately; meal/worktop/serve + pause; brief reward | Inventoried |
| SouthShoreScoopsScene | Build picture ice-cream orders | Town ice-cream counter | Player shift picker, level/progress totals, score and detailed result | CONVERT TO CONTEXTUAL UI | Current shift opens immediately; picture order/build/serve + pause; brief reward | Inventoried |

All 16 lazy scenes registered in `src/scenes/lazyScenes.js` have a Town entry owner or a deliberate home/job entry. No additional orphan Phaser scene was found. Player-facing level pickers are embedded DOM states rather than separate Phaser scenes, but they still create unnecessary screens and are therefore classified for removal.

### Global overlays and panels

| Screen or overlay | Purpose | Current problems | Decision | Replacement flow | Status |
| ----------------- | ------- | ---------------- | -------- | ---------------- | ------ |
| Landscape/portrait orientation state | Prevent unsafe play after rotation | Correct one-sentence barrier; River uses portrait exception | KEEP | Pause exact state and restore it on correct orientation | Inventoried |
| Shared loading/error overlay | Explain lazy loading or failure | Necessary and already concise | KEEP | One loading message; one dismissible recovery message | Inventoried |
| Town menu | Pause and open secondary destinations | Eight destinations are acceptable only here; `Save` opens technical save detail | SIMPLIFY | Resume/Shop/Inventory/Resident/Animals/Stories/Impact; settings/help when implemented | Inventoried |
| Onboarding town-name panel | Name town | Rewards detail exposes duplication-protection language | SIMPLIFY | Name town, then resident creator; reward details optional and player-worded | Inventoried |
| First-session guide | Teach through live town play | Step numbering is acceptable transiently; ensure only one instruction | KEEP | One saved contextual instruction at a time | Inventoried |
| Daily reward toast | Report reward | Already short | KEEP | Reward + dismiss | Inventoried |
| Custom resident creator | Appearance, hobbies, starter home | Correctly split across three pages; header still exposes milestone copy | SIMPLIFY | Three focused steps; creation as primary action | Inventoried |
| NPC story panel | Read optional resident stories | Milestone heading, chapter evidence, requirement/bond lists and status language expose system structure | SIMPLIFY | One message/chapter at a time; longer detail remains player-initiated | Inventoried |
| Animal friends panel | Greet/feed/adopt/follow animals | Milestone heading, global adoption count, habitat/system summary are dense | SIMPLIFY | Selected animal + trust + suitable food + contextual primary action | Inventoried |
| Farming panel | Plant/harvest/manage orchard/lawns | Milestone heading and long system explanations | SIMPLIFY | Crop/tree/lawn state and one contextual action; optional help | Inventoried |
| Shop panel | Understand/buy/place an item | Milestone heading, atomic-save/rollback note, footprint/debug-like placement copy, verbose buy label | SIMPLIFY | Image/name/price/owned/lock + Buy; placement action only when relevant | Inventoried |
| Wallet/inventory panel | Inspect balance and owned items | Milestone/catalogue counts, ledger internals, transaction-safety note | SIMPLIFY | Balance, recent player-readable activity, owned inventory; commerce remains separated | Inventoried |
| Commerce/support panel | Optional real-money support and purchase recovery | Required safety/legal copy must remain; development-authority status must be player-safe | KEEP | Products, adult confirmation, restore/manage, concise availability/error state | Inventoried |
| Impact panel | Explain real-world impact | Long but deliberately player-initiated; validation/offline implementation wording is technical | SIMPLIFY | Verified totals, stories, privacy; hide data-pipeline language | Inventoried |
| Save status panel | Save recovery/import | “MILESTONE”, schema/separate-area details and manual create-save action feel like a developer utility | MOVE TO MENU / DEBUG ONLY | Silent healthy save; show recovery/import/error only when action is required | Inventoried |
| Interaction prompt | Perform selected world action | Keyboard key/detail appear on touch; wording can duplicate action | SIMPLIFY | One contextual action; input hint only for active input type/onboarding | Inventoried |
| Town placement banner | Place/rotate/cancel | Necessary contextual controls; placement count is secondary | KEEP | Preview + Rotate/Place/Cancel; count only near capacity | Inventoried |
| Placed-object panel | Move/store selected object | Necessary and compact | KEEP | Move/Store/Close | Inventoried |
| Resident-control banner | Explain optional direct resident control | Direction copy is unnecessary after first use | SIMPLIFY | Resident name + Return to map | Inventoried |
| Restoration reveal | Celebrate permanent town change | Two explanatory paragraphs and explicit permanent-system heading | SIMPLIFY | What changed + gift, one continue action | Inventoried |
| Homeowner gift flow | Story-led gratitude and item decision | Two-step “see gift” flow plus milestone heading can be merged | MERGE | One warm message showing gift + Keep/Use | Inventoried |
| Generic cleanup result | Show first cleanup reward | Rating, reward, balance and 100% heading repeat the outcome | SIMPLIFY | “Area cleaned! +coins” then one return | Inventoried |
| Main menu / account / settings / dedicated pause / offline recovery | Standard secondary flows | No distinct production implementation found | KEEP ABSENT / DEFER | Do not invent parity-breaking systems; shared error/save recovery covers current needs | Inventoried |

## UI element classification register

| Element family | Original location | Classification | New location or removal | Reason |
| -------------- | ----------------- | -------------- | ----------------------- | ------ |
| Playable map/board/water/worktop | Town and every activity | Essential and always visible | Retain as dominant surface | Core purpose |
| Current objective/order | Activity HUD | Essential and always visible | Compact card/row inside live gameplay | Next action must be clear |
| Live progress needed for decisions | Activity HUD | Essential and always visible | Retain only moves/fuel/time/patience/progress that changes play | Fairness |
| Cast/Reel/Pull, Serve, Buy, Plant, Feed, Place | Contextual UI | Essential but contextual | Show only when usable | One-primary-action rule |
| Undo/Hint/Restart | Activity HUD | Essential but contextual | Reveal after a move/failure or place in pause | Avoid inactive clutter |
| Exit/Return/Close | Headers/results | Secondary and menu-only, except safe Exit | One safe Exit or one Close; no duplicate Return/Continue | Predictable navigation |
| Shop, Inventory, Resident, Animals, Stories, Impact | Town HUD/menu | Secondary and menu-only | Town menu | Keep town visible |
| NPC dialogue and thought | Story overlays | Story-led | One message at a time | Preserve warmth without system metadata |
| First-use gestures/rules | Intro/picker panels | First-time tutorial only | One live contextual prompt, then persist completion | Teach by playing |
| Level select, QA clear/solve, seed/state diagnostics | Activity pickers/DOM data | Debug-only | Development harness only | Not player decisions |
| Milestone numbers and migration labels | Headers/panels | Debug-only | Remove from production copy | Development history is not game content |
| Campaign size, completed totals, catalogue validity | Headers/pickers/DOM data | Debug-only | Retain in tests/diagnostic attributes only when development-gated | Backend evidence |
| Level number and “X of 750/150” | Pickers/live headers | Unnecessary | Remove from normal production journey | Correct current level is automatic |
| Board dimensions/type/layers/stain counts | Live mini-game headers | Debug-only | Remove; keep meaningful objective count only | Generation metadata |
| Multi-stat result grids | Every campaign result | Duplicated/unnecessary | Result + reward; failure reason + Try Again | Faster return to play |
| Replay and Next beside Return | Results | Duplicated | One primary Return/Continue; replay via world re-entry or contextual choice | Prevent choice overload |
| Save schema, legacy untouched, rollback notes | Save/shop/economy panels | Debug-only | Tests and recovery logs; player sees only actionable failure | Technical implementation |
| Internal item/animal/NPC IDs and raw JSON | QA attributes/services | Debug-only | Never rendered; keep data ownership internal | Production safety |
| Coins and price | Town/shop | Essential and always visible where spending matters | Compact resource counter | Decision-critical |
| Owned/locked state | Shop/inventory | Essential but contextual | Item card/detail | Purchase clarity |
| Long recipe/system explanations | Pickers/panels | First-time tutorial only | Optional Help after first demonstration | Avoid repeated text |
| Keyboard-only command strings | Building headers | First-time tutorial only | Input-aware help/menu | Mobile-first presentation |

## Coded but non-production and development surfaces

- URL `qa` modes and QA solve/clear buttons are guarded by `import.meta.env.DEV`; they remain development-only.
- Diagnostic `data-*` attributes are heavily used by automated tests. They are not visually rendered, but production emission will be reviewed so raw internal data is not exposed unnecessarily.
- There is no player-facing level-select service outside the embedded picker controls. Removing picker navigation must preserve an approved development-only route for boundary-level QA.
- There is no separate account, privacy-consent, settings, pause, offline, or error Phaser scene. The existing commerce safety controls, shared lazy-load error, and save recovery panel are the only current equivalents.

## Removed screens

| Removed screen | Why unnecessary | Original flow | New flow | Regression result |
| -------------- | --------------- | ------------- | -------- | ----------------- |
| Lawn Care level picker | The player has no useful level choice in normal progression | Town interaction → picker → Start | Town interaction → current/assigned lawn immediately | 572/572 tests; production build and performance pass; live town-guided entry and active-save reload pass |
| River Clear-Out level picker | Normal progression determines the cleanup and River is already orientation-gated | Town interaction → rotate/picker → Start | Town interaction → rotate when needed → active board | Focused River/gesture tests pass; normal onboarding entry, portrait play, tap rotation, and orientation resume pass |
| Waste Collection campaign picker | Town progression already owns the current unlocked cleanup | Town interaction → campaign picker → Start | Town interaction → current/assigned matching board immediately | 573/573 tests; build/performance pass; isolated fidelity entry, touch selection and exact rotate/resume pass; first town job remains separate |
| House Rescue level picker | The dirty house identity and saved campaign state already determine the rescue | Dirty home → picker → Start | Dirty home → current/assigned rescue immediately | 573/573 tests; build/performance pass; direct entry, correct touch sort and exact rotate/resume pass |
| Beach Cleanup level picker | Town progression already determines the active South Shore cleanup | Town interaction → picker → Start | Town interaction → assigned/current beach immediately | Protected 750-level and gesture suites pass; direct entry, guided movement, rake rendering and rotate/resume pass |

## Removed or relocated information

| UI element | Original location | Classification | New location or removal | Reason |
| ---------- | ----------------- | -------------- | ----------------------- | ------ |
| Milestone/campaign/progress heading | Lawn Care header | Debug-only/duplicated | Removed | Development history and completion totals do not help the current move |
| Level number, campaign size and par | Lawn Care live HUD | Debug-only/unnecessary | Removed from visible UI; protected values remain in service/tests | The player needs cut progress and remaining moves |
| Persistent stars, legend and upgrade explanation | Lawn Care side rail | Secondary/tutorial-only | Removed; mower name retained | The board shows grass/hedges and the explanation consumed playable width |
| Replay, Next and Return trio | Lawn Care result | Duplicated | Contextual Try again on failure or Continue on success | One-primary-action rule |
| Campaign/level/difficulty/par/stars metadata | River header, side rail and result | Debug-only/unnecessary | Removed; next-three preview and meaningful progress remain | Preserve fair play without exposing generator/scoring detail |
| Four River result actions | River result | Duplicated | Continue on success; Undo last or Try again on failure | One clear recovery action |
| Campaign totals, level selector, card/type/layer/difficulty and match totals | Waste Collection campaign | Debug-only/duplicated | Removed from visible UI; all 750 boards remain in the protected service and tests | The live board needs only the objective, cards left and five-slot tray |
| Replay, Next and Return trio | Waste Collection campaign result | Duplicated | One Continue action with the saved reward | Town progression owns the next activity |
| Level/tier, score, mistakes, wave, stain-layer, power and detailed result metrics | House Rescue | Debug-only/duplicated | Removed from visible UI; clean percentage, items left and named vacuum remain | The two-stage rescue stays understandable without exposing generator/scoring internals |
| Overlapping compact sorting cards | House Rescue at 568×320 | Usability defect | Stable two-row compact slots with 44px touch targets | Prevent one item intercepting a tap intended for another |
| Campaign/level/grid, move and earned-coin metrics | Beach Cleanup | Debug-only/duplicated | Removed; Raked and Found remain beside the board | Keeps the rake board and its protected grooves visually dominant |
| Three Beach result actions and four result metrics | Beach Cleanup | Duplicated/unnecessary | Reward plus one Continue action | Re-entry through South Shore owns replay/progression |

## Before-and-after verification

| Screen | Before evidence | After evidence | Phone tested | Tablet tested | Regression result | Commit |
| ------ | --------------- | -------------- | ------------ | ------------- | ----------------- | ------ |
| Baseline town/onboarding | `phase2-ui-evidence/before/` | — | All nine required landscape sizes | 390×844 rotate state | 571/571 tests; build/performance pass | — |
| Lawn Care | `phase2-evidence/wave4-lawn/lawn-568x320-before.png` | `phase2-ui-evidence/after/lawn-direct-568x320.png` | 568×320, 844×390, 1280×720 | 1024×768 | Direct entry, swipe 7%→29%, reload at 29%/1 move, rotate/resume exact, no fresh runtime errors, 572/572 tests | `484eeac` |
| River Clear-Out | `phase2-evidence/wave4-river/river-390x844-picker-before.png` | `phase2-ui-evidence/after/river-direct-390x844.png` | 568×320 protected rotate state | 390×844 portrait activity | Entered through normal onboarding, no picker, tap rotated the I piece horizontally→vertically, rotate barrier restored exact active state, focused tests pass | `915aa7b` |
| Waste Collection campaign | `phase2-evidence/wave4-waste/waste-picker-568x320-before.png` | `phase2-ui-evidence/after/waste-direct-568x320.png` | 568×320, 844×390; 390×844 rotate state | 1024×768 | Direct entry without picker, card selection changed 30/0 → 29/1, orientation pause restored exact active board; protected first town job already passed normal onboarding; 573/573 tests | `ad97430` |
| House Rescue | `phase2-evidence/wave4-house-rescue/house-rescue-picker-568x320-before.png` | `phase2-ui-evidence/after/house-rescue-direct-568x320.png` | 568×320; 390×844 rotate state | 1024×768 | Direct entry without picker, correct organic sort reduced items 8→7, stable compact slots prevent tap overlap, orientation resumed exact rescue; 573/573 tests | `521dca1` |
| Beach Cleanup | `phase2-evidence/wave4-beach/beach-picker-568x320-after.png` | `phase2-ui-evidence/after/beach-direct-568x320.png` | 568×320; 390×844 rotate state | 1024×768 | Direct entry without picker, in-game hint plus movement changed rake progress 0/24→1/24 and rendered the protected grooves; orientation restored exact active beach | Pending commit |
| Farming and Village Grocer | Protected HTML farming panel and town rows | Live browser verification recorded in `docs/qa/PHASE_3_FARMING_FIDELITY_RECOVERY.md` | 568×320, 844×390; 390×844 rotate state | 1024×768 | Individual bed selection, seed purchase, planting, apple harvest, Grocer routing, save-safe capacity rules and responsive layouts pass | `a0721a0` |

## Change register

| Change ID | System | UX reason | Files changed | Behaviour changed? | Save impact | Tests added | Status |
| --------- | ------ | --------- | ------------- | ------------------ | ----------- | ----------- | ------ |
| KW-UI-000 | Inventory | Map all player and developer surfaces before restructuring | `docs/qa/PHASE_2_UI_SIMPLIFICATION_REPORT.md` | No | None | None | Complete |
| KW-UI-001 | Lawn Care | Remove the redundant start screen and technical HUD/result data | `index.html`, `src/scenes/LawnCareScene.js`, `src/style.css` | Navigation/presentation only; current level auto-starts | Existing active session resumes unchanged; no schema change | Direct-entry UI gate added; 572 full tests pass | Complete |
| KW-UI-002 | River Clear-Out | Start the assigned/current cleanup immediately and keep the portrait board dominant | `index.html`, `src/scenes/RiverClearoutScene.js`, `src/style.css` | Navigation/presentation only; current level auto-starts | Existing active session and result undo remain unchanged; no schema change | Direct-entry UI gate plus protected River/gesture suites | Complete |
| KW-UI-003 | Waste Collection | Remove the redundant 750-level picker and keep the matching board dominant | `index.html`, `src/scenes/WasteCollectionScene.js`, `src/style.css` | Navigation/presentation only; current campaign level auto-starts while first town job remains unchanged | Existing campaign/town-job sessions resume unchanged; no schema change | Direct-entry UI gate; full protected campaign and layout suites pass | Complete |
| KW-UI-004 | House Rescue | Start the house-owned rescue immediately and prevent compact touch-card overlap | `index.html`, `src/scenes/HouseRescueScene.js`, `src/style.css` | Navigation/presentation plus compact visual card placement; protected sorting/vacuum rules unchanged | Exact active house/session resumes; no schema change | Direct-entry UI gate; 750-level, house identity, save, reward and layout suites pass | Complete |
| KW-UI-005 | Beach Cleanup | Remove the campaign picker/technical HUD while preserving swipe play and rake grooves | `index.html`, `src/scenes/BeachCleanupScene.js`, `src/style.css` | Navigation/presentation only; assigned/current beach auto-starts | Active town-job/campaign state resumes; no schema change | Direct-entry UI gate; protected 750-level, swipe history, reward, save and rake-pattern suites pass | Complete |
| KW-UI-006 | Farming and orchard | Restore direct bed selection, exact allotment artwork, clear farming feedback and the protected partial-capacity harvest | `index.html`, `src/data/farming.js`, `src/scenes/TownScene.js`, `src/systems/FarmingService.js`, `src/ui/FarmingController.js`, `src/style.css` | One parity correction: a final harvest can fill the remaining inventory space; all other changes are presentation/reachability | No schema change; atomic save and legacy import unchanged | Partial/full inventory, exact row geometry, full farming/Grocer and whole-project regression suites | Complete |

## Deferred ideas

- Final Sprite AI texture replacement and animation atlas work remain separate from UI simplification.
- A full audio/settings/accessibility suite is not present in the protected legacy contract and should be scoped separately.
- Physical iOS/Android safe-area, lifecycle, sound, and endurance testing remain release gates even after browser viewport verification.

## Verdict

**IN PROGRESS.** Inventory is complete. No production flow is considered simplified until the rebuilt version has been operated and verified at the required phone and tablet sizes.
