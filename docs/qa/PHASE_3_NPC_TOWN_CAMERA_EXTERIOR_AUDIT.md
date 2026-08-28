# Phase 3 NPC, Town Camera and Business Exterior Fidelity Audit

## Scope and protected reference

- Working branch: `phase-3-legacy-fidelity-recovery`
- Starting commit: `ea5654e`
- Protected source: `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`
- Audited Phaser areas: `TownScene`, `TownCameraController`, `MovementController`, `CustomResidentService`, `NpcTownLifeService`, town data, business visual states, resident UI and the shipped Town markup.
- Protected gameplay data changed: none. Saves, coins, rewards, ownership, resident narratives, schedules, level data and mini-game completion rules are unchanged.

## Legacy behavior recovered in this batch

| Contract | Protected HTML behavior | Phaser finding before recovery | Recovery and verification | Status |
| --- | --- | --- | --- | --- |
| Default Town mode | The player browses Willowmere freely. No unrelated avatar is controlled by default. | A separate `PlayerCharacter` was visible, immediately moveable and camera-followed. | The placeholder player remains hidden and disabled. Town now starts in `browse` mode with no camera follow. Live diagnostics expose `data-town-mode="browse"`. | VERIFIED |
| Browse camera | One-finger drag pans the map; desktop arrows/WASD pan it. | Touch input drove the placeholder avatar. | Added a dedicated bounded Town camera controller. A live drag moved the camera midpoint from `1641,1142` to `2154,1142` while mode remained `browse`. | VERIFIED |
| First-session exploration | The introductory action must match the actual Town interaction. | The old prompt said `Swipe to take a few steps`, which became incorrect once Town returned to free browsing. | Step 1 is now `Explore the town — Drag the map to look around.` The first real map drag saves the existing `moved` journey marker and advances to `Meet a neighbour`; live operation proved the step transition. | VERIFIED |
| Pinch zoom | Two-finger pinch zooms around the gesture midpoint and preserves the world point under the fingers. | Wheel and visible `+`/`−` controls existed; no equivalent focal pinch controller existed. | Added tracked two-pointer pinch scaling with min/max bounds and focal-world preservation. Wheel zoom now uses the same focal algorithm. Static interaction tests and production build pass. Simultaneous multi-touch is not exposed by the desktop browser-control surface, so a physical-device pinch remains a release-device check. | IMPLEMENTED; DEVICE CHECK PENDING |
| Town title and zoom buttons | Mobile play does not need a large persistent town-name banner or zoom controls. | A large upper-left town title and two persistent zoom buttons covered the map. | Removed both zoom buttons and the visible banner. Town name and location remain screen-reader status text. Live 1280×720 operation shows only compact time/weather/coins/menu controls. | VERIFIED |
| Owned resident selection | The owned resident is visible in Town, is selected like another resident and only becomes player-controlled after an explicit choice. | The custom resident profile and control service existed, but the default experience still controlled a separate avatar. | A Town tap now prioritizes the visible owned resident, opens its profile and presents `Take a walk`. Live canvas selection set `resident-npc-kindly-member`; `Take a walk` changed mode to `resident-control`; a swipe moved the resident from `3875,1620` to `3837,1620`. Return wording is now `Return to map`. | VERIFIED |
| Other residents | Authored NPCs follow schedules/routes and participate in needs, relationships, conversations, businesses, litter/disposal and community care. | The sophisticated service was present but obscured by the incorrect player-follow model. | Repository audit confirms all 35 residents retain those systems. Live Town diagnostics showed 35 residents, 20–21 visible and 12–16 actively walking, with no runtime fault after repair. No resident rules were altered. | VERIFIED |
| Owned resident autonomy | The player-owned NPC should participate in Town life when not directly controlled, using its hobbies and home as part of its routine. | `CustomResidentService.getResident()` reports the resident as permanently `At home in Meadowlight House` unless controlled. It is not registered into the 35-resident schedule/needs/relationship/social graph. | No unsafe shortcut was made in this batch. Integrating one identity into the persistent NPC graph needs an additive save migration, deterministic schedule/needs defaults and dedicated regression coverage. | CONFIRMED P1 GAP — RECOVERY REQUIRED |
| Business exteriors | Every high-street venue has its own protected kit, dimensions, wall/roof palette, sign and fixture language. | Phaser used one rounded generic block with two windows, emoji merchandise and a large emoji/title for every venue. | Ported all 12 current Town venues to distinct protected visual kits: Café, Grocer, Bakery, both restaurants, pub, coffee shop, general store, market, pet shop, beach café and cinema. Restored pixel masonry, roof, striped canopy, labelled sign, venue windows/doors and venue-specific fixtures. | VERIFIED CODE-DRIVEN PARITY |

