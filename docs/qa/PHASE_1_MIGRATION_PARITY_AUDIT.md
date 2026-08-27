# KindWorks Phase 1 — HTML-to-Phaser Migration Parity Audit

**Audit date:** 27 August 2026  
**Audit type:** Read-only migration-parity audit  
**Auditor:** Codex, operating the legacy and Phaser builds side by side  
**Repository changes made during audit:** This report only. No game code, data, asset, test, build configuration, save, or legacy HTML file was edited.

## 1. Executive summary

### Builds compared

- **Legacy behavioural reference:** `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`
- **Legacy SHA-256:** `0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5`
- **Legacy current save version:** 82, stored under `kindworks_living_town_v38` with backup and recovery keys.
- **Phaser repository commit:** `ae262cd87a443c64f40ce9ed043303c1456804b5`
- **Commit subject:** `Complete Milestone 46 differential parity audit`
- **Commit date:** 2026-08-27 10:32:53 +01:00
- **Remote comparison:** local `HEAD` exactly matched `origin/main` before and after testing.
- **Application version:** 0.1.0
- **Phaser dependency:** `^4.2.1`
- **Vite dependency:** `^8.2.2`
- **Phaser save schema:** 37, wrapped in a checksummed `kindworks-phaser` envelope.

### Environment

- macOS local development host.
- Codex in-app Chromium browser, local HTTP servers, 1280 × 720 desktop viewport.
- Mouse and keyboard were available. Physical touch, device sensors, OS background lifecycle, native safe areas, and genuine phone/tablet GPU performance were not available.
- Legacy and Phaser were run on isolated localhost origins so each build had its own known save state.
- Production Phaser `dist` was used for the main comparison. A Vite development preview and a second isolated production origin were used to repeat the town-name finding.
- No login or test account was required.

### Result

- **Overall demonstrated parity:** **98.3%** — 354 PASS checks out of 360 completed checks. The remaining six completed checks were PARTIAL; none was a functional FAIL.
- **Audit coverage:** **78.6%** — 360 of 458 planned checks. The 98 outstanding checks are predominantly physical-device touch/orientation, audio timing, deliberate fault injection in a real browser, visual review after Sprite AI asset replacement, and extended performance/endurance tests.
- **Systems passed:** 16
- **Systems partial:** 7
- **Systems failed:** 0
- **Systems not testable as a whole:** 1 (full sound/music/settings coverage)
- **Automated suite:** 450/450 tests passed; 0 failed, skipped, cancelled, or marked todo.
- **Differential parity audit:** passed; 13 activities, 5,850 campaign levels, 19 shared domains, 1,704 named legacy functions, 218 public API entries, 80 legacy validators, and 85 exact scalar rules were inventoried or compared.
- **Performance budget:** passed read-only against the existing production build.
- **P0:** 0
- **P1:** 0
- **P2:** 0
- **P3:** 1
- **P4:** 0

The only reproduced migration defect is a non-blocking mixed town identity: after renaming the town, Phaser updates the page title and main town label but its live location line returns to `Willowmere · x, y`. It reproduced independently in both production and development builds and survived reload. The legacy build consistently used the chosen town name.

The strongest parity evidence is the complete automated state/rule suite plus a fully played side-by-side Lawn Care Level 1 journey: identical board, route, percentage, move count, three-star result, +100 coins, town restoration result, return navigation, and persistence after reload. The principal remaining risk is not known logic loss; it is incomplete manual validation on real mobile hardware, limited audio coverage, and unfinished final art.

### Phase 1 recommendation

**Conditional GO.** Treat the migrated game logic and data as sufficiently preserved to continue, but do not claim final Phase 1 acceptance or mobile release readiness until the physical-device, orientation, audio, endurance, all-scene UI-smoke, and Sprite AI visual gates in Sections 11 and 13 are closed. Repair `KW-MIG-001` in the normal code-change phase, then rerun its focused regression test and the full suite.

## 2. Coverage table

“Completed” means observed in the running builds or exercised by an executable validator/test. Code presence by itself was not counted as a completed gameplay check. “Not testable” includes checks requiring unavailable hardware, network shaping, OS lifecycle control, final art, or much longer endurance runs.

| System | Tests planned | Tests completed | Pass | Partial | Fail | Not testable | Coverage % |
| ------ | ------------: | --------------: | ---: | ------: | ---: | -----------: | ---------: |
| A. Boot, loading and recovery | 18 | 14 | 14 | 0 | 0 | 4 | 77.8% |
| B. Town map, movement and navigation | 27 | 20 | 19 | 1 | 0 | 7 | 74.1% |
| C. HUD and town interface | 18 | 13 | 10 | 3 | 0 | 5 | 72.2% |
| D. Buildings and locations | 19 | 16 | 16 | 0 | 0 | 3 | 84.2% |
| E. Lawn Care | 19 | 16 | 16 | 0 | 0 | 3 | 84.2% |
| F. River Clear-Out | 17 | 15 | 15 | 0 | 0 | 2 | 88.2% |
| G. Waste Collection | 18 | 16 | 16 | 0 | 0 | 2 | 88.9% |
| H. House Rescue/interior cleaning | 16 | 15 | 15 | 0 | 0 | 1 | 93.8% |
| I. Fishing and Magnet Fishing | 16 | 14 | 14 | 0 | 0 | 2 | 87.5% |
| J. Power Wash and other cleanup | 11 | 9 | 9 | 0 | 0 | 2 | 81.8% |
| K. Cooking and customer service | 23 | 20 | 20 | 0 | 0 | 3 | 87.0% |
| L. Level-system validation | 12 | 12 | 12 | 0 | 0 | 0 | 100.0% |
| M. NPC systems | 23 | 19 | 19 | 0 | 0 | 4 | 82.6% |
| N. Animals and pets | 21 | 17 | 17 | 0 | 0 | 4 | 81.0% |
| O. Farming and apple trees | 19 | 17 | 17 | 0 | 0 | 2 | 89.5% |
| P. Economy, coins and rewards | 30 | 27 | 27 | 0 | 0 | 3 | 90.0% |
| Q. Shops, inventory and placed objects | 25 | 21 | 20 | 1 | 0 | 4 | 84.0% |
| R. Houses and upgrades | 15 | 13 | 13 | 0 | 0 | 2 | 86.7% |
| S. Time and world-state progression | 17 | 15 | 15 | 0 | 0 | 2 | 88.2% |
| T. Saving and loading | 25 | 23 | 23 | 0 | 0 | 2 | 92.0% |
| U. Touch, responsive layout and accessibility | 21 | 8 | 8 | 0 | 0 | 13 | 38.1% |
| V. Sound and music | 18 | 4 | 4 | 0 | 0 | 14 | 22.2% |
| W. Visual and animation parity | 16 | 9 | 8 | 1 | 0 | 7 | 56.3% |
| X. Performance and technical stability | 14 | 7 | 7 | 0 | 0 | 7 | 50.0% |
| **Total** | **458** | **360** | **354** | **6** | **0** | **98** | **78.6%** |

