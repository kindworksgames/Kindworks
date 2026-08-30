# Little Bakery — Stage 4 QA

## Result

**PASS AFTER REPAIR.** The audit's one P3 picker-label defect is fixed and verified; gameplay and campaign validation remain green.

## Coverage

- Exhaustive validation: 150/150 levels; 24/24 recipes; 57/57 steps; unique IDs and plans.
- Complete-loop samples: 1, 2, 10, 11, 20, 21, 40, 41, 50, 75, 100, 101, 125, 149, 150.
- Live start/exit samples: 1, 10, 11, 50, 100, 150.
- Live actions: order selection, wrong ingredient rejection, correct preparation sequence, oven working/ready states, customer patience failure, result screen, Replay, and Return.
- Automated tests: service, mobile UX, appliance fidelity, shared presentation, save/reward guards.

## Results

Orders match customer targets; recipes are on-menu and have valid ingredients/stations; wrong steps do not advance; baking/frying/decorating and payload transfer pass; appliances stop and resume safely; completion/reward/save and duplicate prevention pass; later bands increase product length and arrival pressure; final level completes in simulation.

The worker does not use free pathfinding. Presentation moves it between authored prep and station anchors, so furniture traversal is not an available action.

## Finding

`S4-F01` is fixed. Changing the picker now updates `Open for Level <selected>`, starts that same level, and cleans up the listener on scene shutdown. Live Levels 150 and 50 passed across exit/re-entry.
