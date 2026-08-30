# Fishing — Stage 3 Detail

## Ownership and entry

- Scene: `FishingScene` in `src/scenes/FishingScene.js`.
- Data: `src/data/fishing.js`.
- Persistent service/state: `src/systems/FishingService.js` and `src/state/fishingState.js`.
- Tests: `tests/fishing-service.test.js` and `tests/fishing-mobile-ux.test.js`.
- Data shape: three unique fishing spots, ten catch IDs, one shared five-cast daily limit.

## Runtime evidence

The Reedbank mode opened live with five casts. Cast changed the prompt to `Watch for a bite`, disabled the action during animation, and reduced the limit to four. A second cast could not be triggered while the first was active. The observed result was `The fish escaped. Cast again.` Exit returned to `TownScene` at Willow Commons.

At 568×320 the compact HUD occupied x=312, y=103, 250×211; at 844×390 it occupied x=588, y=173, 250×211; at 1024×768 it occupied x=758, y=536, 250×216. Both controls were contained and at least 44 pixels; the remaining viewport stayed available to the fishing surface.

## Functional results

| Area | Result | Evidence |
| --- | --- | --- |
| World/direct entry | PASS | Spot targeting service and live direct Reedbank entry. |
| Water targeting | PASS | Cast outside water consumes nothing; valid spots share the daily limit. |
| Cast timing/input lock | PASS | Live disabled repeat input plus service state-machine tests. |
| Catch/escape/full stack | PASS | Timed catch, escape, 99-stack filtering, ornamental release/tank rules pass. |
| Daily resource | PASS | Five casts shared across spots and next-day reset pass. |
| Pause/exit | PASS | Exit after cast returned live; cancellation preserves used cast and grants no pending catch. |
| Success/failure/retry | PASS | Catch, escape, capacity fallback, and subsequent cast paths pass. |
| Reward/inventory | PASS | Each catch enters inventory/aquarium/release history exactly once. |
| Save/reload/rollback | PASS | Cast and reward failure roll back without duplication; schema migration passes. |
| Touch/playfield | PASS | Live emulated landscape phone/tablet and automated controls pass. |

## Data and probability coverage

All three spot IDs and all ten catch IDs are unique and resolve. Catch tables, full-stack filtering, ornamental-fish handling, and pity/rarity behavior use deterministic forced outcomes in tests. The audit did not estimate real-world random distribution through thousands of live casts because the service's deterministic probability branches are already directly exercised.

## Exact coverage boundary

One live Reedbank cast was operated; the other spot definitions were validated programmatically. Physical-device water targeting and haptics were not available.

## Finding

No Fishing defect was confirmed.
