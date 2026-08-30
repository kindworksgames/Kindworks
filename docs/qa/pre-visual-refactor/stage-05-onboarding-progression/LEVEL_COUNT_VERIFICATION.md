# Stage 5 Level-Count and Boundary Verification

## Method

The repository's actual level arrays/generators and validators were imported. Every numbered record was enumerated for expected count, integer/range-safe ID, uniqueness, required schema, valid references, board bounds, unlock progression, final-level behavior, and deterministic/certified solution where the game exposes one.

This is exhaustive programmatic validation of all records plus representative live/service testing. It is not a claim that 5,850 levels were manually played.

## Counts

| Campaign | Expected | Enumerated | Unique IDs/plans/boards | Validator/solution result |
| --- | ---: | ---: | ---: | --- |
| Lawn Care | 750 | 750 | 750 | all stored optimal routes validate |
| Waste Collection | 750 | 750 | 750 | all five-slot certificates clear |
| River Clear-Out | 750 | 750 | 750 | all hydrated levels valid; representative certified solutions |
| House Rescue | 750 | 750 | 750 | all level schemas/endpoints valid |
| Beach Cleanup | 750 | 750 | 750 | all deterministic boards have certified complete walks |
| Playground Power Wash | 750 | 750 | 750 | all deterministic difficulty records valid |
| Little Bakery | 150 | 150 | 150 | all recipe/station references valid |
| Corner Café | 150 | 150 | 150 | all recipe/station references valid |
| Morning Mug | 150 | 150 | 150 | all recipe/station references valid |
| Riverside Kitchen | 150 | 150 | 150 | all recipe/station references valid |
| South Shore Scoops | 750 | 750 | 750 | all orders finishable; unlock map valid |
| **Total** | **5,850** | **5,850** | **5,850** | **PASS** |

Fishing and Magnet Fishing are non-levelled activities and are excluded from the 5,850 total.

## Mechanic and difficulty boundaries inspected

| Campaign | Boundaries |
| --- | --- |
| Lawn | difficulty labels at 1, 229, 468, 659; weed introductions at 1, 10, 50; final 750 |
| Waste | 1, 10, 25, 50, 100, 150, 200, 300, 400, 500, 600, 650, 700, 725, 750 |
| River | broad bands at 1, 51, 61, 101, 301, 551, 701; authored mechanic-signature changes checked; final 750 |
| House Rescue | item-count bands at 1, 95, 189, 283, 377, 471, 565, 659; stain bands 1, 151, 301, 451, 601; final 750 |
| Beach | geometry bands 1, 95, 126, 189, 251, 282, 376, 470, 501, 563, 626, 657, 750; obstacle introductions checked |
| Power Wash | resistance bands 1, 151, 301, 451, 601; final 750 |
| Four 150-level restaurants | every 10-level chapter edge: 1/10/11 through 140/141/150 |
| Scoops | component/family boundaries 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 16, 18, 20, 21, 22, 24, 30, 35, 38, 45, 75, 120, 200, 300, 425, 550, 650, 750 |

## Runtime representatives

- Fresh journey: real Lawn level 1 through the normal onboarding route.
- Returning isolated state: Lawn level 750, Corner Café level 150, South Shore Scoops level 750.
- Applicable Stage 3 runtime samples: early/mechanic boundaries/middle/late/final cleanup levels.
- Applicable Stage 4 runtime samples: levels 1, 10, 11, 50, 100, 150 for four restaurants; 1, 8, 50, 151, 300, 500, 750 for Scoops.

No missing band, duplicate ID, malformed final level, unlock reset, or out-of-range next-level state was found.

