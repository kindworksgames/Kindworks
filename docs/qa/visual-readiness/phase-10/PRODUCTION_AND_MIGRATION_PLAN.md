# KindWorks Phase 10 — Artwork Production and Migration Plan

Status: **STRUCTURAL PLANNING PASS; PRODUCTION EXECUTION BLOCKED**  
Plan schema: `artwork/production/phase-10/production-migration-plan.v1.json`  
Validator: `npm run phase10:check`

## Executive result

The audited KindWorks game has been reduced to **74 reusable production families in 10 dependency-ordered waves**. The machine-readable dependency map assigns **all 18 registered production scenes** and all **22 Phase 8A vertical-slice contracts**. No mass artwork has been generated.

Production must not begin yet. Phase 8B recorded **0/22 approved runtime slice assets**, so there is no approved premium slice from which Phase 9 can measure and lock the production art bible. The plan is usable for estimating, assigning, and preparing jobs, but generated pixels may not advance beyond staging until:

1. all required Phase 8A outputs are supplied, validated, reviewed in Asset Lab, integrated, and approved through Phase 8B; and
2. Phase 9 measures those approved outputs and publishes the locked human- and machine-readable art bible.

This distinction prevents invented scale, palette, perspective, rig, anchor, and export rules from becoming production debt.

## Authoritative inputs and limits

The plan was derived from the actual repository using:

- the Phase 0 visual-surface inventory;
- the Stage 1 complete game inventory and later QA reports;
- the semantic visual manifest, prefab contracts, state maps, animation registry, layouts, Asset Lab, scale system, and artwork validator;
- the 22 specified Phase 8A vertical-slice contracts;
- the Phase 8B intake report; and
- the Phase 9 blocked report.

The current Phaser implementation, save schema, gameplay data, scene coordinates, collision, navigation, interaction geometry, rewards, progression, inventories, NPC identities, animals, farming, and minigame completion rules remain protected. HTML remains the functional source of truth where a proven Phaser discrepancy exists.

The phrase “approved vertical slice” is not treated as satisfied: the repository contains specifications and placeholders, not approved runtime artwork. “Locked production art bible” is also not treated as satisfied: `KindWorks Visual Style Bible v4` is a declared target reference in the contracts, but Phase 9 has not locked measured production values from approved slice pixels.

## Audited production scope

| Surface | Audited quantity |
| --- | ---: |
| Registered production scenes | 18 |
| Development-only visual surfaces | 3 |
| World size | 4200×2800 logical units |
| Districts | 10 |
| Roads / paths / bridges | 9 / 5 / 3 |
| Houses / architecture kits / lawns | 19 / 5 / 20 |
| Shop exteriors / landmarks | 12 / 6 |
| Authored NPCs plus optional owned resident | 35 + 1 |
| Animal species / stable identities | 37 / 56 |
| Released placeables / furniture products / home themes | 32 / 10 / 6 |
| Major UI surfaces | 73 |
| Campaign levels across levelled minigames | 5,850 |

## Asset strategy rules

| Strategy | Use it for | Do not use it for |
| --- | --- | --- |
| Reuse directly | Existing validated Power Wash masters/masks, fishing reference layers, and any already-approved compliant runtime asset | An asset that only looks similar but violates the locked contract |
| Palette/state variants | Clean/dirty, growth, restoration, identity markings, clothing colours, material themes | Geometry or anchor changes disguised as recolouring |
| Modular components | Houses, shopfronts, rooms, stations, resident appearance, landmark assemblies | Baking every possible combination into separate art |
| Layered assets | Tree trunk/canopy/shadow, dirt, water effects, restoration, aquariums, occlusion | Gameplay geometry baked into a flattened screenshot |
| Coherent whole illustration | Only a composition whose spatial unity is essential: selected boards, global system states, or the Scoops sea-facing shell | Town maps, reusable venues, furniture arrangements, or interactive content that can be assembled |
| Sprite sheets | Directional characters, animals, equipment, appliances, effects, moving water | Static props or UI labels |
| Atlases | Rubbish, props, crops, icons, ingredients, furniture, expressions | Large repeatable terrain surfaces |
| Tilesets | Grass, soil, roads, pavement, water, room construction, minigame boards | Unique silhouettes or narrative landmarks |
| UI nine-slices | Buttons, panels, dialogs, cards, slots, progress and result containers | Baked text, numbers, icons, or complete screens |

