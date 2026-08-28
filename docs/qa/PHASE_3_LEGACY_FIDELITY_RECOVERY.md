# Phase 3 Legacy Fidelity Recovery

Status: **CODE/INTERACTION RECOVERY COMPLETE — CONDITIONAL VISUAL PASS**
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
| Existing automated suite | 506/506 passing before Phase 3 edits; 557/557 passing after dedicated House and Lawn Fidelity Recovery |
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
| FID-002 | Fishing | The Phaser water canvas only cast. Legacy canvas taps also produced an early miss, reeled a bite, and pulled a settled magnet. Legacy bite/catch haptics were absent. | Restored canvas primary-action semantics, explicit waiting phase, early-miss rule, tap-to-reel/pull, and legacy haptic patterns. No catch table, inventory, aquarium, cast limit, or reward rule changed. | Operated at 1280×720: early tap produced the saved early miss; bite tap produced exactly one catch. Fishing service and mobile UX tests pass; final phone/tablet layout operation is recorded in FID-015. | VERIFIED |
| FID-003 | Power Washing simulation | Same-cell suppression prevented stationary multi-pass cleaning; pointer gaps were not interpolated; drain varied by event rate; supplies recovered only by switching tools. | Added elapsed-time spray segments, continuous stationary application, pointer-path interpolation, and legacy idle recovery for water and soap. | Level 750 engine tests prove repeated stationary progress, interpolated path coverage, and exact 1-second regeneration. Browser clicks create valid strokes. | VERIFIED functionally |
| FID-004 | Power Washing approved art | Phaser displayed crude geometric playground approximations and a 2:1 board instead of the approved legacy playground. | Extracted the exact embedded master and transparent dirt reference, verified both hashes, restored the 1536×1024/3:2 canvas, used the exact 1428×706 wash region, and removed the geometric board renderer. | Live browser screenshot: `phase3-evidence/powerwash/powerwash-approved-art-washing-after.jpg`. Asset hashes and build tests pass. | VERIFIED artwork source/composition |
| FID-005 | Power Washing pixel presentation | Phaser clipped dirt through 48×24 rectangles and omitted the legacy wand, radial wash, procedural dirt, resistant-stain layer, foam, wetness, mist, and alpha-sampled completion. | Ported the protected full-resolution layered renderer. Runtime completion now defers the grid engine and is awarded only when the approved pixel mask reaches 97%. The protected progression/reward transaction remains the sole completion writer. | Operated at 1280×720: continuous diagonal wash revealed the clean master without blocks; soap produced clipped foam; water removed the treated resistant stain; the wand followed the pointer; console contained no errors. Evidence: `powerwash-full-resolution-dirty.jpg`, `powerwash-full-resolution-soap.jpg`, `powerwash-full-resolution-rinse.jpg`. Fourteen focused tests and production build pass; final device/checkpoint operation is recorded in FID-014. | VERIFIED |
| FID-006 | Little Bakery concurrent shift | Phaser reduced the legacy shift to one sequential customer and one shared preparation state, removing the three simultaneous orders, scheduled arrivals, independent patience, and independent trays. | Recovered the three-customer queue and three preparation trays. Every tray now owns its order, recipe index, completed dishes, step progress, and appliance wait state; arrivals occur at the authored times and every active customer loses patience independently. The 150-level campaign, no-miss completion rule, first-clear rewards, saves, unlocks, and return flow are unchanged. | Eighteen focused tests prove scheduled arrivals, three occupied trays, isolated tray progress, concurrent patience, partial service, completion, replay, failure, cancellation, and save rollback. Operated at 1280×720 through the isolated QA route: three customers were visible together and one step on Prep 2 left Prep 1 and Prep 3 untouched. Evidence: `phase3-evidence/bakery/bakery-independent-trays.jpg`. | VERIFIED functionally at 1280×720; authored worker/customer artwork and device matrix pending |
| FID-007 | Restaurant visual presentation | All five Phaser restaurant scenes used flat room bands, aggregate emoji, compact token products, and a large overlay instead of the protected top-down venue presentation. | Added a shared labelled Phaser presentation foundation; restored the protected dining/counter/kitchen proportions, six places, individual pixel customers, order bubbles, tickets, three physical prep spaces, venue appliances/fixtures, visible workers and payload movement. Scoops now composes containers, flavours, sauces, toppings, drinks and lollies as procedural picture art. Active DOM controls are compact top/bottom rails. | Operated all five venues at 1280×720 and 568×320. Full landscape matrix passed at nine sizes with no document overflow and 44-pixel touch controls. Every venue also passed 844×390, 1024×768 and 1280×720. Portrait 390×844 showed the rotate state and resumed the exact Morning Mug scene/level/phase/served count. Evidence and baseline pairs: `phase3-evidence/restaurants/`. | VERIFIED ADAPTED PARITY; final labelled Sprite AI replacements remain production art |
| FID-008 | Restaurant appliance and departure runtime | Café, Morning Mug and Riverside Kitchen used one scene-only timer, so appliances could not independently own trays; Morning Mug never burnt; Riverside reload discarded a cooking station; and Scoops removed a served customer immediately. | Moved appliance ownership, cooking, ready and burn timers into the real service session. Different physical stations now run independently for their own trays; Undo/discard cancels only the selected tray's station; Morning Mug and Riverside persist exact remaining timers and burnt state; older saves gain safe idle station maps. Scoops now freezes service input, animates the served customer out for 280 ms, then advances at the protected 360 ms boundary. | Four dedicated runtime tests cover concurrent Café stations, Morning Mug cooking reload and burn clearing, Riverside exact-heat reload and collection, and additive old-save normalization. Twenty focused service/presentation/mobile tests pass. The complete automated suite passes 526/526 and the production build passes. Final browser regression at 568×320 and 1024×768 found no document overflow; portrait 390×844 hid gameplay and landscape resume restored the exact Morning Mug presentation; the console was clean. | VERIFIED FUNCTIONAL PARITY |
| FID-009 | House Rescue authored geometry | Phaser generated rubbish and grime on normalized rectangles and let the vacuum cross furniture and partitions, unlike the protected house-aware floor. | Rebuilt each NPC cottage from the real home layout; deterministic rubbish now avoids furniture and walls, grime is sampled only from vacuum-reachable floor nodes, and swept vacuum movement stops or axis-slides at obstacles. The DOM floor and Phaser room now show the same labelled furniture/partition geometry. The 750 levels, sorting, 95% completion, rewards, saves, equipped-vacuum effects, home respawn and gifts are unchanged. | Twenty-two focused tests pass, including four geometry/QA-route tests and the exhaustive 750-level generator. Complete suite: 530/530. Production build passes. Operated at 568×320 and 1024×768: nine furniture objects, one partition and nine safe wave items were visible; no overflow, undersized game controls or console errors. | VERIFIED FUNCTIONAL/VISUAL GEOMETRY PARITY |
| FID-010 | River assistance and result recovery | Phaser exposed the final placement immediately on every Hint press without advancing the protected assistance tier, so the 3/2/1-star cap never applied. Finished-session Undo was rejected. | Restored progressive Hint 1/2/3 disclosure, assistance tiers and star caps. Hint 3 adds a visible landing overlay. Added result-screen Undo that reopens the exact pre-placement board. A won result reverses its entire durable transaction before reopening, so coins, bests, stars, restoration points and first-clear status cannot duplicate; replaying the placement commits once again. | Twenty-one focused River/mobile/gesture tests pass. The reward rollback/reapply test proves atomicity. Production build passes. Operated in required 390×844 portrait: all three messages and the four-cell Hint 3 overlay appeared, with no overflow, undersized controls or console errors. | VERIFIED FUNCTIONAL/INTERACTION PARITY |
| FID-011 | Beach continuous-run Undo | Phaser Undo restored one tile, while the protected held/swiped input treated a continuous rake run as one action. | Added a persisted run identifier. Pointer holds and continuous swipes now store one pre-run checkpoint and Undo restores the complete run; discrete presses still undo individually. Rake-groove path metadata survives save/reload. | Beach engine, mobile and gesture tests pass, including separate-run and reload cases. Operated at 568×320 with the protected rake-groove renderer visible and no overflow. | VERIFIED FUNCTIONAL/VISUAL PARITY |
| FID-012 | Waste active-board layout | High-level authored card coordinates remained pinned to their source bounds and could crowd or clip the small-phone play area. | Added a deterministic active-bounds fitter that recentres and uniformly scales only the visual layout. A separate coarse-pointer layer preserves at least 44-pixel interaction targets without enlarging or overlapping the visible cards. Card order, coverage, tray capacity and certificate remain unchanged. | Level 750 operated at 568×320: 138 cards and 138 hit layers, visual bounds 136–278px, board 115–270px, zero document overflow. Waste mobile and full campaign tests pass. | VERIFIED ADAPTED PARITY |
| FID-013 | Lawn route, motion and cut evidence | Phaser moved instantly, accepted moves that could strand the mower, lacked separate dead-end/out-of-gas results, and did not retain direction-specific cutting. | Restored route-solvability checks after every move, distinct end reasons, protected 55ms-per-cell travel, queued input, mower-profile weed resistance and strain, and persisted horizontal/vertical cut directions. | Lawn engine/mobile tests pass across all 750 source levels. Operated at 568×320 and 1024×768: board remains inside the safe viewport, every control is 44px, Hint returns a safe route and no overflow occurs. | VERIFIED FUNCTIONAL/VISUAL PARITY |
| FID-014 | Power Washing interrupted visual state | Reload reconstructed the full-resolution mask from the coarse simulation grid instead of the exact player path. | Added an additive bounded visual checkpoint containing exact canvas spray segments. Reload replays the same tool, pressure and point sequence into the full-resolution renderer; restart clears it. Durable grid, supplies, reward and save-envelope rules are unchanged. | Exact full-resolution reload test passes independently of the grid. Level 750 operated at 568×320 and 1024×768 with board and wand inside the viewport and no overflow. | VERIFIED FUNCTIONAL/VISUAL PARITY |
| FID-015 | Fishing presentation | The repaired interaction still used a simplified straight-line/token presentation. | Restored a visible rod, curved line, red/white float, expanding water ripples and bite marker. Magnet Fishing now visibly casts, sinks, settles and becomes ready before retrieval. No catch table, limits, inventory, aquarium or reward logic changed. | Fishing service and mobile tests pass. Operated at 568×320 and 1024×768 with the water canvas dominant, compact side rail visible and no overflow. | VERIFIED ADAPTED PARITY |
| FID-016 | Town and living-world visual language | Town omitted Mill Walk, selection emphasis, pond wildlife, house silhouettes, shop merchandise, activity-specific characters, growth stages and localized cleanup effects. | Restored Mill Walk; five house architecture kits; window merchandise and awnings; ten swimming/resting pond ducks and wakes; night/weather window glow; interaction highlight; NPC work/social/eating poses and props; species anatomy overlays; crop/orchard stages; and land stains/river pollution. Every new visual family has a stable semantic Sprite AI label. | New town visual-fidelity tests plus personal-home/interior tests pass. Operated at 844×390 and 1024×768 with zero overflow; 360 labelled DOM candidates were present, and town survived portrait pause/resume without changing scene. | VERIFIED ADAPTED PARITY; final raster replacements remain labelled production art |
| FID-017 | Animal Fidelity Recovery | Phaser omitted environmental trust bonuses, permanent Paws care protection, 100-trust adoption, exact route waits, dynamic-object avoidance, rare arrival notices, active-follower home occupancy and the protected animal artwork. | Restored the complete care/adoption/appearance/rare/follower contract and extracted the exact 43-cell v44 reference master from the immutable HTML. Town, Paws & Wonders, Animal Friends and the personal home now share that authored artwork. Added an isolated animal QA route. | `docs/qa/PHASE_3_ANIMAL_FIDELITY_RECOVERY.md`; 55 focused tests pass; complete suite 552/552; build/performance pass. Operated at 568×320, 844×390, 1024×768 and 390×844 with safe scene resume. | VERIFIED FUNCTIONAL AND REFERENCE-ART PARITY |
| FID-018 | House and Lawn Fidelity Recovery | Eight saved house identities were attached to the wrong plots; five source architectures, architecture-driven interior size, progressive house dirt, first-visit activation and full-yard live grass stages were incomplete. The reserved non-physical lawn 19 was player-visible. | Restored the exact 19-cottage position/architecture mapping, five distinct silhouettes and interior footprints, derived exterior weathering/job-ready dirt, bounded first-visit activation, live House Rescue refresh, full-yard four-stage grass/weed rendering, and active-lawn-only menus/jobs while preserving the slot-19 save record. | `docs/qa/PHASE_3_HOUSE_LAWN_FIDELITY_RECOVERY.md`; 47 focused tests pass; complete suite 557/557; build/performance pass. Operated at 568×320, 844×390, 1024×768 and 390×844; console clean. | VERIFIED FUNCTIONAL AND CODE-DRIVEN VISUAL PARITY |
| FID-019 | Gesture-only movement controls | Phaser displayed persistent direction pads in Town, Beach Cleanup, Lawn Care and River Clear-Out even though the protected HTML uses direct gestures. The pads reduced the playable area, especially on phones. | Removed the visible direction/movement pads. Town and top-down interiors use canvas swipes; Beach and Lawn retain four-way board swipes; River retains horizontal/down swipes and tap-to-rotate. Keyboard controls remain available. Undo stays as a compact contextual action. No movement rule, completion condition, reward, level or save contract changed. | Focused gesture/mobile/release tests pass. Operated Town, Beach and Lawn at 568×320 and River at 390×844: no direction controls were present; Town and both cleanup boards responded to swipes; River tap rotated and downward swipe advanced/dropped the piece; console clean. | VERIFIED INTERACTION/VISUAL PARITY |
| FID-020 | NPC, Town camera and business exterior audit | Phaser defaulted to a separate camera-followed player, exposed a large Town banner and zoom buttons, lacked focal pinch browsing, and rendered all businesses from one generic block. | Restored default free map browsing, drag/keyboard camera pan, two-pointer focal pinch, explicit canvas selection/control of the owned resident, matching first-session exploration, compact Town HUD and all 12 protected business kit compositions. The audit also proved the 35 ordinary residents retain their schedule/social/environment systems and exposed a separate owned-resident autonomy gap. | `docs/qa/PHASE_3_NPC_TOWN_CAMERA_EXTERIOR_AUDIT.md`; focused tests and complete 559-test suite pass; build/performance and differential parity pass; live 1280×720 drag, first-session progress, business entry/return, owned-resident selection, explicit control, swipe movement and return pass. | VERIFIED EXCEPT OWNED-RESIDENT AUTONOMY / DEVICE PINCH |

