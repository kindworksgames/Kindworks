# Beach Cleanup — Stage 3 Detail

## Ownership and entry

- Scene: `BeachCleanupScene` in `src/scenes/BeachCleanupScene.js`.
- Data/engine: `src/data/beachCleanup.js`.
- Persistent service/state: `src/systems/BeachCleanupService.js` and `src/state/beachCleanupState.js`.
- Rake rendering: `src/ui/BeachRakePattern.js`.
- Tests: `tests/beach-cleanup.test.js`, `tests/beach-mobile-ux.test.js`, and `tests/mobile-gesture-parity.test.js`.

## Runtime evidence

Levels 1, 2, 10, 50, 125, 375, 625, 749, and 750 opened. On Level 1, movement along the boardwalk did not rake sand. Entering/leaving a sand tile changed the board from `0/24` to `1/24` and displayed `1 of 24 tiles raked.` The contextual menu opened and Undo operated.

The board measured x=11, y=63, 470×229 at 568×320; x=11, y=63, 717×298 at 844×390; and x=11, y=72, 865×641 at 1024×768. The playable surface remained visible and contained.

## Functional results

| Area | Result | Evidence |
| --- | --- | --- |
| Entry/re-entry | PASS | Live direct entry plus active route/return persistence tests. |
| Instructions | PASS | Short contextual prompt and optional challenges render; no blocking separate tutorial. |
| Legal/illegal movement | PASS | Boardwalk versus sand behavior live; bounds and blocked movement in engine tests. |
| Swipe/rake input | PASS | Held-swipe batching, four directions, and browser-scroll prevention pass. |
| Rake patterns | PASS | Straight, corner, revisit, and undo patterns pass protected renderer tests. |
| Undo/restart/menu | PASS | Live menu/Undo; whole-swipe and separate-input Undo automation. |
| Pause/exit/return | PASS-A | Guarded exit and persisted return point pass service/source tests. |
| Success/failure/retry | PASS-A | Certified completion, challenge/reward bounds, replay, and rollback pass. |
| Reward duplication | PASS | Level 750 first clear pays 170; replay pays 0; town job removes exact litter once. |
| Save/reload | PASS | Route, Undo batch, rake metadata, and return point restore. |
| Touch/playfield | PASS | Live emulated phone/tablet plus mobile tests. |

## Exhaustive level result

All 750 IDs and boards are unique and structurally valid. Every certified complete walk was executed successfully. Sand, boardwalk, rubbish, start positions, and route references stay in bounds. Progressive boards increase work and rubbish without losing a completion route. No impossible or malformed level was found.

## Exact coverage boundary

The ordinary South Shore job entrance was not re-operated live in this stage; its exact litter removal, reward, regeneration, and return behavior pass automation. Physical finger swipe continuity remains untested.

## Finding

No Beach Cleanup defect was confirmed.
