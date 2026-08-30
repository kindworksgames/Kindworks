# KindWorks scene-layout architecture audit

**Audit date:** 2026-08-30  
**Repository:** `/Users/youyoulu/Documents/GitHub/Kindworks`  
**Branch:** `phase-2-ui-simplification`  
**Starting commit:** `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
**Scope:** read-only-first scene/layout architecture, controlled negative tests, development and production runtime checks  
**Production code changed:** No

## Verdict

**FAIL — SCENE-LAYOUT ARCHITECTURE IS NOT READY FOR WHOLE-GAME ARTWORK PLACEMENT.**

The Fishing pilot proves a useful direction: a visual instance can move through layout data while its gameplay geometry remains byte-identical, a larger source canvas can retain a fixed logical footprint through the prefab scale system, the pilot retains 12 stable live objects across repeated reloads, and development tooling is excluded from production.

That success does not generalise to the complete game. Only Fishing imports a versioned scene layout. The build validates one layout for 18 production scenes: **5.6% scene coverage**, with all HUDs and overlays still outside the layout catalogue. The validator is also not an enforceable safety boundary: nine deliberately invalid mutations were accepted, including an edit to a zone marked gameplay-critical and locked.

No gameplay defect, save mutation or runtime crash was introduced or found by this audit. This is an architecture-coverage and contract-enforcement failure.

## Scope and evidence

- All 19 scene files under `src/scenes/` were inventoried: 18 production scenes and the development-only Scale Calibration scene.
- Asset Lab, Reference Overlay Mode, Scene QA Overlay, global DOM UI and all player-visible surface families were inspected separately.
- Every JavaScript/CSS source under `src/` plus `index.html` was scanned for placement/transform/geometry/responsive candidates.
- Existing reports were leads only; actual source, build scripts, validators and runtime routes were rechecked.
- Browser evidence used local Chromium and isolated QA storage. It is emulation, not physical-device evidence.
- The user worktree was already heavily modified; unrelated changes were preserved.

Supporting files:

- [Scene coverage matrix](SCENE_LAYOUT_COVERAGE_MATRIX.md)
- [Hard-coded placement inventory](HARD_CODED_PLACEMENT_INVENTORY.md)
- [Machine-readable evidence and every file/line candidate](EVIDENCE.json)
- [Runtime evidence](RUNTIME_EVIDENCE.md)
- [Repair specification](REPAIR_SPECIFICATION.md)

## Current architecture map

```text
Gameplay/persistent owners
  town.js, homeInteriors, services, level engines, schema-37 save
        |                         |
        | mostly direct reads     | protected coordinates/state
        v                         v
Scene/entity/UI code ---------- procedural Phaser / DOM / custom canvas
  18 production scenes            hard-coded transforms + CSS breakpoints
        |
        +-- Town bins only --> semantic prefab/factory/geometry contracts
        |
        +-- Fishing only ----> fishingSceneLayout schema 1
                                  |
                                  +-- manual FishingScene property reads
                                  +-- Reference Overlay Mode (development)

Build validation
  validate-scene-layouts.mjs --> [FISHING_SCENE_LAYOUT] only