## Power Washing protected asset provenance

| Asset | File | SHA-256 | Size |
| --- | --- | --- | ---: |
| Approved clean master | `public/assets/powerwash/playground-master.png` | `0679fe2c14f28b750f61415641b73e6d17d1f35cbaadfc1a470a011d3cdd0f24` | 2,561,213 bytes |
| Approved transparent dirt reference | `public/assets/powerwash/playground-reference-dirt.png` | `5db4c213d34d1e435f74f03a49590f766e172f01d8ac97703dc090ded7d36736` | 1,998,003 bytes |
| Approved Precision nozzle | `public/assets/powerwash/tool-precision.png` | `d9e75832314fee928b606021986d0d24bf903f51f6d43d6e3beefb083cb16f61` | 4,711 bytes |
| Approved Standard nozzle | `public/assets/powerwash/tool-standard.png` | `97f9dca3ecc229ba147cbc9e1bc44049c1a3946efd09812ebe03bec07dbe6290` | 7,461 bytes |
| Approved Wide nozzle | `public/assets/powerwash/tool-wide.png` | `1e56931d3e0b759317dfcab7612a6abe535f812094ce5e507d684a7d11d87ceb` | 9,269 bytes |

`scripts/extract-powerwash-assets.mjs` regenerates these files only from the protected embedded payload and fails if any hash changes.

