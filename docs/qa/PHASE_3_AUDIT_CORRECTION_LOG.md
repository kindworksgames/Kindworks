# Phase 3 audit correction log

## Functional recovery batch 1

| Finding | Original problem | Correction | Save impact | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| KW-XAUD-001 | The owned resident stayed at Meadowlight House unless directly controlled. | Added additive schema-3 autonomy state, the protected HTML hobby destinations and daily schedule, graph movement, needs, relationships, conversations, shopping/community-care counters, and pause/return behavior around direct control. Ordinary residents now retain a reciprocal custom-resident relationship entry. | Existing profiles normalize forward; resident ID, home ID, player location, economy and all other save keys are unchanged. | Custom-resident, advanced-NPC, personal-home and full regression suites. | Corrected |
| KW-XAUD-002 | Boot reopened only four interrupted activities. | Added one activity-recovery owner covering all eleven migrated activities. Boot selects the newest unfinished checkpoint, ignores completed sessions, preserves older conflicting checkpoints, and safely returns to Town if lazy scene loading fails. | Detection is read-only; it does not clear sessions, grant rewards or mutate saves. | Dedicated recovery tests, full regression suite and production build. | Corrected for every service exposing a durable/in-memory active session |

### Protected behavior

- No level counts, reward formulas, prices, balances, ownership, coordinates or completion rules changed.
- Direct resident control remains opt-in and returns the player to the exact saved map position.
- Recovery selection never completes an activity and never grants a reward.
- The unrelated `KindWorks Migration Starter .json` file remains untouched.

### Verification result

- Automated tests: **566 passed, 0 failed**.
- Production build: **passed**, 176 modules transformed.
- Physical-device and final-art gates remain separate Phase 3 work and are not claimed complete by this batch.
