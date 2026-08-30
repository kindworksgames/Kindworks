# Asset Lab prioritized repair specification

## Priority 0 — restore approval trust

### R1. Introduce explicit preview eligibility states

Every catalog record must resolve to one of at least:

- `runtime-approved`
- `integrated-unapproved`
- `generated-awaiting-review`
- `contract-only`
- `placeholder`
- `fallback-active`
- `missing-required`
- `missing-optional`
- `invalid`

Rendering a fallback must never produce “valid.” Display the semantic ID, expected runtime file, fallback reason, contract status, and affected scenes.

**Tests:** all 22 current Phase 8A placeholders show placeholder/fallback warnings; missing required and optional samples differ; approved assets never inherit fallback state.

### R2. Integrate the authoritative validator result stream

Generate a versioned validation-results artifact keyed by semantic ID and consume it in the Lab. Include error code, asset/contract ID, expected/actual values, file, severity, suggested action, and validator version. Add validation and approval filters.

**Tests:** wrong dimensions, alpha, frame count, direction/state, atlas frame, case, format, size, missing contract, missing file, duplicate ID/cache key, and orphan cases appear correctly in the Lab.

### R3. Make the complete production inventory browseable

Expose all 15 contract categories, all 74 Phase 10 production family IDs, and all 18 planned scene dependency groups as first-class catalog records even before artwork exists. Contract-only records must be clearly non-runtime and must not be preview-approved.

Use one stable inventory source; do not copy the production plan into a second hand-written Lab list.

**Acceptance:** catalog coverage reports 15/15 categories, 74/74 family IDs, and 18/18 scene groups with explicit lifecycle status.

## Priority 1 — complete technical-art inspection

### R4. Add frame-accurate spritesheet and atlas inspection

- Atlas frame browser/search and frame metadata.
- Sprite-sheet grid and frame-boundary overlay.
- Arbitrary frame selection.
- Timeline scrubber, frame-number field, restart, loop toggle, deterministic current-frame display.
- Declared versus decoded dimensions and trimming/padding information.

### R5. Add real visible-pixel and geometry inspection

Decode alpha bounds for each frame and show them separately from technical canvas and declared visual bounds. Add named standing points/destinations and numerical coordinate/size readouts. Flag frame-to-frame visible-bound or anchor drift beyond the contract.

### R6. Show complete metadata and real usage provenance

Provide expandable manifest, contract, prefab, animation, source/provenance, lifecycle, and validator sections. Derive consumers from scene layouts, prefab references, scene packs, and the legacy bridge; label inferred versus verified runtime use.

## Priority 1 — make large libraries safe

### R7. Lazy-load and virtualize

- Build indexed facets once.
- Virtualize long lists/selectors.
- Load/decode preview files only for the selected item and comparison/calibration dependencies.
- Cancel stale loads when selection changes.
- Release preview-only textures safely.
- Show progress for expensive operations.

### R8. Replace monolithic contact sheets

Export paginated sheets with bounded dimensions and memory, plus an index manifest. Refuse unsafe canvas sizes with an actionable message. Support category/status/selection batches.

**Performance gates:** interactive search/filter for 5,000 records; no eager 5,000-image load; no sheet exceeds browser canvas limits; operation can be cancelled.

## Priority 2 — artist workflow and device accuracy

### R9. Add changed-asset reload

Reload the selected semantic asset using manifest fingerprint/versioning, clear only its preview cache entries, rerun validation, and preserve current state/facing/frame when compatible. Never mutate production content from the Lab.

### R10. Redesign the narrow-viewport Lab shell

Use a collapsible/drawer control panel and preview-first layout. Enforce at least 44 px touch targets, preserve a useful preview region, support keyboard and touch, and keep comparison usable at `568x320`.

### R11. Use real preview pipelines

- Apply the game’s actual day/night tint, lighting, and shadow rules.
- Reflow the preview under each responsive profile rather than drawing only a frame.
- Show safe areas/notches and real logical-to-device scaling.
- Keep emulation labeled; add a physical-device verification checklist.

## Regression suite required before approval

1. Traverse every inventory record and every declared state/direction/variant/layer/animation.
2. Prove no fallback or placeholder reports runtime-approved.
3. Prove all controlled invalid fixtures show the correct per-asset diagnostic.
4. Prove atlas frame selection and spritesheet frame boundaries with real fixtures.
5. Prove alpha/visible bounds against padded and shifted artwork.
6. Prove standing points and all logical geometry remain independent of art dimensions.
7. Benchmark 1,000 and 5,000 records, lazy loading, filtering, and paginated exports.
8. Verify `568x320`, wider phone, tablet, and desktop with touch-target assertions.
9. Verify selected-asset reload and cache invalidation.
10. Retain the production build guard and assert the query route, DOM markers, dev chunks, exports, and global hooks are absent.

## Completion gate

The Asset Lab is ready to become the authoritative visual approval tool only when:

- every production inventory record is represented;
- required missing/invalid artwork cannot appear valid;
- validator results and lifecycle status agree;
- every supported static/spritesheet/atlas/state/direction/layer contract is inspectable;
- large catalogs remain responsive and exports are bounded;
- supported device previews are usable and technically representative;
- production exclusion continues to pass.

