# Playground Power Wash — Stage 3 Detail

## Ownership and entry

- Scene: `PlaygroundPowerwashScene` in `src/scenes/PlaygroundPowerwashScene.js`.
- Data/engine: `src/data/playgroundPowerwash.js`.
- Persistent service/state: `src/systems/PlaygroundPowerwashService.js` and `src/state/playgroundPowerwashState.js`.
- Visual renderer: `src/rendering/LegacyPowerwashRenderer.js`.
- Tests: `tests/playground-powerwash.test.js` and `tests/powerwash-mobile-ux.test.js`.

## Runtime evidence

Levels 1, 2, 10, 50, 100, 250, 500, 749, and 750 opened. On Level 1, Soap selected the soap mode and a drag left clean percentage at 0%, as expected for unrinsed foam. Standard water selected the standard nozzle and the next drag raised cleaning to 3%. At Level 750, a certified live completion displayed `Playground restored!` and paid 170 coins; reopening and completing the same level paid 0 and displayed `Best cleanup saved.`

The board measured x=44, y=0, 480×320 at 568×320; x=130, y=0, 585×390 at 844×390; and x=0, y=43, 1024×683 at 1024×768. At 568×320, Soap, Precision, Standard, and Wide were 45×44.4 image-aligned hit zones and Exit was 44×44. A live Standard tap changed its pressed/nozzle state.

## Functional results

| Area | Result | Evidence |
| --- | --- | --- |
| World/direct entry | PASS | Commons job service and live deterministic campaign entry. |
| Tool selection | PASS | Live Soap/Standard plus all four image-aligned controls in automation. |
| Targeting/collisions | PASS | Master dirt mask, hitbox alignment, interpolation, and full-resolution path tests. |
| Water/soap/resources | PASS | Live mode behavior plus recovery, resistance, pressure, wetness, and idle-time tests. |
| Continuous input | PASS | Stationary resistant-cell cleaning and interpolated movement tests. |
| Pause/exit/return | PASS | Guarded two-step exit operated; active session/return state persist. |
| Success/failure/retry | PASS | 96% rejection, 97% residue clear to 100%, retryable persistence failure. |
| Reward duplication | PASS | Live Level 750 170/0 first-clear/replay result; town reward capped and reconciled. |
| Save/reload | PASS | Supplies, tool, coarse state, and exact full-resolution path restore independently. |
| Touch/playfield | PASS | Live phone/tablet measurements and image-aligned 44-pixel controls. |

## Exhaustive level result

All 750 IDs and generated fingerprints are unique. Every level resolves required masks/entities and produces bounded dirt, grit, stains, resistance, pressure, and resource settings. Difficulty rises through more/stronger dirt rather than invalid geometry. The protected precision default and 97% completion tolerance remain intact. No missing definition or impossible generated target was found.

## Exact coverage boundary

Continuous washing has no useful finite certificate comparable to Lawn/Waste/Beach. Exhaustive data generation and engine mechanics passed, while representative levels and the final-level completion were operated. No report claims a full manual spray path for every level.

## Finding

No Playground Power Wash defect was confirmed.
