# Stage 8 Save/Recovery Coverage Matrix

| Requirement | Method | Result | Notes |
| --- | --- | --- | --- |
| Previous-stage gate | Read Stage 7 repair report | PASS | `SAFE TO CONTINUE WITH DOCUMENTED USER DECISIONS`; no open P0–P3 |
| Fresh save | Automated + release-candidate fixture | PASS | Valid schema 37, 100 starter coins, first write/readback verified |
| Ordinary save | Repository/service suites | PASS | Current envelope checksum/readback pass |
| Every major scene family | Persistent activity owner inventory + Stage 2 lifecycle + service saves | PASS | Town/world, interiors, shops, cleanup/action, restaurants, fishing, animals/farming all covered |
| Save after rewards | Every first-clear/service suite | PASS | Processed IDs prevent repeat payment |
| Save after purchases | 67 ordinary products, Paws and Harbour suites | PASS | Deduction and delivery remain atomic |
| Save after progression/restoration | Progression/restoration suites | PASS | Unlocks, counters and one-time gifts survive reload |
| Animal/pet changes | Animal/Paws/Stage 6 suites | PASS | Feed, trust, adoption and follower reload |
| Farming/harvesting | Stage 6 + farming suites | PASS | All crops, six beds, trees and one-fruit rule reload |
| Browser refresh | Isolated live preview | PASS | Active Lawn Level 1 resumed at the same board state |
| Close/reopen | Isolated live preview | PASS | New tab resumed the same active checkpoint |
| Interrupted transition/activity | 11-owner recovery matrix + live refresh | PASS | Deterministic resume owner selected |
| Missing top-level/optional fields | Recomputed valid envelope variants | PASS | 25 audited additive omissions normalize and persist without progress loss; S8-REC-001 fixed |
| Malformed field | Validation suites | PASS | Present corrupt required data still fails closed; backup/recovery candidates remain safe |
| Corrupt JSON/checksum | Automated | PASS | Valid backup used, corrupt current quarantined, no duplicated state |
| Partially old Phaser save | Schemas 1–36 | PASS | 36/36 upgraded with sentinels retained |
| Latest legacy save | Sealed v82 fixture | PASS | Imported, validated, persisted and source untouched |
| All legacy versions | v12–82 fixtures | PASS | 71/71 inspect/import/save/reload |
| Reset/new game | Automated + isolated live browser | PASS | Two-step confirmation, cancellation, verified backup, fresh reload and failure rollback; S8-RESET-001 fixed |
| Maximum/boundary values | Completed v82 + schema bounds | PASS | 999,999 coins and 1,500 jobs retained; validators reject illegal boundaries |
| Progress/currency/item duplication | Recovery + rapid-repeat suites | PASS | Backup restore returns exact checkpoint; processed IDs/caps hold |
| NPC/animal duplication | Full simulation, import and reload suites | PASS | Stable identity maps and validators hold |
| Invalid progression combination | Validators and upgrade fixtures | PASS | Rejected before storage write |
| One-time reward repetition | All minigame/gift/onboarding/commerce suites | PASS | First-clear/event/receipt IDs remain idempotent |
| Legacy import storage failure | Stage 8 focused reproduction | PASS | Failed persistence leaves the exact pre-import live state; S8-MIG-001 fixed |
| Reset does not touch real save | Isolated MemoryStorage/Fidelity namespace | PASS | No real save was used |

## Quantified execution

- Stage 8 focused persistence/cross-system run: **169/169 passed**.
- Complete project regression after repair: **641/641 passed**, 0 failed, 0 skipped.
- Phaser schema migration matrix: **37/37** accepted (36 upgrades plus current).
- Protected HTML migration matrix: **71/71** versions inspected, imported, validated, saved and reloaded.
- Production build: **PASS**, 179 modules transformed.
- Performance budget: **PASS**, 19 lazy chunks and 4,827,700 JavaScript bytes.
- Differential HTML parity: **PASS**, 13 activities / 5,850 levels / 19 shared domains / 85 exact rules.
- Minigame parity: **PASS**, 14 games / 75 comparisons / 105,795 level and reward instances.
- Live refresh and close/reopen: **PASS** in isolated browser storage.