## 3. Migration parity scorecard

| System | Legacy behaviour | Phaser status | Parity status | Blocking issues | Notes |
| ------ | ---------------- | ------------- | ------------- | --------------- | ----- |
| Boot and first launch | Direct single-file load; new save starts safely | Production build loaded with onboarding and starter reward | PASS | None | Fresh, returning, reload, backup/recovery and malformed-state behaviour have executable coverage |
| Town identity/onboarding | Five-step creator; chosen town name appears consistently | Consolidated creator works and persists, but live location line reverts to Willowmere | PARTIAL | No | `KW-MIG-001`; redesigned onboarding otherwise preserved state |
| Town map/navigation | Drag map, select town objects/jobs | Phaser player/camera movement, collisions and interactions are present | PARTIAL | No | Core movement tests pass; not every route was physically traversed during this audit |
| HUD/interface | Coins, weather, jobs, inventory, resident and impact controls | Equivalent major information is present in a redesigned HUD | INTENTIONAL DIFFERENCE | No | Inventory hides zero counts; first-job flow uses find/focus; approval required |
| Lawn Care | 750 sliding-mower levels, stars, rewards and town effect | Exact catalogue and service rules migrated | PASS | None | Level 1 fully completed side by side; all levels validated automatically |
| River Clear-Out | 750 falling-piece river levels | 750-level Phaser scene, rewards, save/resume and portrait support | PASS | None | Full service/campaign suite passed; manual device swipe remains outstanding |
| Waste Collection | 750 layered triple-match boards | 750 boards, exact certificates, reward and town-job bridge | PASS | None | Direct nearby navigation is less explicit than legacy job list |
| House Rescue | Sorting waves, bins, vacuum, home state and gifts | 750 deterministic levels and full two-stage state | PASS | None | Exact reward, rollback, respawn and gift tests passed |
| Beach Cleanup | 750 walking/raking levels and town beach effect | Native Phaser service/scene with embedded protected data, not a runtime iframe | PASS | None | All levels and representative complete walks validated |
| Playground Power Wash | Soap/water, 97% tolerance, town playground effect | Native Phaser service/scene and 750 generated levels | PASS | None | Exact tool rules and persistence tests passed |
| Bakery | 150 shifts, 24 recipes | 150-shift lazy Phaser scene | PASS | None | Sequence, queue, failure, reward and replay tests passed |
| Corner Café | 150 shifts, 64 recipes | 150-shift lazy Phaser scene | PASS | None | Tray isolation, arrival schedule, save and rollback tests passed |
| Morning Mug | 150 coffee shifts, 54 recipes | Separate 150-shift scene and state | PASS | None | Does not leak into Café progress |
| Riverside Kitchen | 150 meal shifts, 32 recipes | Separate 150-shift scene and state | PASS | None | Exact preparation/heat rules and resume tests passed |
| South Shore Scoops | 750 shifts and 24 parts | 750 unique finishable shifts | PASS | None | 60% passing rule, unlocks and reward cap preserved |
| Fishing | Three locations, catch tables and five daily casts | Separate fishing mode in `FishingScene` | PASS | None | Targeting, animation windows, inventory/aquarium and rollback tested |
| Magnet Fishing | Separate recovery catalogue and pity rules | Separate mode in `FishingScene` | PASS | None | Does not alias River Clear-Out or ordinary fishing state |
| NPCs/stories | 35 residents, homes, schedules, thoughts and four-stage arcs | All residents/arcs represented in Phaser systems | PASS | None | Full-day navigation and narrative persistence tests passed |
| Animals/pets | 37 species, 56 identities, diets, friendship and adoption | Complete wildlife plus Paws & Wonders systems | PASS | None | Physical device and long-session visual observation outstanding |
| Farming/orchard | Six beds, three crops, starter tree and up to 24 trees | State, shops, placement, growth, harvest and offline progression migrated | PASS | None | Atomic transaction and duplicate-harvest protection passed |
| Economy/shops/inventory | 100 starter coins, exact prices, unlocks and one-time rewards | Shared transactional services and reconciled ledger | PASS / INTENTIONAL DIFFERENCE | None | Manual Lawn reward matched; shop feedback is deliberately more informative |
| Homes/furniture/aquarium | 19 cottages, upgrades, furniture, fish tank and gifts | Separate services with atomic placement and migration | PASS | None | 60-placement boundary and fish safety covered |
| Saving/migration | Legacy JSON, integrity seal, backup and recovery | Separate checksummed schema-37 envelope; original HTML key untouched | PASS | None | All legacy data versions 12–82 reconciled in tests |
| Mobile/orientation | Landscape-oriented game with River exception requested | Code enforces landscape for every activity except River Clear-Out | PARTIAL | Not yet known | Automated gates pass; real touch and device orientation remain untested |
| Sound/music/settings | Legacy exposes only a restoration Web Audio chime, not a complete mixer | Phaser reproduces a restoration chime/haptics path; no full audio asset/mixer system | NOT TESTABLE | No migration blocker proven | Browser permission, timing, stacking and persistence could not be exercised fully |
| Visual art/animation | Legacy canvas/DOM pixel presentation | Phaser uses labelled vector/emoji placeholders awaiting Sprite AI art | INTENTIONAL DIFFERENCE / PARTIAL | No logic blocker | Final visual parity cannot be approved before asset replacement |
| Performance | Single large HTML file | Lazy Phaser scene chunks with cacheable engine | PARTIAL | No | Budgets pass; cold local load was slower; no physical-device 30-minute run |

## 4. Critical blockers

No P0 or P1 migration defects were found.

No save loss, currency loss, infinite reward duplication, permanent progression lock, missing major system, or boot crash was reproduced. The automated suite specifically passed corruption recovery, transaction rollback, first-clear-only rewards, replay protection, legacy-key protection, interrupted/failed persistence models, and scene return-state checks.

