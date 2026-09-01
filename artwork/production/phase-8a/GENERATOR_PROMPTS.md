# KindWorks Phase 8A Generator-Ready Prompt Book

Generated from `kindworks.phase-8a.premium-vertical-slice` revision 1. This is a production specification, not permission to mass-generate or integrate artwork. Generate and review one dependency wave at a time.

## 01 — terrain.town.slice.grass

- Family: `family.town-terrain.slice`
- Purpose: large varied grass foundation for the representative town block
- Output: `1254×1254` PNG, alpha=false; single untrimmed image
- Logical display: `1254×1254`
- Camera: top-down orthographic
- Anchor: tile-top-left at `0, 0`
- States: default
- Layers: main
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/town-grass-tile.v1.png`
- Prefab/state: `prefab.phase-8a.terrain.grass` / `state.phase-8a.terrain.grass`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.terrain.grass`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for large varied grass foundation for the representative town block The approved bright spring-green village meadow texture with dense irregular grass blades, softly varied green patches, and sparse naturally scattered white, yellow, and red flowers. Use KindWorks Visual Style Bible v4. Exact output: 1254×1254px PNG, fully opaque, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; paths, stones, rocks, bushes, trees, large plants, objects, baked shadows, organised flower rows, or visible hard-edged panels

### Delivery

Return only town-grass-tile.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": 0,
      "y": 0,
      "width": 1254,
      "height": 1254
    },
    "collision": null,
    "navigation": null,
    "interaction": null,
    "touch": null
  },
  "sockets": []
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 02 — terrain.town.slice.pavement

- Family: `family.town-terrain.slice`
- Purpose: complete modular pavement surface with centre, four grass edges, convex and concave corners, and natural grass transitions
- Output: `256×256` PNG, alpha=false; 4×4; 16 frames; 64×64px each; order: centre, grass-edge-north, grass-edge-east, grass-edge-south, grass-edge-west, grass-outer-corner-north-east, grass-outer-corner-south-east, grass-outer-corner-south-west, grass-outer-corner-north-west, grass-inner-corner-north-east, grass-inner-corner-south-east, grass-inner-corner-south-west, grass-inner-corner-north-west, grass-only, isolated-paver-transition, worn-grass-transition
- Logical display: `64×64`
- Camera: top-down orthographic
- Anchor: tile-top-left at `0, 0`
- States: centre, grass-edge-north, grass-edge-east, grass-edge-south, grass-edge-west, grass-outer-corner-north-east, grass-outer-corner-south-east, grass-outer-corner-south-west, grass-outer-corner-north-west, grass-inner-corner-north-east, grass-inner-corner-south-east, grass-inner-corner-south-west, grass-inner-corner-north-west, grass-only, isolated-paver-transition, worn-grass-transition
- Layers: main
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/town-pavement-tile.v1.png`
- Prefab/state: `prefab.phase-8a.terrain.pavement` / `state.phase-8a.terrain.pavement`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.terrain.pavement`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for complete modular pavement surface with centre, four grass edges, convex and concave corners, and natural grass transitions A complete pavement surface sheet in the exact declared frame order: centre; grass edges north, east, south, west; four convex outer corners; four concave inner corners; grass-only; an isolated paver transition; and a worn grass transition. Use warm pale Willowmere paving stones with a readable 32-unit rhythm. Every edge and corner must assemble without seams. Transition pixels must use the approved town grass tile exactly, with a restrained one-to-three-pixel irregular grass-and-earth edge and no gutters between frames. Use KindWorks Visual Style Bible v4. Exact output: 256×256px PNG, fully opaque, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; road markings, grid labels, frame dividers, gutters, objects, baked characters, perspective tilt, a different grass palette, or disconnected tile edges

### Delivery

Return only town-pavement-tile.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64
    },
    "collision": null,
    "navigation": null,
    "interaction": null,
    "touch": null
  },
  "sockets": []
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 03 — terrain.town.slice.road

