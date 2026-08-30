# KindWorks Controlled Real-Art Vertical Slice — Implementation Plan

Status: **PLAN ONLY — no artwork generated, staged, approved, or integrated**  
Prepared: 2026-08-30  
Canonical reference: 1280×720 landscape  
Recommended slice: North Road House 6, Willow River edge, Community Orchard, and Lawn Care level 1

## 1. Decision and purpose

The smallest slice that exercises the largest useful portion of the certified visual-readiness architecture is one 1280×720 town block with world origin `(1880, 0)`:

- House 6 and its fenced lawn on the west;
- North Road and its pavement along the lower part of the block;
- the Willow River and both banks through the centre;
- the Community Orchard edge on the east;
- one controllable resident, one town NPC, and one dog;
- one large layered oak for Y-sorting and occlusion;
- the existing starter apple tree for five saved growth/harvest states;
- one crushed-can cleanup interaction and one ground-dirt layer;
- the House 6 lawn job, its reward transition, and complete Lawn Care level 1;
- only the essential Town interaction prompt, Lawn Care exit/undo/hint controls, and the existing result popup;
- the same scene at day and night and across phone, tablet, reference, and desktop viewports.

This slice deliberately avoids a second house, shop, interior, restaurant, and unrelated minigame. Those would add art volume without proving a new architectural capability. It also avoids changing coordinates, level data, rewards, save fields, collision, navigation, progression, or input rules.

## 2. Protected gameplay boundary

The visual slice observes, but must never own, these existing systems:

| Contract | Protected source/behaviour |
| --- | --- |
| Town world | 4200×2800 logical units; current camera, zoom, and player movement |
| House | `house-6`; existing building data and door/approach points |
| Lawn | `lawn-house-6`; saved growth, readiness, and completion state |
| Orchard | Existing starting apple tree, growth timer, one-apple harvest rule, inventory delivery |
| Lawn gameplay | Existing 750-level catalogue, `LawnCareEngine`, controls, success/failure, undo, hint, restart, and exit |
| Reward | Existing `LawnCareService.applyResult`, `calculateLawnReward`, first-clear/job rules, and processed-session duplicate guard |
| Save | Current schema and fields, including `farming.lawns`, orchard state, `lawnCare`, `economy.coins`, and ledger |
| NPC/animal | Existing identities, routes, obstacles, interaction ranges, follower/animal state, and persistence |
| Time | Existing world clock, day/night state, tinting, and lighting rules |
| Input | Existing pointer, touch, keyboard, swipe, safe-area, orientation, and pause/resume behaviour |

The visual state transition for the representative job is the existing `transition.phase-8a.lawn-house-6.complete`: `job-ready` to `fresh-cut`, with the reward and save mutation performed only by the gameplay service. A visual mapper may read that result; it must not write it.

## 3. Canonical composition and layout data

### 3.1 Coordinate system

- Canonical viewport: 1280×720.
- Slice world origin: `(1880, 0)`.
- One logical unit equals one canonical display pixel.
- Fine snap: 8 units; composition module: 32 units.
- Art may be authored at 1×, 2×, or 4× density, but prefab logical bounds determine display size.
- Rendering: nearest-neighbour, `pixelArt: true`, rounded pixels, aspect-preserving `FIT`, centred canvas.
- No source PNG dimension may implicitly define collision, navigation, interaction, or touch geometry.

### 3.2 Stable instances

The existing versioned layouts remain the starting point:

- `layout.phase-8a.town-block.house-6`
- `layout.phase-8a.lawn-care.representative`

The controlled-slice package must be revised to version 2 before generation, without mutating the v1 package. The layout must declare these stable instances:

