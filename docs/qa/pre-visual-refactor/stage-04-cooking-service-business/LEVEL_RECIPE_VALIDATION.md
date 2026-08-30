# Stage 4 Level and Recipe Validation

## Validation method

The validator imported the repository's actual level generators, recipe catalogues, ingredients, appliances, service modules, and progress state. It exhaustively checked identifiers, counts, chapter boundaries, references, menus, order targets, arrival ranges, unique plan signatures, difficulty fields, unlock boundaries, and final-level records. It then ran representative complete-loop simulations through the real service APIs.

This is exhaustive data validation plus representative runtime/service simulation; it is not a claim that every level was manually played.

## Exhaustive results

| Campaign | Levels | Unique IDs | Unique plans | Recipes used/defined | Steps used/defined | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Little Bakery | 150/150 | 150 | 150 | 24/24 | 57/57 | PASS |
| Corner Café | 150/150 | 150 | 150 | 64/64 | 86/88 | PASS with observation¹ |
| Morning Mug Coffee | 150/150 | 150 | 150 | 54/54 | 33/33 | PASS |
| Riverside Kitchen | 150/150 | 150 | 150 | 32/32 | 67/67 | PASS |
| South Shore Scoops | 750/750 | 750 | 750 | 19/19 families | 24/24 parts | PASS |

1. Raw `mushroom` and `pumpkin` are defined but unused; recipes use `mushroomSoupBase` and `pumpkinSoupBase`. The protected HTML contains the same definitions and usage, so this is not a Phaser migration mismatch.

No duplicate level ID, malformed record, out-of-range arrival, missing recipe, missing ingredient step, missing station, invalid menu order, or missing final level was found.

## Progression/difficulty ranges

| Campaign | Target/order range | Workload/progression evidence | Final level |
| --- | --- | --- | --- |
| Little Bakery | 3–6 customers | Workload 16–114; later levels add longer mixed products and faster arrival bands | L150: 12 items, workload 99 |
| Corner Café | 3–6 diners | Workload 11–77; menu and simultaneous preparation complexity expand across bands | L150: 14 items, workload 76 |
| Morning Mug | 3–6 customers | Workload grows through drink families, sizes, toppings, and station dependencies | L150: 11 items, workload 89 |
| Riverside Kitchen | 3–6 diners | Workload grows through multi-part meals, pans, pots, grill, roasting, and temperature | L150: 11 items, workload 107 |
| South Shore Scoops | 4–12 orders | Items 4–19, rank 0–10, patience 50–26, sequential unlocks | L750: 12 orders, 19 items, rank 10 |

Generated campaigns have unique plan signatures, so there was no exact duplicate layout/order-plan repetition. Recipe reuse is intentional progression, not duplicate-level data. Difficulty fields increase across authored bands; no reversed unlock, impossible order, absent station, or invalid final-level transition was detected.

## Scoops-specific validation

- 75 chapters resolve.
- 19/19 recipe families resolve.
- 24/24 component parts resolve.
- 48/48 customer definitions resolve.
- Family and component unlocks are sequential and available before use.
- Two-item quotas and simultaneous complexity remain internally valid.
- Patience decreases from 50 to 26 while targets and permitted complexity increase.
- No generated order references a locked or missing component.

## Representative complete-loop simulation

| Campaign | Levels simulated | Passed | Action range | Final-level result |
| --- | ---: | ---: | --- | --- |
| Little Bakery | 15 | 15 | 19–123 | 111 actions; 3 stars; 165 coins |
| Corner Café | 15 | 15 | 14–90 | 90 actions; 3 stars; 506 coins |
| Morning Mug | 15 | 15 | 15–111 | 100 actions; 3 stars; 170 coins |
| Riverside Kitchen | 15 | 15 | 25–138 | 118 actions; 3 stars; 170 coins |
| South Shore Scoops | 23 | 23 | 14–149 | 144 actions; 100% accuracy; 45 coins |

Total: **83/83 representative loops passed**. Each simulation verified start, required sequence, station operation where applicable, serving, completion, reward, and persisted level completion.

## Harbour General business-data validation

| Contract | Result |
| --- | --- |
| Product catalogue | PASS — 17 products, unique IDs, valid costs and sale prices |
| Physical displays | PASS — 6 displays |
| Profit margins | PASS — every sell price exceeds buy cost |
| Stock rules | PASS — four-case restock, maximum stock 24 |
| Ownership | PASS — deed price 5,000 and owned/unowned states |
| Hours | PASS — opening 07:00, closing 21:00 |
| Purchase/restock/shelf/till save integration | PASS in service tests |

