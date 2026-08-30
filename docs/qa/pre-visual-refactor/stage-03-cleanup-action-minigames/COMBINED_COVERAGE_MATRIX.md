# Stage 3 Combined Coverage Matrix

Legend: `PASS-L` live operation; `PASS-A` automated/service test; `PASS-E` exhaustive programmatic validation; `PARTIAL` evidence exists but the requested path was not completely operated live in this stage; `N/A` the game has no such concept.

| Game/mode | World entry | Direct entry | Controls and illegal input | Resource/turn rules | Undo/restart | Pause/exit/return | Success/failure/retry | Reward and duplicate guard | Save/reload | Touch/layout | Level/data |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Lawn Care | PARTIAL | PASS-L | PASS-L/A | PASS-A | PASS-L/A | PASS-A | PASS-A | PASS-A | PASS-A | PASS-L/A | PASS-E |
| River Clear-Out | PARTIAL | PASS-L | PASS-L/A | PASS-L/A | PASS-L/A | PASS-A | PASS-L/A | PASS-A | PASS-A | PASS-L/A | PASS-E; representative solver |
| Waste campaign | PARTIAL | PASS-L | PASS-L/A | PASS-A | PASS-A | PASS-A | PASS-A | PASS-A | PASS-A | PASS-L/A | PASS-E |
| Authored Waste town job | PASS-A | N/A | PASS-A | PASS-A | N/A | PASS-A | PASS-A | PASS-A | PASS-A | PASS-A | one exact six-item snapshot |
| House Rescue sorting | PARTIAL | PASS-L | PASS-L/A | PASS-A | PARTIAL | PASS-A | PASS-A | PASS-A | PASS-A | PASS-L/A | PASS-E |
| House Rescue vacuuming | PARTIAL | PASS-L | PASS-L/A | PASS-A | N/A | PASS-A | PASS-A | PASS-A | PASS-A | PASS-L/A | PASS-E |
| Fishing | PASS-A | PASS-L | PASS-L/A | PASS-L/A | N/A | PASS-L/A | PASS-A | PASS-A | PASS-A | PASS-L/A | PASS-E |
| Magnet Fishing | PASS-A | PASS-L | PASS-L/A | PASS-L/A | N/A | PASS-L/A | PASS-A | PASS-A | PASS-A | PASS-L/A | PASS-E |
| Beach Cleanup | PARTIAL | PASS-L | PASS-L/A | PASS-A | PASS-L/A | PASS-A | PASS-A | PASS-A | PASS-A | PASS-L/A | PASS-E |
| Playground Power Wash | PASS-A | PASS-L | PASS-L/A | PASS-L/A | N/A | PASS-L/A | PASS-L/A | PASS-L/A | PASS-A | PASS-L/A | PASS-E |

## Cross-cutting checks

| Check | Result |
| --- | --- |
| Tutorial/onboarding | Lawn, Waste, and River tutorial flags and first-job flow pass automation; other games use contextual instructions rather than a separate mandatory tutorial. |
| Rapid repeated input | Waste accepted two different exposed cards without duplication; Fishing and Magnet disabled Cast during animation; scene engines reject stale/illegal actions. |
| Input during animation | Fishing and Magnet live controls disabled; River and movement batching covered by automated gesture/engine tests. |
| Collision/targeting | Lawn hedge stops, House vacuum geometry, Power Wash masks, Fishing water targeting, and waste exposure rules pass automated tests; House vacuum collision worked live. |
| Return location | All services persist bounded return positions; Fishing and Magnet returned live to Willow Commons; Power Wash safe exit returned live to Town. |
| Console/runtime errors | 0 errors, 0 warnings after representative operation. |
| Complete playfield | PASS at the tested emulated profiles. The House closed-state transition may extend one invisible pixel; the player-visible open bins end at y=709 in 1280×720. |

## Exact manual/runtime boundary

The `PARTIAL` world-entry cells mean the stage used deterministic direct entry for broad level sampling and did not repeat every ordinary town doorway/job selection that Stage 2 had already covered. They are coverage boundaries, not confirmed broken entrances.
