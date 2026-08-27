# Phase 3 Legacy Fidelity Recovery

Status: **IN PROGRESS — not eligible for PASS**  
Working branch: `phase-3-legacy-fidelity-recovery`  
Protected starting commit: `e441669`  
Legacy source: `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`  
Legacy SHA-256: `0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5`

## Fidelity rule

The legacy HTML is the presentation and interaction ground truth. Phase 1 parity is the protected functional contract for saves, rewards, progression, inventory, ownership, story, farming, level data, and town integration. A Phaser feature is not considered recovered merely because a similarly named service exists; the visible behavior must be operated and compared.

Accepted final classifications are:

- `EXACT`: same rule, interaction, timing, state transition, and presentation.
- `ADAPTED-APPROVED`: an intentional mobile/Phaser adaptation with equivalent player meaning and explicit approval.
- `NOT-APPLICABLE`: legacy code was unreachable, disabled, or deliberately superseded.

`PARTIAL`, `MISSING`, and `UNVERIFIED` remain open.

## Baseline protection

| Check | Result |
| --- | --- |
| Starting branch/commit | `phase-3-legacy-fidelity-recovery` from `e441669` |
| Existing automated suite | 506/506 passing before Phase 3 edits |
| Production build | PASS |
| Differential parity | PASS: 13 activities, 5,850 levels, 19 shared domains, 85 exact probes |
| Isolated QA storage | `kindworks:phase-3-fidelity:`; production and legacy keys are not mutated |
| Required viewport contract | 568×320, 667×375, 736×414, 812×375, 844×390, 1024×768, 1180×820, 1280×720, 1366×768, 390×844 portrait |

Baseline evidence:

- `phase3-evidence/baseline/phaser-town-1280x720-before.png`
- `phase3-evidence/baseline/legacy-town-1280x720-setup-complete.png`

## Verified recovery batches

| ID | System | Original problem | Recovery | Evidence and regression result | Status |
| --- | --- | --- | --- | --- | --- |
| FID-001 | QA protection | There was no deterministic way to open every migrated activity without modifying the real save. | Added an immutable source contract, all required viewports, representative boundary levels, isolated storage, replay/snapshot APIs, and a browser-operable development-only activity panel. | `tests/fidelity-contract.test.js`; focused tests and production build pass. | VERIFIED |
| FID-002 | Fishing | The Phaser water canvas only cast. Legacy canvas taps also produced an early miss, reeled a bite, and pulled a settled magnet. Legacy bite/catch haptics were absent. | Restored canvas primary-action semantics, explicit waiting phase, early-miss rule, tap-to-reel/pull, and legacy haptic patterns. No catch table, inventory, aquarium, cast limit, or reward rule changed. | Operated at 1280×720: early tap produced the saved early miss; bite tap produced exactly one catch. Fishing service and mobile UX tests pass. | VERIFIED at 1280×720; phone/tablet evidence pending |
| FID-003 | Power Washing simulation | Same-cell suppression prevented stationary multi-pass cleaning; pointer gaps were not interpolated; drain varied by event rate; supplies recovered only by switching tools. | Added elapsed-time spray segments, continuous stationary application, pointer-path interpolation, and legacy idle recovery for water and soap. | Level 750 engine tests prove repeated stationary progress, interpolated path coverage, and exact 1-second regeneration. Browser clicks create valid strokes. | VERIFIED functionally |
| FID-004 | Power Washing approved art | Phaser displayed crude geometric playground approximations and a 2:1 board instead of the approved legacy playground. | Extracted the exact embedded master and transparent dirt reference, verified both hashes, restored the 1536×1024/3:2 canvas, used the exact 1428×706 wash region, and removed the geometric board renderer. | Live browser screenshot: `phase3-evidence/powerwash/powerwash-approved-art-washing-after.jpg`. Asset hashes and build tests pass. | VERIFIED artwork source/composition; pixel-mask recovery still open |

## Power Washing protected asset provenance

| Asset | File | SHA-256 | Size |
| --- | --- | --- | ---: |
| Approved clean master | `public/assets/powerwash/playground-master.png` | `0679fe2c14f28b750f61415641b73e6d17d1f35cbaadfc1a470a011d3cdd0f24` | 2,561,213 bytes |
| Approved transparent dirt reference | `public/assets/powerwash/playground-reference-dirt.png` | `5db4c213d34d1e435f74f03a49590f766e172f01d8ac97703dc090ded7d36736` | 1,998,003 bytes |

`scripts/extract-powerwash-assets.mjs` regenerates these files only from the protected embedded payload and fails if either hash changes.

## Confirmed remaining fidelity ledger

### P0 — must be recovered before Phase 3 can pass

| ID | System | Confirmed difference | Required recovery |
| --- | --- | --- | --- |
| PWR-PIXEL-01 | Power Washing | Dirt state and completion are still represented by 48×24 cells. Legacy uses continuous dirt, resistant, soap, foam, and wet pixel canvases and alpha-sample completion. | Replace cell-mask rendering and percentage with the protected continuous mask pipeline while retaining save/reward compatibility. |
| PWR-FEEL-02 | Power Washing | Wand, hose, spray beam, mist, wet fade, foam, and `SOAP FIRST` feedback are simplified. | Port the legacy procedural feedback and pointer-following wand against the restored master. |
| BAK-MODEL-01 | Little Bakery | Legacy runs three simultaneous trays/customers with independent appliances and scheduled arrivals. Phaser has one sequential order/recipe/step/patience state. | Recover the concurrent three-tray shift model without changing 150-level rewards or unlocks. |
| HRS-GEOM-01 | House Rescue | Legacy vacuuming uses actual house floor geometry, partitions, furniture, obstacles, reachable floor, and collision-safe movement. Phaser uses normalized grids and rectangular stains. | Port authored floor geometry and collision-safe vacuum coverage. |