## Restaurant visual fidelity review

Direct operation of all five restaurant games at 1280×720 originally confirmed that their Phaser rooms did not reproduce the protected HTML presentation. The comparison evidence, recovery, asset labels, viewport matrix, and final verdict are recorded in `docs/qa/PHASE_3_RESTAURANT_VISUAL_FIDELITY_REVIEW.md`.

Restaurant code-driven fidelity now **PASSES as a VERIFIED ADAPTED mobile presentation**. The protected composition and player-facing state are restored in Phaser, every procedural visual family is labelled for final Sprite AI replacement, and the protected appliance ownership/timing and Scoops departure contracts are durable runtime behaviour.

## Confirmed remaining fidelity ledger

### P0 — must be recovered before Phase 3 can pass

No confirmed P0 gaps remain. House Rescue geometry was recovered and verified in FID-009.

### P1 — functional or interaction fidelity

One confirmed P1 gap remains after FID-020: the player-owned resident is still supplied by `CustomResidentService` as a static-at-home presentation when it is not directly controlled. It is not yet part of the persistent 35-resident schedules, needs, relationships, conversations, shopping or community graph. The default Town control model is repaired, but dedicated additive owned-resident autonomy recovery is required before Phase 3 can return to conditional pass.

### P2 — presentation, animation, and game-feel fidelity