All coherent-whole exceptions are explicitly justified in the machine plan. Live text remains live. Filenames never become gameplay identity. A replacement enters through staging, validation, review, runtime export, semantic manifest resolution, and regression verification.

## Deduplicated inventory

### 1. Calibration and foundations — 3 families

- `foundation.calibration-specimens`: measured resident, door, house, tree, bench, bin, fence, road, river, lawn, grid, anchor, and safe-area references.
- `foundation.shadow-profiles`: shared soft, hard, water-contact, interior, and no-shadow policies.
- `system.visual-fallbacks`: labelled development fallback and safe production fallback.

### 2. Terrain, roads, paths, water, and transitions — 11 families

- Grass and soil tiles; terrain edge/corner transition atlas.
- Road surfaces, curbs, markings, junctions, bends, crossings, and parking bays.
- Pavement, dirt/gravel paths, park loops, stepping edges, and entrance transitions.
- River water animation; straight banks, corners, mouths, and tree-free rock/earth edges.
- Pond and wetland kit; beach sand/shore/foam/water kit.
- Wooden road/foot bridges; harbour docks, piers, ramps, moorings, and edge caps.
- Repeating woodland boundary with corner and opening modules.

### 3. Props, rubbish, vegetation, and effects — 12 families

- Layered tree family with shared shadows and trunk collision; nine purchasable tree identities are variants.
- Crop/seed/apple growth sheets; shrubs, flowers, planters, hedges, reeds, and waterside plants.
- Fence/gate tiles; bins; benches and picnic seating; street/decorative props.
- Prestige decoration layers for gazebo, clock, monument, and fountains.
- One shared rubbish atlas used by the town, house rescue, waste collection, beach cleanup, river cleanup, and fishing catches.
- Environmental and interaction/reward effects.
- Municipal collection vehicle directional/action sheet.

### 4. House families and states — 4 families

- Five modular architecture kits serve all 19 houses.
- Shared clean, weathered, job-ready, upgraded, and occupation layers remain state-aligned.
- The personal home uses six upgrade levels through compatible kit pieces.
- All 20 lawns use one four-state lawn family: tidy, growing, overgrown, and job-ready.

### 5. Shops and landmarks — 5 families

- One shopfront grammar for doors, windows, walls, roofs, counters, signs, awnings, and exterior displays.
- One sign/awning identity atlas.
- Twelve distinct composites: Corner Café, Village Grocer, Little Bakery, Riverside Kitchen, Willow Arms, Morning Mug, Harbour General, Riverstone, Fresh Market, Paws & Wonders, South Shore Scoops, and Cinema.
- Six assembled landmarks: Community Orchard, Watermill, Commons Playground, Allotments, Reedbank Wetland, and South Harbour.
- Shared before/after/restored/celebration layers for restoration milestones.

### 6. Player, NPC, clothing, animation, and expression — 5 families

- One resident rig supplies four-direction idle, walk, interact, and action alignment.
- Appearance layers cover skin, hair, eyes, body, top, bottom, and footwear.
- Clothing/accessory atlas covers ordinary, work, rain, winter, and shop wardrobe items.
- Shared expressions/actions include thought, speech, gift, carry, sit, work, cast, and celebrate.
- Thirty-five NPCs and the optional owned resident are data recipes, not 36 duplicated baked sheets.

### 7. Animals and pets — 4 families

- Rig templates: quadruped, small mammal, bird, aerial, water, reptile, and novelty companion.
- Thirty-seven species and 56 persistent identities use species sheets plus identity/state variants.
- Pet-shop presentation mounts reuse the runtime animal assets.
- Aquarium fish sheets serve catches and owned tanks without duplicating fish art.

### 8. UI — 7 families

- Button and panel/dialog nine-slices.
- Global action/navigation icon atlas and resource/status icon atlas.
- Shared card and slot components for shops, inventory, orders, rubbish, recipes, and trays.
- Shared progress, patience, cleaning, trust, growth, loading, reward, success, and failure components.
- One rotate-device/loading/error system. Text, counters, and backend state are never baked into art.

### 9. Interiors and stations — 10 families

