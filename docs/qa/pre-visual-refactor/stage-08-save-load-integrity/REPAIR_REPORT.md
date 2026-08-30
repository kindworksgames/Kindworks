# Stage 8 Repair Report

## Result

**READY FOR NEXT QA STAGE.**

All three confirmed Stage 8 findings were reproduced, repaired at their state/save owner, and verified without changing gameplay, progression, economy, inventory, NPCs, animals, farming, rewards, level data or protected HTML source data.

## Finding resolution

| Finding | Root cause | Correction | Regression evidence | Status |
| --- | --- | --- | --- | --- |
| S8-REC-001 | Current-schema envelopes did not pass through additive normalization; only current/backup were load candidates; recovery quarantine could be overwritten by a later invalid current payload | Current schema now fills only missing additive fields from each domain normalizer while leaving present corrupt required values untouched. Normalized saves are immediately persisted. A valid recovery payload is a third load candidate, is promoted to current on boot, and is not replaced by an invalid payload. | All 25 audited missing-field paths retain town identity, 4,321 coins and valid state; a present corrupt coordinate still fails closed. Recovery-only boot promotes `Recovered Willow` with 777 coins. | **FIXED** |
| S8-MIG-001 | Import replaced live state before repository persistence | Import now validates and persists the candidate before publishing it to the live `GameStateService`. A failed write leaves the exact previous live state and protected HTML key unchanged. | Simulated import write failure leaves source `new`, town `Willowmere`, and no Phaser save rather than exposing transient imported state. | **FIXED** |
| S8-RESET-001 | Healthy-save rendering hid the only primary action and no safe reset transaction existed | Healthy Save Status exposes `Start new game`; first activation only arms a clear confirmation. Confirmation writes a fresh valid state through the normal repository, preserving the old current envelope as verified backup, then publishes and reloads. Closing the panel cancels and disarms. Failed persistence leaves current progress untouched. | Automated success/failure/cancel tests plus isolated browser operation. The live flow retained 20,000 coins before confirmation, then reloaded to Day 1 / 100 coins after confirmation and remained there after refresh and tab reopen. | **FIXED** |

## Files changed by this repair

- `src/state/GameState.js`
- `src/state/SaveRepository.js`
- `src/state/bootstrapState.js`
- `src/ui/SaveStatusController.js`
- `src/main.js`
- `tests/stage-08-audit.test.js`
- `tests/stage-08-repair.test.js`
- Stage 8 QA documentation and stage register

The worktree already contained extensive earlier QA, migration and visual changes. They were preserved and are not attributed to this repair.

## Verification evidence

| Check | Result |
| --- | --- |
| Original findings reproduced before edit | PASS |
| Focused save/migration/reset suite | PASS — 31/31 |
| Complete project suite | PASS — 641/641, 0 failed, 0 skipped |
| Phaser schemas | PASS — 37/37 |
| Protected HTML versions | PASS — 71/71 |
| Differential HTML parity | PASS — 13 activities, 5,850 levels, 19 shared domains, 85 exact rules |
| Minigame/reward parity | PASS — 14 games, 75 comparisons, 105,795 instances |
| Production build | PASS — 179 modules transformed |
| Performance budget | PASS — 19 lazy chunks, 4,827,700 total JavaScript bytes |
| Live confirmation cancellation | PASS — 20,000-coin QA state remained unchanged and action disarmed on close |
| Live confirmed new game | PASS — reloaded at Day 1, 07:00, clear weather and 100 coins |
| Browser refresh after reset | PASS — fresh state retained |
| Tab close/reopen after reset | PASS — fresh state retained |
| Real player save exposure | NONE — isolated Fidelity QA namespace only |

## Save and gameplay protection

- Missing-field recovery copies only absent/`undefined` additive values; it does not replace present invalid required values.
- Invalid checksums, malformed required values and invalid coordinates still fail closed.
- Normalization preserves player identity, balances, inventories, placements, active sessions and processed reward IDs.
- New game uses the existing verified-save path, so the previous current envelope becomes the backup before the fresh current save is written.
- No protected HTML key is removed or overwritten.
- No schema version or persisted gameplay field was added.

## Remaining risk

No Stage 8 P0–P3 finding remains open. Physical iOS/Android lifecycle, storage eviction and OS-level process termination remain explicit Stage 9/release tests; browser emulation is not claimed as physical-device coverage. The inherited companion-cap/freeing product decision remains non-blocking and unchanged.
