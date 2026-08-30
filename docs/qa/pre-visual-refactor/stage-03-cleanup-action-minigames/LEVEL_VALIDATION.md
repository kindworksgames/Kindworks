# Stage 3 Level and Data Validation

## Aggregate

| Metric | Result |
| --- | --- |
| Campaigns | 6 |
| Levels enumerated | 4,500 |
| Unique campaign IDs | 4,500/4,500 |
| Structural validator failures | 0 |
| Duplicate/malformed levels | 0 |
| Missing referenced entities | 0 |
| Runtime sample levels | 59 campaign openings across early, mechanic-boundary, middle, late, and final bands |

## Per campaign

| Campaign | Count | Exhaustive checks | Solvability evidence | Difficulty and final-level result |
| --- | ---: | --- | --- | --- |
| Lawn Care | 750 | unique IDs, grids, source IDs/families, bounds, move limits, weed bands, stored optimal routes | all 750 stored solutions executed by the validator | tough weeds begin at 10; woody weeds at 50; move limits rise with optimal routes; Level 750 completes and pays 170 once |
| River Clear-Out | 750 | unique definitions/IDs, settled finite boards, references, supported start cells, mechanics, difficulty bands | certified one-star solver routes at 1, 10, 25, 50, 56, 61, 100, 250, 500, 750 | heavy rubbish begins at 56; gentle transition through 60; finale band retained; Level 750 opens correctly |
| Waste Collection | 750 | unique IDs/boards, 40 rubbish types, exposure graph, tray constraints, certificate references | all 750 five-slot certificates executed successfully | board complexity grows without malformed triples; Level 750 clears and pays 170 once |
| House Rescue | 750 | unique rule profiles, deterministic sort layouts, dirt layouts, item categories, wave balance, room bounds, geometry reachability, reward range | all dirt points are connected to a valid vacuum start; sorting categories are balanced; no discrete whole-level solver applies | items grow from 9 to 30; dirt from 180 to 267; stain strength reaches 5; rewards remain 60–170 |
| Beach Cleanup | 750 | unique IDs/boards, sand/rubbish bounds, route references, rake patterns, move batches | all 750 certified complete walks executed successfully | sand/rubbish density rises across progression; final route completes; Level 750 pays 170 once |
| Playground Power Wash | 750 | unique fingerprints/IDs, mask/entity references, dirt/pass configuration, nozzle/soap/water rules, completion threshold | continuous full-resolution washing mechanics and representative levels tested; no discrete complete-path solver applies | dirt/resistance/stain complexity rises; 97% correctly resolves to 100%; Level 750 paid 170 then 0 on replay live |

## Non-level modes

| Mode | Enumerated data | Result |
| --- | --- | --- |
| Authored Waste town job | one exact Commons target, six unique item IDs, valid world/return metadata | PASS |
| Fishing | 3 unique spots, 10 catch IDs, shared five-cast daily limit | PASS |
| Magnet Fishing | 8 unique recovery IDs, rarity tiers, shared five-cast daily limit | PASS |

## Data-validated, simulated, runtime-tested, and untested

- **Data-validated:** every campaign level 1–750 in all six campaigns; all Fishing spots/catches; all Magnet recovery entries; authored Waste job.
- **Solution-simulated:** all 750 Lawn routes, all 750 Waste certificates, all 750 Beach routes, and ten River certified solver representatives.
- **Runtime-opened:** exact level lists are recorded in the main report and the individual game reports.
- **Runtime-completed:** live Power Wash Level 750 first clear and replay; live River failure and recovery; engine/service completions for representative and final levels across every campaign.
- **Not manually played:** the remaining thousands of levels. No report claims exhaustive manual play.
- **Not formally solved:** every River board, or an end-to-end continuous path for every House vacuum and Power Wash surface. Their validators and targeted mechanics tests passed, but that is not represented as a mathematical solvability proof.

## Difficulty, variety, and fairness conclusion

No impossible state or malformed difficulty transition was confirmed. All six campaigns retain unique deterministic level definitions. Mechanic boundaries are populated and later bands add higher move requirements, more/stronger obstacles, denser goals, or more resistant dirt without removing the corresponding legal mechanics. The evidence supports functional fairness, but physical-device input feel and a long human playtest remain separate experiential gates.