- Family: `family.town-terrain.slice`
- Purpose: complete modular road surface with directional kerbs, rounded corners, and pavement transitions
- Output: `256×256` PNG, alpha=false; 4×4; 16 frames; 64×64px each; order: surface-a, surface-b, surface-c, surface-d, kerb-north, kerb-east, kerb-south, kerb-west, rounded-corner-north-east, rounded-corner-south-east, rounded-corner-south-west, rounded-corner-north-west, pavement-transition-north, pavement-transition-east, pavement-transition-south, pavement-transition-west
- Logical display: `64×64`
- Camera: top-down orthographic
- Anchor: tile-top-left at `0, 0`
- States: surface-a, surface-b, surface-c, surface-d, kerb-north, kerb-east, kerb-south, kerb-west, rounded-corner-north-east, rounded-corner-south-east, rounded-corner-south-west, rounded-corner-north-west, pavement-transition-north, pavement-transition-east, pavement-transition-south, pavement-transition-west
- Layers: main
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/town-road-set.v1.png`
- Prefab/state: `prefab.phase-8a.terrain.road` / `state.phase-8a.terrain.road`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.terrain.road`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for complete modular road surface with directional kerbs, rounded corners, and pavement transitions A complete modular road sheet in the exact declared frame order: four seamless blue-grey asphalt variants; straight kerbs north, east, south, west; rounded road corners north-east, south-east, south-west, north-west; and pavement transitions north, east, south, west. Match the approved grass and warm pale pavement exactly. Every connection must assemble without seams. Use KindWorks Visual Style Bible v4. Exact output: 256×256px PNG, fully opaque, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; vehicles, road markings, crossings, grid labels, frame dividers, gutters, objects, baked characters, square corner protrusions, or disconnected tile edges

### Delivery

Return only town-road-set.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": 0,
      "y": 0,
      "width": 64,
      "height": 64
    },
    "collision": null,
    "navigation": null,
    "interaction": null,
    "touch": null
  },
  "sockets": []
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 04 — terrain.town.slice.river-edge

- Family: `family.town-terrain.slice`
- Purpose: tree-free Willow River banks and water edge beside the block
- Output: `512×64` PNG, alpha=true; 4×1; 4 frames; 128×64px each; order: west-straight, east-straight, west-transition, east-transition
- Logical display: `128×64`
- Camera: top-down orthographic
- Anchor: tile-top-left at `0, 0`
- States: west-straight, east-straight, west-transition, east-transition
- Layers: main
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/town-river-edge-sheet.v1.png`
- Prefab/state: `prefab.phase-8a.terrain.river-edge` / `state.phase-8a.terrain.river-edge`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.terrain.river-edge`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for tree-free Willow River banks and water edge beside the block Four horizontal frames in the exact order specified: west straight bank, east straight bank, west transition, east transition. Blue flowing water meets a narrow stone-and-earth bank; stones remain on land at the water edge, never floating in the river. Use KindWorks Visual Style Bible v4. Exact output: 512×64px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; trees, bridge, floating rocks, boats, characters, mirrored labels, or water wider than the declared protected geometry

### Delivery

Return only town-river-edge-sheet.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": 0,
      "y": 0,
      "width": 128,
      "height": 64
    },
    "collision": {
      "kind": "rectangle",
      "x": 20,
      "y": 0,
      "width": 88,
      "height": 64
    },
    "navigation": {
      "kind": "rectangle",
      "x": 20,
      "y": 0,
      "width": 88,
      "height": 64
    },
    "interaction": null,
    "touch": null
  },
  "sockets": []
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 05 — building.town.slice.house-6-bay-cottage

- Family: `family.house-exterior.slice`
- Purpose: house-6 bay-cottage exterior with clean, dirty, job-ready, and upgraded visual states
- Output: `1024×192` PNG, alpha=true; 4×1; 4 frames; 256×192px each; order: clean, weathered, job-ready, upgraded
- Logical display: `256×192`
- Camera: three-quarter top-down town exterior
- Anchor: front-door-ground at `0.5, 0.916667`
- States: clean, weathered, job-ready, upgraded
- Layers: main
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/house-6-bay-cottage-states.v1.png`
- Prefab/state: `prefab.phase-8a.house-6` / `state.phase-8a.house-6`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.house-6`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for house-6 bay-cottage exterior with clean, dirty, job-ready, and upgraded visual states One bay cottage kept pixel-perfect in the same position across four horizontal frames: cared-for clean, time-weathered, visibly job-ready but still habitable, and tasteful upgraded. The front door socket and building footprint cannot move between frames. Use KindWorks Visual Style Bible v4. Exact output: 1024×192px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; interior cutaway, people, lawn, fence, separate environment background, moved door, frame-to-frame silhouette drift, or destructive damage

### Delivery

Return only house-6-bay-cottage-states.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -128,
      "y": -176,
      "width": 256,
      "height": 192
    },
    "collision": {
      "kind": "rectangle",
      "x": -97.5,
      "y": -115,
      "width": 195,
      "height": 110
    },
    "navigation": {
      "kind": "rectangle",
      "x": -103,
      "y": -120,
      "width": 206,
      "height": 120
    },
    "interaction": {
      "kind": "circle",
      "x": 0,
      "y": -7,
      "radius": 92
    },
    "touch": {
      "kind": "rectangle",
      "x": -110,
      "y": -130,
      "width": 220,
      "height": 145
    }
  },
  "sockets": [
    {
      "id": "door",
      "logical": {
        "x": 0,
        "y": -6
      }
    },
    {
      "id": "approach",
      "logical": {
        "x": 0,
        "y": 25
      }
    },
    {
      "id": "roof-status",
      "logical": {
        "x": 0,
        "y": -150
      }
    }
  ]
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 06 — terrain.town.slice.lawn-house-6

