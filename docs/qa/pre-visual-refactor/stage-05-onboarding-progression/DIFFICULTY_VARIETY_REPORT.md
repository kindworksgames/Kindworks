# Stage 5 Difficulty and Variety Report

## Result

**PASS for data structure, progression boundaries, and deterministic feasibility.** No impossible generated campaign state or missing difficulty band was confirmed.

## Campaign evidence

| Campaign | Difficulty/variety evidence | Fairness/feasibility result |
| --- | --- | --- |
| Lawn | 750 unique families; optimal moves grow from 9 to 25; tough/woody weeds enter later | every stored optimal route replays; no optimal-move regression |
| Waste | 750 unique authored sources; difficulty rises from 40 to 85; card variety reaches 40 types | every certified tray solution clears |
| River | 750 unique sources; broad difficulty rises from 10 to 88; heavy/rotation mechanics expand | generated states are settled/finite; representative certified solutions pass |
| House Rescue | rubbish grows 9 to 30; stain strength 1 to 5; dirt coverage 180 to 267 | reachable rubbish/stain endpoints validate |
| Beach | 750 unique deterministic boards; geometry grows 7×7 to 15×13; rubbish grows 1 to 50 | every board has a certified complete walk |
| Power Wash | 750 unique levels; resistant layers increase and clean strength tightens | interpolation, resistance, supplies, 97% completion, and final reward tests pass |
| Bakery | 15 chapters, unique plans, 3–6 customers | all references and representative complete loops pass |
| Café | 15 chapters, unique plans, 3–6 diners | all references and representative complete loops pass |
| Morning Mug | 15 chapters, unique plans, 3–6 customers; target briefly resets at chapter 11 | chapter reset is accompanied by new recipe/station complexity; no impossible order |
| Riverside Kitchen | 15 chapters, unique plans, 3–6 diners; target resets at levels 7 and 11 | authored plan complexity changes; all representative loops pass |
| Scoops | 75 chapters; orders increase 4 to 12; 19 families and 24 parts unlock progressively; patience tightens | all 750 generated shifts unique and finishable |

Short target-count reductions in Morning Mug and Riverside Kitchen are plan/chapter variation, not a difficulty reset defect: workload, recipes, stations, and time pressure change at those boundaries, and the protected data/validators accept them.

## Repetition audit

- No exact duplicate level ID or generated plan/board fingerprint was found.
- Reuse of recipes, ingredients, card types, rubbish types, house objects, and washer surfaces is intentional vocabulary reuse rather than duplicate levels.
- Later levels add size, workload, obstacles, resistance, time pressure, simultaneous orders, or component variety depending on the game; difficulty is not represented by a single monotonically increasing scalar in every campaign.

## Scope limits

Programmatic feasibility cannot prove subjective fun or physical-device ergonomics for every generated level. Physical-device testing and longer human play sessions remain later gates. The audit therefore records structural/fairness evidence without claiming all 5,850 levels were manually completed.

