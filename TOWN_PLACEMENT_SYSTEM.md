# Kindworks Phaser town placement contract

Milestone 25 migrates the original town-object placement system without
changing the protected HTML game. It connects the Milestone 24 catalogue,
shops, inventory, wallet history, safe-save repository, and Phaser town scene.

## Catalogue and availability

- All 35 original placeable IDs have authored descriptions, placement rules,
  visual types, and behaviour metadata.
- 32 are released through ordinary coin-shop progression.
- `kindly-heart-planter` remains subscription-only and is not offered as an
  ordinary purchase.
- `__qa-young-tree` and `__qa-town-bin` remain hidden development fixtures.
- Exact circular footprint radii are preserved: 28, 30, 38, 42, 50, 52, 58,
  60, 72, or 78 world units depending on the original item type.

## Player flow

1. Buy a released town item through Willowmere Shop, subject to its exact
   price, unlock, affordability, and inventory-capacity rules.
2. Choose **Place owned item** in Shop or **Place in town** in Inventory.
3. Tap or drag over the Phaser town to move the translucent preview. Keyboard
   users can nudge it with the arrow keys.
4. A green boundary means the exact position is valid; red shows the applicable
   road, water, building, entrance, lawn, fixture, reachability, or overlap
   reason.
5. Rotate in 90-degree steps with the button or `R`. Confirm with the button or
   Enter, and cancel with the button or Escape.
6. Walk near or tap a saved object to open its controls. **Move** returns to
   preview mode while preserving ownership; **Store** removes it from the town
   and returns one item to Inventory.

The placement interface pauses player movement and town simulation while the
preview is active. Touch targets are at least 42–44 pixels and the compact
bottom controls fit phone landscape and portrait layouts without requiring a
mini-game orientation change.

## Validation order

A candidate must satisfy every rule below before inventory or save state can
change:

1. The full footprint remains inside Willowmere's authored world bounds.
2. It remains beyond the item's original river-distance rule and outside the
   Commons pond, Reedbank wetland, and South Harbour water.
3. It retains the item's original road clearance plus the bounded
   footprint-aware margin.
4. It does not touch a cottage, business, or protected entrance approach.
5. It does not cover an active Lawn Care plot, permanent landmark, or authored
   collision region.
6. A resident destination or public bin is within 280 world units of an
   eligible public navigation node.
7. It remains at least both footprint radii plus eight units from every other
   placed object.
8. The total saved collection remains at or below the safe 500-object limit.

## Atomic ownership and persistence

- New placement validates first and consumes one inventory unit only inside the
  same candidate state that creates the object.
- Moving ignores the object's old position during collision validation and
  never removes or adds inventory.
- Storing adds one inventory unit and removes the object in the same candidate.
- Each successful action writes a bounded zero-coin ledger record with the item
  and stable object ID; place and move also record the exact transform.
- The complete game state validates before replacement. The save is then
  written and verified by the existing checksummed current/backup/recovery
  repository. Any failed write restores the entire pre-action checkpoint.

## Saved object data

Each object has a stable `placed-N` ID, catalogue ID/type, exact finite `x` and
`y`, normalized rotation, real and game placement times, optional public-bin
fill/tipping data, and catalogue-derived hooks. `nextSerial` prevents reused
identities after storing an object.

Schema-21 saves upgrade to schema 22 with an empty placement domain. Current
schema-23 saves retain and revalidate that same placement domain. A legacy
import reads only the preserved `economy.placedObjects` array: safe known
objects retain exact coordinates and normalized rotation; duplicate, unsafe,
or over-limit known items return to the new Phaser inventory; unknown IDs are
reported and never invented. The source HTML save and `legacySnapshot` remain
unchanged.

## Behaviour integration hooks

Every saved object exposes validated, deterministic hooks for:

- resident destination and interaction kind/capacity;
- public-bin capacity and state;
- wildlife obstacle avoidance radius;
- rubbish-spawn exclusion radius;
- player collision radius; and
- automatic night glow for lamps.

The Town scene already consumes player collision and renders every current
type. The other hooks are stable integration points for subsequent NPC,
wildlife, rubbish, and lighting behaviour milestones; they are saved and
validated now so later work does not require another placement migration.
