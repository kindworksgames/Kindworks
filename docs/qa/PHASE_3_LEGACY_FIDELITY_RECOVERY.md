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
| FID-004 | Power Washing approved art | Phaser displayed crude geometric playground approximations and a 2:1 board instead of the approved legacy playground. | Extracted the exact embedded master and transparent dirt reference, verified both hashes, restored the 1536×1024/3:2 canvas, used the exact 1428×706 wash region, and removed the geometric board renderer. | Live browser screenshot: `phase3-evidence/powerwash/powerwash-approved-art-washing-after.jpg`. Asset hashes and build tests pass. | VERIFIED artwork source/composition |
| FID-005 | Power Washing pixel presentation | Phaser clipped dirt through 48×24 rectangles and omitted the legacy wand, radial wash, procedural dirt, resistant-stain layer, foam, wetness, mist, and alpha-sampled completion. | Ported the protected full-resolution layered renderer. Runtime completion now defers the grid engine and is awarded only when the approved pixel mask reaches 97%. The protected progression/reward transaction remains the sole completion writer. | Operated at 1280×720: continuous diagonal wash revealed the clean master without blocks; soap produced clipped foam; water removed the treated resistant stain; the wand followed the pointer; console contained no errors. Evidence: `powerwash-full-resolution-dirty.jpg`, `powerwash-full-resolution-soap.jpg`, `powerwash-full-resolution-rinse.jpg`. Fourteen focused tests and production build pass. | VERIFIED at 1280×720; device matrix and exact interrupted visual checkpoint pending |
| FID-006 | Little Bakery concurrent shift | Phaser reduced the legacy shift to one sequential customer and one shared preparation state, removing the three simultaneous orders, scheduled arrivals, independent patience, and independent trays. | Recovered the three-customer queue and three preparation trays. Every tray now owns its order, recipe index, completed dishes, step progress, and appliance wait state; arrivals occur at the authored times and every active customer loses patience independently. The 150-level campaign, no-miss completion rule, first-clear rewards, saves, unlocks, and return flow are unchanged. | Eighteen focused tests prove scheduled arrivals, three occupied trays, isolated tray progress, concurrent patience, partial service, completion, replay, failure, cancellation, and save rollback. Operated at 1280×720 through the isolated QA route: three customers were visible together and one step on Prep 2 left Prep 1 and Prep 3 untouched. Evidence: `phase3-evidence/bakery/bakery-independent-trays.jpg`. | VERIFIED functionally at 1280×720; authored worker/customer artwork and device matrix pending |
| FID-007 | Restaurant visual presentation | All five Phaser restaurant scenes used flat room bands, aggregate emoji, compact token products, and a large overlay instead of the protected top-down venue presentation. | Added a shared labelled Phaser presentation foundation; restored the protected dining/counter/kitchen proportions, six places, individual pixel customers, order bubbles, tickets, three physical prep spaces, venue appliances/fixtures, visible workers and payload movement. Scoops now composes containers, flavours, sauces, toppings, drinks and lollies as procedural picture art. Active DOM controls are compact top/bottom rails. | Operated all five venues at 1280×720 and 568×320. Full landscape matrix passed at nine sizes with no document overflow and 44-pixel touch controls. Every venue also passed 844×390, 1024×768 and 1280×720. Portrait 390×844 showed the rotate state and resumed the exact Morning Mug scene/level/phase/served count. Evidence and baseline pairs: `phase3-evidence/restaurants/`. | VERIFIED ADAPTED PARITY; final labelled Sprite AI replacements remain production art |
| FID-008 | Restaurant appliance and departure runtime | Café, Morning Mug and Riverside Kitchen used one scene-only timer, so appliances could not independently own trays; Morning Mug never burnt; Riverside reload discarded a cooking station; and Scoops removed a served customer immediately. | Moved appliance ownership, cooking, ready and burn timers into the real service session. Different physical stations now run independently for their own trays; Undo/discard cancels only the selected tray's station; Morning Mug and Riverside persist exact remaining timers and burnt state; older saves gain safe idle station maps. Scoops now freezes service input, animates the served customer out for 280 ms, then advances at the protected 360 ms boundary. | Four dedicated runtime tests cover concurrent Café stations, Morning Mug cooking reload and burn clearing, Riverside exact-heat reload and collection, and additive old-save normalization. Twenty focused service/presentation/mobile tests pass. The complete automated suite passes 526/526 and the production build passes. Final browser regression at 568×320 and 1024×768 found no document overflow; portrait 390×844 hid gameplay and landscape resume restored the exact Morning Mug presentation; the console was clean. | VERIFIED FUNCTIONAL PARITY |

