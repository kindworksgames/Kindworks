# Protected Gameplay and Save Contracts

## Save envelope

| Contract | Current value |
| --- | --- |
| Game-state schema | 37 |
| Supported Phaser schema upgrades | 1 through 37 |
| Format | `kindworks-phaser` |
| Primary key | `kindworks_phaser_v1` |
| Backup key | `kindworks_phaser_v1_backup` |
| Recovery key | `kindworks_phaser_v1_recovery` |
| Legacy source versions | 12 through 82 |
| Legacy current key | `kindworks_living_town_v38` |

`SaveRepository` validates the envelope checksum and full upgraded state, keeps a valid previous save as backup, writes invalid/current data to recovery storage, and verifies a write by reading it back. The visual refactor must not rename keys, change envelope semantics or mutate state merely to render an asset.

## Persisted top-level domains

The schema-37 fresh state and validators protect:

- Metadata: schema version, created/updated timestamps, import source and warnings.
- Identity: town name.
- World: day/time, weather and authored world state.
- Player: current scene, x/y and facing.
- Progress and cleanup sessions.
- Economy and inventory.
- Town placement.
- NPC town-life state.
- Municipal collection.
- Restoration milestones.
- Onboarding/login rewards.
- Commerce state.
- Custom resident and personal home.
- Home interiors and furniture placements.
- Farming and orchards.
- Living environment and litter/pollution.
- Animals/pets and follower state.
- Fishing, magnet fishing and aquarium housing.
- Bakery, Café, Morning Mug, Riverside Kitchen and South Shore Scoops.
- River Restoration, House Rescue, Lawn Care, Beach Cleanup and Playground Power Wash.
- Homeowner gifts.
- Harbour General.
- Legacy reconciliation and legacy snapshot.

## Functional contracts that presentation must not own

### World and coordinates

- Authored 4200×2800 Town geometry.
- Player/NPC/animal positions and routes.
- House, shop, bridge, road, water, beach, landmark and collision coordinates.
- Purchased town-object and home-furniture coordinates/rotation.
- Camera bounds and interaction/collision rectangles.

New art may use origin/trim metadata to align to those coordinates. It must not move state coordinates to compensate for an image.

### Progression and rewards

- Level counts, IDs, unlock boundaries and completed-level sets.
- First-clear and ordinary reward formulas.
- One-time reward prevention and interrupted-activity recovery.
- Restoration and world-area unlock flags.
- Shop and equipment unlocks.
- Final-level behavior.

### Economy, inventory and shops

- Coin balances and ledger behavior.
- Item IDs, ownership, stack quantities and placement categories.
- Prices, affordability, purchase atomicity and equip/consume effects.
- Mower/vacuum equipment performance values.
- Furniture, decoration, bin, tree and town-placement ownership.
- Farming seeds/saplings and animal food.

### NPCs, animals and farming

- NPC identity, home, story, relationships, schedules/routes and controlled-resident selection.
- Animal species, habitat, rarity, probability, spawn caps and mutually exclusive rares.
- Feeding compatibility, friendliness thresholds, five-pet cap, follower selection and freeing pets.
- Crop varieties, planting, growth timers, plot ownership and harvest delivery.
- Starting/additional apple trees, fruiting/picked state and one-apple harvest rule.

### Minigames

- Input rules, legal actions, timers/moves/resources, collisions and targeting.
- Board geometry that participates in rules.
- Success/failure/completion conditions.
- Restart, retry, exit and world-return behavior.
- Power-wash masks, nozzle modes, pressure/interpolation, pass resistance and 97% completion cleanup.
- Restaurant recipes, customers, orders, stations, appliance timers and serve correctness.
- River portrait control/tap direction rules; landscape rules for other gameplay.

## Protected rendering-adjacent contracts

These values are presentation-adjacent but currently affect behavior and therefore require snapshot tests before relocation:

- Texture and animation IDs referenced by gameplay/entities.
- Power-wash canvas/image dimensions and mask alignment.
- Origins used to align feet/objects to world coordinates.
- Depth policies used for traversal/occlusion.
- Explicit collision and hit areas.
- DOM/scene identifiers used by controllers and orientation handling.
- Persistent activity scene keys.
- Stable semantic product, NPC, animal, house, furniture and level IDs.

## Allowed visual-only outputs

After state selection has been proven pure, the visual registry may own:

- Texture/atlas variant.
- Animation clip and visual-only speed where no state timing depends on it.
- Layer composition.
- Origin, display scale and trim metadata that preserve the same world anchor.
- Shadow recipe.
- Tint/color-grade/alpha recipe.
- Visual depth policy that preserves existing occlusion tests.
- Visual effect/particle recipe.
- UI skin/token/icon mapping.
- Accessibility label and generator prompt metadata.

## Required invariants

1. A visual-only code path receives read-only snapshots or semantic state.
2. Loading or substituting an asset never writes the save.
3. A missing/staged asset falls back without changing progress or geometry.
4. Existing schema-37 and supported migrated saves load before and after every phase.
5. Visual registry versions are not game-state schema versions.
6. No art filename becomes a gameplay item/entity ID.