| Instance | Local anchor | Protected/dynamic binding |
| --- | ---: | --- |
| Grass cover | `(640, 360)` | Repeat to cover the canonical block |
| Pavement strip | `(640, 493)` | Existing North Road pavement geometry |
| Road strip | `(640, 548)` | Existing North Road geometry |
| River edge set | `(670, 360)` | 188-unit water width; 226 including banks |
| House 6 | `(278, 391)` | Ground anchor; protected world anchor `(2158, 391)` |
| House 6 lawn | `(375, 320)` | `lawn-house-6`; yard `(2100,150,310,340)` |
| Fence/gate | `(375, 475)` | Existing yard boundary and approach gap |
| Large oak layers | `(1000, 250)` | One shared ground anchor; geometry on trunk only |
| Starter apple tree | `(1140, 230)` | Protected world position `(3020,230)`; saved orchard state |
| Dirt | `(470, 480)` in deterministic fixture | Actual runtime position/visibility comes from environment state |
| Crushed can | `(520, 470)` | Existing cleanup item state |
| Player | Nominal fixture `(520, 470)` | Live Town resident position and facing |
| NPC | `(440, 470)` | Existing identity/route fixture |
| Dog | `(910, 330)` | Existing animal identity/movement fixture |
| Lawn job prompt | `(375, 405)` | Existing lawn job target |
| Reward burst | `(375, 405)` | Presentation only after committed reward |
| Lawn board/weed/mower | `(640, 340)` | Existing Lawn Care board state |
| Lawn controls | Exit in top-right safe area; undo/hint below board | DOM/input handlers remain existing controls |

House, lawn, road, pavement, river, fence, tree, and interaction geometry remain locked. A reference-overlay adjustment may change a visual offset, scale policy, or layer only. Moving a protected logical anchor requires a separate gameplay/layout approval and is outside this slice.

## 4. Exact real-art deliverables

The package contains 22 deliverables. Nineteen reuse the certified Phase 8A contracts unchanged. Two optional Phase 8A items—`prop.town.slice.public-bin` and `prop.town.slice.flower-planter`—are not generated for this slice. Their production slots are replaced by the required five-state apple tree and dirt layer. Existing legacy/placeholder support for the deferred items is retained.

### 4.1 Environment, building, and state assets

| # | Semantic asset ID | Exact output | Required content and logical contract |
| ---: | --- | --- | --- |
| 1 | `terrain.town.slice.grass` | 64×64 opaque PNG | Seamless on four edges; 64×64 logical; top-left anchor; no geometry |
| 2 | `terrain.town.slice.pavement` | 64×64 opaque PNG | Seamless pavement tile; 64×64 logical; no embedded curb, prop, text, or shadow |
| 3 | `terrain.town.slice.road` | 64×64 opaque PNG | Seamless road tile; 64×64 logical; markings remain modular |
| 4 | `terrain.town.slice.river-edge` | 512×64 RGBA sheet; 4×1 frames of 128×64 | `west-straight`, `east-straight`, `west-transition`, `east-transition`; no rocks or trees inside the water channel; explicit bank navigation geometry remains independent |
| 5 | `building.town.slice.house-6-bay-cottage` | 1024×192 RGBA sheet; 4×1 frames of 256×192 | `clean`, `weathered`, `job-ready`, `upgraded`; identical door, anchor, footprint, and frame alignment in every state |
| 6 | `terrain.town.slice.lawn-house-6` | 1280×352 RGBA sheet; 4×1 frames of 320×352 | `fresh-cut`, `growing`, `long`, `job-ready`; same boundary, gate clearance, anchor, and transparent padding in all states |
| 7 | `prop.town.slice.large-oak.shadow` | 128×160 RGBA PNG | Custom ground shadow only; no gameplay geometry |
| 8 | `prop.town.slice.large-oak.trunk` | 128×160 RGBA PNG | Trunk/body layer; visual 87×97 logical; collision radius 22; navigation radius 50; ground anchor shared with canopy |
| 9 | `prop.town.slice.large-oak.canopy` | 128×160 RGBA PNG | Foreground canopy only; no collision/input; must occlude moving residents without changing their physics |
| 10 | `prop.town.slice.white-fence` | 256×64 RGBA sheet; 2×1 frames of 128×64 | `straight`, `gate`; collision strip `(-64,-10,128,16)`; gate approach remains open |
| 11 | `vegetation.town.slice.apple-tree` | 640×160 RGBA sheet; 5×1 frames of 128×160 | New v2 contract: `sapling`, `young`, `mature`, `fruiting`, `picked`; frame-stable trunk/base and ground anchor `(0.5,0.9)`; collision radius 38, navigation radius 50, interaction radius 78, touch box 96×112; no new save fields |
| 12 | `effect.town.slice.ground-dirt` | 64×32 RGBA PNG | New v2 contract: 38×18 logical ground mark centred in canvas; no collision, navigation, interaction, or input; cleaned state uses visibility, not a blank duplicate frame |
| 13 | `prop.town.slice.rubbish-can` | 64×64 RGBA PNG | 34×28 logical crushed can; `present`/`collected` visibility states; interaction radius 54; minimum 48×48 touch target; no collision/navigation |