## Power Washing protected asset provenance

| Asset | File | SHA-256 | Size |
| --- | --- | --- | ---: |
| Approved clean master | `public/assets/powerwash/playground-master.png` | `0679fe2c14f28b750f61415641b73e6d17d1f35cbaadfc1a470a011d3cdd0f24` | 2,561,213 bytes |
| Approved transparent dirt reference | `public/assets/powerwash/playground-reference-dirt.png` | `5db4c213d34d1e435f74f03a49590f766e172f01d8ac97703dc090ded7d36736` | 1,998,003 bytes |

`scripts/extract-powerwash-assets.mjs` regenerates these files only from the protected embedded payload and fails if either hash changes.

## Restaurant visual fidelity review

Direct operation of all five restaurant games at 1280×720 originally confirmed that their Phaser rooms did not reproduce the protected HTML presentation. The comparison evidence, recovery, asset labels, viewport matrix, and final verdict are recorded in `docs/qa/PHASE_3_RESTAURANT_VISUAL_FIDELITY_REVIEW.md`.

Restaurant code-driven fidelity now **PASSES as a VERIFIED ADAPTED mobile presentation**. The protected composition and player-facing state are restored in Phaser, every procedural visual family is labelled for final Sprite AI replacement, and the protected appliance ownership/timing and Scoops departure contracts are durable runtime behaviour.

## Confirmed remaining fidelity ledger

### P0 — must be recovered before Phase 3 can pass

| ID | System | Confirmed difference | Required recovery |
| --- | --- | --- | --- |
| HRS-GEOM-01 | House Rescue | Legacy vacuuming uses actual house floor geometry, partitions, furniture, obstacles, reachable floor, and collision-safe movement. Phaser uses normalized grids and rectangular stains. | Port authored floor geometry and collision-safe vacuum coverage. |

### P1 — functional or interaction fidelity

| ID | System | Confirmed difference |
| --- | --- | --- |
| PWR-SAVE-03 | Power Washing | A reloaded in-progress attempt safely preserves its validated grid/tool/supplies/return state, but the full-resolution visual mask is reconstructed from that grid rather than an exact saved pixel-path checkpoint. |
| RIV-HINT-01 | River Clear-Out | Progressive Hint 1/2/3 disclosure and 3/2/1-star cap are not wired through the Phaser service/UI. |
| RIV-UNDO-02 | River Clear-Out | Legacy can Undo the last placement from the result screen and resume the same board. Phaser currently rejects finished-session Undo. |
| BCH-UNDO-01 | Beach Cleanup | Legacy Undo reverses an entire held/swiped continuous run; Phaser reverses one tile. |
| LWN-END-01 | Lawn Care | Automatic dead-end detection and the distinct dead-end/out-of-gas result are missing. |
| LWN-ROUTE-02 | Lawn Care | Legacy checks route solvability after moves; Phaser only solves when Hint is pressed. |
| LWN-MOTION-03 | Lawn Care | 55 ms cell travel, queued input, weed slowdown/strain, upgrades, and directional cut stripes are missing. |
| WST-INPUT-01 | Waste Collection | Legacy recenters/scales the active card bounds and provides a coarse-pointer hit layer; Phaser pins cards to original positions. |

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
| Scoops | Procedural finished products, picture orders, numbered stations, tray art and the protected customer departure timing are restored. Final Sprite AI art remains a labelled production replacement. |
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

1. Recover House Rescue floor geometry and collision-safe vacuuming.
2. Restore River Hint tiers/star caps and result Undo.
3. Restore Beach continuous-run Undo.
4. Restore Lawn dead-end/route feedback, timed movement, weed resistance, and directional stripes.
5. Recover the exact Power Washing interrupted visual checkpoint without changing its protected save/reward contract.
6. Recover Town/world/NPC/animal/farm/home/shop visual state dictionaries.
7. Run the complete device, orientation, transition, save, reward, and accessibility matrix before a Phase 3 verdict.

## Verdict

**PHASE 3: IN PROGRESS.** The protected gameplay data remains intact; Power Washing’s approved art and full-resolution active rendering pipeline are restored; Little Bakery again runs its three simultaneous customer/tray model; and all five restaurant presentations and restaurant runtime details now have verified parity. Phase 3 cannot pass until the remaining non-restaurant P0/P1 gaps, broader authored world visuals, and the full release regression are complete.