The open Phase 1 gates are validation gaps, not confirmed critical defects:

1. Physical phone/tablet touch and orientation testing.
2. Real browser audio permission, lifecycle, timing, and stacking.
3. 30-minute and repeated-scene memory/FPS endurance on the agreed minimum device.
4. Final Sprite AI art and animation review.
5. Manual UI completion of every activity at representative boundary levels.

## 5. Complete defect register

| ID | Severity | Classification | System | Feature | Expected | Actual | Reproduction | Evidence | Recommended direction | Phase 1 blocker |
| -- | -------- | -------------- | ------ | ------- | -------- | ------ | ------------ | -------- | --------------------- | --------------- |
| KW-MIG-001 | P3 | Migration regression | Onboarding / Town HUD | Renamed town identity in live location status | After naming the town, all identity labels use the chosen name, as in legacy | Main town label and title update, but `#location-status` returns to `Willowmere · x, y` and remains stale after reload | Fresh save → name town → create resident/home or return to town → observe secondary status → reload; 2/2 independent Phaser origins | `KW-MIG-001-town-location-label.png`; no console error | Make the TownScene status prefix read the saved identity name; add rename + movement + reload UI regression coverage | No |

### KW-MIG-001 — detailed evidence

- **System:** Onboarding, town HUD and identity persistence.
- **Feature:** Custom town name propagation.
- **Severity:** P3 — visible and confusing, but not progression-blocking.
- **Classification:** Migration regression.
- **Legacy expected behaviour:** With a town named `Audit Meadow`, the town banner and restoration copy use `Audit Meadow`; no live town identity label reverts to Willowmere.
- **Phaser actual behaviour:** With a town named `Audit Brook`, the document title and main header read `Audit Brook`, but the live location line reads `Willowmere · 1050, 1545`. It remains Willowmere after reload.
- **Exact reproduction:** 
  1. Start Phaser on an origin with no current save.
  2. Open Welcome and name the town `Audit Brook`.
  3. Continue to or return to TownScene.
  4. Read the secondary line under the main town name.
  5. Reload and read it again.
- **Frequency:** 2/2 independent reproductions: one Vite development origin and one production-build origin.
- **Starting state:** Fresh Phaser save; no prior resident required for the label mismatch.
- **Viewport/input:** 1280 × 720; mouse and keyboard.
- **Screenshot:** `/Users/youyoulu/Documents/Codex/2026-08-25/referenced-chatgpt-conversation-this-is-an/audit-evidence/KW-MIG-001-town-location-label.png`
- **Console error:** None observed.
- **Relevant code:** `src/scenes/TownScene.js`, `updateStatus()` around line 2071 hard-codes `let label = "Willowmere"`; `src/ui/OnboardingController.js`, `applyTownIdentity()` around lines 145–166 correctly replaces initial text but is later overwritten by TownScene.
- **Player impact:** Mixed identity undermines the custom-town promise and makes save/onboarding state look inconsistent.
- **Recommended direction:** Read the current state identity in TownScene, retain district names when inside a district, and add a UI test covering rename, movement, scene return and reload.
- **Phase 1 blocker:** No. Repair before calling the migration visually complete.

No legacy-carried bug or missing-both defect was demonstrated strongly enough to enter the defect register. Observations requiring design approval are separated in Section 10.

## 6. System-by-system findings

### A. Boot, loading and recovery — PARTIAL, high logic confidence

Tested fresh launch, returning launch, reload during town, isolated-origin saves, malformed/current/backup/recovery handling through executable tests, legacy detection, and optional Impact data fallback. Both builds loaded without visible runtime failure or baseline console error.

Observed local cold-load timings were approximately 4.27 seconds for the legacy HTML and 8.45 seconds for the production Phaser build. Earlier same-host reload observations were approximately 1.60 seconds and 8.96 seconds respectively. These are in-app/local observations, not a controlled network or device benchmark, so they are not logged as a defect.

Phaser boot recovery catches lazy-scene failure and returns safely to TownScene. Optional Impact remote failures fall back to offline-safe content. The current browser did not permit controlled asset-response corruption, true offline/reconnect transitions, OS background termination, or refresh exactly during asset decoding. Those remain outstanding.

### B. Town map, movement and navigation — PARTIAL, medium-high confidence

The repository certifies a 4,200 × 2,800 world, 19 houses, 12 shops, six landmarks, nine roads, three bridges and ten districts. Movement, collision, interaction selection, map zoom, NPC water avoidance, building return points, town placement collision and authored navigation graphs all passed executable tests.

The running Phaser town displayed a controllable player, directional controls, zoom, nearby interaction prompt, camera focus and town activity. Lawn Care returned to the correct town flow. `KW-MIG-001` affects only the live location label.

The legacy Jobs panel directly lists cleanup activities. Phaser’s first-session `Find Waste Collection` focuses the camera on a waste target while the player remains at the prior interaction location. The target becomes visible, but the nearby action can still be the lawn/house until the player walks over. This is navigation friction and a design difference, not proven inaccessibility.

Not all roads, bridges, fences, benches, water edges, building doors, occlusion layers, click priorities or every return coordinate were physically traversed in this run.

### C. HUD and interface — PARTIAL, medium-high confidence

Coins, weather, date/time, shop, inventory, resident, onboarding, animal friends, Impact, stories, save health, movement, zoom, first-job progress and nearby interaction are present in Phaser. The 200-coin balance updated immediately after Lawn Care and persisted after reload. No stale wallet state was observed.

The interfaces differ deliberately:

- Phaser consolidates onboarding and home progression into a more detailed creator.
- Phaser inventory lists owned items rather than retaining visible zero-count rows.
- Phaser’s insufficient-funds action remains clickable and reports the exact shortfall; legacy disables it as “Need coins”.
- Phaser uses a find/focus first-job checklist rather than the legacy’s direct comprehensive Jobs panel.

Pause, settings, audio toggle and music toggle were not present as full legacy controls, so their absence is not recorded as a migration regression. Final product approval is still needed for the redesigned HUD flow.

### D. Buildings and locations — PASS with incomplete manual traversal, medium confidence

The Phaser source has BootScene and TownScene plus 16 lazy scenes: House Interior, Village Grocer, Paws & Wonders, Harbour General, Bakery, Café, Morning Mug, Riverside Kitchen, South Shore Scoops, River Clear-Out, House Rescue, Waste Collection, Lawn Care, Beach Cleanup, Playground Power Wash and Fishing. Each non-town scene has an explicit loader and test owner.

