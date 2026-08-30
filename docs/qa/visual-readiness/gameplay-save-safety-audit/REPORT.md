# Visual-Readiness Gameplay and Save-Safety Audit

**Audit date:** 2026-08-30  
**Branch:** `phase-2-ui-simplification`  
**Current Phaser save schema:** 37  
**Protected HTML source:** `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`  
**Protected HTML SHA-256:** `0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5`

## Verdict

**PASS — no gameplay or save regression attributable to the visual-readiness refactor was found.**

The central visual manifest, semantic prefabs, scene layouts, fallback handling, and replacement-art tests do not write persistent state. An older dense HTML v82 save and a current progressed schema-37 save retained byte-equivalent protected gameplay projections after manifest substitution, layout-only movement, repository reconstruction, and reload.

This is an engineering and browser-emulation result. A physical iOS/Android process-kill and relaunch remains an external-device coverage gap; it is not recorded as a confirmed defect.

## Scope and method

The audit traced the actual save path (`SaveRepository`, `GameState`, legacy inspection/import, bootstrap migration, transactional services, page lifecycle persistence) and the visual path (`VisualRegistry`, semantic manifest, prefab/state/layout contracts). It then ran:

- a recursive persisted-field scan on a fresh deterministic state and representative migrated v82 state;
- an older-save artwork substitution/layout movement/restart comparison;
- missing optional, required, and gameplay-critical artwork failure tests;
- current-save manifest/layout resolution and repository-restart comparison;
- all Stage 8 migration/recovery tests and visual-registry/layout/geometry safety tests;
- exhaustive HTML-to-Phaser differential and minigame parity validators;
- the complete automated test suite;
- the production build and post-build validators;
- live production-browser checks at narrow phone, River portrait, and wide phone sizes.

No real user save was copied, decoded, or mutated. The browser check used the existing isolated QA profile exposed by the local preview.

## Save architecture result

| Contract | Status | Evidence |
| --- | --- | --- |
| Fresh save | PASS | Schema-37 deterministic fixture validates, writes, read-back verifies, reloads |
| Existing Phaser saves | PASS | Schemas 1–37 are accepted and upgraded through the current migration chain |
| Legacy HTML saves | PASS | Every protected HTML version 12–82 inspects and reconciles to valid schema 37 |
| Integrity | PASS | Envelope checksum, schema and state validation run before a save is published |
| Backup/recovery | PASS | Last valid current envelope is backed up; corrupt current data recovers without duplication |
| Failed write | PASS | Candidate is read back and revalidated; failed persistence rolls transactional services back |
| Autosave | PASS | World time saves at its configured interval/day boundary; visibility hide, page hide, farming, environment, animals, NPC/collection state, and active venue sessions persist |
| Manual save | N/A | There is no separate player-facing manual-save command. The Save Status panel reports health and provides a confirmed new-game operation; gameplay mutations save transactionally |
| New game/reset | PASS | Two-step confirmation writes a fresh valid state, preserves the former valid current state as backup, and rolls back on failure |
| Browser reload | PASS | Live production reload retained town, day/time, coins and onboarding state |
| App restart | PASS (simulated) | New repository instances and full browser reloads retained exact state; physical OS process termination was not available in this environment |

## Persisted visual-implementation scan

The recursive scan found none of the following in fresh or representative migrated saves:

- raw `/assets/` paths or image filenames;
- Phaser texture or atlas keys;
- frame or animation names;
- display/canvas dimensions;
- Phaser origins or visual-only offsets;
- semantic prefab IDs or scene-layout IDs;
- live scene object references.

The scan reviewed the full persisted tree, including the retained legacy snapshot. Matches such as `carryOriginBusinessId`, NPC `path`, and farming `grassHeight` were inspected and are gameplay state, not presentation implementation.

The following rendering-adjacent values are intentionally persistent because they are protected gameplay or player-authored state:

- player scene, logical position and facing;
- stable NPC/animal route progress and locations;
- purchased object and furniture logical coordinates and rotations;
- selected house wall/roof styles;
- lawn growth, dirt/cleanliness, restoration, weather, time and day/night state.