- Family: `family.world-lawn.slice`
- Purpose: the authored house-6 lawn in all four growth states
- Output: `1280×352` PNG, alpha=true; 4×1; 4 frames; 320×352px each; order: fresh-cut, growing, long, job-ready
- Logical display: `320×352`
- Camera: top-down orthographic
- Anchor: yard-centre at `0.5, 0.5`
- States: fresh-cut, growing, long, job-ready
- Layers: main
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/lawn-house-6-growth-states.v1.png`
- Prefab/state: `prefab.phase-8a.lawn-house-6` / `state.phase-8a.lawn-house-6`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.lawn-house-6`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for the authored house-6 lawn in all four growth states Four horizontally aligned versions of the exact same 310×340 house yard: freshly cut below 20 grass height, growing 20–44, long 45–69, and overgrown job-ready at 70+. Preserve every boundary and gate opening; only grass height, density, weeds, and small flowers change. Use KindWorks Visual Style Bible v4. Exact output: 1280×352px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; house, road, mower, person, text, status badge, moved yard boundary, or changed gate position

### Delivery

Return only lawn-house-6-growth-states.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -160,
      "y": -176,
      "width": 320,
      "height": 352
    },
    "collision": null,
    "navigation": null,
    "interaction": {
      "kind": "circle",
      "x": 0,
      "y": 95,
      "radius": 105
    },
    "touch": {
      "kind": "rectangle",
      "x": -155,
      "y": -170,
      "width": 310,
      "height": 340
    }
  },
  "sockets": [
    {
      "id": "job-entry",
      "logical": {
        "x": 0,
        "y": 95
      }
    },
    {
      "id": "gate-south",
      "logical": {
        "x": 0,
        "y": 170
      }
    }
  ]
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 07 — prop.town.slice.large-oak.shadow

- Family: `family.layered-tree.slice`
- Purpose: separate ground shadow for the large occluding oak
- Output: `128×160` PNG, alpha=true; single untrimmed image
- Logical display: `128×160`
- Camera: three-quarter top-down town prop
- Anchor: tree-ground at `0.5, 0.9`
- States: default
- Layers: shadow
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/large-oak-shadow.v1.png`
- Prefab/state: `prefab.phase-8a.large-oak` / `state.phase-8a.large-oak`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.large-oak`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for separate ground shadow for the large occluding oak Only the soft pixel-art ground shadow of a large oak, aligned to ground contact (64,144); all other pixels fully transparent. Use KindWorks Visual Style Bible v4. Exact output: 128×160px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; trunk, foliage, grass, opaque background, hard black ellipse, or shifted anchor

### Delivery

Return only large-oak-shadow.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -64,
      "y": -144,
      "width": 128,
      "height": 160
    },
    "collision": null,
    "navigation": null,
    "interaction": null,
    "touch": null
  },
  "sockets": []
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 08 — prop.town.slice.large-oak.trunk

- Family: `family.layered-tree.slice`
- Purpose: large-oak trunk and lower body used for collision and Y-sort
- Output: `128×160` PNG, alpha=true; single untrimmed image
- Logical display: `128×160`
- Camera: three-quarter top-down town prop
- Anchor: tree-ground at `0.5, 0.9`
- States: default
- Layers: trunk
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/large-oak-trunk.v1.png`
- Prefab/state: `prefab.phase-8a.large-oak` / `state.phase-8a.large-oak`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.large-oak`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for large-oak trunk and lower body used for collision and Y-sort Only the oak trunk, roots, and low branches needed below the canopy; align with the shared 128×160 tree canvas and ground contact (64,144). Use KindWorks Visual Style Bible v4. Exact output: 128×160px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; full canopy, ground shadow, fruit, sign, character, or opaque background

### Delivery

Return only large-oak-trunk.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -43,
      "y": -62,
      "width": 87,
      "height": 97
    },
    "collision": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 22
    },
    "navigation": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 50
    },
    "interaction": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 72
    },
    "touch": {
      "kind": "rectangle",
      "x": -44,
      "y": -62,
      "width": 88,
      "height": 100
    }
  },
  "sockets": [
    {
      "id": "ground",
      "logical": {
        "x": 0,
        "y": 0
      }
    },
    {
      "id": "canopy",
      "logical": {
        "x": 0,
        "y": -62
      }
    }
  ]
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 09 — prop.town.slice.large-oak.canopy