Town data certifies all building, shop, home, landmark and district counts. Enter/exit services and persistent return points passed automated journeys. No legacy mini-game is running in an iframe. Phaser’s only created iframe is the privacy-enhanced YouTube player inside the optional Impact panel. Beach Cleanup retains a protected embedded data payload but executes as a native Phaser scene/service.

Manual physical entry, completion and re-entry were not repeated for every building in this audit. Fresh Market, cinema unlock, every NPC cottage and all visual entrance hit boxes need a final all-location walk-through.

### E. Lawn Care — PASS, high confidence

Lawn Care Level 1 was completed fully in both builds from equivalent fresh states.

- Identical 7 × 7 hedge/grass layout.
- Identical mower start at row 3, column 2.
- Identical 7% initial completion, 11 gas/moves and par 9.
- First right move produced 29% and 10 remaining in both.
- Certified route: `R, L, D, R, D, U, R, L, D`.
- Both ignored an impossible extra right move without corrupting state.
- Both finished at 100%, nine moves, three stars and +100 coins.
- Both wallets changed from 100 to 200 exactly once.
- Both returned to town with the lawn restored.
- Both retained the balance and completion state after reload.

All 750 levels, original grids, obstacle families, weed bands, stored optimal routes, upgrade effects, undo limit, star thresholds, rewards, Level 750 boundary, town-job proportional effect, active-session reload and save rollback passed automated validation.

Outstanding: real swipe input on phones, manually triggered failure/restart/exit paths and animation wheel/pivot review after final sprites.

### F. River Clear-Out — PASS, high logic confidence

All 750 exact levels hydrated deterministically and passed structural validation. The first 60 gentle-transition rules, heavy rubbish behaviour, L/J rotation, line clearing, failure, cancellation, reward, replay, save rollback and legacy import passed. Representative challenge levels have certified reachable one-star solutions. River Clear-Out is the only activity configured to support mobile portrait.

Outstanding: full manual touchscreen completion, visual water/garbage animation review and background pause observation on a physical phone.

### G. Waste Collection — PASS, high logic confidence

All 750 protected boards have stable provenance, validate, and include exact five-slot completion certificates. The service enforces covered-card blocking, exposed-card selection, automatic triple clearing, persisted card/tray state, Level 750 first-clear reward, replay protection, town occurrence integration and rollback. The Phaser UI uses a seven-slot rail as required by the migrated design while the certification data proves solvability.

Outstanding: repeated physical touch selection across dense late boards and manual failure/restart/exit at mobile landscape sizes.

### H. House Rescue/interior cleaning — PASS, high logic confidence

All 750 deterministic levels preserve tier scaling, balanced sorting categories, visual waves, rubbish scoring, vacuum unlock, tool power/reach, 95% coverage, multi-pass dirt, rewards, respawn, active-session resume, rollback, home exterior state and guaranteed homeowner gifts. All 19 interiors are generated with distinct beds, furniture and occupants.

Outstanding: one end-to-end manual UI completion with sorting and vacuum on a narrow landscape phone.

### I. Fishing and Magnet Fishing — PASS, high logic confidence

Three fishing locations, catch tables, targeting, separate five-cast limits, cast/reel windows, fish inventory, ornamental aquarium routing/release, magnet catalogue, river cleanup integration, rare/treasure pity counters, daily reset, cancellation, rollback and legacy import passed. Fishing and magnet recovery remain separate modes within FishingScene and separate state branches; neither aliases River Clear-Out.

Outstanding: repeated live random success/failure windows and tap-position/rod-direction animation on touch hardware.

### J. Power Wash and other cleanup — PASS, high logic confidence

Playground Power Wash retained its protected source checksum, 750 deterministic levels, soap resistance, water rinse, 97% completion tolerance, reward cap, town playground restoration, respawn, active tool/supply resume and rollback. Beach and Lawn are covered in their own sections.

Outstanding: physical drag performance, multi-touch interference and visual residue readability after final art.

### K. Cooking and customer service — PASS, high logic confidence

The migrated catalogue contains:

- Little Bakery: 150 shifts, 24 recipes.
- Corner Café: 150 shifts, 64 recipes.
- Morning Mug Coffee: 150 shifts, 54 recipes.
- Riverside Kitchen: 150 shifts, 32 recipes.
- South Shore Scoops: 750 shifts, 24 parts.

Tests passed recipe sequence enforcement, customer arrival schedules, three trays, undo/discard isolation, save-and-exit resume, customer-leaving failure, exact heat/preparation steps, serving order, first-clear rewards, replay protection, rollback, late-complexity rules, Scoops two-item trays, the 60% pass boundary and restoration unlocks. Generated shift plans satisfy uniqueness/difficulty constraints.

Outstanding: manual chef/customer animation, counter collision, all appliance hit areas, phone-screen visibility and later-level visual variety after final art.

### L. Level systems — PASS, very high data/rule confidence

All 5,850 campaign entries were enumerated. No missing IDs or duplicate definitions were detected by the certification suite. Activity-specific validators checked solvability/certificates where calculable and structural playability elsewhere. Boundaries and final-level first-clear/replay behaviour passed. See Section 7.

This is not a claim that a person manually played 5,850 levels. Manual UI coverage was Lawn Care Level 1; exhaustive evidence came from deterministic generators, exact legacy probes, certificates and service-level execution.

### M. NPC systems — PASS, high logic confidence

All 35 residents, authored home/work/leisure graph, midnight schedules, needs, mutual relationships, conversations, littering, bin use/tipping, restoration reactions, contextual thoughts and four-stage narratives are present. A simulated full day retained valid locations and phases. Town simulation pause reasons freeze and resume residents.

The legacy and Phaser custom resident both saved `Alex Audit`, Fishing hobby and Meadowlight House and restored them after reload. Legacy thought card and Phaser profile/story separation expose the same durable identity through different UI.

Outstanding: long live observation of route frequency, every shop entry, all thought variety and rare collision/pathfinding edge cases.

### N. Animals and pets — PASS, high logic confidence

The catalogue certifies 37 species and 56 identities, distinct schedules, five rare visitors, environment-specific movement, weather/season responses, four rotating wild visitors, exact diets, friendliness, cooldowns, guaranteed adoption visits, one follower and South Meadow roaming. Paws & Wonders contains 11 permanent companions. Adoption, feeding, care, release, offline grace, aquarium safety and persistence passed.