These values select semantic states or preserve player placement. They do not store filenames, texture geometry, padding, sprite bounds, or renderer objects.

## Migration and replacement tests

| Test | Before | Visual operation | After | Result |
| --- | --- | --- | --- | --- |
| Dense legacy v82 | Imported schema-37 protected projection | Fishing background source, dimensions and cache fingerprint replaced in the manifest; Fishing background moved in cloned layout data | Repository reconstructed and protected projection compared | PASS — 0 changed protected paths |
| Current progressed state | Safe schema-37 fixture | Semantic asset resolved and visual layout movement attempted | Repository reconstructed | PASS — exact deep equality |
| Missing optional semantic ID | Verified current envelope | Production fallback requested | Raw current envelope compared | PASS — raw bytes unchanged |
| Missing required Phaser image | Verified current envelope | Runtime load error forced; stable-key production fallback installed | Raw current envelope and gameplay projection compared | PASS — unchanged |
| Missing gameplay-critical native mask | Verified current envelope | Native image load forced to fail | Loader rejected and current envelope compared | PASS — failed closed; raw bytes unchanged |
| Live production reload | Day 4, 12:47; 310 coins; onboarding step 5 | Enter River, rotate viewport, safely exit, reload | Same day/time, 310 coins and step 5 | PASS — no reward or progression mutation |

Representative v82 import values independently retained after save/reload: town `Test Willow`, day `42`, time `905`, completed jobs `71`, coins `24,800`, South Shore Scoops unlock `12`, and the original legacy snapshot.

## System-by-system matrix

| System | Status | Coverage/evidence |
| --- | --- | --- |
| New game and first launch | PASS | Fresh state validation, starter reward once, confirmed reset and failure rollback |
| Existing saves and migration | PASS | Phaser schemas 1–37; HTML versions 12–82; dense maximum-progression fixture |
| Autosave/reload/transitions | PASS | Interval, day boundary, visibility/page hide, active venue checkpointing; live Town → River → Town → reload |
| Progression and unlocks | PASS | Differential parity plus onboarding/progression and Stage 8 cross-system tests |
| Level counts and difficulty | PASS | 5,850 protected campaign levels; 105,795 validator/simulation instances; early/middle/final and full catalog rules |
| Economy and rewards | PASS | First-clear and occurrence rewards, duplicate prevention, failed-save rollback, 85 exact protected scalar rules |
| Shops and purchases | PASS | Economy/shop/inventory repair and regression tests; atomic deductions and delivery retained |
| Inventory | PASS | Stack/cap/unique-item rules and legacy inventory projection retained |
| Equipment | PASS | Mower/vacuum/nozzle and relevant improvement contracts remain parity-aligned |
| House upgrades/interiors | PASS | Stable home identity, upgrades, player furniture placement and aquarium state survive save/reload |
| Crops and apple trees | PASS | Plant/grow/harvest, weather/offline advancement and exact orchard import remain persistent |
| Animals and pets | PASS | Species, friendship, feeding, adoption, five-pet cap, follower and rare-visit state pass |
| NPC life and stories | PASS | Identities, routes, locations, relationships, narratives and transitions remain stable |
| NPC gifts | PASS | Eligibility, bounded delivery and duplicate prevention remain transactionally persistent |
| Cleanliness/restoration | PASS | Land/river litter, lawns, house jobs and restoration milestones retain protected state |
| Day/night/weather | PASS | Protected 24-minute day, clock/weather/light state, offline cap and reload pass |
| Lawn Care | PASS | 750 levels, swipe controls, saved attempt, rewards and replacement-art geometry test |
| River Clear-Out | PASS | 750 levels, tap/swipe portrait controls, saved attempts and safe exit |
| Waste Collection | PASS | 750 authored boards, tray state, rewards and reload |
| House Rescue/sorting/vacuuming | PASS | 750 levels, persistent home jobs, retries, reward rollback |
| Beach Cleanup | PASS | 750 generated/catalogued levels, rake/walk input and town restoration reward |
| Playground Power Wash | PASS | 750 levels, dirt mask, nozzles/soap, 97% tolerance, native failure safety |
| Fishing | PASS | Three spots, seeded catches, saved inventory/aquarium outcomes and responsive targeting |
| Magnet Fishing | PASS | Recovery catalogue, pity selection, rewards and responsive targeting |
| Corner Café | PASS | 150 levels, recipes/stations/orders and first-clear rewards |
| Little Bakery | PASS | 150 levels, recipes/stations/orders and first-clear rewards |
| Morning Mug | PASS | 150 levels, resumable active shifts, transactional serving and rewards |
| Riverside Kitchen | PASS | 150 levels, resumable active shifts, appliances/plating and rewards |
| South Shore Scoops | PASS | 750 levels, components/orders/customers/restoration and first-clear rewards |
| Harbour General/business | PASS | 17 products, deed/stock/shelf/till state and atomic persistence |
| Tutorials/onboarding | PASS | Fresh journey, per-step persistence, interrupted/returning-save inference and one-time rewards |
| Mobile controls | PASS (emulated) | Automated touch/swipe/pointer tests plus live 568×320, 390×844 River exception and 844×390 checks; no physical device run |

