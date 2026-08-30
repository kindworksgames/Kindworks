# Magnet Fishing — Stage 3 Detail

## Ownership and entry

- Scene: `FishingScene` in `src/scenes/FishingScene.js`, using magnet mode.
- Data: `src/data/fishing.js`.
- Persistent service/state: `src/systems/FishingService.js` and `src/state/fishingState.js`.
- Tests: `tests/fishing-service.test.js` and `tests/fishing-mobile-ux.test.js`.
- Data shape: eight unique recovery IDs, rarity tiers, and a five-cast daily limit shared with the fishing day reset.

## Runtime evidence

Mill Bridge magnet mode opened with five casts. Cast reduced the limit to four, changed the status to `Waiting for the riverbed…`, and disabled the action during animation. Exit during the active cast did not leave immediately; it displayed `Leave this cast? Tap Confirm Exit.` A second Exit confirmed and returned safely to `TownScene` at Willow Commons.

The compact HUD used the same contained 250-pixel landscape rail measured for Fishing at 568×320, 844×390, and 1024×768. Both controls met the 44-pixel minimum.

## Functional results

| Area | Result | Evidence |
| --- | --- | --- |
| World/direct entry | PASS | River target service and live direct Mill Bridge entry. |
| Targeting/legal actions | PASS | Visible persistent targets, empty-water outcome, and stale/invalid state guards pass. |
| Cast timing/input lock | PASS | Live repeat lock plus service state-machine tests. |
| Daily resource | PASS | Five casts and synchronized next-day reset pass. |
| Pause/exit | PASS | Live two-step in-progress exit; pending recovery was not granted. |
| Success/failure/retry | PASS | Named recovery, empty pull, pity progression, and retry paths pass. |
| Reward duplication | PASS | Coin ledger and collection update once; replayed/failed persistence cannot duplicate. |
| World integration | PASS | Recovery removes the exact river item and schedules 180 game minutes before respawn. |
| Save/reload/rollback | PASS | Cast/reward rollback and legacy conversion pass. |
| Touch/playfield | PASS | Live emulated landscape phone/tablet and automated controls pass. |

## Data and probability coverage

All eight recovery IDs are unique and have valid rarity tiers. Deterministic tests cover ordinary recoveries, empty pulls, the twelfth-dry-pull rare-or-better guarantee, and the fortieth-dry-pull treasure-or-better guarantee. This is direct branch coverage rather than an unverifiable claim based on random live pulls.

## Exact coverage boundary

One live Mill Bridge cast and its interrupted-exit path were operated. Physical-device drag/tap feel was not available.

## Finding

No Magnet Fishing defect was confirmed.
