# Phase 9 — Production Art Bible Lock

Date: 2026-08-30  
Verdict: **BLOCKED — PHASE 8B PREMIUM SLICE DOES NOT EXIST**

## Decision

The KindWorks production art bible is **not locked**. Phase 9 requires measurements from a successful, approved premium vertical slice. The repository currently contains Phase 8A specifications and procedural placeholders only:

- approved Phase 8A staging assets: 0/22;
- approved Phase 8A runtime assets: 0/22;
- Phase 8B integrated assets: 0/22;
- Phase 8B verdict: FAIL — approved artwork input required;
- successful Reference Overlay comparison of the premium slice: none;
- accepted-versus-rejected premium-slice visual evidence: none.

Treating intended prompts or placeholders as successful artwork would make palette, outline, texture, material, lighting, shadow, readability, and animation rules subjective. That directly violates the Phase 9 requirement.

## What is already measurable but is not an art bible

The following technical constraints exist independently of approved artwork and remain useful inputs after Phase 8B succeeds:

- canonical landscape reference: 1280×720;
- declared native density: one native pixel per logical unit for the Phase 8A slice;
- supported profiles: narrow phone, modern phone, tablet 4:3, reference, and desktop;
- logical footprints, anchors, sockets, collision, navigation, interaction, and touch geometry from Phase 5 and Phase 8A;
- exact sprite-sheet canvases, frame grids, state names, directions, and frame order from Phase 8A;
- nearest-neighbour rendering, untrimmed frame canvases, and smoothing disabled;
- the existing semantic registry, prefab renderer, layout definitions, Asset Lab, and Reference Overlay tooling.

These are technical contracts. They do not demonstrate the final production palette, contrast, outlines, detail density, material language, shadows, lighting, terrain blending, restoration-state treatment, or rig aesthetics.

## Evidence required before the bible can be derived

Phase 9 may resume only after Phase 8B supplies:

1. Twenty-two approved, contract-valid slice assets in staging and runtime.
2. Asset Lab captures at native and intended gameplay size for every state, direction, layer, and animation.
3. Reference Overlay evidence for the complete town block and Lawn Care screen.
4. Successful house clean/dirty/upgrade and four-stage lawn transitions.
5. Player/NPC/tree occlusion evidence and verified ground-contact geometry.
6. Player, NPC, dog, mower, interaction, and reward animation captures.
7. Phone, tablet, reference, and desktop screenshots.
8. A recorded list of approved visual examples and rejected/revised outputs.
9. Confirmation that the integrated slice uses no missing texture or fallback.
10. A passing Phase 8B gameplay, save, and viewport regression report.

## Measurements that must be derived from the accepted pixels

After Phase 8B passes, the Phase 9 measurement job must extract and lock:

| Domain | Required evidence-derived output |
| --- | --- |
| Camera and perspective | Measured visible top/side ratios, shared projection angles, and directional conventions from terrain, house, props, and characters. |
| Grid and pixel density | Native pixels per logical unit, cluster cadence, tile seams, and permitted scaling factors. |
| Proportions | Player-relative height/width bands for NPCs, animals, doors, houses, trees, props, roads, river, and UI. |
| Palette | Exact RGB/hex swatches, usage roles, ramp lengths, material ramps, day/night transforms, and contrast thresholds. |
| Outlines | Exact colours, thickness, selective-outline rules, internal-line rules, and exceptions by scale. |
| Texture/detail | Measured pixel-cluster frequency and detail budgets at native and gameplay sizes. |
| Materials | Approved wood, stone, metal, glass, water, foliage, fabric, soil, dirt, and clean-surface ramps and highlight patterns. |
| Lighting/shadows | Direction measured from approved pixels, highlight offsets, shadow colour/opacity, footprint, and layer policy. |
| Ground contact | Shared feet/base rows, empty padding, ground anchors, socket offsets, and shadow relationships. |
| Terrain transitions | Measured edge widths, blending cadence, bank construction, and seamless-repeat requirements. |
| Visual states | Pixel-change boundaries for clean, weathered, job-ready, upgraded, growth, cut, and restoration states. |
| Rigs/animation | Shared player/NPC/dog frame geometry, motion arcs, timing, holds, frame rates, and directional asymmetry. |
| UI | Icon bounding boxes, panel padding, outline/contrast rules, disabled/pressed treatment, and minimum touch behaviour. |
| Export | Exact formats, alpha modes, frame grids, untrimmed padding, filenames, budgets, filtering, and validation rules. |

## Independent confirmation specifications

The two independent confirmation targets are reserved but **not yet authored or claimed as passing**:

1. Ordinary prop: a semantic town lamp or planter using the locked prop scale, material, outline, shadow, anchor, and export rules.
2. Character/environment: a distinct resident or small environmental tree variant using the locked rig/projection, palette, ground-contact, animation, and export rules.

They cannot be specified without guessing until the approved slice provides measured values. Once authored, both must enter through staging, pass the machine-readable validator, integrate by semantic manifest only, and match the slice in Asset Lab and live gameplay.

## Acceptance gate

| Phase 9 condition | Status |
| --- | --- |
| Derived from successful approved slice | FAIL — no approved slice |
| Machine-readable measured values | BLOCKED — no accepted pixels to measure |
| Human-readable locked guide | NOT CREATED — prevents subjective lock |
| Positive and rejected examples | BLOCKED — no Phase 8B review set |
| Two independent specifications | RESERVED ONLY — cannot be validated consistently |
| Integration confirmation | BLOCKED — no locked bible or Phase 8B runtime slice |

**Phase 9 verdict: FAIL — COMPLETE PHASE 8B WITH APPROVED ARTWORK FIRST.**

No production art bible, validator values, prompts, or generation jobs were fabricated during this blocked phase.