- Family: `family.layered-tree.slice`
- Purpose: foreground canopy that correctly occludes residents behind the large oak
- Output: `128×160` PNG, alpha=true; single untrimmed image
- Logical display: `128×160`
- Camera: three-quarter top-down town prop
- Anchor: tree-ground at `0.5, 0.9`
- States: default
- Layers: foreground-canopy
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/large-oak-canopy.v1.png`
- Prefab/state: `prefab.phase-8a.large-oak` / `state.phase-8a.large-oak`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.large-oak`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for foreground canopy that correctly occludes residents behind the large oak Only a lush rounded large-oak canopy, aligned with the shared tree canvas. Lower canopy pixels must naturally pass in front of a resident walking behind the trunk while leaving the ground-contact region transparent. Use KindWorks Visual Style Bible v4. Exact output: 128×160px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; trunk, roots, ground shadow, background, rectangular foliage mass, or missing lower occlusion fringe

### Delivery

Return only large-oak-canopy.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -64,
      "y": -144,
      "width": 128,
      "height": 160
    },
    "collision": null,
    "navigation": null,
    "interaction": null,
    "touch": null
  },
  "sockets": []
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 10 — prop.town.slice.public-bin

- Family: `family.small-town-prop.slice`
- Purpose: compact public bin for the town block
- Output: `192×80` PNG, alpha=true; 3×1; 3 frames; 64×80px each; order: normal, full, tipped
- Logical display: `56×70`
- Camera: three-quarter top-down town prop
- Anchor: bin-ground at `0.5, 0.875`
- States: normal, full, tipped
- Layers: main
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/public-bin-states.v1.png`
- Prefab/state: `prefab.phase-8a.public-bin` / `state.phase-8a.public-bin`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.public-bin`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for compact public bin for the town block Three horizontally aligned frames of the same small dark-green Willowmere public bin with a tiny clear litter emblem: normal, visibly full, and tipped. Preserve its model, scale, ground contact, and canvas position across every state. Use KindWorks Visual Style Bible v4. Exact output: 192×80px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; oversized wheelie bin, text label, recycling brand, loose rubbish outside the full-state boundary, missing state, or changed ground contact

### Delivery

Return only public-bin-states.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -20,
      "y": -45,
      "width": 56,
      "height": 70
    },
    "collision": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 18
    },
    "navigation": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 28
    },
    "interaction": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 72
    },
    "touch": {
      "kind": "rectangle",
      "x": -28,
      "y": -35,
      "width": 56,
      "height": 70
    }
  },
  "sockets": [
    {
      "id": "status",
      "logical": {
        "x": 0,
        "y": -42
      }
    }
  ]
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 11 — prop.town.slice.white-fence

- Family: `family.small-town-prop.slice`
- Purpose: house-6 white picket fence segment with gate socket
- Output: `256×64` PNG, alpha=true; 2×1; 2 frames; 128×64px each; order: straight, gate
- Logical display: `128×64`
- Camera: three-quarter top-down town prop
- Anchor: fence-ground at `0.5, 0.875`
- States: straight, gate
- Layers: main
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/white-fence-segment.v1.png`
- Prefab/state: `prefab.phase-8a.white-fence` / `state.phase-8a.white-fence`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.house-6-fence`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for house-6 white picket fence segment with gate socket Two horizontal frames: a 128-unit white picket fence and a matching centred gate. Keep posts, baseline, endpoints, and ground contact identical so segments join without seams. Use KindWorks Visual Style Bible v4. Exact output: 256×64px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; lawn, house, flowers, perspective mismatch, open gate animation, or nonmatching endpoints

### Delivery

Return only white-fence-segment.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -64,
      "y": -56,
      "width": 128,
      "height": 64
    },
    "collision": {
      "kind": "rectangle",
      "x": -64,
      "y": -10,
      "width": 128,
      "height": 16
    },
    "navigation": {
      "kind": "rectangle",
      "x": -64,
      "y": -12,
      "width": 128,
      "height": 20
    },
    "interaction": null,
    "touch": null
  },
  "sockets": [
    {
      "id": "segment-left",
      "logical": {
        "x": -64,
        "y": 0
      }
    },
    {
      "id": "segment-right",
      "logical": {
        "x": 64,
        "y": 0
      }
    },
    {
      "id": "gate-centre",
      "logical": {
        "x": 0,
        "y": 0
      }
    }
  ]
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 12 — prop.town.slice.rubbish-can