| Area | Confirmed missing/simplified presentation |
| --- | --- |
| Town | Code-driven composition now restores the protected path, selection, architecture, venue-specific business kits, wildlife, cleanup and lighting state language. Final bespoke raster buildings/props remain labelled Sprite AI production work. Per-job reveal currently uses the existing permanent restoration transformation rather than a pixel-identical legacy transition. |
| NPCs | Activity poses/props, hair and accessories are restored. Weather clothing and expressive portrait frames remain labelled Sprite AI production work. |
| Animals | The exact protected 43-cell v44 reference master now covers every one of the 56 identities in Town, Paws & Wonders, Animal Friends and the personal home. Final per-frame leg, wing, tail and idle nuances from the later code-driven legacy rig remain animation polish. |
| Farming/homes | Exact house identities, five architecture-to-interior kits, night windows, progressive exterior dirt, full-yard grass/weed stages, crop/orchard stages and active-companion artwork are restored. Bespoke furniture and household portraits remain labelled Sprite AI production work. |
| Shops | All 12 protected exterior kit identities, dimensions, palettes, signs and fixture families are restored as code-driven Phaser composition. Final venue-specific raster artwork, shelves, staff and item art remain labelled Sprite AI production work. |
| Lawn | Protected route, timing, strain, directional cuts and mower progression are restored. Final bespoke garden, mower, clipping, audio and haptic assets remain production polish. |
| River | Authored rubbish silhouettes/preview, wave/cascade/gravity/final-flush effects, sound/haptics, and grade-specific result flow. Direct tap/swipe input is restored; no persistent direction pad is displayed. |
| Waste | 40 authored rubbish assets, park detail, cleanliness progression, seven-slot/future-capacity affordance, card flight/triple burst, and transition lock. |
| Beach | Authored sand/world/player/rake visuals, synchronized groove reveal, walk cycle, collection flight, sounds, and completion celebration. |
| Fishing | Rod, float, ripples, curved line and magnet phases are restored as code-driven Phaser visuals. Final bespoke raster animation remains labelled Sprite AI production work. |
| Scoops | Procedural finished products, picture orders, numbered stations, tray art and the protected customer departure timing are restored. Final Sprite AI art remains a labelled production replacement. |
| Interiors | Residents and animals are static icons; furniture is generic rectangles/emoji. |

