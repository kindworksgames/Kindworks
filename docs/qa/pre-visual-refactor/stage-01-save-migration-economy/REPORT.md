# Stage 01 — Save, Migration, Persistence, Progression, and Economy

**QA date:** 2026-08-28  
**Starting branch:** `phase-2-ui-simplification`  
**Starting commit:** `2e42b1c22dbca9b77d5d0756b4b78602ca7ce47c`  
**Protected HTML:** `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`  
**Protected HTML SHA-256:** `0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5`  
**Stage verdict:** **PASS for the browser/runtime persistence contract**

No production gameplay, progression, economy, save, or visual code was changed during this QA stage.

## Scope

This stage checked:

- Phaser save-envelope validation and checksums
- save read-back verification
- valid-save backup creation
- corrupted-current-save recovery
- write-failure rollback
- schema upgrades from supported Phaser save versions
- legacy HTML save inspection and read-only handling
- legacy save reconciliation from versions 12 through 82
- coin balance and lifetime-total reconciliation
- inventory persistence through a real shop transaction
- insufficient-funds and invalid-transaction non-mutation
- duplicate reward, commerce transaction, subscription-period, and first-clear protection
- production build viability
- representative phone and tablet runtime persistence

This stage did not evaluate visual design, artwork, layout fidelity, or the functional details of Stage 02–09 systems beyond their persistence/economy regression contracts.

## Evidence summary

| Evidence | Result |
| --- | --- |
| Focused save/migration/economy suite | 62 passed, 0 failed |
| Cross-system persistence/reward/transaction filter | 233 matching tests passed, 0 failed |
| Complete automated regression suite | 610 passed, 0 failed, 0 skipped |
| Differential HTML/Phaser parity | PASS: 13 activities, 5,850 campaign levels, 19 shared domains, 85 exact rules |
| Exhaustive mini-game parity | PASS: 14 games, 75 comparisons, 105,795 deterministic level/seed instances |
| Legacy version coverage | PASS: every supported HTML save version 12–82 reconciled to schema 37 |
| Production build | PASS, including performance budget |
| Live isolated purchase | PASS: 100 → 70 coins; carrot seeds 1 → 2 |
| Full reload | PASS: 70 coins and 2 carrot seeds persisted |
| Save status after reload | Healthy; verified backup available |
| Live console | 0 warnings, 0 errors |
| Runtime viewports | 844×390 purchase/reload; 568×320 and 1024×768 persistence confirmation |

The machine-readable run summary is stored in [evidence/test-run-summary.json](evidence/test-run-summary.json).

## Representative runtime reproduction

1. Launch the current Vite development build on a new local origin.
2. Open `?qa=fidelity`; confirm the page reports that the QA save is isolated.
3. Open Village Grocer through the development fidelity launcher.
4. Observe 100 coins and one owned packet of Carrot Seeds.
5. Buy one packet for 30 coins.
6. Observe 70 coins and two owned packets.
7. Reload the complete page.
8. Observe the 70-coin balance in town.
9. Re-enter Village Grocer and observe `Carrot Seeds, 30 coins, 2 owned`.
10. Check the Save panel; it reports a healthy Phaser save and a verified backup.
11. Repeat the persisted-state visibility check at 568×320 and 1024×768.
12. Inspect the captured console stream; no warning or error was present.

The runtime test used only the isolated fidelity namespace on a fresh local origin. It did not inspect, modify, or clear the user's production browser storage.

## Confirmed defects

None.

## Confirmed HTML parity gaps

None within this stage's save, migration, progression-persistence, reward, and economy scope.

## Visual-only issues

Not evaluated in this stage by design.

## Pre-existing issues preserved

| ID | Item | Evidence | Handling |
| --- | --- | --- | --- |
| PRE-01 | Untracked repository file `KindWorks Migration Starter .json` existed before QA | `git status --short` at stage start and end | Left untouched |

## Observations

| ID | Severity | Observation | Evidence | Impact | Follow-up |
| --- | --- | --- | --- | --- | --- |
| OBS-01 | Observation | Native iOS/Android persistence and store billing are not certifiable from this repository state. | `package.json` contains Phaser and Vite only; no Capacitor dependency, configuration, `ios/`, or `android/` project is present. | Browser `localStorage` and mocked server-wallet contracts are covered, but packaged-device lifecycle/storage behaviour has not been proved. | Re-test native storage, app suspension/termination, and billing only after the native wrapper exists; do not treat this as a browser-game defect. |
| OBS-02 | Observation | The automated reconciliation fixtures are anonymized and deterministic; the user's actual production browser save was deliberately not inspected. | Tests cover versions 12–82 and a dense v82 fixture; live testing used `?qa=fidelity` on a fresh origin. | Production data privacy and safety are preserved, but a later user-authorized backup/import rehearsal may still be useful. | If requested, test a user-provided exported save copy without touching the live save. |

## User decisions required

None.

## Defect register fields

No defect rows were created because no failure was confirmed. Future defect rows must include severity, reproduction, evidence, expected behaviour, actual behaviour, affected files, suspected cause, and required regression test before a repair prompt begins.

## Exit gate

- Stage 01 QA: **PASS**
- Repair required: **NO**
- Production behaviour changed: **NO**
- Ready for a separate Stage 02 QA prompt: **YES**
- Pre-visual-refactor QA as a whole: **IN PROGRESS**