- Family: `family.small-town-prop.slice`
- Purpose: one collectable rubbish item near the public bin
- Output: `64×64` PNG, alpha=true; single untrimmed image
- Logical display: `34×28`
- Camera: three-quarter top-down town prop
- Anchor: rubbish-ground at `0.5, 0.75`
- States: present, collected
- Layers: main
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/rubbish-crushed-can.v1.png`
- Prefab/state: `prefab.phase-8a.rubbish-can` / `state.phase-8a.rubbish-can`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.rubbish-can`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for one collectable rubbish item near the public bin A single clearly readable but small crushed drinks can, isolated on transparency, suitable for a town cleanup interaction. Use KindWorks Visual Style Bible v4. Exact output: 64×64px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; card background, label, multiple rubbish items, bin, hand cursor, or giant scale

### Delivery

Return only rubbish-crushed-can.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -17,
      "y": -22,
      "width": 34,
      "height": 28
    },
    "collision": null,
    "navigation": null,
    "interaction": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 54
    },
    "touch": {
      "kind": "rectangle",
      "x": -24,
      "y": -24,
      "width": 48,
      "height": 48
    }
  },
  "sockets": []
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 13 — prop.town.slice.flower-planter

- Family: `family.small-town-prop.slice`
- Purpose: small flower planter decoration beside house-6
- Output: `64×64` PNG, alpha=true; single untrimmed image
- Logical display: `48×48`
- Camera: three-quarter top-down town prop
- Anchor: planter-ground at `0.5, 0.875`
- States: default
- Layers: main
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/flower-planter.v1.png`
- Prefab/state: `prefab.phase-8a.flower-planter` / `state.phase-8a.flower-planter`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.flower-planter`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for small flower planter decoration beside house-6 A compact warm-stone planter with restrained mixed cottage flowers, readable at 48 logical pixels and isolated on transparency. Use KindWorks Visual Style Bible v4. Exact output: 64×64px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; large garden bed, sign, text, person, background, or flowers beyond the 64px canvas

### Delivery

Return only flower-planter.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -24,
      "y": -42,
      "width": 48,
      "height": 48
    },
    "collision": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 14
    },
    "navigation": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 20
    },
    "interaction": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 56
    },
    "touch": {
      "kind": "rectangle",
      "x": -24,
      "y": -36,
      "width": 48,
      "height": 48
    }
  },
  "sockets": []
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 14 — character.player.slice.resident

- Family: `family.resident-character.slice`
- Purpose: controllable player resident for the premium slice
- Output: `256×256` PNG, alpha=true; 4×4; 16 frames; 64×64px each; order: down-0, down-1, down-2, down-3, left-0, left-1, left-2, left-3, right-0, right-1, right-2, right-3, up-0, up-1, up-2, up-3
- Logical display: `40×54`
- Camera: three-quarter top-down resident
- Anchor: resident-feet at `0.5, 0.875`
- States: default
- Layers: main
- Directions: down, left, right, up
- Runtime filename: `public/assets/runtime/phase-8a/player-resident-walk.v1.png`
- Prefab/state: `prefab.phase-8a.player` / `state.phase-8a.player`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.player`; `LawnCareScene` → `layout.phase-8a.lawn-care.representative` → `instance.phase-8a.lawn.player-reference`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for controllable player resident for the premium slice A friendly customizable KindWorks resident. Four rows down, left, right, up; four columns idle-contact, passing, idle-contact, passing. Keep anatomy, clothing, hair, palette, feet, and hand sockets aligned across all 16 frames. Use KindWorks Visual Style Bible v4. Exact output: 256×256px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; weapons, tool baked into hand, cast shadow, frame labels, inconsistent clothing, missing direction, mirrored asymmetric details, or cropped hair

### Delivery

Return only player-resident-walk.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -20,
      "y": -54,
      "width": 40,
      "height": 54
    },
    "collision": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 16
    },
    "navigation": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 16
    },
    "interaction": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 60
    },
    "touch": {
      "kind": "rectangle",
      "x": -24,
      "y": -54,
      "width": 48,
      "height": 60
    }
  },
  "sockets": [
    {
      "id": "right-hand",
      "logical": {
        "x": 12,
        "y": -28
      }
    },
    {
      "id": "left-hand",
      "logical": {
        "x": -12,
        "y": -28
      }
    },
    {
      "id": "head",
      "logical": {
        "x": 0,
        "y": -50
      }
    }
  ]
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 15 — character.npc.slice.resident-a

- Family: `family.resident-character.slice`
- Purpose: one independently moving town NPC
- Output: `256×256` PNG, alpha=true; 4×4; 16 frames; 64×64px each; order: down-0, down-1, down-2, down-3, left-0, left-1, left-2, left-3, right-0, right-1, right-2, right-3, up-0, up-1, up-2, up-3
- Logical display: `42×66`
- Camera: three-quarter top-down resident
- Anchor: resident-feet at `0.5, 0.875`
- States: default
- Layers: main
- Directions: down, left, right, up
- Runtime filename: `public/assets/runtime/phase-8a/npc-resident-a-walk.v1.png`
- Prefab/state: `prefab.phase-8a.npc-resident-a` / `state.phase-8a.npc-resident-a`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.npc-resident-a`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for one independently moving town NPC A distinct adult Willowmere NPC using the exact same four-direction, four-frame grid and foot alignment as the player while remaining visibly a different person. Use KindWorks Visual Style Bible v4. Exact output: 256×256px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; player duplicate, name text, speech bubble, gift baked into sprite, shadow, missing direction, or frame-to-frame costume changes

