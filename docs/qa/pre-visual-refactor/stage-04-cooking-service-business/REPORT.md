# Stage 4 — Cooking, Service, Business, and Remaining Minigames

## Audit verdict before repair

**NOT READY — STAGE 4 REPAIR REQUIRED.**

## Repair status

**READY FOR NEXT QA STAGE.** S4-F01 was repaired and the complete Stage 4 verification was rerun successfully. See [REPAIR_REPORT.md](REPAIR_REPORT.md).

Stage 3's repair report explicitly returned `READY FOR NEXT QA STAGE`, so Stage 4 was permitted to begin. Stage 4 found no P0, P1, or P2 defect. The audit found one reproducible P3 defect: Little Bakery's launch button did not update its level number when the level picker changed, although the selected level itself started correctly. That defect is now fixed.

The initial Stage 4 pass was audit-only. The subsequent repair changed only the Bakery picker-label listener lifecycle; it did not change gameplay behavior.

## Authoritative baseline

- Branch: `phase-2-ui-simplification`
- Starting commit: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`
- Protected HTML: `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`
- Protected HTML SHA-256: `0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5`
- Stage 3 gate: `READY FOR NEXT QA STAGE`

The worktree already contained Stage 2 repairs, Stage 3 evidence, visual-readiness evidence, and unrelated user work. Those changes were preserved.

## Scope accounting

| System | Kind | Campaign size | Stage 4 status |
| --- | --- | ---: | --- |
| Little Bakery | Cooking/service campaign | 150 | **PASS AFTER REPAIR** — S4-F01 fixed and verified |
| Corner Café | Cooking/service campaign | 150 | **PASS** |
| Morning Mug Coffee | Cooking/service campaign | 150 | **PASS** |
| Riverside Kitchen | Cooking/service campaign | 150 | **PASS** |
| South Shore Scoops | Ice-cream service campaign | 750 | **PASS** |
| Harbour General | Player-owned retail-management activity | Non-levelled | **PARTIAL** — logic passes; physical touch not tested |
| Willow Arms | Ambient town business node | N/A | **N/A — intentional non-minigame** |
| Riverstone Restaurant | Ambient town business node | N/A | **N/A — intentional non-minigame** |

All 1,350 cooking/service levels were programmatically enumerated and validated. No additional service, business, cooking, or uncategorized minigame remained unaccounted for after the Stage 1 and Stage 3 inventories were reconciled. Village Grocer and Fresh Market are transactional shops, not minigames, and remain in Stage 7's shop/economy scope.

## Methods and exact coverage

### Automated and exhaustive checks

- Focused Stage 4 suite after repair: **114 passed, 0 failed** across restaurant service/mobile tests, Scoops tests, Harbour General tests, appliance fidelity, shared restaurant presentation, and the repair contract.
- Complete project suite after repair: **617 passed, 0 failed, 0 skipped**.
- Production build: **PASS**, 179 modules transformed.
- Performance budget: **PASS** — initial app 3,040,323 bytes; Phaser 1,374,829 bytes; 19 lazy chunks; total JavaScript 4,812,049 bytes.
- Exhaustive campaign validation: **1,350/1,350 levels**.
- Representative complete-loop simulation: **83/83 levels passed**.

The complete-loop simulation used the real service/state modules to start a level, prepare the exact recipe steps, operate required stations, serve, finish, grant the reward, and verify completion persistence. It is not represented as 1,350 manually played levels.

### Representative level bands

- Each 150-level restaurant: levels 1, 2, 10, 11, 20, 21, 40, 41, 50, 75, 100, 101, 125, 149, and 150.
- South Shore Scoops: levels 1, 2, 7, 8, 10, 16, 20, 30, 38, 45, 50, 75, 100, 150, 151, 200, 300, 425, 500, 550, 650, 749, and 750.
- Live browser start/exit checks: levels 1, 10, 11, 50, 100, and 150 for all four restaurants; levels 1, 8, 50, 151, 300, 500, and 750 for Scoops.

### Runtime checks

Live browser operation verified:

- wrong ingredient/action rejection in Bakery and Café;
- station working, ready, premature collection, burnt-item, and recovery states;
- Bakery failure/result/replay/return flow;
- Scoops incorrect-build rejection, customer departure/replacement, correct build, and successful service turnover;
- selected campaign level entry and safe return across early, boundary, middle, late, and final samples;
- Harbour General rendering with owned-business fixture, six physical displays, stock/on-shelf values, margins, till, customers, and product selection;
- no blank screen, missing resource, unhandled exception, or browser console error in the tested journeys.

Timed live automation could not reliably complete every restaurant before patience/burn windows because browser-control calls add real elapsed time. The deterministic 83-level service simulation and automated suites cover successful loops; the live session deliberately covered failure and recovery. This limitation is recorded rather than hidden.

## Gameplay results

| Requirement | Result | Evidence |
| --- | --- | --- |
| Order/customer loop | PASS | 83 representative real-module simulations; live Scoops turnover |
| NPC/customer counts | PASS | Every restaurant order list equals its target; Scoops queue/count rules validate |
| Order generation and recipe progression | PASS | Unique level plans, chapter boundaries, menu membership, and final levels validate |
| Ingredients and preparation sequences | PASS | Every referenced step resolves; wrong actions reject without advancing |
| Appliances and timers | PASS | Working/ready/burnt states and pause-safe timing covered |
| Carrying, tray, cup, plate, counter behavior | PASS | Service/state tests and presentation fidelity contracts pass |
| Serve controls and correct delivery | PASS | Exact recipe required; wrong/incomplete build rejected |
| Customer departure/replacement | PASS | Live Scoops plus restaurant service tests |
| Success/failure/retry/exit | PASS | Automated suites and live Bakery/Scoops checks |
| Scoring and rewards | PASS | Representative loop rewards persisted once; complete suite duplicate guards pass |
| Save/reload | PASS | Per-venue state/progression repository tests pass |
| Pathfinding around furniture | N/A BY DESIGN | Restaurant workers use fixed safe prep/station anchors rather than free navigation |
| Walking on tables/counters/stations | N/A BY DESIGN | No player-directed walking exists in these activities; authored anchors cannot traverse furniture |
| Touch and responsive visibility | PASS IN EMULATION | 568×320, 844×390, 1024×768, and 1280×720; physical devices remain untested |

## Responsive/runtime evidence

| Profile | Evidence | Result |
| --- | --- | --- |
| 568×320 narrow landscape phone | Harbour General and Café level 150 fit; complete playfield and controls remain visible | PASS in browser emulation |
| 844×390 wider landscape phone | Harbour General fits; service controls remain visible | PASS in browser emulation |
| 1024×768 tablet | Café level 150 fits with expected 16:9 letterboxing and no crop | PASS in browser emulation |
| 1280×720 reference/desktop | All live campaign and business journeys | PASS |

The QA-route fixture panel is development-only and overlaid part of some evidence captures. It is not present on the normal production route.

## Runtime errors and resources

- Browser console errors: **0**.
- Unhandled promise rejections: **0 observed**.
- Missing resource/texture failures: **0 observed**.
- One warning stated that multiple interrupted activities existed. It was produced by intentionally accumulated QA fixtures/checkpoints and is not a production defect.

## Findings summary

| ID | Severity | System | Summary | Status |
| --- | --- | --- | --- | --- |
| S4-F01 | P3 | Little Bakery | Level picker changed the launched level but left the launch-button label at `Open for Level 1` | **FIXED AND VERIFIED** |
| S4-O01 | Observation | Corner Café data | Raw `mushroom` and `pumpkin` definitions are unused; the protected HTML has the same definitions and recipes intentionally use soup-base steps | Protected-source observation; not a parity defect |
| S4-COV01 | Coverage | Mobile/tablet | Browser emulation completed; physical iOS/Android touch testing was not performed | Deferred physical-device gate |
| S4-COV02 | Coverage | Timed restaurant runtime | Tool latency prevented a trustworthy full timed live success loop | Compensated by real-module simulations and automated tests |
| S4-COV03 | Coverage | Harbour General | Visual/runtime entry was operated; semantic canvas controls were not exposed for reliable coordinate purchase operation | Service/business tests pass; physical touch remains later gate |

See [FINDINGS_REGISTER.md](FINDINGS_REGISTER.md) for reproduction and required regression coverage.

## Protected contracts

The post-audit repair modified only the Bakery picker-label listener lifecycle. The following remain unchanged:

- save schema and legacy-save migration;
- coins, prices, margins, rewards, and one-time grant rules;
- 150/150/150/150/750 level counts;
- recipe, ingredient, appliance, arrival, customer, and difficulty data;
- venue unlocks and independent progression;
- town entry/return routes;
- customer patience, failure, retry, and completion rules;
- Harbour General ownership, stock, shelf, till, and operating-hours behavior;
- touch input and responsive layout rules.

## Next action

Stage 4 repair verification is complete. Stage 5 may proceed.

## Files added by this audit

- `docs/qa/pre-visual-refactor/stage-04-cooking-service-business/REPORT.md`
- `COMBINED_COVERAGE_MATRIX.md`
- `LEVEL_RECIPE_VALIDATION.md`
- `FINDINGS_REGISTER.md`
- one detailed report for each Stage 4 activity
- `evidence/stage4-summary.json`
