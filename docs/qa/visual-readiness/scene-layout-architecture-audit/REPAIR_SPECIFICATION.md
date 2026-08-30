# Scene-layout architecture repair specification

This is a repair design, not an implemented change. Gameplay, save, progression and persistent coordinates remain protected.

## Repair order

### 1. Close and strengthen schema version 2

Create a closed, machine-readable schema for root, prefab roles, instances, visual transforms, anchors, parents, conditions, repeated objects, zones, sockets, references and safe areas.

Required visual fields and validation:

- semantic `prefabId` / asset resolution;
- finite position and normalized origin;
- positive finite scale or scale policy;
- finite rotation in one canonical unit;
- boolean flips and visibility;
- finite depth or a named depth policy;
- alpha in `[0,1]`;
- validated tint format;
- animation/state/variant references;
- finite visual bounds and visible bounds inside declared policy;
- optional visual-only offset explicitly separate from the instance/world position;
- valid parent/container reference with cycle detection;
- debug label and reference-image alignment metadata;
- no unknown fields.

Add safe-area edge/target validation, responsive-rule validation and canonical profile validation. Reject functions and non-serializable values anywhere in layout data.

### 2. Make gameplay locks enforceable

`locked: true` is currently declarative. Replace it with one of these enforceable approaches:

1. Keep gameplay geometry outside scene-layout exports and let layouts reference immutable geometry IDs owned by gameplay data; preferred.
2. If geometry must be mirrored for tooling, validate its digest against the authoritative owner and forbid editor/export changes.

The editor must accept only a typed visual patch. Never accept a complete mutable layout object from the UI. Deep-freeze canonical definitions and return deep-frozen validated clones.

### 3. Add a global layout catalogue

Create one catalogue imported by validation/build tooling. It must:

- list all 18 production scenes and development-only layouts separately;
- enforce one canonical layout ID/revision per scene/surface;
- detect duplicate stable IDs across layouts;
- validate scene IDs, prefab/state/animation IDs and scene-pack dependencies;
- report missing required surfaces and intentionally exempt transitional surfaces;
- be the only source used by the post-build validator and Reference Overlay Mode.

### 4. Build a generic instance applier with family renderers

The layout consumer should apply supported common properties consistently, while prefab/family renderers continue owning art-specific logic. Remove manual per-property reads from scenes.

The common applier should own:

- transform, visibility, tint/alpha and depth policy;
- parent/container resolution;
- responsive/safe-area anchors;
- deterministic conditional/state resolution;
- repeat/template expansion with stable derived IDs;
- instance registration and shutdown cleanup;
- debug metadata and reference-overlay selection.

Gameplay services continue to own collisions, navigation, interaction and persistent transforms. Visual offsets decorate those values rather than replacing them.

### 5. Add regression tests before expanding coverage

Add the negative probes documented in `EVIDENCE.json` to the normal test suite. Required tests:

- unknown property, invalid origin/scale/alpha/tint/rotation/flip/depth;
- missing/cyclic parent;
- invalid responsive/safe-area rule;
- mutated gameplay-critical geometry;
- oversized visible bounds;
- functions/random conditions/non-serializable data;
- cross-layout duplicate IDs and missing scene/prefab/state/animation refs;
- deep immutability;
- deterministic repeat/condition expansion;
- three scene reloads with stable instance/listener/object counts;
- dev/production layout digest equality;
- larger source canvas/different origin/visible bounds with unchanged logical collision/navigation/interaction;
- save digest unchanged after layout validation, rendering, editing and export.

### 6. Migrate in dependency order

Recommended sequence:

1. Finish Fishing schema/consumer and HUD layout; it is the proving ground.
2. Town visual-only terrain/landmark layers, retaining all gameplay geometry in `town.js`.
3. House interiors, with persistent furniture transforms explicitly protected.
4. Grocer/Paws/Harbour shop compositions.
5. Shared restaurant venue template plus per-venue layout variants.
6. Waste, Lawn, Beach, River, House Rescue and Power Wash one at a time.
7. Global HUDs, overlays, popups, tutorials and transitions as responsive component layouts.

Each migration must preserve the stored visual baseline unless separately approved, pass all supported viewports, and remove the corresponding entries from the hard-coded inventory or classify them as justified local effects.

## Acceptance gate for repair

Do not call the architecture scene-layout ready until:

- all nine currently failing controlled probes reject correctly;
- the catalogue accounts for every production scene and player-visible overlay;
- no gameplay geometry can be edited through visual-layout export;
- a source canvas/origin/bounds replacement leaves gameplay geometry byte-identical;
- three reload cycles keep stable object/listener counts for every migrated scene;
- layouts produce the same digest in development and production;
- layout operations cannot mutate a schema-37 save fixture;
- the hard-coded inventory has an explicit disposition for every record in each migrated surface.