The v2 contract validator must add the `category.effect` allowlist entry and the `family.orchard-tree.slice` and `family.environment-effect.slice` contracts before either new asset may enter generation-ready status.

### 4.2 Characters and animation

| # | Semantic asset ID | Exact output | Directions, frames, anchors, and geometry |
| ---: | --- | --- | --- |
| 14 | `character.player.slice.resident` | 256×256 RGBA sheet; 4 columns × 4 rows; 64×64 frames | Rows: down, left, right, up. Four aligned walk frames per row, 9 fps loop. Display 40×54; feet anchor `(0.5,0.875)`; collision/navigation radius 16; interaction radius 60; touch 48×60; hand/head sockets retained |
| 15 | `character.npc.slice.resident-a` | 256×256 RGBA sheet; 4×4; 64×64 frames | Same row/frame order and 9 fps loop. Display 42×66; collision/navigation radius 16; existing identity and route unchanged |
| 16 | `character.animal.slice.dog` | 192×160 RGBA sheet; 4×4; 48×40 frames | Rows: down, left, right, up; four walk frames, 8 fps. Display 36×30; collision/navigation radius 12; interaction radius 70; 48×48 touch target |

All frames are untrimmed. Feet/paws and attachment sockets must remain at the same coordinates across every frame. A generator may not mirror asymmetric details in place of a separately reviewed facing.

### 4.3 Interaction, feedback, minigame, and UI

| # | Semantic asset ID | Exact output | Required content |
| ---: | --- | --- | --- |
| 17 | `ui.town.slice.lawn-interaction` | 128×64 RGBA sheet; 2×1 frames of 64×64 | `available`, `pressed`; 52×52 logical; 64×64 touch target; no baked instruction sentence |
| 18 | `ui.town.slice.coin-reward-burst` | 384×64 RGBA sheet; 6×1 frames of 64×64 | `burst-0` through `burst-5`; 12 fps, play once; feedback only and never the reward source |
| 19 | `minigame.lawn.slice.board-tiles` | 256×64 opaque sheet; 4×1 frames of 64×64 | `tall`, `cut-vertical`, `cut-horizontal`, `hedge`; no labels or progress numbers |
| 20 | `minigame.lawn.slice.weed-tiles` | 192×64 RGBA sheet; 3×1 frames of 64×64 | `normal`, `tough`, `woody`; frame bounds aligned to board cells |
| 21 | `minigame.lawn.slice.mower` | 256×64 RGBA sheet; 4×1 frames of 64×64 | `down`, `left`, `right`, `up`; 56×56 logical; logical board cell remains 64×64 |
| 22 | `ui.lawn.slice.controls` | 192×64 RGBA sheet; 3×1 frames of 64×64 | `exit`, `undo`, `hint`; pressed/disabled treatment stays in the shared button system; no direction pad and no level/stat bar |

The result popup reuses the current live result-card structure, text, focus management, and input blocking. Its panel/button nine-slices and typography remain existing approved components for this slice. Only the coin burst is new art. This avoids treating a complete popup screenshot as artwork.

## 5. Perspective, scale, depth, and lighting

### 5.1 Perspective and measuring reference

- Terrain: top-down orthographic.
- Buildings, residents, animals, trees, and props: the current three-quarter top-down Willowmere view, all facing the same south-oriented map camera.
- Main scale reference: player display 40×54 logical units, feet at ground contact.
- Standard house reference: 195×145 logical footprint inside the 256×192 visual state frame.
- Large tree reference: 87×97 logical trunk/body presentation with independent radius-50 navigation footprint.
- River reference: 188 logical units of water and 226 including banks.
- Artwork must be judged at intended game size, not enlarged preview size.

### 5.2 Depth and occlusion

Use the existing named layers:

- terrain `0`;
- water/banks `4`;
- roads/paths `10`;
- ground details `20`;
- buildings `60`;
- ground-sorted `200 + groundY / 10`;
- interaction guides `475`;
- foreground `490`;
- HUD `1000`.

The oak shadow is below actors, the trunk is ground-sorted, and the canopy is an authored foreground occluder. Only the trunk owns collision and navigation. Apple tree sorting uses its ground anchor. Dirt and rubbish render as ground details; interactive rubbish keeps its separate logical target.

### 5.3 Day and night

Do not generate separate baked night duplicates. Assets are authored in neutral approved daylight with upper-left lighting. The existing world lighting/tint system provides night presentation; windows or emissive accents may use declared optional layers only if their visibility is driven by the existing day/night state.

Night approval requires the same camera, save fixture, object state, and layout as day. It must preserve silhouette readability, interaction contrast, river-bank distinction, and HUD accessibility without changing geometry or game difficulty.

## 6. Existing components to reuse

| Area | Reuse |
| --- | --- |
| Registry/loading | Existing semantic manifest, `VisualRegistry`, asset contracts, fallback policy, generated runtime packs, and legacy compatibility bridge |
| Rendering | Existing family prefabs, `PhaserPrefabRenderer`, state maps, animation registry, named layers, ground anchors, and Y-sort |
| Layout | Existing versioned layout runtime, stable instance IDs, visual offsets, locked gameplay geometry, and production/development parity checks |
| Review | Existing Asset Lab, candidate intake/approval workflow, geometry overlays, device frames, animation controls, and provenance metadata |
| Comparison | Existing deterministic capture fixtures, reference overlay, side-by-side, difference view, baseline approval protection, and viewport profiles |
| Town gameplay | Current player, NPC, animal, farming, environment, interaction, navigation, camera, and time services |
| Lawn gameplay | Existing Lawn Care level data, engine, service, DOM/input handlers, result flow, and rewards |
| UI | Current safe-area shell, essential Lawn Care buttons, result-card structure, live text, accessibility labels, focus/input blocking, and rotate-device screen |
| Persistence | Current save repository, migrations, healthy-save protection, reward idempotency, and visual-state readers |

No scene may receive a raw new filename, texture key, frame name, source-dimension calculation, or artwork-specific collision patch.

## 7. Required reference package

Generation cannot start until each reference is copied into the managed reference area with provenance and checksum, then associated with the correct semantic contract.

| Reference | Purpose | Required preparation |
| --- | --- | --- |
| Approved town map reference, currently external `Codex Image 19 Aug 2026, 00_48_50.png` | Town composition, river/bank treatment, tree-free water, house/lawn/road proportions | Preserve the full map plus an aligned 1280×720 crop for world origin `(1880,0)`; record crop transform |
| KindWorks Visual Style Bible v4 | Palette, outline, materials, detail density, lighting, shadow, character and animal style | Store the authoritative document/location and version; extract its machine-readable production values before generation |
| Current deterministic Town captures | Functional position, framing, state, and responsive baselines | Use reference 1280×720, 568×320, 844×390, and 1024×768 captures; do not treat placeholder art as the style target |
| Current deterministic Lawn Care captures | Board, safe areas, controls, and result-flow baseline | Use the existing narrow-phone Lawn capture plus new reference/tablet captures from the same level-1 fixture |
| Approved Lawn Care visual reference | Intended final layout and material hierarchy | If no approved external reference exists, formally approve the deterministic current layout as layout-only; do not invent a new composition during generation |
| Player/NPC/animal model strip | Identity, scale, proportions, facing, outline, palette, sockets | Approve one neutral turnaround/calibration specimen before full sheets |
| Day/night paired capture | Readability and lighting comparison | Same scene state and camera at the two controlled world times |

References guide visual production; none is pasted into the live game as a static background.

## 8. Production and generation order

### Gate 0 — contract and reference freeze

1. Fork the Phase 8A package to controlled-slice schema/package v2.
2. Add apple-tree and dirt family/category contracts; remove public-bin and flower-planter from this slice's required generation list only.
3. Lock all 22 semantic IDs, filenames, dimensions, state/frame order, anchors, sockets, geometry signatures, byte limits, prompts, negative prompts, and fallbacks.
4. Import and checksum the approved references; record overlay transforms.
5. Freeze the deterministic fresh/job-ready/completed and day/night fixtures.
6. Capture the pre-integration baselines and create the approval ledger.