- Room construction tiles for walls, floors, doors, windows, kitchens, and bathrooms.
- Six home material themes as palette/material variants, not separate floor plans.
- Fixed and placeable furniture atlases; four rotations are states of the same product.
- Layered aquarium and dirt/clean systems.
- Modular Village Grocer, Paws & Wonders, and Harbour General kits.
- One shared restaurant room/station grammar for dining, order counter, preparation, kitchen, appliances, customer seats, and interaction sockets.

### 10. Minigames — 13 families

- Lawn Care, Waste Collection, River Clearout, House Rescue, Beach Cleanup, Power Washing, and shared Fishing/Magnet Fishing packs.
- One shared restaurant service pack for order cards, customer bubbles, trays, plates/cups, ingredients, serving, discarding, undo, appliance states, and feedback.
- Venue packs add only the specific recipes, appliances, products, and shell treatments for Corner Café, Little Bakery, Morning Mug, Riverside Kitchen, and South Shore Scoops.

## Production waves

The exact arrays of jobs, dependencies, integration order, validators, reviews, scene tests, and completion criteria are source-controlled in the machine plan. The operational sequence is summarized below.

### Wave 1 — Calibration and environmental foundations

**Jobs:** reproduce approved slice calibration specimens; encode locked palette/perspective/pixel-density values; prepare shadow profiles and fallback assets.  
**Dependencies:** Phase 8B approved slice and Phase 9 locked art bible.  
**Integration:** measured bible → calibration scene → shared scale/anchor/shadow contracts → semantic manifest.  
**Validation/review:** dimensions, alpha, nearest-neighbour sampling, anchors, sockets, geometry separation, palette and light checks; art-director and technical-art review at all supported viewport frames.  
**Scene tests:** Scale Calibration, Asset Lab, Boot fallback, representative Town block.  
**Complete when:** values are machine-readable, fallbacks are verified, and calibration screenshots are approved without gameplay mutation.

### Wave 2 — Terrain, roads, paths, water, and transitions

**Jobs:** generate tilesets/atlases for every audited surface and transition; animate river/water without embedding rocks or trees.  
**Dependencies:** Wave 1 measurements and shadows.  
**Integration:** base tiles → edges/corners → roads/paths → water/banks → bridges/docks → scene packs and layout data.  
**Validation/review:** seamless-edge, frame-grid, state-alignment, water-width, bank-placement, texture-budget, missing/orphan checks; map overlay review against the approved layout.  
**Scene tests:** Town at all viewports, bridges and water navigation, Fishing backgrounds, beach, river, and shoreline minigames.  
**Complete when:** every required adjacency renders without seams, floating bank rocks, collision changes, or layout changes.

### Wave 3 — Props, rubbish, vegetation, and effects

**Jobs:** produce tree layers, crop growth, plants, fences, bins, seating, decoration, rubbish, feedback effects, and municipal vehicle.  
**Dependencies:** Waves 1–2 ground, scale, depth, and transition contracts.  
**Integration:** shared shadows → anchors/geometry → atlases/sheets → prefab states → Town and dependent minigame packs.  
**Validation/review:** alpha, atlas bounds, growth/state alignment, tree layer alignment, identity uniqueness, touch geometry, texture budget; Asset Lab review at native and gameplay size.  
**Scene tests:** Town placement/purchase, tree occlusion, farming growth, rubbish collection, effect timing, reward behavior, save/reload.  
**Complete when:** one semantic source serves every consumer and all existing coordinates/interactions remain unchanged.

### Wave 4 — House families and states

**Jobs:** build five modular house kits, state overlays, six personal-home levels, and four lawn states.  
**Dependencies:** Waves 1–3 terrain, vegetation, fences, props, and effects.  
**Integration:** kit geometry → door sockets → states → lawn alignment → all 19 house instances → home upgrades.  
**Validation/review:** state canvas alignment, stable collision/door/approach sockets, roof occlusion, upgrade completeness, lawn boundary; overlay comparison per architecture kit.  
**Scene tests:** Town weathering/job readiness, Lawn Care return state, house entry, personal-home upgrade, old-save restoration.  
**Complete when:** every house/lawn state resolves from data with unchanged gameplay geometry and no one-off house screenshots.

### Wave 5 — Shops and landmarks