One checklist phrase in the supplied scope says “maximum five owned pets,” while the current protected baseline and tests permit all 11 shop companions and separately limit the active home capacity/follower presentation. The final HTML remains the source of truth; this is not marked as a Phaser regression.

Outstanding: multi-day live rare spawn observation, follower home entry and visual route review on final sprites.

### O. Farming and apple trees — PASS, high confidence

Fresh state contains six beds, one positioned starter tree and one lawn job. Seed purchases, planting, rain-aware growth, offline progression, crop harvest, one-apple harvest, regrowth, paid saplings, preview/placement, 24-tree capacity, legacy positional imports and failed-save rollback passed. Carrots, berries/fresh greens and apples use bounded inventory and cannot duplicate.

Outstanding: physical long-duration growth observation and phone touch placement.

### P. Economy, coins and rewards — PASS, very high confidence

Exact starting currency, 100-coin Lawn result, percentage/job formulas, first-clear-only rules, final-level boundaries, replay protection, shop prices, inventory changes, ledger reconciliation, gifts, restoration rewards and transaction rollback passed. Manual evidence confirmed 100 → 200 after one perfect Lawn clear and 200 after reload.

Shop samples matched exactly:

- Cherry Red mower: 2,000 coins, requires 1/3 perfect lawns.
- Classic Yellow: 7,500, requires 1/8.
- SwiftCut: 12,000, requires 1/15.
- Meadow Pro: 20,000, requires 1/30.
- Vintage Special: 30,000, requires 1/50.
- Small Town Bin: 2,500.
- Park Bin: 3,500.
- Recycling Bin: 4,500 and five waste jobs.
- Large Commercial Bin: 6,000 and ten waste jobs.

At 200 coins, attempting the Small Town Bin in Phaser produced the exact 2,300-coin shortfall and changed neither balance nor ownership. Legacy disabled the same unaffordable purchase. The behaviour differs, but both are safe.

### Q. Shops, inventory and placed objects — PARTIAL, high logic confidence

Both fresh inventories contained Old Green Mower, Starter Vacuum and Carrot Seeds ×1. Phaser reported three owned types and preserved equipment after reload; legacy additionally displayed zero-count carrots, apples, saplings, greens and berries. Phaser’s complete catalogue reports 82 definitions and only lists owned quantities.

All three shops, exact ordinary stock, equipment upgrade credit, insufficient funds, item caps, placement, rotation, move/store, collision, 500-town-object limit, 60-interior-object limit and rollback passed executable tests.

Outstanding: manual purchase/use/place/move/store/reload for representative exterior and interior objects and product approval of the owned-only inventory presentation.

### R. Houses and upgrades — PASS, high logic confidence

The migrated state preserves 19 physical cottages, Meadowlight’s temporary render alias, four personal-home levels, exact 15,000/40,000/90,000 upgrade prices, capacities 1/2/3/5, redesign rounding, sequential upgrades, house-clean states, furniture, fish tank uniqueness and NPC ownership. Atomic failure tests prevent lost items or currency.

Outstanding: manual visual comparison of every upgrade level and collision/entrance after each visual transformation.

### S. Time and world state — PASS, high logic confidence

The 24-real-minute day, 28-day seasons, deterministic weather, dawn/day/dusk/night lighting, NPC schedules, crop growth, animal schedules, living-environment flow, offline cap of three game days, save interval and pause reasons passed. Both manual town states retained their progression after reload.

Outstanding: OS-level background/resume and a multi-day physical-device observation.

### T. Saving, loading and migration — PASS, very high confidence

Manual onboarding, resident, Lawn reward, completion and wallet state persisted after reload in both builds. Automated tests cover fresh save, manual/service saves, job, purchase, reward, placement, pets, farming, upgrades, tutorial, world advancement, rapid domain transactions, invalid state, corrupted current save, backup recovery, recovery quarantine, legacy migration and schema upgrades.

No test writes to a legacy key. The Phaser current, backup and recovery namespaces are separate. All protected legacy versions 12 through 82 were inspected/reconciled, and the version-82 dense fixture reached every final Phaser owner without balance or durable-record loss.

Outstanding: hard browser termination during the actual storage write and native app process restart.

### U. Touch, responsive layout and accessibility — PARTIAL, low-medium confidence

Automated release gates pin 1280 × 720 desktop, 844 × 390 mobile landscape and 390 × 844 mobile portrait. All activities require landscape except River Clear-Out. Lazy scenes, HUDs, orientation barriers and 44-pixel touch controls are wired. Scenes advertise swipe/pointer controls where appropriate.

The browser viewport override did not take effect during this audit, so a claimed portrait/landscape screenshot would have been false and was not retained. Real touch events, safe areas, notches, accidental page scroll, double-tap zoom, multi-touch, tall/narrow landscape clipping and tablet layout remain not testable here.

Desktop keyboard/button accessibility was inspectable through named controls and dialogs. Final keyboard-only focus order, reduced motion and contrast require dedicated accessibility testing.

### V. Sound and music — NOT TESTABLE, low confidence

The legacy source contains a Web Audio restoration chime. Phaser contains a corresponding oscillator-based restoration chime and optional haptics. Neither inspected build contains a broad audio asset library or a complete music/sound/volume/settings mixer comparable to the extensive checklist.

No missing-audio console error was observed. Autoplay permission, start/stop, stacking, background/resume, failure/success cues, offline audio and persisted volume could not be demonstrated. Because the final HTML itself does not expose the proposed full audio system, this is not classified as a Phaser migration regression; it is a product scope and release-validation gap.

### W. Visual and animation parity — PARTIAL, medium confidence

Baseline screenshots and Lawn success screens were captured for both builds. Core information, board state and success results were legible, but Phaser intentionally changes composition and uses generated vector/emoji placeholders. The Sprite AI inventory marks DOM and Phaser objects, and its completeness gates passed.

Final texture fidelity, pivots, directional animation, sprite-foot sliding, occlusion, weeds, fence seams, mower wheel contact and dirty/clean artwork cannot receive final parity approval until the planned Sprite AI assets are generated and installed.

### X. Performance and technical stability — PARTIAL, medium confidence

The existing production build passed its read-only budget calculation:

