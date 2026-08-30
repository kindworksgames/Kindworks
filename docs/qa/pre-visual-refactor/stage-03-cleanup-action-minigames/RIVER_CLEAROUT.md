# River Clear-Out — Stage 3 Detail

## Ownership and entry

- Scene: `RiverClearoutScene` in `src/scenes/RiverClearoutScene.js`.
- Data/engine: `src/data/riverClearout.js`.
- Persistent service/state: `src/systems/RiverClearoutService.js` and `src/state/riverState.js`.
- Tests: `tests/river-clearout.test.js`, `tests/river-mobile-ux.test.js`, and `tests/mobile-gesture-parity.test.js`.
- Orientation: portrait-only; landscape must pause behind the rotate-device shield.

## Runtime evidence

Levels 1, 10, 25, 50, 55, 56, 60, 61, 100, 250, 500, and 750 opened at 390×844. Level 750 also fit at 768×1024. A tap changed the active cells from `[113,114,115,116]` to `[113,123,133,143]`, proving clockwise rotation. Hard drop advanced `0/34` to `1/34`. A live failed board displayed the retry result, and result-screen Undo reopened the same attempt. Hint displayed its star-cap warning. At 568×320 landscape the game paused with `Turn your device upright to play.`

## Functional results

| Area | Result | Evidence |
| --- | --- | --- |
| Entry/re-entry | PASS | Live deterministic entry; service persists return and campaign state. |
| Tutorial | PASS | River first-job tutorial and gesture contract pass automation. |
| Tap/swipe/drop | PASS | Tap rotation, hard drop, soft drop/swipe mapping, and browser-scroll prevention verified. |
| Legal/illegal actions | PASS | Rotation bounds, heavy-row weakening, lock timing, and finished-session guards pass. |
| Timer/resources | PASS | Fall interval, lock delay, buffer, rubbish goals, and star thresholds validate per band. |
| Undo | PASS | Live failure/result Undo plus atomic reward reversal test. |
| Restart/pause/exit | PASS | Failure retry and cancellation service tests; landscape orientation safely pauses. |
| Success/failure | PASS | Live failure; certified completion and failure durability in automation. |
| Rewards | PASS | First clear pays once; replay pays 0; result Undo reverses the committed reward. |
| Save/reload | PASS | Campaign progress, active board, rollback, and legacy conversion pass. |
| Touch/playfield | PASS | Live portrait phone/tablet and landscape barrier; all controls at least 44 pixels. |

## Exhaustive level result

All 750 definitions and IDs validate as deterministic, settled, finite, and immediately playable. No unsupported start cell exists. Heavy rubbish first appears at Level 56, after the protected gentle transition. Certified reachable one-star solver routes pass at Levels 1, 10, 25, 50, 56, 61, 100, 250, 500, and 750.

## Exact coverage boundary

The solver was not run exhaustively over every River level, so the report does not claim a formal all-750 solvability proof. Exhaustive structural/playability validation and representative certified routes passed. Physical portrait-device input remains untested.

## Finding

No River Clear-Out defect was confirmed.
