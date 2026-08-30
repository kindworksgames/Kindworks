# Stage 6 Repair Report

## Result

**SAFE TO CONTINUE WITH DOCUMENTED USER DECISIONS.**

Both confirmed Stage 6 P2 findings were reproduced, fixed at their presentation/scheduling owners, regression-tested, rebuilt and operated in the live town. No P0–P3 finding remains open. `S6-UDR-001` remains a documented, non-blocking product decision because the latest protected HTML and the older five-pet/freeing text contradict each other.

## Finding resolution

| Finding | Root cause | Correction | Regression test | Runtime proof | Status |
| --- | --- | --- | --- | --- | --- |
| S6-NPC-001 | Simulation correctly snaps every route arrival to its authored graph node, but Town rendered and selected every resident at that same raw coordinate | Added deterministic presentation-only rings for coincident visible residents. Character position, depth, proximity and narrative tap targets share the derived coordinate. Routes and persisted `x,y` remain untouched. | `tests/stage-06-repair.test.js` uses 14 coincident residents to require stable unique positions, at least 19px separation, identical repeat output, zero input mutation, and Town/character wiring. | At 1280×720, a visibly separated pair could be selected independently: the first tap opened Theo and the adjacent tap opened Ella. | **FIXED** |
| S6-ANIMAL-001 | `rareVisitState()` correctly evaluates each authored schedule, but presentation and notifications accepted every active schedule independently | Added shared `activeRareVisitor()`: offline replay first, otherwise earliest active start, then stable ID. World presentation and arrival notices now use the same exclusive winner and hand off when that visit ends. | Exhaustive 840-day/five-minute test observes all five species, reproduces raw concurrency of three, requires exactly one selected visitor, checks wolf→beaver handoff, notice deduplication and valid state. | Normal Animal Friends and town runtime remained stable; the time-compressed overlap/handoff is programmatically verified rather than falsely claimed as 840 days of manual play. | **FIXED** |

## Files changed by this repair

- `src/systems/NpcTownLifeService.js`
- `src/entities/NpcCharacter.js`
- `src/scenes/TownScene.js`
- `src/data/animals.js`
- `src/systems/AnimalService.js`
- `tests/stage-06-repair.test.js`
- Stage 6 QA documentation and the pre-visual-refactor stage register

The pre-existing dirty worktree contains earlier repairs, QA evidence, visual-readiness work and unrelated user changes. Those were preserved and are not attributed to this repair.

## Verification evidence

| Check | Result |
| --- | --- |
| Original findings reproduced | PASS — shared raw NPC nodes and up to three raw rare schedules remain represented by the audit fixtures |
| Stage 6 repair tests | PASS — 3/3 |
| Stage 6 focused rerun | PASS — 146/146 |
| Complete project suite | PASS — 629/629, 0 failed, 0 skipped |
| Production build | PASS — 179 modules transformed |
| Live NPC visual separation | PASS — separated bodies visible in town |
| Live NPC interaction separation | PASS — Theo and Ella opened independently |
| Save schema/migration | UNCHANGED |
| NPC authoritative coordinates/routes | UNCHANGED |
| Rare periods/windows/probability definitions | UNCHANGED |
| Adoption, trust, follower and South Meadow | PASS in focused and complete suites |
| Farming, harvesting, feeding and inventory | PASS in focused and complete suites |

## Save and gameplay protection

NPC spacing is derived on every Town frame and is never written into resident state. Rare arbitration adds no field: the existing stable IDs, `lastRareNoticeKey`, visit counts, offline replay timestamp and schedules remain authoritative. The repair changes neither coins nor rewards, inventory, crops, apple production, relationship/story gates, animal diets/trust, adoption probabilities, follower state, jobs, routes, level data or scene transitions.

## Documented user decision

`S6-UDR-001` remains unresolved by design. The latest HTML explicitly removes the companion limit (`southMeadowCompanionCap:null`) and current Phaser matches it; older protection text asks for a five-pet cap and voluntary freeing. No safe QA repair can choose between those product rules. Current unlimited behaviour is preserved until the user decides.

## Remaining risk

No Stage 6 P0–P3 defect remains open. Physical iOS/Android lifecycle and touch testing remains a later Stage 9/release gate. Universal autonomous NPC walking inside every interior is a documented feature-scope observation, not a regression introduced by this repair.
