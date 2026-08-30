# Corner Café — Stage 4 QA

## Result

**PASS.**

## Coverage

- Exhaustive validation: 150/150 levels; 64/64 recipes; 86/88 defined steps used; unique IDs and plans.
- Complete-loop samples: 1, 2, 10, 11, 20, 21, 40, 41, 50, 75, 100, 101, 125, 149, 150.
- Live start/exit samples: 1, 10, 11, 50, 100, 150.
- Live actions: wrong ingredient rejection, Cup → Tea bag → Hot water sequence, working state, premature collection rejection, burn state, and recovery.

## Results

Customer counts equal level targets; all referenced recipes, ingredients, and appliances resolve; wrong actions do not advance; tray/cup/counter and contextual Serve behavior pass; customer departure, replacement, scoring, rewards, retry, exit, and save/reload pass in the focused and complete suites. Difficulty expands menus and simultaneous preparation without generating an impossible order or missing station.

The raw `mushroom` and `pumpkin` definitions are unused in both Phaser and protected HTML; soup-base steps are used instead. This is recorded as an observation, not a migration defect.

The chef uses fixed safe floor/prep/station anchors rather than free walking, so player pathfinding and table traversal are not applicable.