## Intentional adaptations that must not be casually reverted

- Reduced Town HUD and shared mobile UI components from Phase 2.
- Phaser’s contextual proximity labels where they do not cover interactions.
- Privacy-gated Impact media loading.
- Phaser’s permanent town restoration transformations.
- Contextual first-session onboarding.
- River Clear-Out portrait orientation; every other activity remains landscape.
- Direct gesture movement without persistent direction pads in Town, Beach Cleanup, Lawn Care and River Clear-Out; keyboard controls remain available.
- No advertisement behavior should be restored without a separate product decision.

## Final verification gate

- Production build: PASS; performance budget: PASS.
- Automated regression: 557/557 PASS; final focused house/lawn/interior/farming suite 47/47 PASS.
- Differential legacy audit: PASS; protected SHA-256 unchanged; 13 activities, 5,850 levels, 19 shared domains and 85 exact rule probes.
- Runtime device checks: 568×320, 844×390 and 1024×768 operated in the rebuilt game; the earlier restaurant matrix also covers 667×375, 736×414, 812×375, 1180×820, 1280×720 and 1366×768.
- Orientation: Town/landscape activities show the one-sentence rotate state at 390×844 and resume the same scene in landscape. River remains the protected portrait-only exception.
- Verified runtime geometry: Level 750 Waste (138 cards), Lawn and Power Washing fit without document overflow; Fishing and Town remain canvas-first with safe rails.
- Save/reward safety: exact interrupted checkpoints, Undo rollback, first-clear idempotency, failure rollback, imports, offline world progress, town returns and protected ownership all pass the complete suite.
- Sprite AI inventory: the existing automatic labeler plus the new explicit semantic labels cover new architecture, merchandise, wildlife, effects, activity props, animal anatomy and growth stages.

## Verdict

**PHASE 3: IN PROGRESS.** FID-020 repairs the default Town control model, camera browsing, visible Town controls and the 12 business exterior compositions, and confirms that the 35 ordinary residents retain their sophisticated life systems. The audit also exposed one genuine P1 gap: the owned resident is not autonomous when not directly controlled. Phase 3 returns to conditional pass only after that resident is safely integrated into the persistent Town-life graph, physical-device pinch is operated, the full suite and differential audit pass, and the Sprite AI production-art condition remains clearly separated from functional parity.