**Jobs:** create shopfront modules, sign/awning atlas, 12 façade composites, six landmark assemblies, and restoration layers.  
**Dependencies:** Waves 2–4 environment, props, and resident scale.  
**Integration:** shared façade kit → venue identity layers → door sockets → landmark modules → restoration states.  
**Validation/review:** door/socket alignment, sign legibility without baked dynamic text, façade bounds, restoration-state alignment, collision/navigation independence; compare every venue with its approved layout reference.  
**Scene tests:** all town entrances/exits, contextual selection, restored/unrestored states, camera occlusion, touch targets, saves.  
**Complete when:** all 12 shops and six landmarks are distinct but assembled from shared foundations.

### Wave 6 — Player/NPC rig and population

**Jobs:** create base rig, modular appearance, clothing, expressions/actions, and 35+1 identity recipes.  
**Dependencies:** Wave 1 measured rig plus Wave 5 station and door sockets.  
**Integration:** base frames → appearance layers → wardrobe → actions → identity recipes → animation registry.  
**Validation/review:** exact frame grid/order, untrimmed alignment, ground contact, sockets, direction/action coverage, palette readability, identity distinction; animation review in Asset Lab at multiple speeds.  
**Scene tests:** creator, Town movement/pathfinding, doors, shops, seating, stories, fishing cast, restaurant stations, save identity.  
**Complete when:** all residents use one compatible rig and no permutation requires a bespoke sheet.

### Wave 7 — Animals and pets

**Jobs:** approve rig templates, species/identity sheets, pet-shop mounts, aquarium fish.  
**Dependencies:** Wave 1 scale/ground-contact and Wave 6 movement timing.  
**Integration:** rig templates → species anatomy → markings/rarity states → habitat/pet/shop/aquarium presentations.  
**Validation/review:** frame, anchor, habitat/action completeness, water restriction visibility, identity uniqueness, pet-follow proportions; zoological silhouette and gameplay-readability review.  
**Scene tests:** spawn, feed, befriend, follow, home entry, free/roam, shop adoption, aquarium, save/reload.  
**Complete when:** all 37 species/56 identities resolve without duplicate rigs or changed animal logic.

### Wave 8 — UI

**Jobs:** produce shared nine-slices, icons, cards/slots, progress/feedback, rotate/loading/error presentation.  
**Dependencies:** locked palette/type/icon metrics and asset identities from Waves 1–7.  
**Integration:** nine-slices → icons → cards/slots → resource/progress components → scene HUD migration.  
**Validation/review:** margins, safe slicing, no baked text, icon uniqueness, touch size, contrast, focus/pressed/disabled/selected states, narrow/wide/tablet fit.  
**Scene tests:** all 73 major UI surfaces, portrait rotate state, dialogs, inventory, shops, onboarding, success/failure, re-entry.  
**Complete when:** all production UI uses shared components, controls remain reachable, and development IDs never appear.

### Wave 9 — Interiors

**Jobs:** build room materials, furniture, aquariums, dirt layers, three shop interiors, and restaurant shell.  
**Dependencies:** Waves 3, 6–8 props, rigs, animals, and UI.  
**Integration:** construction tiles → fixed furniture → placeables → themes/states → store fixtures → restaurant sockets.  
**Validation/review:** tile seams, station sockets, rotations, room-plan bounds, collision/navigation/interaction separation, dirt alignment, shop product reuse; room-composition review at phone/tablet sizes.  
**Scene tests:** house sizes/themes, empty owned room with bed, furniture placement, cleaning, every shop transaction, every restaurant station/path.  
**Complete when:** all interiors are assembled and interactive; no gameplay-relevant room is a pasted static image.

### Wave 10 — Minigames, one complete game at a time

**Jobs:** complete packs in this order: Lawn Care; Waste Collection; River Clearout; House Rescue; Beach Cleanup; Power Wash; Fishing/Magnet Fishing; shared restaurant pack; Corner Café; Little Bakery; Morning Mug; Riverside Kitchen; South Shore Scoops.  
**Dependencies:** all relevant terrain, prop, character, animal, UI, and interior families.  
**Integration:** migrate one game only → validate → Asset Lab review → runtime play → viewport/save/reward regression → approve before starting the next.  
**Validation/review:** exact board/sheet dimensions, frame/state completeness, semantic references, playfield visibility, touch targets, no static-image substitution for interactive objects, no missing/fallback textures; visual comparison with each approved scene reference.  
**Scene tests:** tutorial, legal/illegal input, success/failure, retry, exit, reward once, save/reload, early/middle/late/final level samples, required viewports, console/resource inspection.  
**Complete when:** each game independently passes visual and functional regression and every interactive asset is semantically replaceable.