### Delivery

Return only npc-resident-a-walk.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -21,
      "y": -66,
      "width": 42,
      "height": 66
    },
    "collision": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 16
    },
    "navigation": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 16
    },
    "interaction": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 74
    },
    "touch": {
      "kind": "rectangle",
      "x": -24,
      "y": -58,
      "width": 48,
      "height": 66
    }
  },
  "sockets": [
    {
      "id": "thought",
      "logical": {
        "x": 0,
        "y": -64
      }
    },
    {
      "id": "gift",
      "logical": {
        "x": 13,
        "y": -30
      }
    }
  ]
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 16 — character.animal.slice.dog

- Family: `family.animal-character.slice`
- Purpose: one roaming and follow-capable dog
- Output: `192×160` PNG, alpha=true; 4×4; 16 frames; 48×40px each; order: down-0, down-1, down-2, down-3, left-0, left-1, left-2, left-3, right-0, right-1, right-2, right-3, up-0, up-1, up-2, up-3
- Logical display: `36×30`
- Camera: three-quarter top-down animal
- Anchor: animal-feet at `0.5, 0.875`
- States: default
- Layers: main
- Directions: down, left, right, up
- Runtime filename: `public/assets/runtime/phase-8a/animal-dog-walk.v1.png`
- Prefab/state: `prefab.phase-8a.animal-dog` / `state.phase-8a.animal-dog`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.animal-dog`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for one roaming and follow-capable dog A friendly medium-small Willowmere dog in four directional rows and four walk frames per row, aligned to the declared feet, food, and friendship sockets. Use KindWorks Visual Style Bible v4. Exact output: 192×160px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; collar text, food bowl, owner, speech bubble, shadow, missing tail motion, or inconsistent markings between frames

### Delivery

Return only animal-dog-walk.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -18,
      "y": -30,
      "width": 36,
      "height": 30
    },
    "collision": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 12
    },
    "navigation": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 12
    },
    "interaction": {
      "kind": "circle",
      "x": 0,
      "y": 0,
      "radius": 70
    },
    "touch": {
      "kind": "rectangle",
      "x": -24,
      "y": -34,
      "width": 48,
      "height": 48
    }
  },
  "sockets": [
    {
      "id": "food",
      "logical": {
        "x": 15,
        "y": -12
      }
    },
    {
      "id": "friendship",
      "logical": {
        "x": 0,
        "y": -34
      }
    }
  ]
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 17 — ui.town.slice.lawn-interaction

- Family: `family.feedback-ui.slice`
- Purpose: contextual lawn-job interaction prompt
- Output: `128×64` PNG, alpha=true; 2×1; 2 frames; 64×64px each; order: available, pressed
- Logical display: `52×52`
- Camera: screen-facing pixel UI
- Anchor: prompt-centre at `0.5, 0.5`
- States: available, pressed
- Layers: main
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/lawn-interaction-prompt.v1.png`
- Prefab/state: `prefab.phase-8a.lawn-interaction` / `state.phase-8a.lawn-interaction`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.lawn-interaction`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for contextual lawn-job interaction prompt Two frames of a compact contextual action badge: available and visibly pressed. Use a simple mower/grass action symbol with no words; readable at phone landscape size. Use KindWorks Visual Style Bible v4. Exact output: 128×64px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; long text, permanent HUD panel, coin amount, level number, hand cursor, or more than one action

### Delivery

Return only lawn-interaction-prompt.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -26,
      "y": -26,
      "width": 52,
      "height": 52
    },
    "collision": null,
    "navigation": null,
    "interaction": null,
    "touch": {
      "kind": "rectangle",
      "x": -32,
      "y": -32,
      "width": 64,
      "height": 64
    }
  },
  "sockets": []
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 18 — ui.town.slice.coin-reward-burst

- Family: `family.feedback-ui.slice`
- Purpose: short saved-reward confirmation after the lawn state transition
- Output: `384×64` PNG, alpha=true; 6×1; 6 frames; 64×64px each; order: burst-0, burst-1, burst-2, burst-3, burst-4, burst-5
- Logical display: `64×64`
- Camera: screen-facing pixel UI
- Anchor: burst-centre at `0.5, 0.5`
- States: rewarded
- Layers: main
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/coin-reward-burst.v1.png`
- Prefab/state: `prefab.phase-8a.coin-reward` / `state.phase-8a.coin-reward`
- Scene destination: `TownScene` → `layout.phase-8a.town-block.house-6` → `instance.phase-8a.town.lawn-reward`; `LawnCareScene` → `layout.phase-8a.lawn-care.representative` → `instance.phase-8a.lawn.reward`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for short saved-reward confirmation after the lawn state transition Six-frame restrained golden coin sparkle burst, expanding and settling without text. Frame zero starts small; final frame fades cleanly to transparency. Use KindWorks Visual Style Bible v4. Exact output: 384×64px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; coin value, currency grant logic, chest, button, confetti filling the canvas, endless loop, or opaque background

