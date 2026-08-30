# Stage 8 Independent Save Compatibility and Cross-System Re-Test

**Date:** 2026-08-30  
**Branch:** `phase-2-ui-simplification`  
**Starting commit:** `3387bcb`  
**Method:** Fresh inspection and independent assertions; prior repair conclusions were not used as pass evidence.

## Verdict

**STAGE 8 APPROVED.**

Existing saves remain compatible and the functional Phaser game still matches the verified pre-refactor HTML baseline. No test reproduced a reset, duplicate reward, corrupt envelope, changed outcome, altered progression value, or visual-to-gameplay state leak.

## Independent save matrix

| State/failure case | Result | State comparison |
| --- | --- | --- |
| Fresh schema-37 save | PASS | Exact state and SHA-256 digest retained after registry replacement, layout movement and repository reconstruction |
| Mid-progress schema-37 save | PASS | Exact state retained, including coins, inventory, NPC/pet, farming, restoration and level progress |
| Completed legacy v82 save | PASS | Exact imported state retained; original HTML source payload remained byte-identical |
| New-player legacy v12 | PASS | Imported, saved, visually substituted and reloaded without state differences |
| Mid-progress legacy v38 | PASS | Imported, saved, visually substituted and reloaded without state differences |
| Farming legacy v60 | PASS | Imported, saved, visually substituted and reloaded without state differences |
| Late-game legacy v75 | PASS | Imported, saved, visually substituted and reloaded without state differences |
| Current legacy v82 | PASS | Imported, saved, visually substituted and reloaded without state differences |
| Missing optional semantic asset | PASS | Production fallback recorded; raw healthy envelope unchanged |
| Failed required Phaser image | PASS | Stable-key fallback created; raw healthy envelope unchanged |
| Failed gameplay-critical Canvas image | PASS | Load rejected as gameplay-critical; raw healthy envelope unchanged |
| Different replacement canvas/dimensions/origin | PASS | Semantic texture identity resolved without storage access or gameplay-state change |
| Layout-only visual movement | PASS | Cloned visual layout changed; source layout and persisted state remained unchanged |
| Completed content/reward history | PASS | Coins, ledger, completed jobs and every minigame progress/result object remained exactly equal |

## Compatibility breadth

- Phaser save schemas **1–37**: PASS through the existing exhaustive migration suite.
- Protected legacy HTML save versions **12–82**: PASS through inspection, import, save and reload.
- Corrupt-current recovery: PASS using the last verified backup without item/currency duplication.
- Missing additive fields: PASS through safe normalization without hiding invalid required state.
- Reset/new game: PASS with confirmation, verified backup, and failed-write rollback.
- Legacy source keys: PASS; the importer never overwrote or deleted the original HTML save.

## Cross-system state checked

Exact full-state equality and the complete regression suite covered:

- identity, town, player and scene position;
- progression, unlocks, level selection and completion records;
- coins, ledger, rewards and duplicate-payment guards;
- inventory, equipment, placed town objects and home furniture;
- NPC identities, locations, routes, relationships, stories and gifts;
- animals, friendship, adoption and active follower;
- crops, apple trees, growth and harvest state;
- cleanliness, lawns, river rubbish and restoration milestones;
- day, time, weather and offline advancement;
- Lawn Care, River Clear-Out, Waste Collection, House Rescue, Beach Cleanup and Power Wash;
- Fishing, Magnet Fishing, Corner Café, Little Bakery, Morning Mug, Riverside Kitchen, South Shore Scoops and Harbour General;
- onboarding, tutorials and mobile input contracts.

## Pre-refactor functional baseline

| Gate | Result |
| --- | --- |
| Protected HTML SHA-256 | `0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5` |
| Differential parity | PASS — 13 activities, 5,850 levels, 19 shared domains, 85 exact rules |
| Minigame parity | PASS — 14 game families, 75 comparisons, 105,795 level/seeded instances |
| Complete automated regression | PASS — 804/804 tests |
| Production build | PASS — 201 modules plus all post-build validators |
| Production development-tool exclusion | PASS — 35 development markers absent |

## Findings

No P0, P1, P2 or P3 save-compatibility or cross-system regression was found.

The build continues to report two separate visual-production facts that do not invalidate Stage 8:

1. The protected Fishing reference and current runtime background intentionally have duplicate bytes.
2. The visual source fingerprint changed, so the live visual-comparison gate is still required for appearance approval.

Phase 8B production artwork is not yet present (0/22 approved slice assets). That blocks later art-bible production execution, not current save compatibility.

## Evidence added

- `tests/visual-refactor-save-compatibility-independent-retest.test.js`

The independent test contributes four new matrix tests and is included automatically in `pnpm test`. No production gameplay, persistence, migration, economy, progression, or visual code was changed.
