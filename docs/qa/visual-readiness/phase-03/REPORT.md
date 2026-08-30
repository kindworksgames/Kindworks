# Phase 3 — Visual Factories and Town-Bin Prefab Pilot

Date: 2026-08-29  
Branch: `phase-2-ui-simplification`  
Starting commit: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
Scope: reusable Phaser prefab resolution plus one complete low-risk family; no gameplay redesign

## Verdict

**PHASE 3 PASS.**

The live Town bin family is now rendered through semantic prefab contracts and one family-specific `TownBinVisualFactory`. This covers all four purchasable town-bin variants, the hidden placement-test bin, the five persistent public bins, placement previews and the municipal collection vehicle's carried bin.

No bin coordinates, placement rules, footprint, interaction callback, NPC behaviour, capacity, fill state, collection identity, rotation, save field or reward/economy rule changed. Unmigrated families continue through their existing render paths and the Phase 2 compatibility layer.

## Assumptions and protected boundaries

- The Phase 0 audit and Phase 2 registry report were re-read before implementation.
- Schema-37 saves, `kindworks_phaser_v1`, item IDs, public-bin IDs, placement coordinates, `placeableFootprintFor`, `placementBehaviorHooks`, `NpcTownLifeService`, `TownPlacementService` and `MunicipalCollectionService` remain authoritative.
- A visual factory can resolve presentation and geometry metadata, but it cannot mutate gameplay or persistent state.
- The pilot is the live Town bin family only. Shop-card emoji thumbnails are shared DOM catalogue UI and are documented legacy usage rather than silently included in this pilot.
- Browser evidence is Chromium viewport emulation, not physical-device certification.

## Implemented architecture

```text
visualManifest.js
  └── townBinPrefabs.js
        semantic assets + variants + state maps + layers + recipes
        anchors + origins + depth/shadow + sockets + all geometry
              │
              ▼
PhaserPrefabRenderer
  shared contract/state/layer resolution + manifest-backed file loading
              │
              ▼
TownBinVisualFactory
  family-specific procedural/file rendering and semantic instance tagging
      ├── TownPlacedObject      (placed bin + preview)
      ├── TownScene             (five persistent public bins)
      └── MunicipalCollectionVehicle (carried bin)
```

`PhaserPrefabRenderer` is deliberately small. It resolves common contracts and file-backed layers; it does not attempt to understand bin fill, tipped warnings or collection behaviour. `TownBinVisualFactory` owns those bin-specific presentation rules.

## Pilot source-of-truth coverage

| Requirement | Town-bin contract |
| --- | --- |
| Semantic asset ID | `prop.town-bin.small`, `.park`, `.recycling`, `.commercial`, `.public` |
| Visual state | `normal`, `full`, `tipped`, `carried` in five validated state maps |
| Variant | small, park, recycling, commercial, public |
| Scale policy | fixed 1×1 with contained replacement-art fit |
| Ground-contact anchor | explicit per placed/public form |
| Origin | explicit 0.5/1 |
| Depth policy | preserved Y-sort bases for placed, preview, public and collection roles |
| Shadow policy | preserved colour, alpha, position and dimensions |
| Animation | explicit `null`; no bin animation existed in the baseline |
| Layers | background, main, optional foreground and status layers |
| Collision footprint | preserved 20.16-radius placement contract |
| Navigation footprint | preserved 42 wildlife and 46 rubbish-exclusion radii |
| Interaction zone | preserved 76 placed / 72 public proximity values |
| Mobile touch target | preserved 56×56 placed-bin area |
| Attachment sockets | ground, collector grip, status badge and warning badge |

The validator now rejects an incomplete Town-bin prefab, missing family layer or missing required socket in addition to the Phase 2 duplicate, missing-file and invalid-reference checks.

## Behaviour and visual-parity proof

### Automated factory proof

- Exact legacy draw-command sequences are asserted for a recycling bin, invalid placement preview, full public bin, tipped public bin and carried collection bin.
- Placed-bin X/Y, 90-degree rotation, depth, 56×56 hit area, item/object data and selection callback are asserted unchanged.
- All four production variants and the hidden QA variant resolve all four visual states.
- The deterministic schema-37 save fixture has the same serialized digest before and after resolving the complete family.
- Existing town-placement, NPC-bin and municipal-collection suites pass, including exact save/reload transforms, capacity, disposal, weekly emptying, identity hiding and rollback behaviour.

### Manifest-only replacement proof

The Phase 3 test clones the manifest, changes only `prop.town-bin.small` from its procedural source to the existing Fishing image file, validates the file, and instantiates the bin as an image with the same semantic texture key. The prefab ID and all three production consumers remain unchanged. This is a proof fixture only; the approved production manifest still uses the baseline procedural bin.

### Runtime interaction proof

Using the isolated deterministic QA save at 1280×720:

1. Opened Town menu and Willowmere Shop through visible controls.
2. Opened the Bins category.
3. Purchased Small Town Bin for 2,500 coins; balance changed from 12,500 to 10,000 and ownership changed 0→1.
4. Entered placement mode.
5. Confirmed water placement was invalid and did not enable Place.
6. Moved the preview to valid grass.
7. Rotated to exactly 90°.
8. Placed the bin and returned to normal Town browsing.
9. Confirmed no page overflow or console warning/error.

State persistence and duplicate-safety are additionally covered by the complete placement, economy, NPC and municipal service tests. The visual-regression URL intentionally reseeds its isolated save on reload, so it is not misrepresented as the repository-reload proof.

