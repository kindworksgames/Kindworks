# Stage 8 QA Report — Save/Load, Recovery, Migration and Cross-System Stress

## Verdict

**NOT READY — STAGE 8 REPAIR REQUIRED.**

The Stage 7 repair report explicitly permitted continuation. Stage 8 then validated every supported Phaser and protected HTML save version, the full persisted state surface, backup recovery, major scene-family checkpoints and eight connected gameplay journeys. Healthy saves and valid backups are strong: all 637 project tests pass, all 37 Phaser schema versions and all 71 legacy versions load through the current schema, the production build succeeds, and an isolated live Lawn session survives both refresh and tab close/reopen.

However, Stage 8 found one P1 recovery gap and two P2 flow gaps. They were reproduced but deliberately not repaired in this audit.

## Baseline and safety

- Branch: `phase-2-ui-simplification`
- Starting commit: `3387bcb`
- Current schema: 37; supported Phaser schemas: 1–37
- Protected HTML import range: 12–82; latest fixture: sealed v82
- Current/backup/recovery keys are separate from every protected HTML key.
- All tests use in-memory storage or the development-only Fidelity QA namespace; no real player save was used.
- Existing dirty worktree changes were preserved.

## What passed

- Fresh and ordinary save, checksum/readback, previous-save backup and backup recovery.
- Save/reload after rewards, purchases, progression, restoration, animal/pet changes and farming/harvesting.
- All 11 resumable activity owners plus fishing, Town, shops, home interiors and world state.
- Corrupt JSON and checksum with a valid backup; exact checkpoint returned with no duplicate coins/items.
- Phaser schemas 1–36 upgraded to 37 while identity and position sentinels survived; schema 37 loaded directly.
- All legacy versions 12–82 inspected, imported, validated, saved and reloaded without modifying the legacy key.
- Dense maximum-progression v82 retained 999,999 coins and 1,500 completed jobs.
- Reward, purchase, inventory, NPC, animal, farm, gift and receipt idempotency/rollback tests.
- Live isolated Lawn Level 1 retained the same 7%-cut, 11-move checkpoint after refresh and after closing/reopening the tab.
- Production build transformed 179 modules successfully.

## Confirmed problems

| Finding | Severity | Summary | Status |
| --- | --- | --- | --- |
| S8-REC-001 | P1 | A checksummed current save missing one defaultable field can be rejected wholesale; without a valid backup boot starts a fresh game while the recovery copy is never offered/loaded. | CONFIRMED, NOT FIXED |
| S8-MIG-001 | P2 | Failed legacy import persistence leaves the imported state active only in memory, contradicting the failure message and disappearing after reload. | CONFIRMED, NOT FIXED |
| S8-RESET-001 | P2 | A healthy returning player has no confirmed reset/new-game flow. | CONFIRMED, NOT FIXED |

Full reproductions, expected/actual behaviour, affected files and required regressions are in [FINDINGS_REGISTER.md](FINDINGS_REGISTER.md).

## Test evidence

| Check | Result |
| --- | --- |
| Stage 8 focused save/cross-system suite | PASS — 169/169 |
| Complete project regression | PASS — 637/637, 0 failed, 0 skipped |
| Phaser schema matrix | PASS — 37/37 |
| Legacy HTML migration matrix | PASS — 71/71 |
| Dense maximum/boundary fixture | PASS |
| Valid-backup corruption recovery | PASS |
| Missing-defaultable-field recovery without backup | FAIL — S8-REC-001 |
| Legacy-import write-failure atomicity | FAIL — S8-MIG-001 |
| Player reset/new game | FAIL — S8-RESET-001 |
| Production build | PASS — 179 modules |
| Performance budget | PASS — 19 lazy chunks; 4,823,094 JavaScript bytes |
| Differential HTML parity | PASS — 13 activities, 5,850 levels, 19 shared domains, 85 exact rules |
| Minigame/reward parity | PASS — 14 games, 75 comparisons, 105,795 instances |
| Isolated browser refresh | PASS |
| Isolated browser close/reopen | PASS |
| Physical-device lifecycle | NOT TESTED / not claimed |

## Files added or updated by this audit

- `tests/stage-08-audit.test.js` — audit-only migration/recovery reproductions and boundary matrix.
- `docs/qa/pre-visual-refactor/stage-08-save-load-integrity/REPORT.md`
- `docs/qa/pre-visual-refactor/stage-08-save-load-integrity/PERSISTED_FIELD_MAP.md`
- `docs/qa/pre-visual-refactor/stage-08-save-load-integrity/CROSS_SYSTEM_JOURNEYS.md`
- `docs/qa/pre-visual-refactor/stage-08-save-load-integrity/COVERAGE_MATRIX.md`
- `docs/qa/pre-visual-refactor/stage-08-save-load-integrity/FINDINGS_REGISTER.md`
- Stage register entry in `docs/qa/pre-visual-refactor/README.md`

No production source was changed by Stage 8.

## Required repair order

1. Repair S8-REC-001 first: additive normalization/recovery must prevent whole-save inaccessibility while still rejecting corrupt required data and preventing duplication.
2. Make legacy import atomic with rollback or save-before-publish (S8-MIG-001).
3. Add a deliberate confirmed reset/new-game transaction with a recoverable prior backup (S8-RESET-001).
4. Rerun the complete Stage 8 matrix, full suite, production build and isolated live refresh/reopen before proceeding to Stage 9.
