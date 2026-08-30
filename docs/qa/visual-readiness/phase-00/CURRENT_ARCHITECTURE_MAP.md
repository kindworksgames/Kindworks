# Current Visual Architecture Map

## Runtime flow

```text
index.html + style.css + shop-reference.css
                 │
                 ├── persistent DOM HUDs, panels, dialogs and minigame shells
                 │
src/main.js ── Phaser.Game (1280×720, FIT, CENTER_BOTH)
                 │
                 ├── BootScene ── raw animal sheet + generated resident textures
                 ├── TownScene ── procedural world + entities + DOM controllers
                 └── lazyScenes ── 16 interiors/minigames/shops
                                      │
                                      ├── Phaser Graphics/Text/Containers
                                      ├── shared DOM/CSS overlays
                                      ├── RestaurantPresentation
                                      ├── LegacyPowerwashRenderer (custom canvas)
                                      └── selected raw raster assets

GameStateService / domain services / data catalogues
                 │
                 └── direct scene render decisions and DOM controller updates
```

## Present rendering paths

| Path | Where | Strength | Refactor risk |
| --- | --- | --- | --- |
| Phaser procedural vectors | Most scenes; especially `TownScene`, shop interiors, NPCs, animals | Interactive, resolution-independent placeholders | Geometry, state and art are mixed inside scene methods |
| DOM + CSS | `index.html`, `src/style.css`, `src/shop-reference.css`, UI controllers | Rapid responsive panels and rich layout | Global cascade, many scene selectors and `!important`; can diverge from canvas scale |
| Generated textures | `PlayerCharacter`/`BootScene` | Gives the player directional animation without raw files | Texture keys and generated frames are hard-coded in entity code |
| Raw raster/sprite sheet | Animal, fishing, power-wash | Closest to final asset replacement | No complete manifest; each loader has its own convention |
| Custom layered canvas | `LegacyPowerwashRenderer` | Supports masks, continuous washing and completion residue | Separate lifecycle, sizing and coordinate system from Phaser display objects |
| Emoji and text placeholders | Town details, NPC props, animals/fish/decorations, some UI | Semantically readable during development | Font/platform-dependent; not a stable asset or collision geometry |

## Data-to-render ownership

| Domain | Current identity/state owner | Current visual owner |
| --- | --- | --- |
| Town geometry | `src/data/town.js` | `TownScene.js` procedural methods |
| Player | Persistent `player` state; `MovementController` | `PlayerCharacter.js` generated textures |
| NPCs | `npcState`, `NpcTownLifeService`, navigation data | `NpcCharacter.js`, Town scene badges/highlights, `legacyVisualStates.js` |
| Animals/pets | `animalState`, `AnimalService`, animal definitions | `AnimalCharacter.js`, reference sheet, procedural anatomy/state visuals |
| Houses/lawns | World, house-rescue and lawn-care states | `TownScene.js`, `legacyVisualStates.js`, `HouseInteriorScene.js` |
| Farming/orchard | `farmingState`, `FarmingService` | `TownScene.js`, crop/orchard stage definitions in `legacyVisualStates.js` |
| Environment/restoration | Environment/cleanup/restoration services | Town graphics, badges, CSS overlays and milestone controller |
| Town placement | `townPlacementState` and service | `TownPlacedObject.js`, Town placement UI |
| Restaurants | Dedicated state/services and recipe catalogues | Scene DOM shells + `RestaurantPresentation.js` Phaser graphics |
| Waste / beach / lawn / house / river | Dedicated state/services and level data | Scene-specific Phaser graphics plus DOM roots |
| Power Wash | Dedicated state/service and level data | `PlaygroundPowerwashScene` + `LegacyPowerwashRenderer` + raw images |
| Shops/inventory | Economy/inventory/shop services and catalogues | Shared DOM ShopController plus scene-specific Phaser shop interiors |
| Responsive/orientation | Active scene key and viewport | Phaser Scale Manager + `ResponsiveShellController` + CSS media/safe-area rules |

## Existing registries and reusable systems

### Useful foundations to preserve

- `src/scenes/lazyScenes.js`: central scene loading catalogue.
- `src/data/town.js`: central world geometry and authored coordinates.
- `src/data/legacyVisualStates.js`: partial semantic visual-state definitions for NPC activities, animals, crops, orchards, houses, furniture, shops and world features.
- `src/assets/southShoreScoopsAssetManifest.js`: explicit 100-item scene asset inventory; the closest current example of a prefab/recipe manifest.
- `src/assets/spriteAiLabels.js` and `src/plugins/SpriteAiLabelPlugin.js`: runtime inventory and replacement-labelling hooks.
- `src/ui/RestaurantPresentation.js`: shared restaurant renderer.
- `src/ui/ResponsiveShellController.js`: cross-scene orientation pause/resume policy.
- `src/ui/SharedOverlayController.js`: shared loading/error surface.
- `src/rendering/LegacyPowerwashRenderer.js`: specialized mask renderer that must be wrapped, not casually replaced.