## Baseline comparison

- Differential parity: **PASS** — 13 activities, 5,850 levels, 19 shared domains, 85 exact rules.
- Minigame parity: **PASS** — 14 game families, 75 comparisons, 105,795 level/seeded instances.
- Focused save/visual safety suite: **58/58 PASS**.
- Full regression suite: **800/800 PASS**.
- Production build and post-build validation: **PASS**.
- Live production console at the checked return state: **0 warnings/errors**.

The protected HTML source hash matches the established pre-refactor baseline. No protected functional difference was introduced by semantic asset resolution, prefab rendering, scene-layout data, geometry isolation, fallback handling, or production packaging.

## Confirmed regressions

None. No P0, P1, P2 or P3 gameplay/save regression was reproduced.

## Separate observations and remaining risk

| ID | Type | Risk | Detail |
| --- | --- | --- | --- |
| SAVE-OBS-01 | Coverage gap | Low | Physical iOS/Android background kill, OS eviction and relaunch were not available. Browser reload and reconstructed repository tests passed. |
| SAVE-OBS-02 | Platform contract | Low | Saves are local to the browser/device. No cloud synchronization or cross-device transfer is represented in the current architecture. |
| SAVE-OBS-03 | Compatibility | Low | `legacySnapshot` intentionally retains the imported source payload byte-for-byte. It is inert and current fixtures contain no artwork paths, but an arbitrary third-party legacy payload could archive unknown fields there. Runtime visual systems never read it. |
| VISUAL-PRE-01 | Pre-existing/non-save | Low | Build validation reports one deliberate duplicate-content diagnostic: the protected Fishing legacy reference and current runtime background have identical bytes. |
| VISUAL-PRE-02 | Pre-existing/non-save | Medium | The visual source fingerprint has changed and the authoritative live visual comparison is still required before approving visual appearance. This does not affect gameplay state. |

## Repair specification

No gameplay or save repair is required from this audit.

Recommended hardening, without changing behavior:

1. Keep `tests/visual-refactor-gameplay-safety-audit.test.js` in the normal `pnpm test` gate.
2. Add a physical-device release checklist for background/foreground, forced process termination and relaunch on one iOS and one Android device.
3. Continue treating `legacySnapshot` as read-only compatibility evidence; never allow runtime renderers to resolve assets from it.
4. Run the authoritative visual comparison for the changed visual fingerprint as a separate visual QA gate.

## Files added by this audit

- `tests/visual-refactor-gameplay-safety-audit.test.js`
- `docs/qa/visual-readiness/gameplay-save-safety-audit/REPORT.md`

No production gameplay, progression, economy, level, save-schema, or visual-rendering code was changed by this audit.