### P1 — functional or interaction fidelity

| ID | System | Confirmed difference |
| --- | --- | --- |
| RIV-HINT-01 | River Clear-Out | Progressive Hint 1/2/3 disclosure and 3/2/1-star cap are not wired through the Phaser service/UI. |
| RIV-UNDO-02 | River Clear-Out | Legacy can Undo the last placement from the result screen and resume the same board. Phaser currently rejects finished-session Undo. |
| BCH-UNDO-01 | Beach Cleanup | Legacy Undo reverses an entire held/swiped continuous run; Phaser reverses one tile. |
| LWN-END-01 | Lawn Care | Automatic dead-end detection and the distinct dead-end/out-of-gas result are missing. |
| LWN-ROUTE-02 | Lawn Care | Legacy checks route solvability after moves; Phaser only solves when Hint is pressed. |
| LWN-MOTION-03 | Lawn Care | 55 ms cell travel, queued input, weed slowdown/strain, upgrades, and directional cut stripes are missing. |
| WST-INPUT-01 | Waste Collection | Legacy recenters/scales the active card bounds and provides a coarse-pointer hit layer; Phaser pins cards to original positions. |
| COOK-WORKER-01 | Café/Bakery/Morning Mug/Riverside | Legacy worker walks, carries food, loads/unloads individual appliances, and has per-customer visuals. Phaser uses stationary placeholders and aggregate/transient state. |
| MUG-BURN-01 | Morning Mug | Burn windows exist in data, but the Phaser scene does not visibly enter the burnt state. |
| KIT-SAVE-01 | Riverside Kitchen | Scene-only appliance working/ready/burnt phase is not serialized, so reload loses the transient station state. |

### P2 — presentation, animation, and game-feel fidelity

| Area | Confirmed missing/simplified presentation |
| --- | --- |
| Town | Mill Walk path, selected-object outline, authored buildings/props, debris/stains, ducks/wakes, localized weather/night lighting, and per-job before/after restoration reveal. |
| NPCs | Role/activity props, fishing/watering/disposal/eating/helping poses, hair/accessories, weather clothing, sitting/waving/blink/smile/blush/eye tracking, and resident portraits. |
| Animals | Species anatomy, poses, identity portraits, and full habitat behavior presentation. |
| Farming/homes | Crop growth stages, orchard apple load/picked state/crates, five architecture kits, authored furniture, time-aware occupants, animal occupants, night lighting, and homeowner portrait. |
| Shops | Venue-specific interiors, shelves, staff, merchandise, and item artwork are placeholders. |
| Lawn | Garden boundary/flowerbeds/shrubs, mower identity, clippings/wheels/audio/haptics, directional cut evidence, and result personality. |
| River | Authored rubbish silhouettes/preview, held-button repeat, wave/cascade/gravity/final-flush effects, sound/haptics, and grade-specific result flow. |
| Waste | 40 authored rubbish assets, park detail, cleanliness progression, seven-slot/future-capacity affordance, card flight/triple burst, and transition lock. |
| Beach | Authored sand/world/player/rake visuals, synchronized groove reveal, walk cycle, collection flight, sounds, and completion celebration. |
| Fishing | Legacy rod/float/ripple/curved-line animation remains simplified after the interaction repair. |
| Scoops | Procedural SVG finished products and the customer departure animation are simplified/missing. |
| Interiors | Residents and animals are static icons; furniture is generic rectangles/emoji. |

## Intentional adaptations that must not be casually reverted

- Reduced Town HUD and shared mobile UI components from Phase 2.
- Phaser’s contextual proximity labels where they do not cover interactions.
- Privacy-gated Impact media loading.
- Phaser’s permanent town restoration transformations.
- Contextual first-session onboarding.
- River Clear-Out portrait orientation; every other activity remains landscape.
- No advertisement behavior should be restored without a separate product decision.

## Runtime-only verification still required

- Every required phone/tablet landscape viewport and the portrait rotate state.
- Orientation pause/resume without timer loss, state loss, duplicated rewards, or restarts.
- Success, failure, restart, exit, town return, reload, offline recovery, and interrupted-session recovery for every activity.
- Exact save/reward atomicity and normal town entrance/return positions.
- Long-session world clock, seasons, weather, farming, NPC schedules, and animal habitat behavior.
- Small-phone touch geometry, clipping, focus order, reduced motion, contrast, and announcements.

The in-app browser’s viewport override did not apply during the first batch and continued reporting 1280×720. Those phone/tablet checks are therefore recorded as **UNVERIFIED**, not passed.

## Next implementation order

1. Complete the Power Washing continuous pixel-mask, completion-percentage, wand, spray, foam, and wetness recovery against the restored approved artwork.
2. Recover Little Bakery’s three simultaneous trays/customers.
3. Recover House Rescue floor geometry and collision-safe vacuuming.
4. Restore River Hint tiers/star caps and result Undo.
5. Restore Beach continuous-run Undo.
6. Restore Lawn dead-end/route feedback, timed movement, weed resistance, and directional stripes.
7. Recover shared cooking worker/appliance state, then Café, Morning Mug, Riverside Kitchen, and Scoops presentation.
8. Recover Town/world/NPC/animal/farm/home/shop visual state dictionaries.
9. Run the complete device, orientation, transition, save, reward, and accessibility matrix before a Phase 3 verdict.

## Verdict

**PHASE 3: IN PROGRESS.** The protected gameplay data remains intact, the Power Washing approved art is restored, and the first high-confidence interaction/simulation defects are repaired. Phase 3 cannot pass until the remaining P0/P1 gaps and the full runtime matrix are complete.
