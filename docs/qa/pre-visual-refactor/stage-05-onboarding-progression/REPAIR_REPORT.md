# Stage 5 Repair Report

## Result

**READY FOR NEXT QA STAGE.**

Both confirmed P2 findings were reproduced, corrected at their root causes, covered by regression tests, and verified through an isolated live fresh-save journey. No gameplay rule, reward, economy value, level record, unlock threshold, resident identity, house identity, or existing save was removed or rewritten.

## Finding resolution

| Finding | Root cause | Correction | Regression test | Runtime proof | Status |
| --- | --- | --- | --- | --- | --- |
| S5-F01 | The welcome controller treated a saved town name as sufficient to dismiss onboarding, while the resident creator had no mandatory first-time mode | Closing is now gated by completed resident/home setup across both surfaces. Required mode hides close, rejects Escape/ordinary close, and provides only a safe return to town-name editing. Normal closing returns after successful setup. | `tests/stage-05-repair.test.js` requires the completion gate, hidden close control, named-incomplete boot route, mandatory creator close guard, and main-controller wiring. | On a fresh isolated origin, the welcome remained open after Escape, no close control was exposed, the creator also had no close control, and ordinary town access returned only after successful creation. | **FIXED** |
| S5-F02 | Creator page and draft lived only in DOM state; boot always reopened page 1 and onboarding had no persistent creator checkpoint | Added backward-compatible `creatorStep` and sanitized `creatorDraft` fields, atomic save/rollback handling, debounced input checkpoints, immediate page-transition/pagehide checkpoints, legacy five-step mapping, automatic named-incomplete resume, and checkpoint clearing after successful creation. | New tests cover exact draft save/reload, successful checkpoint clearing, persistence-failure rollback, startup routing, and old-save compatibility through the full suite. | Reload from page 3 automatically reopened page 3 with `Draft Resident`, both selected hobbies, hair, hair colour, wall, roof style, and roof colour intact. Completed setup reloaded with no setup modal and the town menu enabled. | **FIXED** |

## Files changed by this Stage 5 repair

- `src/state/onboardingState.js`
- `src/systems/OnboardingService.js`
- `src/ui/OnboardingController.js`
- `src/ui/CustomResidentController.js`
- `src/main.js`
- `tests/stage-05-repair.test.js`
- Stage 5 QA documentation and the pre-visual-refactor stage register

The worktree already contained Stage 2–4 repairs, visual-readiness evidence, and unrelated user work. Those changes were preserved and are not attributed to Stage 5.

## Verification evidence

| Check | Result |
| --- | --- |
| Reproduction before repair | PASS — both original failures reproduced; new test initially failed on missing draft support |
| Focused repair/onboarding/save suite | PASS — 56/56 |
| Complete project suite | PASS — 621/621, 0 failed, 0 skipped |
| All campaign records | PASS — 5,850/5,850 remain validated |
| Minigame parity | PASS — 14 games, 75 comparisons, 105,795 level/rule instances |
| Differential HTML/Phaser parity | PASS — 13 activities, 5,850 levels, 19 shared domains, 85 exact rules |
| Production build | PASS — 179 modules transformed |
| Performance budget | PASS — 3,045,845-byte initial app, 1,374,829-byte Phaser engine, 19 lazy chunks, 4,817,831 total JavaScript bytes |
| Live mandatory setup | PASS — close absent and Escape rejected before resident/home completion |
| Live interrupted draft recovery | PASS — exact page and all tested choices restored automatically |
| Live completion/reload | PASS — checkpoint cleared, no setup replay, ordinary menu access restored |
| Runtime console during primary live journey | PASS — no repair-attributable error |

## Save compatibility and rollback

The new fields are additive within the existing onboarding domain. Saves without them normalize to page 1 with no draft. Protected HTML creator steps map deterministically into the approved three-page Phaser flow. Invalid draft values are sanitized before persistence, completed setup cannot retain a checkpoint, and a failed draft write restores the exact prior game-state snapshot.

## Remaining risk

No Stage 5 P0–P3 finding remains open. Physical iOS/Android lifecycle testing remains a later gate. The in-app browser's explicit viewport override did not retain a running Phaser context during this repair session, so phone/tablet assurance for this logic relies on the unchanged responsive shell and the complete automated viewport contracts; the normal development viewport live journey passed. This tool limitation is documented rather than misreported as physical-device coverage.