## Screenshot comparison

The deterministic Town was recaptured at all five Phase 1 landscape profiles. Each route reached `TownScene`, reported ready, showed no orientation gate, had no page overflow and emitted no warning/error.

| Viewport | Result | Mean absolute channel difference | Pixels with any channel difference >24 |
| --- | --- | ---: | ---: |
| 568×320 | PASS | 9.035 | 0.610% |
| 844×390 | PASS | 7.542 | 0.382% |
| 1024×768 | PASS | 7.395 | 0.293% |
| 1280×720 | PASS | 0.111 | 0.138% |
| 1366×768 | PASS | 9.649 | 0.314% |

The stored baseline is JPEG while the review captures are PNG; broad low-amplitude differences are therefore expected from JPEG decoding. The small material-pixel areas are consistent with animated Town inhabitants/environment frames. Visual review at 1280×720 showed the same layout and bin presentation. The production procedural recipe is also protected by exact draw-command tests, so no baseline correction was approved or required.

Temporary review captures are under `/private/tmp/kindworks-phase3-*`; the approved Phase 1 baseline images remain unchanged. The visual-source fingerprint was updated only after the comparison passed.

## Verification

| Check | Result |
| --- | --- |
| Phase 3 focused tests | PASS — 6/6 |
| Complete automated suite | PASS — 670/670 |
| Minigame parity | PASS — 14 games, 75 comparisons, 105,795 generated instances |
| Differential HTML parity | PASS — 13 activities, 5,850 levels, 19 domains, 85 exact rules |
| Visual registry | PASS — 15 assets, 7 files, 6 prefabs, 1 scene instance, 4 animations, 4 packs |
| Production build | PASS — 190 modules, 19 lazy chunks |
| Production-surface audit | PASS — 18 development-only markers absent |
| Performance budget | PASS — initial app 3,052,797 B; Phaser 1,374,829 B; total JS 4,821,880 B |
| Stored visual baselines | PASS — 10 images, 6 families, 5 profiles |
| Live Town interaction | PASS — purchase, preview, invalid/valid placement, rotate and place |
| Console/resource smoke | PASS — no warning/error or failed page resource observed |

## Acceptance gate

| Requirement | Evidence | Result |
| --- | --- | --- |
| Pilot created through semantic prefabs/factories | Five assets/prefabs/state maps plus one Town-bin factory used by all live paths | PASS |
| No undocumented raw references in production scenes | Static source checks; old `drawBin`/`drawLiftedBin` removed; semantic factory calls only | PASS |
| Baseline visual match | Exact draw-command tests plus five reviewed Town captures | PASS |
| Identical gameplay behaviour | Full suite, placement/NPC/collection tests, live purchase/placement and save digest | PASS |
| Artwork replaceable without scene changes | Valid manifest-only source swap creates an image-backed bin with stable prefab/key | PASS |
| Unmigrated families retained | Existing legacy bridge and all non-bin render paths still active | PASS |

## Justified exceptions

1. `small-town-bin`, `park-bin`, `recycling-bin` and `commercial-bin` remain gameplay/catalogue IDs. They map to semantic visual variants inside the prefab module; they are not filenames or texture keys.
2. Public-bin coordinates, capacities and collection identities remain in NPC/municipal data and services because they are protected gameplay/layout contracts.
3. Fill counts and full/tipped badges remain visible status layers and use the existing data values and positions.
4. Willowmere Shop's bin emoji/card thumbnails remain in the shared DOM shop renderer. Migrating that shared UI would exceed the one-family live-world pilot and is deferred explicitly.
5. The municipal truck and collector remain procedural. Only the carried bin belongs to this pilot.

## Remaining legacy usage

- Town trees, benches and all non-bin placed decorations still use the existing `TownPlacedObject` procedural drawers.
- Town terrain, roads, river, rocks, buildings, houses, venues, landmarks, farming, environment, restoration, NPC and animal presentation remain on existing scene/entity paths.
- Boot still loads the registered animal spritesheet through its legacy key/path constants.
- Resident textures/animations are still generated directly by `PlayerCharacter`.
- Power Wash still uses the registered native-image/custom-canvas path because its mask dimensions are functional.
- DOM/CSS UI, shop cards, restaurant presentation, South Shore's separate manifest, emoji placeholders and `legacyVisualStates.js` remain incremental migration debt.
- Phase 2 pass-through compatibility remains required and was not removed.

## Files changed for Phase 3

- `src/visual/contracts.js`
- `src/visual/visualManifest.js`
- `src/visual/VisualRegistry.js`
- `src/visual/validateVisualManifest.js`
- `src/visual/index.js`
- `src/visual/prefabs/townBinPrefabs.js`
- `src/visual/renderers/PhaserPrefabRenderer.js`
- `src/visual/renderers/TownBinVisualFactory.js`
- `src/entities/TownPlacedObject.js`
- `src/entities/MunicipalCollectionVehicle.js`
- `src/scenes/TownScene.js`
- `tests/visual-readiness-phase-2.test.js`
- `tests/visual-readiness-phase-3.test.js`
- `docs/qa/visual-readiness/phase-01/BASELINE_MANIFEST.json`
- `docs/qa/visual-readiness/phase-03/REPORT.md`
- `docs/qa/visual-readiness/README.md`

Pre-existing dirty-worktree changes were preserved. No artwork was generated, moved, renamed, deleted or overwritten. No commit or push was performed.
