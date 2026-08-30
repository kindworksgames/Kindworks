# Stage 5 Findings Register

## Confirmed defects

### S5-F01 — Incomplete first-time setup can be dismissed

- Severity: **P2**
- Classification: progression/onboarding parity regression
- Status: **FIXED**
- Reproduction:
  1. Open the normal game on a browser origin with no KindWorks save.
  2. Enter and save a valid town name.
  3. Before creating the resident/home, press the now-visible close control.
  4. Open the town menu.
- Expected: first-time setup remains modal until the one resident and Level 1 home are saved. The protected HTML hides close/cancel in onboarding mode and refuses incomplete creator closure.
- Actual: the welcome surface closes after the town is named. The player can browse the town and open Shop, Inventory, Create resident, Animals, Impact, Stories, and save controls with no resident/home.
- Evidence: reproduced on fresh isolated origin `127.0.0.1:5174`; reload preserved the incomplete named-town state and ordinary town access.
- Affected files: `src/ui/OnboardingController.js`, `src/ui/CustomResidentController.js`, and their boot/controller wiring.
- Suspected root cause: `OnboardingController.close()` blocks only while `townNamed` is false; `render()` shows the close control as soon as naming completes; `openResidentCreator()` force-closes the welcome surface; `CustomResidentController` has no mandatory-onboarding mode and Escape/close remain available.
- Save/economy impact: no corruption or reward duplication observed. It creates an invalid progression combination and premature feature access.
- Workaround: reopen Create resident from the town menu and finish all three pages.
- Required repair: keep incomplete setup modal across both surfaces, allow only a safe return to town-name editing, and prevent background/town actions until resident/home creation commits.
- Required regression test: fresh save must reject close button, Escape, backdrop, and ordinary town actions after town naming; completed setup must restore normal closing and menu access.

### S5-F02 — Interrupted creator step and draft do not resume

- Severity: **P2**
- Classification: save/recovery and protected-HTML parity regression
- Status: **FIXED**
- Reproduction:
  1. On a fresh save, name the town and open resident creation.
  2. Enter `Draft Resident`, select a hobby, and advance to `Your house` (step 3 of 3).
  3. Reload the page before pressing `Create resident & home`.
  4. Wait for boot, then manually reopen Create resident.
- Expected: the incomplete creator opens automatically at the same step with name, choices, and home draft restored. The protected HTML persists `creatorStep` and `creatorDraft` and calls `startFirstTimeSetup()` to reopen it.
- Actual: the town loads with neither setup surface open. Manual reopening returns to Appearance step 1 with an empty name and lost hobby/draft.
- Evidence: reproduced on fresh isolated origin `127.0.0.1:5174`; completed setup later reloaded normally, isolating the failure to incomplete state.
- Affected files: `src/state/onboardingState.js`, `src/ui/OnboardingController.js`, `src/ui/CustomResidentController.js`, boot startup wiring, and save migration/validation tests.
- Suspected root cause: current onboarding state has no creator-step/draft fields; creator inputs are local DOM state; `CustomResidentController.open()` always resets to step 0; first-run opening is a one-shot availability check and does not route a named incomplete setup directly into the creator.
- Save/economy impact: unsaved setup input is lost; no coin/item duplication observed.
- Workaround: manually reopen Create resident and restart the three-page setup.
- Required repair: add backward-compatible incomplete-draft persistence, debounce/immediately commit meaningful steps, automatically reopen the correct setup surface, clear draft only after successful resident/home save, and preserve old saves with no draft.
- Required regression test: reload at each creator step; assert step and all draft choices restore; simulate failed persistence; assert completed saves clear draft and cannot create a second resident.

## Observations, not defects

### S5-O01 — Compatibility duplicate-protection mirrors

- Severity: Observation
- `onboarding.starterGrantClaimed` and `onboarding.firstRestorationGiftGranted` are serialized/normalized for compatibility and diagnostics.
- The authoritative gates are the starter economy ledger/fresh grant and `restorationMilestones.firstRestorationGift.granted` respectively.
- Action: preserve through Stage 5 repair; revisit only during Stage 8/10 save-field ownership analysis.

### S5-O02 — NPC story flags are historical evidence

- Severity: Observation
- `storyFlags["stage.*"]` are written when a story advances but the actual dependency gate uses `storyStage`, history, selections, routines, jobs, relationships, days, and restoration evidence.
- Action: do not remove during onboarding repair; full narrative behavior is Stage 6 scope.

## Coverage limitations

| ID | Limitation | Consequence | Mitigation |
| --- | --- | --- | --- |
| S5-COV01 | No physical iOS/Android device | OS lifecycle and native storage interruption are not certified | isolated browser origins, save/reload tests, later physical-device gate |
| S5-COV02 | 5,850 levels were not manually played | subjective pacing at every level is not certified | exhaustive data/certificate validation plus representative early/boundary/late/final runtime tests |

## Severity count

- P0: 0
- P1: 0
- P2: 2
- P3: 0
- Observations: 2
- User decisions required: 0
