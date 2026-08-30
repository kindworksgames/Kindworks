# HTML versus Phaser Parity Risks

## Authority

The repository’s latest legacy source is:

`kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`

Protected SHA-256:

`0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5`

The differential parity validator currently protects 13 activities, 5,850 levels, 19 shared domains and 85 exact rules. The minigame validator exercises 14 games and 105,795 generated level instances. These are strong functional signals but not visual equivalence proof.

## Why the Phaser baseline is not universally authoritative

- The HTML contains a very large embedded presentation implementation: 13 canvases, 19 SVG elements, five embedded data images, 303 absolute-position rules and 108 media-rule occurrences.
- Multiple earlier fidelity audits document Phaser presentation/layout differences for Town, restaurants, shops, House Rescue, Beach Cleanup, Lawn Care, animals, farming and other systems.
- Phaser now contains later mobile-oriented changes that may be intentional, while some legacy visual details may still be missing.
- Automated validators compare rules and data, not every visual layer, animation, z-order, hit area or responsive composition.
- The Phase 0 runtime samples establish that current screens render; they do not establish pixel parity.

## Risk matrix

| Area | Parity risk | Evidence / reason | Required rule for refactor |
| --- | --- | --- | --- |
| Town map and exteriors | High | Large procedural redraw; prior town/exterior fidelity audits; many hard-coded decorative substitutions | Use HTML and approved reference audits for semantic composition; preserve Phaser coordinates until approved layout change |
| House/interior layouts | High | Multiple house kits and room sizes; personal home differs intentionally; scene/root state issue open | Preserve house identity/size/interior data; compare each layout family with HTML before recipe approval |
| Restaurants | High | Shared Phaser renderer and mobile simplifications differ from HTML composition | Preserve order/recipe/service logic; approve scene-specific layouts against HTML/reference evidence |
| Power Wash | High | Raw master art/masks are functionally coupled; earlier art mismatch complaint/audit | HTML rules and current validated mask mechanics both required; never replace art without mask-alignment tests |
| Beach / Waste / Lawn | Medium–High | Presentation repeatedly changed to reference proportions; gameplay boards are geometry-sensitive | Freeze board and interaction snapshots before asset swaps |
| Fishing / Magnet fishing | Medium–High | Fishing bitmap is active; magnet reference file is not; cast visuals are procedural | HTML interaction state machine is authoritative where Phaser differs |
| NPC / animal visuals | High | Procedural presentation and limited raw sheet; sophisticated activity/habitat state | Stable identity/state selectors required before new art |
| Farming / environmental states | Medium–High | Thresholds are migrated but rendered procedurally | Threshold and save parity are protected; visual recipe can change only output |
| Shops and inventory | Medium–High | Shared DOM shop plus unique scene interiors; reference layouts exist | Prices/items/placement categories remain service-owned; visual catalogue is not gameplay catalogue |
| Orientation/mobile shell | Medium | Phaser intentionally diverges: River portrait, others landscape | Current approved orientation contract overrides generic legacy layout behavior |
| UI copy and diagnostics | Confirmed defect | Stage 2 `S2-F01` | Repair separately; do not bake internal copy into new components |
| House Interior root marker | Confirmed defect | Stage 2 `S2-F02` | Repair separately before relying on root marker as renderer context |

## Difference classification

| Classification | Handling |
| --- | --- |
| Intentional mobile adaptation | Preserve only when documented/tested (orientation policy, touch/pinch, mobile full-board layouts) |
| Missing/incomplete migration | Do not enshrine in prefab recipes; recover behavior/composition from HTML first |
| Visual-only difference | May be replaced through reviewed asset recipes without state changes |
| Data/rule mismatch | Stop visual work on that surface and resolve in functional QA |
| Unclear | Mark USER DECISION REQUIRED; do not guess |

## Baseline entry conditions for each scene

Before approving a scene’s final visual recipe:

1. Run the relevant HTML/Phaser parity validator.
2. Read its existing fidelity audit and unresolved findings.
3. Record whether HTML, current Phaser mobile behavior or an approved reference governs each layer.
4. Freeze semantic coordinates/hit areas and state variants.
5. Capture current Phaser and, where runnable, HTML reference evidence at the same viewport.
6. Do not call current Phaser presentation “approved art” merely because it is the active implementation.

## Open functional baseline limitations

- Stage 2 repair has not been performed.
- Pre-visual QA Stages 3–10 are not complete.
- Physical-phone/tablet touch, notches, background/resume and performance remain manual gates.
- Ambient venues versus fully playable interiors remain a documented product-decision area.
- External billing/IAP is not an available verified integration; development commerce is local-only.

These limitations do not invalidate this inventory, but they prevent the visual-refactor program from claiming whole-game readiness or final parity.