- Initial application chunk: 2,998,403 bytes; budget 3,100,000.
- Phaser engine chunk: 1,374,829 bytes; budget 1,500,000.
- Lazy scene chunks: 16; minimum 12.
- Largest lazy chunk: 19,389 bytes; budget 80,000.
- Total JavaScript: 4,622,052 bytes; budget 5,000,000.
- Production source maps: none.

The complete 450-test run passed in approximately 1,198 seconds on the restricted local audit host. Several persistence-heavy tests were slow under the host’s restricted filesystem, so the suite duration is not a player benchmark.

No baseline console error, unhandled rejection, duplicate scene or visible duplicate resident/object was observed. FPS, memory growth, 30-minute stability, repeated scene-entry leaks and maximum-entity performance were not measured on an agreed minimum device.

## 7. Level-system audit

### Aggregate result

- Expected campaign levels: 5,850.
- Detected campaign levels: 5,850.
- Missing IDs: 0 detected.
- Duplicate level definitions: 0 detected.
- Exact legacy scalar probes: 85/85 matched.
- Differential contracts: 13/13 activities mapped to data, service, state, scene and tests.
- Manual UI levels completed in this audit: Lawn Care Level 1.
- Automated coverage: exhaustive catalogue checks plus representative boundary/solver/service tests as described below.

| Activity | Expected | Detected | Missing IDs | Duplicate definitions/output | Manual UI levels | Automated checks | Solvability/difficulty/reward result | Status |
| -------- | -------: | -------: | ----------: | ---------------------------- | ---------------- | ---------------- | ------------------------------------ | ------ |
| Waste Collection | 750 | 750 | 0 | 0 detected | None | Every board validated; all exact five-slot certificates; Level 750 reward/replay | Every authored certificate clears; first-clear and town occurrence are atomic | PASS |
| Lawn Care | 750 | 750 | 0 | 0 detected | 1 | Every grid, family, weed band and optimal route; Level 750 and town jobs | All stored optimal routes validate; stars, move limits and rewards match | PASS |
| River Clear-Out | 750 | 750 | 0 | 0 detected | None | All hydrated finite/playable; first 60 transition; representative certified routes; final reward | Representative campaign challenges retain reachable solutions; heavy tiers scale correctly | PASS |
| House Rescue | 750 | 750 | 0 | 0 detected | None | All deterministic generators; tier boundaries; full two-stage service tests | Balanced categories and safe visual waves; reward and 95% vacuum threshold exact | PASS |
| Beach Cleanup | 750 | 750 | 0 | 0 detected | None | All deterministic levels; representative early/middle/final walks; reward/resume | Certified complete walks and bounded rewards pass | PASS |
| Playground Power Wash | 750 | 750 | 0 | 0 detected | None | All generated difficulties; tools, soap, 97% tolerance; Level 750 reward | Tool requirements and tolerance prove completion paths | PASS |
| Little Bakery | 150 | 150 | 0 | 0 detected | None | All catalogue/shift rules; Level 1 full service in tests; failure/resume/replay | Deterministic queues and workload progression; rewards exact | PASS |
| Corner Café | 150 | 150 | 0 | 0 detected | None | All menu/arrival/difficulty rules; complete Level 1 service; resume/failure | Plans are unique within generator constraints; reward/replay exact | PASS |
| Morning Mug | 150 | 150 | 0 | 0 detected | None | All shift chapter/order/timing rules; full service state transitions | Exact ingredient/station sequence; separate state and capped rewards | PASS |
| Riverside Kitchen | 150 | 150 | 0 | 0 detected | None | All chapters/timing/diner tiers and recipe stations | Every ingredient and all nine preparation/heat stations used; reward exact | PASS |
| South Shore Scoops | 750 | 750 | 0 | 0 detected | None | All shifts unique/finishable; unlock map; 60% threshold; Level 8 multi-item | Difficulty and order complexity increase; 45-coin cap and replay protection exact | PASS |
| Fishing | N/A | N/A | N/A | N/A | None | Three spots, catch tables, timing, five-cast limit, aquarium and rollback | Non-level random activity; deterministic service probes pass | PASS |
| Magnet Fishing | N/A | N/A | N/A | N/A | None | Eight finds, targeting, pity thresholds, river target integration and rollback | Non-level random activity; rare/treasure guarantees pass | PASS |

### Manual-level limitation

The requested manual set—1, 2, 10, 11, 20, 50, 100, 150, 250, 500, 749, 750 and 20 random levels for each 750-level system—was not completed through the UI. A fresh player cannot legitimately jump to all those levels without altering progression, and this audit prohibited data/code mutation. The repository’s read-only QA routes expose certification but do not authorise state changes. The exact outstanding UI sweep should be run with an approved, non-production level-select harness or supplied QA save.

## 8. Save-data audit

### Legacy format

- Current browser key: `kindworks_living_town_v38`.
- Backup: `kindworks_living_town_v38_backup`.
- Recovery: `kindworks_living_town_v38_recovery`.
- Compatible historic keys: `kindworks_living_town_v12` through `kindworks_living_town_v37`.
- Current data version: 82; compatible data versions 12–82.
- Shape: direct JSON town snapshot with `version` and an integrity seal in supported final saves.
- Legacy load tries current, backup and historic keys, quarantines invalid current data and migrates recovered/older data.

### Phaser format

- Current key: `kindworks_phaser_v1`.
- Backup: `kindworks_phaser_v1_backup`.
- Recovery: `kindworks_phaser_v1_recovery`.
- Envelope format: `kindworks-phaser`.
- Current state schema: 37; upgrader supports schemas 1–37.
- Envelope fields include schema version, timestamp, app version, data and checksum.
- Saves perform validation, backup of the last valid current value, write, read-back and checksum/state verification.
- Invalid current data is recorded in the recovery namespace and a valid backup can be loaded.

### Legacy migration behaviour

The importer is non-destructive. It inspects compatible current, backup, historic and recovery candidates; validates shape and integrity; creates a new Phaser state; and writes only the Phaser namespace when the user accepts import. The original legacy snapshot is retained in `legacySnapshot`, and reconciliation metadata records where durable values were projected.

The version-82 full fixture projected economy, inventory, equipped tools, placed objects, NPCs, narratives, municipal collection, resident/home, interiors, farming, environment, animals, fishing, all mini-games, gifts, Harbour General, restoration, onboarding and commerce into their final owners.

### Missing, renamed and defaulted data

