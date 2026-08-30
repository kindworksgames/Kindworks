# Raw Asset and Texture-Key Report

## Active raw files

| Semantic use | Raw file | Runtime key / loader | Geometry | Status |
| --- | --- | --- | --- | --- |
| Animal reference sheet | `public/assets/animals/reference-master-v44.png` | `animal-reference-master-v44`; Phaser spritesheet preload in `BootScene` | 64×64 frames | Active |
| Reedbank fishing background | `public/assets/legacy-reference/fishing.webp` | `legacy-fishing`; Phaser image load in `FishingScene` | Raster background | Active for fishing mode |
| Power-wash playground | `public/assets/powerwash/playground-master.png` | Native `Image`, `LegacyPowerwashRenderer` | Level/reference canvas source | Active |
| Power-wash dirt | `public/assets/powerwash/playground-reference-dirt.png` | Native `Image`, dirt/mask renderer | Pixel-aligned master dirt | Active |
| Precision tool | `public/assets/powerwash/tool-precision.png` | Native `Image` | Tool button/cursor asset | Active |
| Standard tool | `public/assets/powerwash/tool-standard.png` | Native `Image` | Tool button/cursor asset | Active |
| Wide tool | `public/assets/powerwash/tool-wide.png` | Native `Image` | Tool button/cursor asset | Active |

Power-wash files have a local manifest/hash record under `public/assets/powerwash/`. The renderer must continue to use matching art and mask dimensions.

## Reference-only raw files

| File | Classification |
| --- | --- |
| `public/assets/legacy-reference/harbour-general.webp` | Archived visual reference; not loaded by active gameplay |
| `public/assets/legacy-reference/magnet-fishing.webp` | Archived visual reference; active magnet-fishing visuals are procedural |
| `public/assets/legacy-reference/manifest.json` | Reference provenance/hash data |

These files must not be promoted to production backgrounds without an explicit composition/interaction review.

## Generated textures and animations

`src/entities/PlayerCharacter.js` creates directional resident frames with Phaser Graphics and `generateTexture`:

- `resident-down-0` … `resident-down-3`
- `resident-left-0` … `resident-left-3`
- `resident-right-0` … `resident-right-3`
- `resident-up-0` … `resident-up-3`

`BootScene` registers:

- `resident-walk-down`
- `resident-walk-left`
- `resident-walk-right`
- `resident-walk-up`

The current animation rate is 9 fps with infinite repeat. These public semantic animation IDs should remain available through the compatibility layer until all callers migrate.

## Phaser texture-loading locations

Only these active loading families were found:

1. `BootScene`: animal spritesheet.
2. `FishingScene`: legacy fishing bitmap.
3. `PlaygroundPowerwashScene`: native `Image` loading delegated to the custom renderer.
4. `PlayerCharacter`: generated resident textures.

No active atlas loader or general asset-pack loader is present. No complete cross-game animation registry is present.

## Canvas and DOM visual creation

- `LegacyPowerwashRenderer` creates and manages multiple canvases/offscreen layers for art, dirt, masks and washing feedback.
- `index.html` contains 13 canvas elements/surfaces associated with the DOM game shells.
- `index.html` contains 19 SVG elements and five embedded `data:image` URLs.
- Runtime UI controllers create/update DOM panels, cards, buttons, lists and notifications.
- Most other scenes create Phaser Graphics/Text/Containers rather than loading raw artwork.

## Existing semantic-key systems

### DOM inventory

`src/assets/spriteAiLabels.js` labels broad DOM candidates and exports `window.KindWorksSpriteAI` inventory/audit utilities. Explicit HTML currently includes 38 `data-sprite-ai-label` attributes; the runtime observer labels the larger dynamic tree.

### Phaser inventory

`src/plugins/SpriteAiLabelPlugin.js` labels display-list objects and supports explicit `setSpriteAiLabelHint` values.

### Explicit scene manifest

`src/assets/southShoreScoopsAssetManifest.js` defines 100 unique visual asset records, including 51 interactive and 60 stateful entries. It is the best current proof that object-level labelling can be explicit rather than inferred.

## Key-quality risks

| Risk | Why it matters | Required control |
| --- | --- | --- |
| Text-derived DOM IDs | Copy changes can rename an asset | Phase 1 assigns explicit stable IDs to player-visible components |
| Occurrence suffixes for Phaser objects | Display-list order can change IDs | Factories must supply semantic instance IDs or stable role IDs |
| Same semantic item rendered in DOM and Phaser | Duplicate records may compete | Manifest record owns variants and renderer targets |
| Texture keys embedded in entity code | Replacements can break animation callers | Compatibility aliases and registry validation |
| Emoji placeholders have no file key | Asset generation cannot replace them by filename | Promote each role to a semantic prefab slot |
| Raw power-wash dimensions are functional | Art replacement can misalign masks/hitboxes | Dimension/hash/mask-alignment acceptance tests |

## Required Phase 1 output

The first implementation phase must export a deterministic manifest snapshot from a clean, seeded runtime twice and prove byte-for-byte stable IDs after timestamps are removed. Label coverage alone is not an acceptance test for semantic stability.

