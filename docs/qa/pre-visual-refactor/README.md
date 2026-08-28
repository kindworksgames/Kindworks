# KindWorks Pre-Visual-Refactor QA

This directory is the evidence register for the staged functional QA cycle that must finish before any visual-readiness refactor begins.

## Test contract

- Test the current repository and running Phaser build.
- Use the protected legacy HTML as the parity source where relevant.
- Keep QA findings separate from repairs. A stage report never silently changes production behaviour.
- Preserve save structure, progression, economy, and unrelated work.
- Use exhaustive programmatic checks for generated campaigns and representative runtime checks for player journeys.
- Record confirmed defects, parity gaps, visual-only findings, pre-existing issues, observations, and user decisions separately.
- Do not advance a stage on assumptions or historic claims.

## Stage register

| Stage | System group | QA status | Repair status | Evidence |
| --- | --- | --- | --- | --- |
| 01 | Save integrity, schema migration, persistence, progression, economy, commerce duplicate protection | PASS for browser/runtime contract | No repair required; no confirmed defects | [Stage 01 report](stage-01-save-migration-economy/REPORT.md) |
| 02 | Town, world simulation, time, navigation, and environment | NOT STARTED | Not started | — |
| 03 | NPCs, custom resident, onboarding, narrative, and control hand-off | NOT STARTED | Not started | — |
| 04 | Animals, adoption, companion care, food, following, and aquarium | NOT STARTED | Not started | — |
| 05 | Shops, inventory, equipment, placement, farming, and personal home | NOT STARTED | Not started | — |
| 06 | Cleanup games: Waste, Lawn, River, House, Beach, and Power Wash | NOT STARTED | Not started | — |
| 07 | Venue games: Café, Bakery, Morning Mug, Riverside Kitchen, and South Shore Scoops | NOT STARTED | Not started | — |
| 08 | Fishing, Magnet Fishing, Fresh Market, and Harbour General | NOT STARTED | Not started | — |
| 09 | Cross-system mobile, offline, transition, and release-candidate regression | NOT STARTED | Not started | — |

## Current gate

Stage 01 is complete. No repair prompt is required because no functional defect was confirmed. Stage 02 must begin as a separate QA stage; no Stage 02 testing or repair was included in Stage 01.