- Older saves without economy receive documented defaults and a warning.
- Missing player setup uses Willowmere defaults and a warning.
- Stable aliases are canonicalised deterministically.
- Known legacy inventory is projected; unresolved records remain retained for later review instead of being silently discarded.
- Old aquarium fish are housed when a placed tank exists; otherwise they are safely released and counted rather than becoming invalid ordinary inventory.
- Legacy waiting homeowner gifts without matching owned inventory are dropped to avoid creating unsupported ownership.
- Older schemas gain new domains with valid defaults while preserving existing fields.

### Data-loss and duplication risk

No reproducible loss was found. Protections exercised include:

- Legacy keys are never written or deleted by Phaser.
- Current Phaser saves are checksummed and read back after writing.
- A valid previous current save becomes the backup.
- Invalid/tampered data is rejected or quarantined.
- Failed domain transactions roll state back atomically.
- First clears, homeowner events, restoration gifts, commerce receipts and membership grants have duplicate protection.
- Replays do not repay first-clear rewards.
- Imported legacy reward history is reconciled so it cannot be replayed.

Residual risks are a real browser/process termination during the storage call, quota exhaustion with a very large save, cross-device/cloud migration if later introduced, and old save variants not represented by the anonymised fixture family.

### Recommended migration protections

1. Preserve the legacy namespace indefinitely through at least one stable release.
2. Keep backup-before-write, read-back verification and recovery quarantine.
3. Export a human-readable migration report for support cases.
4. Retain unresolved legacy records until product owners explicitly map or retire them.
5. Add a browser-level import journey using a real version-82 save and a storage-quota failure case.
6. Never fold the Phaser save back into the legacy key.

### Save-system verdict

**PASS — high confidence.** This is the strongest area of the migration. Manual reload evidence and exhaustive schema/reconciliation tests agree, and no save loss or duplicate reward was reproduced.

## 9. Legacy bugs carried forward

No legacy bug was reproduced with enough confidence to register during this run.

Items should not be added to this section merely because they are awkward or because the audit prompt proposes a broader feature. For example, the absence of a full audio mixer exists in the inspected legacy baseline as well as Phaser, so it is a product-scope gap, not a carried-forward gameplay bug proven by failure.

## 10. Intentional differences requiring product approval

| ID | Difference | Legacy | Phaser | Recommendation |
| -- | ---------- | ------ | ------ | -------------- |
| KW-DES-001 | Onboarding layout | Multi-step creator and simpler first-session overlay | Consolidated resident/home preview, upgrades and reward history | Accept if usability testing supports it; retain exact durable fields and rewards |
| KW-DES-002 | Inventory presentation | Shows several zero-count resource rows | Shows owned types and a catalogue/owned summary | Accept for clarity, but confirm players can discover all possible resources |
| KW-DES-003 | Insufficient funds | Purchase button disabled with “Need coins” | Button explains exact shortfall without mutating state | Accept; this is safer and more informative |
| KW-DES-004 | First-job navigation | Jobs panel directly lists cleanup activities | Checklist uses camera focus/highlight and expects the player to walk to the target | Design review; consider retaining a discoverable complete Jobs list or clearer route cue |
| KW-DES-005 | Mobile orientation | Baseline is landscape-oriented | All activities require landscape except River Clear-Out, which supports portrait | Accept; this matches the explicit product instruction, subject to physical-device verification |
| KW-DES-006 | Rendering implementation | Large single-file DOM/canvas pixel presentation | Phaser/vector/emoji placeholders with Sprite AI labels pending final assets | Defer visual approval until the Sprite AI replacement milestone; do not call final art parity now |
| KW-DES-007 | Impact video embedding | Legacy cinema/Impact presentation | Privacy-enhanced YouTube iframe only when a valid project is opened | Accept if privacy/product review approves; it is not a legacy game iframe |

`KW-MIG-001` is not an intentional difference: it is a clear stale hard-coded label and should be fixed.

## 11. Not-testable items and blockers

| Area | What was not testable | Why | Required access/environment | Confidence impact |
| ---- | --------------------- | --- | --------------------------- | ----------------- |
| Mobile touch | Real taps, swipes, drag pressure, multi-touch, accidental browser gestures | No physical device/touch injection in the active browser | At least one iPhone-sized device, one narrow Android phone and one tablet; Safari and Chrome | High for mobile release, low for core logic |
| Orientation | Live landscape lock, portrait exception, rotate barrier, safe areas/notches | Browser viewport override did not apply; no native orientation sensor | Physical devices or a reliable device-emulation harness | High for mobile release |
| Audio | Permission, autoplay, stacking, lifecycle, volume persistence, success/failure cues | No full audio UI; restoration trigger not reached manually; browser permission state unavailable | Real browser/device with audio output and a restored-town QA save | Medium; no migration defect proven |
| Final art | Texture fidelity, pivots, depth, animation direction, mower wheel contact | Sprite AI assets are explicitly planned but not yet installed | Final asset pack and animation atlas | High for visual acceptance, none for rule parity |
| Endurance | 30-minute FPS, memory, repeated scene transitions, max entities | No agreed minimum device or long profiler session | Minimum-spec device and performance profiler | Medium-high |
| Fault injection | Offline after startup, reconnect, asset 404, write interrupted mid-save, quota full | Local servers and browser storage could not be safely manipulated without changing the test environment/state | Controlled browser harness/service worker/network shaping and disposable save origin | Medium |
| Full manual level sweep | Boundary levels and 20 random levels in every 750-level UI | Audit prohibited modifying progression; no approved mutable level selector or QA save supplied | Read-only level-select QA harness or prebuilt boundary saves | Medium for UI integration, low for catalogue/rule correctness |
| All-location traversal | Every house, shop, landmark and entrance twice | Time and navigation cost; no fast-travel harness | Approved navigation QA mode/save | Medium |
| Native app lifecycle | Background, suspend, kill, restart and OS storage behaviour | Testing was browser-only | Capacitor iOS/Android build on devices | High before app-store release |

The 98 not-testable checks are explicitly included in the 78.6% audit coverage calculation. They prevent an unconditional Phase 1 PASS but do not invalidate the strong logic/data/save evidence.

## 12. Recommended repair order

### Wave 0 — data loss, boot and progression blockers

No confirmed Wave 0 defect. Preserve all save/reconciliation tests as mandatory release gates. Add real-browser quota and interrupted-write tests before native release.

Required regression tests: corrupted current save → backup recovery; legacy v82 import; duplicate first-clear/reward receipt; failed transaction rollback; original legacy key byte-for-byte untouched.

