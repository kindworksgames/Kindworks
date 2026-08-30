# Stage 4 Repair Report

## Result

**READY FOR NEXT QA STAGE.**

The only confirmed Stage 4 defect, S4-F01, is fixed and verified. Little Bakery's launch button now follows the selected campaign level, starts that same level, and removes its level-change listener during scene shutdown so repeated entry cannot accumulate handlers.

## Finding resolution

| Finding | Root cause | Correction | Status |
| --- | --- | --- | --- |
| S4-F01 | `BakeryScene` read the picker value when launching but never listened for picker changes. The other restaurant scenes already had that lifecycle. | Added a localized `change` handler that updates `Open for Level <selected>`, registered it with the picker, and removed it during scene shutdown. | **FIXED** |

## Reproduction and proof

Before the correction, the new regression test failed because `BakeryScene` had no `onLevelChange` handler, registration, or cleanup. Live Stage 4 evidence also showed selections 10, 11, 50, 100, and 150 continuing to display `Open for Level 1` while starting the selected level.

After the correction:

- selecting Level 150 changed the visible control to `Open for Level 150`;
- pressing it produced runtime level `150` and `Level 150 · Master Baker · Chapter Challenge`;
- after exiting and reopening through the isolated Fidelity QA harness, selecting Level 50 changed the control to `Open for Level 50`;
- pressing it produced runtime level `50` and `Level 50 · Orchard Display · Chapter Challenge`;
- shutdown cleanup is required by the regression test, preventing duplicate listeners on re-entry.

The live verification used the isolated development-only Fidelity save. No real player save was read or changed.

## Files changed by this repair

- `src/scenes/BakeryScene.js`
- `tests/stage-04-repair.test.js`
- Stage 4 QA documentation and evidence status
- pre-visual-refactor stage register

`BakeryScene.js` already contained an unrelated Stage 2 copy cleanup in the dirty worktree. That prior change was preserved.

## Regression test

`tests/stage-04-repair.test.js` requires:

- the launch action to read the current picker value;
- the level-change handler to derive the visible label from that same value;
- the listener to be registered during interface binding;
- the listener to be removed during scene shutdown.

## Complete Stage 4 re-verification

| Check | Result |
| --- | --- |
| New regression test before fix | FAIL as expected — defect reproduced |
| Bakery-focused repair batch | PASS — 30/30 |
| Stage 4 focused suite | PASS — 114/114 |
| Exhaustive campaign validator | PASS for 1,350/1,350 level records; protected Café raw-ingredient observation unchanged |
| Representative complete-loop simulation | PASS — 83/83 |
| Complete project suite | PASS — 617/617, 0 failed, 0 skipped |
| Production build | PASS — 179 modules transformed |
| Performance budget | PASS — 3,040,323-byte initial app, 1,374,829-byte Phaser engine, 19 lazy chunks, 4,812,309 total JavaScript bytes |
| Live Level 150 label/start | PASS |
| Live exit/re-entry and Level 50 label/start | PASS |
| Browser console/runtime error attributable to repair | None observed |

## Protected contracts

| Contract | Result |
| --- | --- |
| Save schema and legacy saves | Unchanged |
| Level count and level data | Unchanged — 150 Bakery levels |
| Recipes, ingredients, appliances, and timers | Unchanged |
| Rewards, scoring, economy, and duplicate prevention | Unchanged |
| Unlocks and independent venue progression | Unchanged |
| Town entry/return behavior | Unchanged |
| Responsive layout and touch sizing | Unchanged |

## Remaining risk

Physical iOS/Android testing remains a later manual gate. Browser emulation and the isolated live interaction prove the repaired DOM behavior, but do not certify device-specific safe areas or OS lifecycle handling.