Nothing advances to generation-ready until Gate 0 passes.

### Wave 1 — calibration and terrain foundation

1. Produce one resident scale/outline/palette calibration specimen for approval; it is not yet the final character sheet.
2. Generate grass.
3. Generate pavement against the approved grass.
4. Generate road against the approved pavement.
5. Generate the four river-edge frames and verify seamless banks and tree-free water.

Approve every asset individually in staging and Asset Lab before the next dependent asset.

### Wave 2 — property composition and saved states

1. Generate the four lawn states as one aligned sheet.
2. Generate the four house states as one aligned sheet.
3. Generate the fence/gate sheet against the approved yard boundary.
4. Generate the dirt mark and crushed-can prop.
5. Review house, lawn, fence, pavement, and road together in a candidate scene; retain separate semantic assets and geometry.

### Wave 3 — occlusion and orchard state

1. Generate the oak shadow.
2. Generate the trunk/body against the approved shadow.
3. Generate the canopy against the trunk and verify layer registration.
4. Generate the five aligned apple-tree states.
5. Test actor ordering around both trees before approving the wave.

### Wave 4 — characters and animal

1. Convert the approved calibration resident into the player four-direction walk sheet.
2. Generate the NPC sheet from the same rig and scale contract while preserving a distinct identity.
3. Generate the dog sheet against the resident scale reference.
4. Review every direction, animation frame, socket, feet/paw anchor, silhouette, and night presentation.

### Wave 5 — minimal UI and feedback

1. Generate lawn interaction icon states.
2. Generate coin reward burst frames.
3. Generate exit/undo/hint icon frames.
4. Review at 1× gameplay size and all viewport frames; keep all words/numbers as live UI.

### Wave 6 — complete Lawn Care art pack

1. Generate board tiles.
2. Generate weed tiles.
3. Generate four-direction mower sheet.
4. Integrate and approve the Lawn Care pack as one complete playable screen.

The next wave never starts while the current wave contains a rejected, fallback, or unapproved required asset.

## 9. Intake, validation, and Asset Lab review

Every asset follows this state machine:

`specified → generation-ready → generated-in-staging → validated → technical review → visual review → approved master → runtime-ready → integrated → verified`

Rejected work returns to `revision`; it is never forced into the game with arbitrary scale, crop, padding, origin, or coordinate offsets.

### 9.1 Automated validation

For each delivery:

1. Match the exact semantic ID, expected filename, version, and provenance record.
2. Verify PNG format, RGB/RGBA mode, bit depth, exact canvas, alpha requirement, untrimmed policy, and nearest-neighbour metadata.
3. Validate sheet columns, rows, frame size/count/order, spacing/padding, actions, states, directions, and animation definitions.
4. Check transparent-padding and maximum-visible-bounds contracts.
5. Verify anchor/socket positions and the unchanged gameplay-geometry signature.
6. Reject missing required states, duplicate variants/IDs/cache keys, path-case mismatches, orphan entries, missing dependencies, unsupported formats, corrupt images, and oversized textures/files.
7. Generate candidate loader packs from the source manifest; do not hand-edit loader code.
8. Run the production-path resolution and fallback tests.

### 9.2 Mandatory Asset Lab review

For every required asset, the reviewer must inspect:

- native and intended gameplay size;
- light, dark, grass, road, interior, and water backgrounds where relevant;
- every state, direction, frame, layer, and animation at normal, half, and double playback speed;
- canvas/visible bounds, origin, ground contact, sockets, collision, navigation, interaction, and touch overlays;
- day and night presentation;
- nearby resident/door/house/tree scale references;
- narrow phone, wide phone, tablet, and reference viewport frames;
- previous-versus-candidate comparison;
- validation, dependency, scene-usage, provenance, and approval status.

Approval requires named technical-art and visual-direction sign-off. Automated validation alone cannot approve visual quality.

## 10. Integration procedure

Integration is deliberately incremental and reversible:

1. Copy an approved master through the runtime export step; never directly overwrite an approved runtime file.
2. Change only the semantic manifest/runtime-pack entry from placeholder/existing art to the approved version.
3. Open the candidate in Asset Lab and the controlled Town or Lawn layout.
4. If composition needs adjustment, change only validated visual layout data. Keep the logical anchor and locked geometry unchanged.
5. Run registry, asset-contract, package, layout, geometry, production-surface, and orphan checks.
6. Run deterministic before/candidate/difference captures.
7. Exercise the real scene and interaction.
8. Save, reload, revisit, and repeat at all supported viewports.
9. Record the asset version, checksum, reviewer, comparison evidence, test results, and rollback entry.
10. Commit one approved wave only after its complete verification passes.

Two explicit architecture proofs are required before final slice approval:

- replace one approved asset with a second compliant version by changing its manifest entry only—no scene or gameplay edit;
- move the House 6 visual by a temporary layout-data offset, prove that door/collision/navigation/interaction coordinates do not move, then restore the approved visual position.

## 11. Scene-by-scene visual QA

### 11.1 Town block

Test the same deterministic fixture for:

- house states: clean, weathered, job-ready, upgraded;
- lawn states: fresh-cut, growing, long, job-ready;
- apple states: sapling, young, mature, fruiting, picked;
- rubbish present and collected; dirt present and cleaned;
- player, NPC, and dog in all four facings and moving;
- player/NPC/dog in front of and behind the oak trunk/canopy;
- fence continuity, gate clearance, door socket, yard and road access;
- grass/pavement/road seams and correct scale;
- river edge alignment, uninterrupted water, no rocks/trees in the river, and readable banks;
- lawn job prompt available/pressed and no unwanted persistent UI;
- reward burst at the committed job location;
- exact day/night pair, including silhouettes, water, house, tree, prompt, and popup readability;
- camera pan/zoom, re-entry, resize, pause/resume, and no duplicate visual instances.

### 11.2 Lawn Care

Use the real level-1 fixture and test:

- full board visible; board tiles and weeds aligned to logical 64×64 cells;
- swipe, arrow, and WASD actions retain identical movement results;
- mower four-direction state and board-cell alignment;
- legal/illegal actions, hedge blocking, weed behaviour, undo, hint, restart, safe exit confirmation, re-entry, and pause;
- success and failure/retry paths where the chosen fixture supports them;
- exit in the top-right safe area and undo/hint below the board;
- no movement pad, level banner, stats bar, or unrelated persistent information;
- existing result popup, reward presentation, focus, one primary next action, and click-through protection;
- return to the same Town position and correct lawn state.

### 11.3 Popup and minimal HUD

- Live text remains readable and is never baked into art.
- Essential controls meet 44 CSS-pixel minimum targets.
- Popup fits without clipping and blocks gameplay input behind it.
- Pressed, disabled, keyboard-focus, touch, and reduced-motion states remain clear.
- Safe-area insets are respected on all sides.

## 12. Gameplay and save regression QA

The slice is not approved on screenshots alone. Verification must include:

1. Full automated regression suite and production build.
2. All visual registry, asset contract, runtime pack, scene-layout, geometry-isolation, production-surface, and comparison validators.
3. Programmatic validation of all 750 Lawn Care levels, preserving IDs, boards, bounds, goals, limits, unlocks, and final-level behaviour.
4. Runtime testing of level 1 plus representative early, mechanic-boundary, middle, high-complexity, and final levels; do not claim all 750 were manually played.
5. Town movement, house/lawn/fence/river/tree collision, door and job interaction, NPC route, dog movement, apple harvest, rubbish cleanup, and input targeting.
6. Job entry → level completion → exact reward once → Town return → fresh-cut state → save → reload.
7. Exit/retry/reload and rapid-input checks proving no duplicated reward or session.
8. Fresh, representative older, mid-progress, and completed saves.
9. Required-asset failure must block visual activation safely without overwriting a healthy save; optional-asset failure must use the documented fallback without gameplay mutation.
10. Manifest replacement, layout version change, day/night toggle, and different-canvas replacement must produce identical gameplay-state diffs.

Acceptance requires zero changes to reward formula, balances, level data, unlocks, apple inventory, NPC/animal identity, saved coordinates, or progression.