## Ordinary resident audit detail

The main `NpcTownLifeService` retains the following validated layers for all 35 authored residents:

- deterministic day schedules, destinations, route finding, commuting and weather-adjusted walk speed;
- home, work, leisure, shopping, eating and sleeping phases;
- persistent needs and a full 34-peer relationship map for every resident;
- paired conversations, social need relief and relationship growth;
- business takeaway carrying and player-owned Harbour General shopping;
- public/player bin choice, causal litter creation, capped daily littering and tipped-bin behavior;
- individual and community cleanup actions with protection windows;
- restoration reactions, contextual narratives and saved runtime diagnostics.

These systems were not rewritten during the camera correction. The audit found no evidence that the 35 authored non-owned residents have been reduced to decorative walkers.

## Confirmed owned-resident gap

The owned resident is a separate service with profile, appearance, hobbies, home progression, locate and direct-control behavior. That service currently supplies a presentation record but not a persistent Town-life record. When not controlled its phase is always `home`, its activity is always `At home in Meadowlight House`, and it has no saved needs, relationships, schedule, business intent, conversation state or community behavior.

The next fidelity recovery must:

1. Add the owned resident to the autonomous life simulation without changing the IDs or state of the existing 35 residents.
2. Derive a deterministic schedule from selected hobbies, Meadowlight House and appropriate public/business nodes.
3. Add safe default needs and relationships through an additive save migration.
4. Pause autonomous movement during direct control, then resume from the exact returned Town node/position.
5. Prevent duplicate resident rendering, conversations, shopping, litter events or rewards.
6. Prove legacy imports, existing Phaser saves, create/edit/upgrade flows and direct-control returns remain valid.

## Business exterior fidelity detail

The renderer now consumes the protected kit values instead of the generic Phaser block. Every venue has a stable Sprite AI label for its complete exterior and sign. This is code-driven composition parity, not a claim that final raster art already exists. The future Sprite AI pass can replace these labelled compositions without changing business coordinates, hit areas, doors, schedules or scene transitions.

## Verification

- Focused automated tests: 17/17 pass across camera, first-session, release and Town visual coverage.
- Complete automated regression: 559/559 PASS.
- Production build: PASS.
- Performance budget: PASS.
- Live Town operation: 1280×720 PASS for render, free drag, first-session progress, business entry/return, owned-resident canvas selection, explicit control, swipe movement and return to browse.
- Runtime console: an initial audit-only `currentPosition` reference was discovered during live operation and repaired before final regression; no new error appears after reload.
- Responsive contracts: existing 568×320, 844×390 and 1024×768 Town layout evidence remains valid for the unchanged shell. Physical-device multi-touch pinch remains explicitly pending.

## Verdict

**CONDITIONAL / IN PROGRESS.** The Town control model, visible controls, free-browse camera and business exterior composition are now substantially closer to the protected HTML. The 35 ordinary residents pass the logic audit. Phase 3 cannot honestly be called free of P1 gaps until the owned resident is integrated into the autonomous Town-life graph and real-device pinch is operated.