### Wave 1 — missing major systems and inaccessible scenes

No confirmed missing major system. Complete an approved all-location/all-scene smoke sweep before closing this wave. If any scene is unreachable through normal player progression, treat it as P1 and repair before lower waves.

Required regression tests: enter, load, complete/cancel, return, re-enter and reload for all 16 lazy scenes.

### Wave 2 — mini-game logic, economy and rewards

No confirmed logic or economy regression. Use approved boundary saves to manually exercise 1/2/10/11/20/50/100/150/250/500/749/750 and random levels without weakening normal progression.

Required regression tests: wallet before/after, first-clear exactly once, replay zero, exit/failure zero, return position, active-session resume, final-level behaviour.

### Wave 3 — NPCs, animals, farming, shops and houses

No confirmed Wave 3 defect. Complete live multi-day and representative purchase/placement/adoption/harvest/home-upgrade journeys to supplement the passing service suite.

Required regression tests: full-day NPC routes; follower/home persistence; rare visitor exclusivity; crop/tree offline growth; exterior/interior placement round-trip; home upgrade retaining furniture.

### Wave 4 — mobile input, scaling, audio and offline behaviour

**Highest-priority remaining validation wave.** This wave determines whether a logic-complete migration is actually releasable on the intended devices.

Run the device matrix in Section 11, verify the landscape policy and River portrait exception, complete at least one gesture-heavy level per scene, test OS background/resume and measure audio stacking/autoplay. Repair any P1/P2 touch or clipping issue before visual polish.

Required regression tests: 44-pixel targets, no hidden buttons, no page scroll during gestures, rotate barrier, safe areas, pause/resume, offline launch, reconnect, audio single-instance behaviour.

### Wave 5 — visual and polish regressions

1. Repair `KW-MIG-001`.
2. Install final Sprite AI assets through the labelled inventory.
3. Compare pivots, depth, hit areas, state changes and animations against the legacy reference.
4. Review the first-job navigation cue and all intentional differences with product/design.

Required regression tests: custom town rename → movement → scene return → reload; baseline screenshot matrix; dirty/recovering/clean state comparisons; four-direction character/mower animation; object collision-to-sprite alignment.

### Wave 6 — code cleanup after parity is proven

Only after Waves 0–5 and the exit checklist pass: remove genuinely unused migration scaffolding, consolidate duplicate helpers, and improve maintainability. Never remove protected legacy import mappings or source data merely because the new code looks cleaner.

Required regression tests: full 450-test suite, differential audit, performance budget and all approved browser journeys.

## 13. Phase 1 exit checklist

- [x] No P0 issues
- [x] No unresolved save-loss issues
- [x] No critical progression blockers
- [ ] All major locations are reachable — automated ownership is complete; final manual all-location traversal remains
- [ ] Every mini-game is completable — service/certification evidence passes; manual UI completion remains incomplete
- [x] Required level data is present
- [x] Economy and rewards match the baseline
- [x] NPC and pet state persists
- [x] Farming and apple-tree state persists
- [ ] Touch controls are usable — physical devices required
- [ ] Offline behaviour is safe — service fallback passes; live offline/reconnect and native lifecycle remain
- [ ] Sound and settings persist — full audio/settings system is not demonstrable in the baseline or Phaser
- [ ] Phaser build performs acceptably — bundle budgets pass; minimum-device FPS/endurance remains
- [x] Legacy save handling is verified
- [ ] Remaining intentional differences are approved

Additional exit condition:

- [ ] `KW-MIG-001` is repaired and its focused UI regression plus all 450 tests pass.
- [ ] Final Sprite AI art receives visual/animation/collision acceptance.

## 14. Final verdict

**PHASE 1 CONDITIONALLY PASSED**

The migration has strong, repeatable evidence that its gameplay rules, content counts, generated levels, economy, persistence, legacy reconciliation and shared systems have been preserved. The protected legacy hash is pinned; the Phaser commit is exact; all 450 tests passed; the differential audit covered all 13 activities, all 5,850 campaign levels and 85 exact rule probes; the production build stayed inside its explicit performance budgets; and the manually completed Lawn Care journey matched board state, route, stars, reward, town effect and reload persistence.

Phase 1 is not unconditionally complete because only 78.6% of the planned audit checks could be executed in the available environment. Physical touch/orientation, native lifecycle, audio, final art, extended performance and full manual all-scene/boundary-level coverage remain open. One P3 migration regression (`KW-MIG-001`) is reproducible and should be repaired, but it does not threaten progression or data.

Proceed first with Wave 4 device validation, then Wave 5’s focused town-label repair and final Sprite AI visual audit. Do not begin code cleanup until those gates pass. No fixes were implemented as part of this audit.

### Evidence index

- Legacy baseline: `/Users/youyoulu/Documents/Codex/2026-08-25/referenced-chatgpt-conversation-this-is-an/audit-evidence/legacy-baseline-1280x720.png`
- Phaser baseline: `/Users/youyoulu/Documents/Codex/2026-08-25/referenced-chatgpt-conversation-this-is-an/audit-evidence/phaser-baseline-1280x720.png`
- Legacy Lawn Level 1 success: `/Users/youyoulu/Documents/Codex/2026-08-25/referenced-chatgpt-conversation-this-is-an/audit-evidence/legacy-lawn-level1-success.png`
- Phaser Lawn Level 1 success: `/Users/youyoulu/Documents/Codex/2026-08-25/referenced-chatgpt-conversation-this-is-an/audit-evidence/phaser-lawn-level1-success.png`
- Town-name regression: `/Users/youyoulu/Documents/Codex/2026-08-25/referenced-chatgpt-conversation-this-is-an/audit-evidence/KW-MIG-001-town-location-label.png`
- Phaser first-job camera focus observation: `/Users/youyoulu/Documents/Codex/2026-08-25/referenced-chatgpt-conversation-this-is-an/audit-evidence/phaser-find-waste.png`

### Reproducible command evidence

- Full tests: `node --test` → 450 passed, 0 failed, duration 1,198,488 ms.
- Differential audit: `node scripts/verify-differential-parity.mjs` → passed; protected hash confirmed; 13 activities; 5,850 levels; 19 shared domains; 85 exact rules.
- Performance calculation: imported `inspectPerformanceBuild()` read-only → passed with the sizes listed in Section X. The normal script writes `dist/performance-budget.json`; that write was deliberately not authorised during this audit.