## Registered scene dependency coverage

| Production scene | Assigned production scope |
| --- | --- |
| BootScene | fallbacks, resident/animal preload, orientation/loading/error |
| TownScene | Waves 2–9: complete world, population, UI, placeables |
| HouseInteriorScene | houses, residents/pets, UI, room/furniture/dirt systems |
| VillageGrocerScene | crops, UI/cards, grocer interior kit |
| PawsWondersScene | animals, pet mounts, UI/cards, enclosure kit |
| HarbourGeneralScene | harbour/clothing, UI/cards, shop kit |
| BakeryScene | resident/UI, shared restaurant shell/service, bakery pack |
| CafeScene | resident/UI, shared restaurant shell/service, café pack |
| MorningMugScene | resident/UI, shared restaurant shell/service, coffee pack |
| RiversideKitchenScene | resident/UI, shared restaurant shell/service, kitchen pack |
| SouthShoreScoopsScene | beach/resident/UI, shared restaurant shell/service, scoops pack |
| RiverClearoutScene | river/rubbish/UI, portrait river pack |
| HouseRescueScene | house/rubbish/UI/interior dirt, rescue pack |
| WasteCollectionScene | pavement/rubbish/UI/cards, waste pack |
| LawnCareScene | grass/lawn/UI, lawn pack |
| BeachCleanupScene | beach/rubbish/resident/UI, beach pack |
| PlaygroundPowerwashScene | landmark/effects/UI, validated power-wash pack |
| FishingScene | river/bank/wetland/bridge/harbour/rubbish/fish/UI, fishing/magnet pack |

Development-only Scale Calibration, Asset Lab, and Reference Overlay dependencies are also assigned in the machine plan and remain excluded from production access.

## Migration and acceptance workflow

For each family or bounded job:

1. Confirm prerequisite family approvals and locked art-bible version.
2. Create generator-neutral specification and expected filenames from semantic IDs.
3. Generate into `artwork/staging`; never overwrite a runtime or master asset.
4. Run file, dimension, alpha, frame, state, anchor, atlas, budget, dependency, orphan, and fallback validation.
5. Reject non-compliant output; do not compensate with scene offsets or altered geometry.
6. Inspect in Asset Lab at native and intended size, all states/directions/layers, light/dark/terrain backgrounds, and supported viewport frames.
7. Approve a master and export an optimized, untrimmed, nearest-neighbour runtime asset.
8. Change only manifest/prefab/state/layout data. Do not add raw filename references to gameplay scenes.
9. Run scene, input, collision, navigation, interaction, save, reward, responsive, console, resource, screenshot, and full regression checks.
10. Record provenance, version, approval, screenshots, failed revisions, remaining legacy usage, and rollback reference.

## Phase 10 planning gate

| Gate | Evidence | Result |
| --- | --- | --- |
| Every registered production scene assigned | Validator derives Boot, Town, and all lazy scene keys: 18/18 mapped | PASS |
| Every vertical-slice contract assigned | 22/22 semantic IDs appear exactly once | PASS |
| Production dependency order complete | 10 ordered waves; no missing, later-wave, or cyclic family references | PASS |
| Unnecessary one-offs eliminated | 74 families with explicit deduplication rules; coherent-whole cases require justification | PASS |
| Plan is machine-checkable | Six automated Phase 10 checks plus command-line validator | PASS |
| Approved premium slice available | Phase 8B intake: 0/22 approved runtime assets | FAIL / BLOCKER |
| Locked measured production art bible available | Phase 9 could not lock values without approved pixels | FAIL / BLOCKER |

## Verdict

**PHASE 10 PLANNING GATE: CONDITIONAL PASS — complete repository-specific inventory and wave assignment; production execution remains blocked.**

The planning requirement itself is satisfied: all registered scene dependencies are assigned and one-off generation has been reduced to justified coherent compositions. The next authorized action is to supply and approve the Phase 8A artwork through Phase 8B, then lock Phase 9. Only after those two gates pass may Wave 1 generation begin.
