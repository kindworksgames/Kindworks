# Waste Collection — Stage 3 Detail

## Ownership and modes

- Scene: `WasteCollectionScene` in `src/scenes/WasteCollectionScene.js`.
- Campaign engine/data: `src/data/wasteCollection.js` and `src/data/wasteCollectionData.js`.
- Town-job definition: `src/data/cleanupJobs.js`.
- Persistent service/state: `src/systems/CleanupJobService.js` and `src/state/cleanupState.js`.
- Layout helper: `src/ui/WasteCardLayout.js`.
- Tests: `tests/waste-collection.test.js`, `tests/cleanup-job-service.test.js`, and `tests/waste-mobile-ux.test.js`.

## Runtime evidence

Campaign Levels 1, 2, 10, 50, 100, 250, 500, 749, and 750 opened correctly. On Level 1, two different exposed cards accepted rapid sequential taps; the tray reached two items without selecting a covered card, duplicating an ID, or throwing an error. At 568×320, 844×390, and 1024×768 the park board remained within the viewport and all 30 Level 1 card targets were at least 44 pixels.

## Functional results

| Area | Result | Evidence |
| --- | --- | --- |
| Campaign entry/re-entry | PASS | Live direct entry and persisted active-card/tray service tests. |
| Town-job entry | PASS-A | Exact authored Commons job and environment land jobs start only when available. |
| Tutorial | PASS | First Waste job tutorial flag passes onboarding automation. |
| Legal/illegal selection | PASS | Only uncovered cards are enabled; covered/stale IDs are rejected. |
| Triple matching/tray | PASS | Exposed-card graph, automatic triple clearing, five-slot certificate, and bounds pass. |
| Rapid input | PASS | Live two-card probe plus engine duplicate/stale guards. |
| Undo/restart/pause | PASS-A | Contextual UI and state lifecycle inspected; campaign state remains bounded. |
| Success/failure/retry | PASS | Certified clears, incomplete town-job rejection, rollback, and retry pass. |
| Rewards | PASS | Level 750 pays 170 once; replay pays 0; Commons job pays once and cannot duplicate. |
| Save/reload | PASS | Exact card/tray/return state survives reload; failed save restores checkpoint. |
| Touch/playfield | PASS | Live phone/tablet emulation and automated card-layout checks pass. |

## Exhaustive campaign result

All 750 boards have unique IDs and unique board definitions. Forty rubbish types resolve. Every stored five-slot solution certificate was executed successfully for all 750 levels. No malformed triple, missing item reference, duplicate level, out-of-bounds card, or impossible certified board was found.

## Authored town-job result

The single Commons job contains exactly six unique item IDs and a valid return position. Completion requires the exact snapshot; duplicate or altered snapshots are rejected. It cleans only the selected persistent target, awards exactly once, and later regeneration remains separate.

## Exact coverage boundary

The campaign was operated live through direct deterministic entry. The ordinary Town selection of the Commons job was not repeated live in this stage; its service and transition contracts pass.

## Finding

No Waste Collection defect was confirmed.