### Delivery

Return only coin-reward-burst.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -32,
      "y": -32,
      "width": 64,
      "height": 64
    },
    "collision": null,
    "navigation": null,
    "interaction": null,
    "touch": null
  },
  "sockets": []
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 19 — minigame.lawn.slice.board-tiles

- Family: `family.lawn-minigame.slice`
- Purpose: full-screen Lawn Care board surface states
- Output: `256×64` PNG, alpha=false; 4×1; 4 frames; 64×64px each; order: tall, cut-vertical, cut-horizontal, hedge
- Logical display: `64×64`
- Camera: top-down orthographic board
- Anchor: cell-centre at `0.5, 0.5`
- States: tall, cut-vertical, cut-horizontal, hedge
- Layers: main
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/lawn-care-board-tiles.v1.png`
- Prefab/state: `prefab.phase-8a.lawn-board-tiles` / `state.phase-8a.lawn-board-tiles`
- Scene destination: `LawnCareScene` → `layout.phase-8a.lawn-care.representative` → `instance.phase-8a.lawn.board-tiles`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for full-screen Lawn Care board surface states Four seamless board cells in exact order: tall grass, vertically raked cut lines, horizontally raked cut lines, and impassable hedge. All cells share edges, lighting, scale, and camera. Use KindWorks Visual Style Bible v4. Exact output: 256×64px PNG, fully opaque, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; mower, weeds, UI, labels, perspective tilt, mismatched tile edges, or ambiguous cut direction

### Delivery

Return only lawn-care-board-tiles.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -32,
      "y": -32,
      "width": 64,
      "height": 64
    },
    "collision": null,
    "navigation": null,
    "interaction": {
      "kind": "rectangle",
      "x": -32,
      "y": -32,
      "width": 64,
      "height": 64
    },
    "touch": {
      "kind": "rectangle",
      "x": -32,
      "y": -32,
      "width": 64,
      "height": 64
    }
  },
  "sockets": []
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 20 — minigame.lawn.slice.weed-tiles

- Family: `family.lawn-minigame.slice`
- Purpose: three readable Lawn Care weed types
- Output: `192×64` PNG, alpha=true; 3×1; 3 frames; 64×64px each; order: normal, tough, woody
- Logical display: `64×64`
- Camera: top-down orthographic board
- Anchor: cell-centre at `0.5, 0.5`
- States: normal, tough, woody
- Layers: main
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/lawn-care-weed-tiles.v1.png`
- Prefab/state: `prefab.phase-8a.lawn-weed-tiles` / `state.phase-8a.lawn-weed-tiles`
- Scene destination: `LawnCareScene` → `layout.phase-8a.lawn-care.representative` → `instance.phase-8a.lawn.weed-tiles`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for three readable Lawn Care weed types Three transparent overlays in exact order: normal weed, tougher leafy weed, and woody obstruction. Each is unmistakable without a text label and remains centred in a 64px lawn cell. Use KindWorks Visual Style Bible v4. Exact output: 192×64px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; grass background, card, label, mower, duplicated plant, or shifted baseline

### Delivery

Return only lawn-care-weed-tiles.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -32,
      "y": -32,
      "width": 64,
      "height": 64
    },
    "collision": null,
    "navigation": null,
    "interaction": null,
    "touch": null
  },
  "sockets": []
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 21 — minigame.lawn.slice.mower

