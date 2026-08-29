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
| 01 | Authoritative baseline, complete inventory, and protected HTML-to-Phaser parity | AUDIT COMPLETE — CONDITIONAL PASS; 0 P0/P1/P2, 1 P3 identified | REPAIR VERIFIED — F-01 fixed; stale autonomy status corrected; 611/611 tests and both parity validators pass | [Baseline report](stage-01-authoritative-baseline-parity/REPORT.md), [repair report](stage-01-authoritative-baseline-parity/REPAIR_REPORT.md), [inventory](stage-01-authoritative-baseline-parity/GAME_INVENTORY.md), [parity matrix](stage-01-authoritative-baseline-parity/HTML_PHASER_PARITY_MATRIX.md) |
| 01A | Supplemental save integrity, schema migration, persistence, progression, economy, and duplicate protection gate | PASS for browser/runtime contract | No repair required in that focused gate | [Save/economy report](stage-01-save-migration-economy/REPORT.md) |
| 02 | Town, world simulation, time, navigation, and environment | NOT STARTED | Not started | — |
| 03 | NPCs, custom resident, onboarding, narrative, and control hand-off | NOT STARTED | Not started | — |
| 04 | Animals, adoption, companion care, food, following, and aquarium | NOT STARTED | Not started | — |
| 05 | Shops, inventory, equipment, placement, farming, and personal home | NOT STARTED | Not started | — |
| 06 | Cleanup games: Waste, Lawn, River, House, Beach, and Power Wash | NOT STARTED | Not started | — |
| 07 | Venue games: Café, Bakery, Morning Mug, Riverside Kitchen, and South Shore Scoops | NOT STARTED | Not started | — |
| 08 | Fishing, Magnet Fishing, Fresh Market, and Harbour General | NOT STARTED | Not started | — |
| 09 | Cross-system mobile, offline, transition, and release-candidate regression | NOT STARTED | Not started | — |

## Current gate

The authoritative Stage 01 repair is complete. Beach Cleanup's hidden exit confirmation is fixed and verified, and the stale owned-resident P1 wording is corrected without rewriting its historical context. There are no open confirmed P0, P1, P2 or P3 functional defects from Stage 01. Visual-art fidelity, physical-device touch/pinch, native packaging and external billing remain explicitly documented gates or user decisions; they were not altered by this repair.
