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

## Fidelity recovery batch 2

| Finding | Original problem | Correction | Save impact | Verification | Status |
| --- | --- | --- | --- | --- | --- |
| KW-XAUD-003 | The Phaser Reedbank scene did not reproduce the protected HTML rod-and-line motion over the approved environment. | Extracted the exact protected Reedbank WebP and restored the live rigid rod, reel, cast arc, bobber, line, bite motion, lift/reel motion and result position above it. The environment image no longer substitutes for gameplay. | None. The five-cast limit, hidden zones, catches, aquarium routing, inventory and rewards are unchanged. | Fishing service/mobile tests, exact asset hash test, production build and full regression suite. | Corrected in code; final browser re-check pending because local preview access was blocked after the implementation. |
| KW-XAUD-004 | The baked Magnet Fishing reference image was being used as a complete scene even though it already contained a fixed magnet and rope. | Restored the HTML v49 rule: the baked image is retained only as protected comparison evidence. Production Magnet Fishing now draws a live river/bridge layer, rope, cast arc, sinking, settling, riverbed contact, pull and result feedback. Added the original separate magnet-water targeting region and separately generated hidden recovery zones. | Existing progress normalizes unchanged. Cast accounting, pity counters, river cleanup, ledger entries and rewards are unchanged. | Magnet service/mobile tests, exact asset hash test, production build and full regression suite. | Corrected in code; final browser re-check pending because local preview access was blocked after the implementation. |
| KW-XAUD-005 | Harbour General's recovered interior could have become a flat screenshot. | Kept the exact protected interior as the environmental layer while retaining six live display hit areas, product selection, stock quantities, player movement, collisions, till interaction and exit above it. | None. Ownership, stock, prices, sales, wardrobes and till state are unchanged. | Harbour General tests, exact asset hash test, production build and full regression suite. | Corrected; browser visual re-check pending. |
| KW-XAUD-006 | The Phaser resident creator placed appearance, hobbies and house design on one crowded form, unlike the protected staged HTML flow. | Split the same saved form into three focused pages: Appearance, Hobbies and Your house. Added progress, Back/Next navigation, step-specific previews, focus handling and final-step-only creation/save controls. All original choices remain present. | None. The same atomic profile/home save and existing schema are used. | Dedicated creator UX tests, custom-resident service tests, production build and full regression suite. | Corrected |
| KW-XAUD-007 | A long QA run produced an out-of-memory `DataCloneError` because Town requested complete NPC diagnostics, including repeated full-save clones, every rendered frame. | Town now refreshes and caches diagnostic-only DOM telemetry at a bounded 250 ms cadence. NPC diagnostics take one shared-save snapshot per refresh instead of repeatedly cloning it for individual fields. | None. Diagnostics are read-only and no simulation timing or NPC behavior changed. | Dedicated clone-count/cadence test and full regression suite. | Corrected |

### Fidelity rules retained

- Recovered reference art may provide an environment, but it may not replace interactive objects or state-driven animation.
- The Magnet Fishing WebP is deliberately not loaded by the production scene because the protected HTML also rejected it as a live renderer.
- Every live fishing, magnet and Harbour element has a stable Sprite AI label so future authored assets can replace the temporary procedural layer without changing gameplay.
- No level counts, rewards, balances, prices, ownership, progression or save keys changed.

### Verification result

- Focused regression tests: **48 passed, 0 failed**.
- Full automated suite: **571 passed, 0 failed**.
- Production build: **passed**, 176 modules transformed.
- Performance budget: **passed**.
- Browser verification completed before the final animation correction at 568×320, 844×390, 1024×768 and 1280×720. The permitted local preview connection then rejected further access, so final after-change screenshots remain an explicit pending evidence gate rather than being claimed complete.