- Family: `family.lawn-minigame.slice`
- Purpose: directional mower token for the Lawn Care board
- Output: `256×64` PNG, alpha=true; 4×1; 4 frames; 64×64px each; order: down, left, right, up
- Logical display: `56×56`
- Camera: top-down orthographic board
- Anchor: cell-centre at `0.5, 0.5`
- States: down, left, right, up
- Layers: main
- Directions: down, left, right, up
- Runtime filename: `public/assets/runtime/phase-8a/lawn-care-mower.v1.png`
- Prefab/state: `prefab.phase-8a.lawn-mower` / `state.phase-8a.lawn-mower`
- Scene destination: `LawnCareScene` → `layout.phase-8a.lawn-care.representative` → `instance.phase-8a.lawn.mower`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for directional mower token for the Lawn Care board The same compact green mower in four exact directional frames down, left, right, up, centred within a 64px board cell. Direction must remain obvious at narrow-phone scale. Use KindWorks Visual Style Bible v4. Exact output: 256×64px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; operator, joystick, direction button, text, grass background, cast shadow outside cell, or inconsistent mower model

### Delivery

Return only lawn-care-mower.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -28,
      "y": -28,
      "width": 56,
      "height": 56
    },
    "collision": {
      "kind": "rectangle",
      "x": -24,
      "y": -24,
      "width": 48,
      "height": 48
    },
    "navigation": {
      "kind": "rectangle",
      "x": -24,
      "y": -24,
      "width": 48,
      "height": 48
    },
    "interaction": null,
    "touch": {
      "kind": "rectangle",
      "x": -32,
      "y": -32,
      "width": 64,
      "height": 64
    }
  },
  "sockets": []
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass

## 22 — ui.lawn.slice.controls

- Family: `family.lawn-minigame.slice`
- Purpose: only the exit, undo, and hint icons required by the representative screen
- Output: `192×64` PNG, alpha=true; 3×1; 3 frames; 64×64px each; order: exit, undo, hint
- Logical display: `52×52`
- Camera: screen-facing pixel UI
- Anchor: control-centre at `0.5, 0.5`
- States: exit, undo, hint
- Layers: main
- Directions: none
- Runtime filename: `public/assets/runtime/phase-8a/lawn-care-essential-controls.v1.png`
- Prefab/state: `prefab.phase-8a.lawn-controls` / `state.phase-8a.lawn-controls`
- Scene destination: `LawnCareScene` → `layout.phase-8a.lawn-care.representative` → `instance.phase-8a.lawn.controls`
- Fallback: labelled checker placeholder in Asset Lab; transparent safe fallback with recorded registry failure

### Generator prompt

Create one production-ready KindWorks pixel-art asset for only the exit, undo, and hint icons required by the representative screen Three compact, coherent pixel UI icons in order: close/exit, undo, and hint. No text. Each icon is centred with clear normal-state contrast and space for runtime pressed/disabled tint. Use KindWorks Visual Style Bible v4. Exact output: 192×64px PNG, transparent alpha, untrimmed, nearest-neighbour pixel art. Preserve the declared camera, scale, anchor, state alignment, frame order, and empty padding. No presentation mockup.

### Negative prompt / forbidden output

provider watermark, signature, logo, caption, or embedded text; photorealism, vector-soft edges, antialiasing, blur, or resampling noise; automatic trimming, cropped canvas, changed frame order, or unequal frame alignment; unrequested UI, characters, props, scenery, shadows, or background colour; perspective, scale, palette, outline, or lighting that conflicts with the KindWorks Visual Style Bible v4; movement arrows, reset, level, timer, served counter, status bar, text labels, or decorative panel wider than one cell

### Delivery

Return only lawn-care-essential-controls.v1.png plus provenance metadata; do not composite it into a screenshot or rename it.

### Geometry and sockets

```json
{
  "geometry": {
    "visual": {
      "kind": "rectangle",
      "x": -26,
      "y": -26,
      "width": 52,
      "height": 52
    },
    "collision": null,
    "navigation": null,
    "interaction": null,
    "touch": {
      "kind": "rectangle",
      "x": -32,
      "y": -32,
      "width": 64,
      "height": 64
    }
  },
  "sockets": []
}
```

### Automated validation

- semantic ID is unique and matches the approved manifest entry
- filename and file format exactly match the contract
- canvas, frame grid, frame count, alpha mode, and untrimmed alignment are exact
- nearest-neighbour sampling is preserved and no smoothing metadata is introduced
- ground anchor, sockets, visual bounds, and gameplay geometry remain independently addressable
- all required states, layers, directions, and animation frames are present
- texture budget, scene-pack dependency, fallback, and orphan-reference checks pass