## 13. Mobile, tablet, orientation, and input QA

### 13.1 Required profiles

| Profile | Viewport | Primary checks |
| --- | ---: | --- |
| Small phone | 568×320 | Complete board, minimum touch targets, no clipping, readable prompt/popup |
| Standard phone | 667×375 | Safe HUD placement and pointer mapping |
| Wide/notched phone | 844×390 | Side safe areas, centred FIT canvas, no stretched art |
| Small tablet | 960×600 | Layout scale and touch reach |
| 4:3 tablet | 1024×768 | Letterbox balance, popup/HUD anchoring |
| Large tablet | 1180×820 | Pixel scale, safe areas, camera coverage |
| Reference | 1280×720 | Pixel-perfect comparison and canonical layout |
| Desktop QA | 1366×768 | Development/reference workflow only |

For every profile, test Town and Lawn Care at day/night where relevant, pointer-coordinate mapping, tap/swipe conflicts, multi-touch, resize, interruption, landscape enforcement, portrait rotate screen, and exact resume state. Pixel art must remain crisp without smoothing or texture bleeding.

Emulation is acceptable during production iteration. Final controlled-slice approval additionally requires a physical landscape phone and a physical tablet smoke test; device model, OS, browser, DPR, and results must be recorded.

## 14. Performance and memory budget

The slice must meet both per-contract limits and whole-build/runtime limits:

| Budget | Gate |
| --- | --- |
| Slice runtime files | At or below 2.92 MB total for the 22 outputs; substitutions must not raise the certified v1 envelope |
| Decoded slice texture memory | At or below 4.0 MiB resident when the Town or Lawn pack is active; scene-specific packs should not remain loaded without need |
| Individual assets | At or below each contract's `maximumRuntimeBytes`; no texture above the runtime 8192×8192 safety ceiling |
| Initial application JS | At or below 3.1 MB; Phaser chunk at or below 1.5 MB; total JS at or below 5 MB |
| Lazy scene chunk | At or below 80 KB for any one scene chunk; retain at least 12 lazy chunks; no production source maps |
| Mobile steady frame time | Average and p95 at or below 33.34 ms during Town movement and Lawn Care play |
| Desktop/reference target | Average at or below 16.67 ms after warm-up where the test host supports it |
| Scene transition | At or below 1 second after warm cache |
| Repeated transitions | No retained scene, object, listener, timer, or texture growth after 21 Town/Lawn entry-exit cycles |
| Soak | No sustained heap increase or runaway spawning during a 15-minute active slice session |
| Runtime errors | Zero missing textures, duplicate cache keys, unhandled errors/rejections, or failed required resources |

Performance thresholds must not be weakened to accept an asset. Oversized or inefficient art returns for revision/export optimisation.

## 15. Approval gates

| Gate | Required evidence | Stop condition |
| --- | --- | --- |
| G0 Scope | This plan and protected-contract sign-off | Any request expands the slice without an explicit scope change |
| G1 Contracts | v2 package, 22 complete machine-readable contracts, validators and negative fixtures pass | Missing/ambiguous state, direction, anchor, geometry, filename, reference, or budget |
| G2 References | Managed/checksummed town, Lawn, style-bible, model, and day/night references | Missing authoritative Style Bible or unresolved Lawn layout target |
| G3 Wave technical approval | Exact validation plus complete Asset Lab review | Invalid file, drifted frame, missing state, fallback, geometry change, or unapproved provenance |
| G4 Wave visual approval | Named art-direction approval and comparison evidence | Style, scale, composition, readability, or consistency rejection |
| G5 Town integration | All Town states, interactions, occlusion, day/night, saves, and viewports pass | Any gameplay mutation, fallback, scene edit per asset, or significant unexplained diff |
| G6 Lawn integration | Complete level loop, minimal HUD/popup, reward once, return, saves, and viewports pass | Wrong board/input/result/reward or clipped playfield/control |
| G7 Performance | Build, texture, frame, transition, memory, and error budgets pass | Budget regression, leak, duplicate load, missing texture, or production-only failure |
| G8 Physical devices | Recorded phone and tablet smoke tests pass | Input mapping, safe area, crispness, visibility, pause/resume, or orientation failure |
| G9 Slice acceptance | Independent QA and product/art approval; zero required fallback assets | Any P0/P1/P2, high pipeline defect, unresolved required reference, or save incompatibility |

