# KindWorks Gameplay Geometry Isolation — Adversarial Audit

**Audit date:** 2026-08-30  
**Branch:** `phase-2-ui-simplification`  
**Starting commit:** `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
**Audit type:** read-only production-code audit plus controlled test fixtures and browser-emulated runtime checks  
**Verdict:** **FAIL — gameplay geometry is not yet genuinely isolated from artwork and presentation data.**

> **Repair status (2026-08-30):** All seven confirmed functional findings were
> subsequently repaired and verified. See [REPAIR_REPORT.md](./REPAIR_REPORT.md)
> and `evidence/post-repair-audit.json`. This file remains the immutable
> pre-repair audit and its original verdict.

No production gameplay code was repaired in this audit. The only repository changes are this evidence package, the read-only audit script, and adversarial regression tests that describe current behaviour.

## Executive summary

The project has a sound geometry boundary in several important places:

- Town player collision uses a fixed logical radius and authored collision rectangles, not the player texture.
- NPC and animal pointer hit areas are explicit container sizes (`42×66` and `52×54`).
- Town bins and other player-placed objects use catalogue footprints and separate collision/interaction hooks.
- Fishing and Magnet Fishing use locked scene-layout interaction geometry; large, small, padded, different-origin, and fallback visual fixtures did not move it.
- Camera and world bounds use logical `WORLD` dimensions.
- No production scene creates automatic Phaser physics bodies from texture/frame dimensions.
- Fresh save data contains no texture path, sprite key, asset path, or frame-name identity.

However, six confirmed functional/architectural failures prevent approval:

1. An authored NPC route intersects the protected Paws & Wonders building rectangle.
2. A valid player-placed decoration can sit directly on an NPC route, while NPC movement ignores placed obstacles.
3. Twenty ground-animal route segments across five animal definitions enter building-protected space.
4. Animal interaction eligibility depends on the rendered sprite alpha.
5. a player's house visual upgrade scale directly changes its collision rectangle.
6. Village Grocer, Paws & Wonders, and Harbour General reuse display rectangles as collision and interaction geometry.

A seventh, mobile-specific defect was reproduced: the House Interior `Furnish home` control is only 40 CSS pixels high at 568×320.

## Method and evidence

- Static scan of every file under `src/` for intrinsic sprite dimensions, display dimensions, `getBounds()`, origin reads, visual alpha/visibility coupling, interactive objects, and automatic physics-body creation.
- Exhaustive sampling of all 481 non-aerial/non-water animal route segments at 4-world-unit spacing.
- Exhaustive inspection of all 138 authored NPC navigation links at 4-world-unit spacing against houses, shops, and blocked river rectangles.
- Adversarial placement search using the real `validateTownPlacement()` contract.
- Controlled replacement fixtures: `32×32`, `2048×1024` with 128-pixel transparent padding and a different authored origin, and a `1×1` optional fallback.
- Browser-emulated runtime testing at 568×320 and 1024×768 for Town, Village Grocer, House Interior, Lawn Care, Playground Power Wash, and Corner Café.
- Repeated scene transitions with console inspection. These were browser emulations, not physical-device tests.
- Full automated suite and production build.

Commands and outcomes:

| Verification | Result |
| --- | --- |
| `node --test tests/gameplay-geometry-isolation-audit.test.js` | PASS — 9/9 adversarial assertions |
| Full `pnpm test` | PASS |
| `pnpm run build` | PASS, including all pre/post-build validators |
| Runtime console after repeated scene/profile transitions | PASS — no warnings or errors |
| Runtime viewport containment | PASS for tested scenes; no page overflow |

The passing adversarial assertions do **not** mean the defects are fixed. Several tests deliberately prove that the current defect witness exists.

## Confirmed findings

### GEO-01 — NPC route crosses a building

- **Severity:** P2 / High
- **Affected systems:** NPC movement, navigation graph, obstacle avoidance, Paws & Wonders exterior
- **Reproduction:** sample link `eastplaza3 → eastplazaside`. At approximately `(3533.33, 887.14)`, the segment enters the Paws & Wonders protected building rectangle.
- **Expected:** every outdoor route segment remains outside houses, shops, water, counters, and permanent obstacles except through declared entrances/bridges.
- **Actual:** `NpcTownLifeService.moveResident()` linearly interpolates between graph nodes and performs no collision or obstacle query.
- **Evidence:** `src/systems/NpcTownLifeService.js:429-464`; generated evidence reports 1 static NPC link violation.
- **Repair requirement:** validate every graph edge against a versioned navigation-obstacle layer; reroute this edge; add CI validation for buildings, water, bridges, and venue entrances; keep indoor endpoints as explicit portal exceptions.

### GEO-02 — Player-placed objects can block an NPC route without affecting NPC navigation

- **Severity:** P2 / High
- **Affected systems:** town placement, NPC movement, dynamic navigation
- **Reproduction:** `town-planter` at `(405, 1155)` is valid under `validateTownPlacement()` and lies exactly on `market1 → market2`; its footprint is 30. The NPC movement method has no placed-object obstacle hook.
- **Expected:** placement is rejected on protected NPC corridors, or navigation dynamically avoids the object.
- **Actual:** player collision and wildlife avoidance know about placed objects, but NPC route traversal does not.
- **Evidence:** `src/data/townPlacement.js:84-130`; `src/systems/NpcTownLifeService.js:429-464`; adversarial test witness.
- **Repair requirement:** introduce protected navigation corridors or a dynamic obstacle query into path planning/movement; validate placement against required corridor clearance; test bins, benches, trees, furniture-like props, and maximum placement counts.

### GEO-03 — Ground-animal routes cross protected building space

- **Severity:** P2 / High
- **Affected systems:** animal movement, habitats, route generation, placed-object avoidance
- **Reproduction:** exhaustive segment sampling found 20 invalid segments across `animal-rabbit-1`, `animal-raccoon-2`, `animal-wolf-1`, `animal-mouse-1`, and `pet-dog-husky`.
- **Expected:** every point along a ground route is navigable.
- **Actual:** route endpoints are individually repaired by `safeGroundPoint()`, but `routeMotionState()` interpolates between endpoints without segment clearance. Some endpoints also remain within the 18-unit building margin when the bounded search cannot find a valid point.
- **Evidence:** `src/data/animals.js:211-253`, `src/data/animals.js:367-420`; 481 sampled ground segments.
- **Repair requirement:** validate complete segments, not just endpoints; generate a route through navigation waypoints or resample until all segments are clear; reject/fallback explicitly if no valid route exists; preserve water/aerial exceptions.

### GEO-04 — Animal gameplay interaction is gated by rendered alpha

- **Severity:** P2 / High
- **Affected systems:** feeding, befriending, adoption, animation transitions, missing-art fallback
- **Reproduction:** while an animal fades in, changing the visual fade duration or replacement alpha can change when interaction becomes enabled.
- **Expected:** gameplay eligibility derives from semantic presentation state and a logical transition state.
- **Actual:** `interaction.enabled = presentation.visible && character.alpha > 0.55 ...`.
- **Evidence:** `src/scenes/TownScene.js:2772-2784`.
- **Repair requirement:** add a logical `interactionReady`/relocation-state contract owned by animal gameplay presentation; render alpha may follow that state but must not be read back by gameplay.

### GEO-05 — House visual scale changes collision geometry

- **Severity:** P2 / High
- **Affected systems:** player collision, house upgrades, building entrances, artwork replacement
- **Reproduction:** personal-home level selects a visual `scale`; the same calculated `width`, `height`, `x`, and `y` create `buildingCollisions`.
- **Expected:** a new canvas or visual upgrade state preserves the declared collision/navigation footprint unless a separately approved gameplay geometry change is made.
- **Actual:** the visual calculation at `TownScene:977-982` feeds collision creation at `TownScene:1078-1081`.
- **Repair requirement:** define stable house collision, entrance, navigation, and occlusion contracts independent of render dimensions; add an explicitly versioned geometry state only if an upgrade is intended to change physical footprint.

### GEO-06 — Shop/interior display rectangles also drive gameplay geometry

- **Severity:** P2 / High
- **Affected systems:** Village Grocer, Paws & Wonders, Harbour General, town shop selection
- **Reproduction:** change a fixture/product/display rectangle to match replacement artwork. The same rectangle changes the drawn fixture, player blocking, and/or interaction centre/radius.
- **Expected:** visual placement offsets and canvas sizes can change without moving collision or interaction geometry.
- **Actual:**
  - Village Grocer product `rect` draws the product zone and provides its interaction centre/radius; fixture rectangles draw and block movement.
  - Paws & Wonders habitat `rect` draws the habitat, creates the interactive zone, and determines the interaction radius; fixture rectangles draw and block.
  - Harbour General slot/counter rectangles draw fixtures, create interactive displays, and define blocking/interaction geometry.
  - Town shop selection uses the same `SHOPS` rectangle used as the building placement boundary.
- **Evidence:** `src/scenes/VillageGrocerScene.js:77-149,188-191`; `src/scenes/PawsWondersScene.js:81-157,259-262`; `src/scenes/HarbourGeneralScene.js:102-120,194-242,417-421`; `src/scenes/TownScene.js:2682-2688`.
- **Repair requirement:** introduce stable fixture IDs with separate `visual`, `collision`, `navigation`, `interaction`, `touch`, `approach`, and `socket` geometry. Scene rendering may consume visual fields only; gameplay systems consume explicit logical geometry.

### GEO-07 — House Interior mobile touch target is below the minimum

- **Severity:** P3 / Medium
- **Affected systems:** House Interior, furniture entry, narrow landscape phone
- **Reproduction:** open the deterministic House Interior fixture at 568×320. `Furnish home` measures approximately `233.9×40` CSS pixels.
- **Expected:** at least 44 CSS pixels in each touch dimension.
- **Actual:** height is 40 pixels. The Exit control is 44 pixels and passes.
- **Repair requirement:** enforce a 44-pixel minimum height in the narrow-landscape House Interior controls and include it in the automated viewport contract.

### GEO-08 — Restaurant appliance standing geometry is not represented

- **Severity:** Observation / architecture gap
- **Affected systems:** Café, Bakery, Morning Mug, Riverside Kitchen, South Shore Scoops
- **Status:** not a current collision regression because these games use direct DOM/tap station controls and a presentation-only worker. There is no walkable restaurant character, navigation graph, appliance collision footprint, or approach/standing socket to validate.
- **Risk:** future animated worker/NPC artwork cannot be integrated with meaningful station approach points without adding geometry contracts.
- **Repair requirement:** if character walking is intended, define station collision and approach sockets before art integration. If direct-touch service play is the intended contract, document these checks as not applicable and prevent decorative station art from becoming the input source.

## Replacement matrix

| Replacement | Fishing/magnet locked layout | Town house | NPC/animal | Shop interiors |
| --- | --- | --- | --- | --- |
| Larger canvas | PASS | FAIL risk: visual scale owns collision | Character hit container passes; route defects remain | FAIL risk: display rect owns gameplay geometry |
| Smaller canvas | PASS | Same coupling | Explicit hit containers pass | Same coupling |
| Transparent padding | PASS | No intrinsic-size read, but visual layout/collision still coupled | Container hit areas pass | Rect coupling remains |
| Different origin | PASS | Not data-isolated | Child animation does not move container hit area | Not independently configurable |
| Multi-frame animation | PASS for player/NPC/animal hit/body stability; no automatic physics body exists | N/A | Explicit container/manual collision geometry does not resize per frame | N/A |
| Missing optional fallback | PASS in controlled Fishing fixture and asset-pipeline validation | Not comprehensively migrated | Animal gameplay can still be affected by alpha coupling | Not comprehensively migrated |

## Important passes

- **Player collisions:** logical point plus `PLAYER_RADIUS = 17`; movement tests x/y separately against explicit geometry.
- **Rubbish selection:** Waste Collection uses an explicit `105×95` interactive container; town rubbish uses authored interaction radii.
- **Crops and trees:** interaction/collision is owned by farming data/services, not sprite bounds.
- **River, fishing, magnet fishing:** authored world radii and locked scene-layout water zones.
- **Job markers, doors, exits, triggers, spawn points:** explicit positions/radii are present. Several are still coupled to building/shop rectangles and therefore remain Partial rather than globally approved.
- **Mini-game touch areas:** tested Lawn Care and Power Wash controls met 44 pixels at 568×320; House Interior had the one reproduced exception.
- **Occlusion/depth:** moving player, NPC, animal, and placed props resolve depth from ground-contact Y, not texture height.
- **Decorative input:** the static scan found 12 `setInteractive()` sites; each belongs to an intentional character, placed object, product/display, control, rubbish item, or bin factory. Decorative graphics were not found intercepting input.
- **Animated hit areas:** NPC and animal child parts move inside fixed interactive containers, so visual bobbing does not move the logical hit zone.
- **Camera/world bounds:** explicit `WORLD` size (`4200×2800`) and camera bounds; DOM canvas bounds are used only for pointer coordinate conversion.
- **Save safety:** no fragile visual identity found in a fresh save.

## Required repair order

1. Separate house/shop/interior visual and gameplay geometry contracts (GEO-05, GEO-06).
2. Add static and dynamic navigation-obstacle validation for NPCs (GEO-01, GEO-02).
3. rebuild ground-animal routes with segment-clearance validation (GEO-03).
4. remove rendered-alpha feedback into gameplay (GEO-04).
5. enforce the mobile touch minimum (GEO-07).
6. record a product decision for restaurant movement/standing sockets (GEO-08).

After repair, rerun this complete audit with deliberately changed canvas dimensions, padding, origins, animation frames, fallback assets, maximum placed objects, all NPC edges, all animal segments, and the 568×320/844×390/1024×768 profiles. Do not approve geometry isolation until all P2 findings are fixed and the full source scan has no undocumented presentation-to-gameplay reads.