### Duplicate or competing systems

1. Phaser objects and DOM elements both implement HUD and interaction presentation.
2. `style.css` and `shop-reference.css` both influence shop/scene layout.
3. Explicit manifest IDs exist for Scoops, while most other objects use runtime-generated fallback labels.
4. Ordinary scenes use Phaser display objects; Power Wash uses a separate canvas tree.
5. Player animation is generated-texture based; animals use a raw reference sheet plus procedural anatomy; NPCs remain vector/text containers.
6. Scene state can be expressed through body datasets, root datasets, scene state and persistent game state. Stage 2 already found one stale root marker.
7. Restaurant games share a renderer but retain separate scene DOM roots and scene-specific orchestration.

## State-selection map

| Visual state | Selector today | Visual result today | Extraction requirement |
| --- | --- | --- | --- |
| House dirt / job readiness | House Rescue and world-day state | Dirt/weathering marks and job badge in Town | Pure selector returning semantic state; preserve thresholds/timing |
| Lawn growth / job readiness | `grassHeight`, weed pressure and Lawn Care state | Procedural long grass/weeds and job badge | Do not alter growth values or readiness rules |
| Crops | Farming growth progress | Seed → sprout → growing → flowering → ready definitions | Preserve stage thresholds 0/.18/.48/.78/1 |
| Apple trees | Orchard state | Sapling → young → mature → fruiting → picked | Preserve one-apple harvest and persisted tree state |
| Environment pollution | Environment/cleanup item status | Litter icons, stains, water rings and pollution visuals | Visual identity must not affect collectible IDs/status |
| Restoration | Restoration tier/flags | Landmark and town celebration variations | Keep unlock and one-time milestone contracts |
| Day/weather | World day/time/weather | Window glow, overlay and atmospheric adjustments | Separate color-grade recipe from simulation clock/weather |
| NPC activity | Activity/action regex selection | Pose/prop/reaction placeholder | Map stable activity IDs to presentation states; no route change |
| Animal species/state | Species family, habitat, movement, follower/relocation | Sheet frame or procedural anatomy, shadow/ripple/heart | Preserve habitat, probability and follower semantics |
| Restaurant stations/orders | Service runtime state | Customers, order cards, trays and appliance visual states | Presentation consumes service snapshot only |
| Power-wash dirt | Level masks, pass resistance, nozzle/pressure | Layered masks and tool cursors | Keep mask geometry and interpolation numerically identical |

## Responsive and camera architecture

- Phaser internal design resolution is 1280×720.
- `Phaser.Scale.FIT` preserves aspect ratio and `CENTER_BOTH` letterboxes where required.
- The Town camera is bounded to the 4200×2800 authored world.
- `TownCameraController` supports drag, wheel and two-pointer pinch zoom; zoom is clamped approximately 0.28–1.35.
- `ResponsiveShellController` observes resize, orientation change and active-scene body attributes.
- All gameplay is landscape except `RiverClearoutScene`, which is portrait-only.
- Orientation blocking pauses the Phaser loop, world simulation, NPC town-life and municipal collection, then refreshes scale on resume.
- CSS safe-area rules apply insets and scene-specific control layouts; 87 media rules currently own much of the phone/tablet presentation.

Observed FIT examples:

- 844×390 viewport → Town canvas approximately 693×390, centered horizontally.
- 1024×768 viewport → Town canvas 1024×576, centered vertically.
- 1280×720 viewport → canvas fills the viewport.

## Recommended target architecture

```text
Persistent game state + domain services (unchanged contracts)
                      │ semantic IDs + render snapshots
                      ▼
src/visual/
  AssetManifest.js          stable keys, file variants, loading policy
  AnimationRegistry.js      animation IDs, frames, timing, fallbacks
  VisualStateSelectors.js   pure state → semantic visual state
  LayoutRegistry.js         existing coordinates, anchors, breakpoints
  PrefabRegistry.js         layers, origins, scale, depth, shadow, hit/collision
  VisualFactory.js          creates Phaser/DOM-compatible visual instances
  LegacyCompatibility.js    translates current keys and procedural fallbacks
  validation/               key, geometry, label and completeness validators
                      │
        ┌─────────────┼─────────────────┐
        ▼             ▼                 ▼
  Phaser renderer   DOM UI adapter   Power-wash canvas adapter
```

The target deliberately retains three render back ends while centralizing identity and recipes. Requiring every surface to become a Phaser sprite in one step would be a risky rewrite and would violate the incremental migration rule.