## 16. Risks and mitigations

| Risk | Impact | Mitigation/gate |
| --- | --- | --- |
| Style Bible v4 is named by contracts but its authoritative measurable content is not available in the current repository | Generators guess palette, outline, material, and lighting | Hard-stop G2 until the authoritative source is managed and values are extracted |
| No dedicated approved Lawn Care art reference has been located | A technically valid pack could follow the wrong composition | Product/art decision at G2: supply a reference or approve current deterministic layout as layout-only |
| Apple tree and dirt require two v2 contract families | Generation could outrun schema/validator coverage | Add and negative-test contracts during G1, before any pixels are requested |
| Multi-state house/lawn/tree sheets drift between frames | State changes visibly jump or move sockets | Exact untrimmed grids, alpha/bounds checks, overlay frame review, and anchor/socket tolerances of zero |
| Character generators produce inconsistent directions or feet | Animation slides, scales, or changes identity | Approve calibration specimen first; frame-by-frame Asset Lab overlays; reject mirroring errors |
| River art places rocks/vegetation in water | Repeats the known composition error and conflicts with navigation | Explicit forbidden-output rule plus reference overlay and water-channel mask validation |
| Dark pixel outlines collapse at night | Characters, river banks, and prompts become unreadable | Paired day/night approval before a wave advances |
| Large state sheets exceed file/memory budgets | Mobile load or frame-time regression | Per-asset byte gates, runtime-pack isolation, and G7 profiling; never lower the threshold |
| Scene-specific offsets are used to rescue non-compliant artwork | Reintroduces visual/gameplay coupling | Reject the asset; only approved layout visual offsets are permitted, with geometry-lock proof |
| Existing working tree contains unrelated in-progress changes | Slice commits could mix or overwrite user work | Implement later on a dedicated slice branch; commit one verified wave at a time and preserve unrelated files |
| Passing this slice is mistaken for full-game art readiness | Unmigrated scene families receive premature mass generation | G9 authorises only the next bounded family/wave, never whole-game generation |

## 17. Conditions before scaling artwork production

The controlled slice may authorise broader production only when all of the following are true:

1. All 22 real assets are approved, integrated through semantic manifests, and displayed without a required fallback.
2. Package v2, contracts, prompts, references, checksums, geometry signatures, runtime packs, and approval ledger are locked and reproducible.
3. A compliant asset can be replaced again by changing only its manifest entry.
4. House visual placement can be adjusted through layout data while door, collision, navigation, interaction, and saves remain unchanged.
5. House 4-state, lawn 4-state, apple 5-state, dirt/rubbish, day/night, and tree occlusion transitions all pass.
6. The entire Lawn Care level-1 loop, result popup, reward-once path, Town return, and save/reload pass; all 750 level records still validate.
7. Every required emulated viewport and the physical phone/tablet smoke tests pass.
8. Production build, automated tests, validators, visual comparisons, geometry isolation, save compatibility, error checks, and performance budgets pass.
9. There are no P0, P1, P2, blocker, critical, or high visual-pipeline defects; medium defects that threaten production scale are also closed.
10. The approved slice is measured to lock the production art bible, and two independent follow-up assets—one ordinary prop and one character/environmental asset—can reproduce it without guessing.
11. Product, visual direction, technical art, gameplay QA, mobile QA, performance, and save-system owners record approval.
12. The next authorisation is one dependency-ordered asset family or one complete scene/minigame pack, not mass whole-game generation.

## 18. Recommended execution result

Proceed with **Gate 0 and Gate 1 only** after this plan is approved: create the controlled-slice v2 specification, manage the references, and prove the new apple/dirt contracts. Then pause for contract/reference approval before requesting any real artwork.

This is the narrowest credible production proof. It exercises semantic replacement, contracts, staging, validators, Asset Lab, layered occlusion, animated directional rigs, multi-state visuals, data-driven layout, geometry isolation, reference comparison, saved state, day/night, responsive input, a complete minigame, reward idempotency, and production performance—without turning the experiment into a town-wide art migration.
