# Lawn Care — Stage 3 Detail

## Ownership and entry

- Scene: `LawnCareScene` in `src/scenes/LawnCareScene.js`.
- Data/engine: `src/data/lawnCare.js` and `src/data/lawnCareData.js`.
- Persistent service/state: `src/systems/LawnCareService.js`, `src/state/lawnCareState.js`, and the farming lawn records.
- Tests: `tests/lawn-care.test.js`, `tests/lawn-mobile-ux.test.js`, and `tests/mobile-gesture-parity.test.js`.
- Ordinary entry: active house/town lawn job; return position persists through the active session.
- Direct entry: `?qa=fidelity`, with a requested campaign level.

## Runtime evidence

Levels 1, 2, 9, 10, 49, 50, 100, 250, 500, 749, and 750 opened with matching scene and root markers. A legal movement cut cells and enabled Undo; Undo restored the prior state. At 568×320 the board occupied 568×268; at 844×390 it occupied 844×338; at 1024×768 it occupied 1024×710. Exit, Undo, and Hint remained wholly contained and at least 44 pixels.

## Functional results

| Area | Result | Evidence |
| --- | --- | --- |
| Entry/re-entry | PASS | Direct live entry plus persisted town return and resume tests. |
| Tutorial | PASS | First-job tutorial flag and mobile gesture contract pass automation. |
| Legal/illegal movement | PASS | Stored route movement, hedge stops, incompletable-state rejection, and no-op behavior pass engine tests. |
| Resources/moves | PASS | Move limits, optimal routes, star thresholds, resistance, and upgrade effects remain exact. |
| Undo | PASS | Live Undo plus five-entry engine limit and empty-undo rejection. |
| Restart/pause/exit | PASS-A | UI/source and state services preserve the active board and return point; no live restart was forced in this stage. |
| Success/failure/retry | PASS-A | Certified completion, distinct failure reasons, persistence rollback, and retry tests pass. |
| Rewards | PASS | Level 750 pays 170 once; replay pays 0; town jobs pay their occurrence reward. |
| Save/reload | PASS | Board, Undo stack, and return position restore exactly. |
| Touch/playfield | PASS | Four-way swipe automation and live emulated phone/tablet measurements pass. |

## Exhaustive level result

All 750 IDs, grids, source IDs, source families, move limits, weed bands, and stored optimal routes validate. Every stored solution was executed. All 750 boards are unique. Tough weeds begin at Level 10, woody weeds at Level 50, and the maximum connected weed cluster is five. No impossible or malformed level was found.

## Exact coverage boundary

The normal town lawn-selection tap was not repeated in this Stage 3 browser run; that path is service-tested and part of the repaired Stage 2 transition baseline. No physical-device swipe test was available.

## Finding

No Lawn Care defect was confirmed.
