# House Rescue — Stage 3 Detail

## Ownership and stages

- Scene: `HouseRescueScene` in `src/scenes/HouseRescueScene.js`.
- Campaign data: `src/data/houseRescue.js`.
- Room/collision geometry: `src/data/houseRescueGeometry.js`.
- Persistent service/state: `src/systems/HouseRescueService.js` and `src/state/houseRescueState.js`.
- Tests: `tests/house-rescue.test.js`, `tests/house-rescue-geometry-fidelity.test.js`, and `tests/house-rescue-mobile-ux.test.js`.
- Stages: category sorting followed by continuous vacuuming.

## Runtime evidence

Levels 1, 2, 10, 50, 100, 250, 500, 749, and 750 opened. On Level 1, placing `Food scraps, organic` in Garbage produced `Wrong bin. −1. Try another.` and retained the item; placing it in Organic produced `Correct! +2.` and removed it. All remaining items were sorted through the visible controls. The vacuum stage then started with 180 stains. A live pointer drag raised coverage from 0% to 8% and reduced stains from 180 to 166.

At 568×320, 844×390, and 1024×768 the full room/floor remained visible and targets met the 44-pixel minimum. At 1280×720, repair review confirmed the three player-visible open sorting bins end at y=709. The earlier y=721 measurement belonged to their invisible translated closed state.

## Functional results

| Area | Result | Evidence |
| --- | --- | --- |
| Entry/re-entry | PASS | Live direct entry; house identity and return point persist. |
| Instructions | PASS | Contextual category and vacuum prompts rendered; no separate mandatory tutorial exists. |
| Correct/wrong sorting | PASS | Live `+2`/`−1` behavior plus wave/category automation. |
| Wave transition | PASS | Live complete sorting transitioned once to vacuum. |
| Vacuum targeting | PASS | Live cleaning plus connected-dirt and collision-safe start tests. |
| Collision/pathing | PASS | Furniture, partitions, wall bounds, stop/slide behavior, and reachable stain geometry pass. |
| Equipment effects | PASS | Equipped vacuum power, reach, and movement profile are tested. |
| Success/failure/retry | PASS-A | 95% completion, accuracy/stars, home status, rollback, and retry pass services. |
| Rewards/duplication | PASS | First clean pays once; dirty-home/campaign duplication and homeowner gift rollback are guarded. |
| Save/reload | PASS | Both sort and vacuum sessions restore; house identity cannot switch on resume. |
| Touch/playfield | PASS | Visible sorting bins are 44 pixels high and end at y=709 in 1280×720. |

## Exhaustive level result

All 750 rule profiles, generated sort layouts, and generated dirt layouts are unique and valid. Item count rises from 9 to 30; dirt rises from 180 to 267; stain strength reaches five; reward output stays in the protected 60–170 range. Categories remain balanced, items and stains stay within authored floor regions, and every stain is connected to a valid collision-safe vacuum start. No impossible generated room was found.

## Finding

No House Rescue defect remains confirmed. S3-F01 is **CANNOT REPRODUCE**: Organic, Recycling, and Garbage are translated down only while invisible and closed. Selecting an item opens the cluster, removes the transform, and places all three 44-pixel controls at y=665–709 inside the 1280×720 viewport.
