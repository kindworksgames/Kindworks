# Stage 4 Findings Register

## Confirmed defects

### S4-F01 — Little Bakery launch label does not follow selected level

- Severity: **P3**
- Classification: functional/presentation regression
- Status: **FIXED AND VERIFIED**
- System: Little Bakery level picker
- Reproduction:
  1. Enter Little Bakery with more than one level unlocked, or use the development-only QA state.
  2. Select level 10, 11, 50, 100, or 150.
  3. Observe the primary launch control.
  4. Press it and inspect the active level.
- Expected: the control reads `Open for Level <selected>` and starts that selected level.
- Actual: the control remains `Open for Level 1`; pressing it nevertheless starts the correctly selected level.
- Runtime evidence: reproduced at selected levels 10, 11, 50, 100, and 150. The body scene marker and QA status reported the correct launched level each time. Equivalent Café, Morning Mug, Riverside, and Scoops controls updated correctly.
- Suspected root cause: `src/scenes/BakeryScene.js` binds the launch action but does not register the picker `onLevelChange` callback used by the other restaurant scenes.
- Affected file: `src/scenes/BakeryScene.js`
- Workaround: choose the desired level and ignore the stale button copy; the correct level launches.
- Save/economy impact: none observed.
- Required repair: add the localized level-change listener, update the button label, and remove the listener during shutdown/re-entry.
- Required regression test: render with multiple unlocked levels, dispatch a level change to 10, assert the label reads Level 10, assert start receives 10, and verify re-entry does not duplicate listeners.
- Root cause confirmed: `BakeryScene` read the selected value when launching but did not register a picker-change handler.
- Correction: added the same localized label-sync lifecycle used by the other restaurant scenes, including shutdown cleanup.
- Verification: live Level 150 label/start passed; after exit and re-entry, live Level 50 label/start passed; 114/114 Stage 4 focused tests, 617/617 complete tests, 1,350/1,350 data validation, 83/83 representative loops, production build, and performance budget passed.

## Observations, not defects

### S4-O01 — Two unused raw Café ingredient definitions

- Severity: Observation
- Status: protected-source parity
- Evidence: `mushroom` and `pumpkin` are defined but no recipe step references them; recipes use prepared soup-base steps. The protected HTML contains the same data pattern.
- Action: do not remove or rewrite during Stage 4. Revisit only if a later authoritative design decision changes the protected recipe contract.

### S4-O02 — Interrupted-activity warning in the QA fixture

- Severity: Observation
- Status: test-fixture-only
- Evidence: the live console warned that multiple interrupted activities existed and that House Rescue was resumed. The QA session deliberately accumulated interrupted checkpoints.
- Action: none for production. Use a clean fixture when a warning-free capture is required.

## Coverage limitations

| ID | Limitation | Consequence | Mitigation |
| --- | --- | --- | --- |
| S4-COV01 | Physical iOS/Android devices were unavailable | Safe areas, OS lifecycle, and real touch hardware are not certified | Browser emulation at 568×320, 844×390, 1024×768, 1280×720 plus touch-oriented automated contracts |
| S4-COV02 | Browser-control latency advances real timers between calls | A full restaurant success loop is not trustworthy through slow automation | 83 complete real-module simulations plus live wrong-action, timer, failure, recovery, replay, and exit checks |
| S4-COV03 | Phaser canvas controls do not expose semantic purchase hooks to browser automation | Harbour coordinate purchase was not certified as physical touch | Complete business/service tests; live business state/render/re-entry inspection; physical-device follow-up |

## Severity count

- P0: 0
- P1: 0
- P2: 0
- P3 found: 1
- P3 remaining: 0
- Observations: 2
- User decisions required: 0