```

There is no global scene-layout catalogue. `scripts/validate-scene-layouts.mjs` imports exactly one file, so a new scene layout can exist without being validated unless a developer remembers to edit the script.

## Requested property coverage

| Property | Fishing pilot | Whole game | Verdict |
| --- | --- | --- | --- |
| Asset/prefab ID | Prefab role exists; only background is registry-backed | Mostly direct procedural/DOM rendering | **PARTIAL** |
| Position | Stored and consumed | Mostly scene/data literals | **PARTIAL** |
| Origin | Stored and consumed manually; any finite value accepted | Mostly scene literals | **FAIL** |
| Scale | Not contracted/applied generically | Scene/prefab/CSS literals | **FAIL** |
| Rotation | `angle` used for one Fishing tool; not validated | Scene/entity literals | **FAIL** |
| Flip | Unsupported by layout contract | Scene/entity logic | **FAIL** |
| Depth | Stored and consumed manually; not validated against depth layers | Many manual constants/formulas | **FAIL** |
| Visibility | Runtime scene state only | DOM classes and scene calls | **FAIL** |
| Tint | Unsupported by layout contract | Scene/entity calls | **FAIL** |
| Alpha | Runtime calls; invalid layout alpha accepted | Scene/CSS calls | **FAIL** |
| Animation | Not scene-layout resolved | Scene/entity/registry-specific | **FAIL** |
| State/variant | Prefab roles have variants; instance state is not validated/applied | Procedural branches and DOM classes | **FAIL** |
| Responsive anchor | Declared; not applied by Fishing and edge values not validated | CSS owns responsiveness | **FAIL** |
| Safe-area behaviour | One rectangle is validated; anchors do not target it enforceably | Responsive shell/CSS | **PARTIAL** |
| Parent/container | Unsupported; missing parent is accepted | Scene-created containers | **FAIL** |
| Repeated/generated objects | Unsupported | Scene loops/helpers | **FAIL** |
| Visual-only offsets | Some Fishing presentation constants; no general contract | Ad hoc offsets | **FAIL** |
| Debug labels | Fishing instance IDs and broad Sprite-AI labels | Not a layout catalogue | **PARTIAL** |
| Reference-image alignment | Fishing development overlay | No other scene | **PARTIAL** |

## Critical verification results

### What works

1. **Visual/gameplay separation through the sanctioned move API:** moving the Fishing background from 640,360 to 649,367 snapped to 648,368 and kept zones, sockets, collision, navigation and interaction JSON byte-identical.
2. **Larger source canvas:** the scale resolver produced the same 54×54 logical display for a 54×54 source and a 432×432 source at 8 pixels per logical unit. The pilot prefab architecture does not derive collision size from source pixels.
3. **Y-sorting primitive:** the shared ground-depth resolver placed Y=100 at depth 210 and Y=200 at depth 220. Town bins use it; Town characters still use separate manual formulas.
4. **Reload stability for the pilot:** three full development reloads each returned `FishingScene`, 12 labelled Phaser layout objects, one Reference Overlay root and the same two canvas surfaces. No accumulating layout object was observed.
5. **Production exclusion:** a production preview opened with `?qa=reference-overlay` stayed in `TownScene`, created no Reference Overlay and exposed no overlay-ready marker.
6. **Save isolation:** existing Phase 4/5 tests prove layout resolution/movement and scale resolution leave the protected schema-37 fixture unchanged; the full suite passed.

### What fails

The existing validator correctly rejected a duplicate instance ID and a missing prefab. It incorrectly accepted all of these:

| Probe | Expected | Actual |
| --- | --- | --- |
| Unknown visual field | Reject | Accepted |
| Origin X of 8 | Reject | Accepted |
| Negative scale | Reject | Accepted |
| Alpha of 5 | Reject | Accepted |
| Missing parent ID | Reject | Accepted |
| Safe-area edge `banana` | Reject | Accepted |
| Move gameplay-critical locked Fishing water zone by 100 | Reject | Accepted |
| 999,999×999,999 visible bounds | Reject | Accepted |
| `activeWhen: () => Math.random() > .5` | Reject | Accepted |

`createSceneLayout` shallow-freezes only the root. The controlled definition remained mutable at `instances[0].visual.position`, demonstrating a hidden-mutation path. A function condition also disappears or changes meaning when exported as JSON, so development/production equivalence is not enforceable.

## Twelve required safety checks

| Requirement | Result | Evidence |
| --- | --- | --- |
| Gameplay coordinates and visual offsets are distinct | **PARTIAL** | Sanctioned Fishing move preserves geometry; Town/interiors/custom canvas still mix concerns. |
| Visual placement cannot move collision unintentionally | **FAIL** | Editor move API is safe, but raw layout mutation of a locked zone validates successfully. |
| Larger sprite canvas does not move logical object | **PARTIAL PASS** | Prefab scale resolver passes; most scenes bypass it. |
| Layout schema validation | **FAIL** | Nine contract false negatives; schema is open and incomplete. |
| Duplicate IDs/missing references | **PARTIAL** | In-layout duplicate and prefab refs fail; no global cross-layout catalogue. |
| Inheritance/variants cannot hide mutation | **FAIL** | No controlled inheritance model; shallow nested mutation and arbitrary fields are accepted. |
| Reloads do not duplicate visuals | **PARTIAL PASS** | Fishing stable across three reloads; no automated all-scene layout lifecycle test. |
| Conditional objects deterministic/testable | **FAIL** | Function/random condition accepted; no condition schema or expansion test. |
| Moving-character depth remains correct | **PARTIAL** | Shared resolver works for bins; Town player/NPC/animal/entity formulas remain independent hard-coded systems. |
| Development/production consistency | **PARTIAL** | Same production data bundle builds; dev editor excluded. Non-serializable/unvalidated layout values prevent digest guarantee. |
| Data-driven placement remains debuggable | **PARTIAL** | Fishing overlay is strong; it is not catalogue-driven and covers no other scene. |
| Layout cannot overwrite persistent state | **PASS for pilot** | Protected save digest tests pass; no layout writes to save APIs found. |

## Hard-coded coupling result

The scanner recorded 5,288 line-level candidates and 7,565 occurrences, including 7,320 in production scope. The largest concentrations are CSS (3,857 placement/breakpoint occurrences across both stylesheets), `TownScene` (537), `town.js` (367), `RestaurantPresentation` (283), Harbour General (142), Fishing (126), Paws & Wonders (108), House Interior (90) and the Power Wash renderer (84).

These values do not all belong in scene layouts. The repair must classify them into protected gameplay geometry, semantic scene layout, prefab-local visual recipe, responsive component layout, or justified runtime effect/animation. The exact record set is in `EVIDENCE.json` so nothing is silently omitted.

## Findings

| ID | Severity | Finding | Reproduction / evidence |
| --- | --- | --- | --- |
| SLA-001 | **Critical** | Gameplay-critical `locked` geometry is mutable and the validator accepts the changed coordinates. | Move `zone.fishing.water.geometry.x` by 100; validation returns OK. |
| SLA-002 | **High** | Scene-layout coverage is 1/18 production scenes and 0 complete HUD/overlay families. | Build validator imports only Fishing; coverage matrix. |
| SLA-003 | **High** | Schema does not enforce most required visual properties or reject unknown fields. | Nine false-negative probes in `EVIDENCE.json`. |
| SLA-004 | **High** | Layout definitions are only shallow-frozen and may contain functions/random conditions, permitting hidden mutation and dev/export divergence. | Nested position mutation succeeds; function condition validates. |
| SLA-005 | **High** | No global catalogue detects cross-layout duplicate IDs, unregistered layouts, missing scenes or missing surface coverage. | `validate-scene-layouts.mjs` owns a literal one-item array. |
| SLA-006 | **Medium** | Fishing manually applies a subset of properties, so accepted layout fields may be ignored silently. | Scene reads position/origin/depth/angle directly; no common instance applier. |
| SLA-007 | **Medium** | Responsive anchors/safe areas are declarative only; CSS owns 82 breakpoint occurrences and the layout does not drive HUD placement. | Invalid safe-area edge validates; Fishing consumer never applies `responsiveAnchor`. |
| SLA-008 | **Medium** | Parent/container, repeat/generation and deterministic conditional instances have no supported contract. | Missing parent and function condition both validate. |
| SLA-009 | **Medium** | Depth ownership is fragmented among named depth layers and multiple manual Y formulas. | Town player/NPC/animal/vehicle/objects use independent bases/divisors. |
| SLA-010 | **Medium** | Reference Overlay and lifecycle proof cover Fishing only. | Three Fishing reloads pass; all other scenes have no layout instance count to assert. |
| SLA-011 | **Medium** | Town/interior data mixes visual and gameplay coordinates without a formal projection boundary. | `town.js`, `HomeInteriorService`, scene drawing and persistent furniture transforms. |
| SLA-012 | **Low** | Current viewport capability did not change the browser's reported 1280×720 inner size during this audit. | Existing five-profile baselines passed verification; new live viewport evidence is blocked rather than claimed. |

## Commands and runtime evidence

| Check | Result |
| --- | --- |
| Controlled architecture audit script | PASS as an audit; found nine expected-rejection failures |
| Focused Phase 3/4/5 tests | PASS — 21/21 |
| Full automated suite | PASS — 734/734 |
| Production build and post-build validators | PASS |
| Scene layout validator | Green but incomplete — one Fishing layout, 12 instances, six zones |
| Development Fishing route | PASS — 1280×720, layout validation marker, 12 labelled objects |
| Three development reloads | PASS — stable scene/object/editor counts |
| Development console | No layout exception; existing isolated interrupted-activity warnings only |
| Production preview | PASS — no Reference Overlay route/tool/marker, no console errors |
| Existing stored responsive baselines | PASS — ten images, six families, five profiles |
| New live multi-profile override | BLOCKED — browser continued reporting 1280×720; no false pass claimed |

## Repair decision

The current architecture is safe enough to continue using Fishing as a constrained pilot, but it is **not safe to accept arbitrary scene-layout data or begin broad artwork placement migration**. Repair SLA-001 through SLA-005 before extracting another scene. Then complete the Fishing contract/consumer, add lifecycle/dev-production digest tests, and migrate surfaces in the dependency order in [REPAIR_SPECIFICATION.md](REPAIR_SPECIFICATION.md).

No repairs were implemented during this audit.
