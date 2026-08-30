# Stage 6 NPC and Narrative Report

## Inventory

- 35 stable resident IDs and unique names.
- 19 authored homes.
- 133 navigation nodes and 138 bidirectional links.
- 67 persistent relationship pairs.
- Four narrative chapters for every resident plus 19 household stories.

## Coverage matrix

| Requirement | Status | Evidence |
| --- | --- | --- |
| Spawning and unique identity | PASS | Fresh-state catalogue contains every ID exactly once; schema validation passes |
| House ownership | PASS | Every resident home references one of 19 authored homes; shared households are intentional |
| Enter/exit homes and venues | PASS | Residents route to authored destination nodes, transition between exterior-visible and interior-hidden state, and return to the graph |
| Routes and movement frequency | PASS | Every home/work/preferred destination is graph-reachable; full-day deterministic schedule tests pass |
| Pathfinding across roads/bridges and around water/buildings | PASS | Navigation is constrained to the validated authored graph; all links are bidirectional and destinations reachable |
| Local obstacle avoidance between residents | PASS AFTER REPAIR | Coincident residents receive deterministic visual slots; saved graph coordinates and routes remain unchanged |
| Counters, tables and preparation stations | OUT OF NPC-TOWN SCOPE | Autonomous residents stop at venue nodes; restaurant customer/worker path and station logic was covered in Stage 4 |
| Dirty/clean town response | PASS | Environment/restoration state drives bounded resident care, business activity and litter behaviour |
| Littering and tipped-bin behaviour | PASS | Exact persistent litter/bin mutations, cleanup and transaction rollback tests pass |
| Contextual thoughts | PASS | Deterministic selection, deliberate save, no immediate repeat and restored-location references pass |
| Story progression | PASS | All 35 four-stage arcs validate; gates use durable conversations, days, routines, jobs, relationships and restoration evidence |
| Relationships | PASS | Symmetric bounded scores and mutual conversations pass |
| Locate NPC | PASS WITH SCOPE NOTE | Player-owned resident locate/control/return flow passes; this matches the latest HTML's custom-resident Locate action |
| Scene transitions and save/load | PASS | Town/home/venue state and narrative evidence survive repository reload |
| Simultaneous NPC stress | PASS AFTER REPAIR | The original stress fixture still reproduces shared simulation nodes, while every rendered position is unique and selectable |
| Missing, duplicated or trapped residents | PASS | No missing ID, duplicate ID, unreachable destination or invalid terminal phase found |

## Confirmed crowding evidence

The deterministic stress probe sampled every minute for seven full game days: 10,080 world snapshots. It counted 75,865 resident-pair samples at exactly identical coordinates and 76,993 within the near-overlap radius. Peak near-overlap was 38 resident pairs in one snapshot.

High-duration examples included:

- Finn and Leo at `dock`: 735 minutes/day;
- Ella and Lily at `square`: 504 minutes/day;
- Ben and Max at `mill`: 479 minutes/day;
- Ella and Theo at `square`: 466 minutes/day;
- Ivy and Lily at `square`: 461 minutes/day;
- Arthur and Louis at `high4`: 440 minutes/day.

Root cause is visible in `NpcTownLifeService.moveResident()`: every arrival assigns the exact graph node `x` and `y`; there is no node occupancy, deterministic resident offset, personal-space radius, or local collision response.

The repair intentionally leaves those authoritative route coordinates untouched. `npcPresentationPositions()` groups only visible residents with coincident simulation coordinates and assigns deterministic rings around that point. `TownScene` uses the same derived point for sprite placement, depth, proximity feedback, browsing selection and interaction hit targets. The 14-resident regression fixture proves uniqueness, deterministic output, minimum spacing and zero mutation of the supplied resident records. In live 1280×720 testing, adjacent separated targets opened Theo and Ella independently.

## Live narrative evidence

At 1280×720, Town menu → Stories exposed all 35 residents. Maya began at chapter 1 with conversation evidence 0/2. One deliberate `Talk with this resident` action produced a saved home thought and 1/2 evidence. Reload retained 1/2. Ordinary map simulation continued while not paused and paused correctly while the modal was open.

## Coverage limitations

- No physical iOS/Android device was available.
- The stress test is deterministic simulation, not seven real-time days of manual observation.
- Final artwork collision silhouettes are not available; structural graph safety is certified, sprite-specific visual clearance is not.
