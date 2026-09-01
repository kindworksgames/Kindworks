# Town grass and pavement integration

Date: 2026-09-01

## Approved artwork

- `terrain.town.slice.grass` — approved runtime grass tile.
- `terrain.town.slice.pavement` — approved 4×4 pavement spritesheet with centre, grass edges, outer corners, inner corners, grass-only, isolated-paver, and worn-transition frames.
- Pavement SHA-256: `1cbc77da46624f987773f345c7cfd87c002d3ab64deab00790707052ab1c5c4e`.
- Pavement approval token: `1cbc77da4662`.

Both assets are selected through the semantic manifest. `TownScene` does not contain their raw filenames or runtime texture keys.

## Reference-led town rules

The approved grass is the single world ground surface. Rivers, ponds, beach, roads, bridges, buildings, and foreground objects remain separate higher-depth surfaces. Legacy district colour panels, decorative grass dots, house background boxes, lawn colour boxes, and the Commons background box are not drawn over the approved ground.

The pavement system has four independent presentation uses:

1. Road verges follow the existing authored road centreline and are rounded at route points beneath the unchanged grey road surface.
2. Park footpaths follow presentation-only reference paths; the Commons path skirts the pond and playground sand instead of covering the playground.
3. Every authored house receives a narrow front-door walk. Its street end is computed from the nearest horizontal road centreline and exact road half-width, so it touches the road edge without entering the road or stopping in the grass.
4. Old Market, High Street, the cinema, and South Shore Café use bounded commercial forecourts. The café pad uses centre pavement only so it does not bake a green grass rectangle into the beach.

All pavement objects are bounded. There is no full-world pavement object or runtime mask, so pavement cannot cover the river, beach, or unrelated grass if masking support changes.

## Protected geometry

- `ROADS`, logical house rectangles, entrances, collision geometry, navigation geometry, interactions, progression, and saves are unchanged.
- The Commons reference adjustment exists only in `TOWN_REFERENCE_LAYOUT.pavement.visualPathOverrides`; it does not mutate the protected NPC/navigation path data.
- Commercial forecourts and doorway walks are presentation-only and non-interactive.

## Verification

- Asset-contract validation: PASS, 167/167 cases.
- Focused approved-scene and artwork tests: PASS, 30/30.
- Approval-count and manifest regression tests: PASS, 25/25.
- Production build and visual pipeline validators: PASS.
- Automated responsive audit: PASS execution across 7 landscape profiles and 21 repeated scene transitions; 0 controls outside the viewport, 0 sub-44px required controls, and 0 document overflows.
- Interactive clean-server inspection: Town, Commons, Old Market, High Street, cottage rows, river, and South Shore checked. The river remains unobstructed; the Commons panel is gone; playground sand remains separate; house walks meet road edges; road bends are rounded; and the café has no grass transition box.

The responsive audit is browser emulation, not physical-device testing. Its deliberate failed-asset and WebGL context-recovery cases produced the expected diagnostic messages and recovered without save damage.
