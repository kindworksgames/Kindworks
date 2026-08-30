# Phase 1 — Regression Safety

Date: 2026-08-29  
Branch: `phase-2-ui-simplification`  
Starting commit: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`  
Scope: regression protection only; no gameplay or production visual redesign

## Verdict

**PHASE 1 PASS.**

The repository now has a small, repository-native safety layer that detects stale visual evidence, broken supported viewport coverage, invalid or incompatible test saves, scene/interaction/reward regressions, and changes to the visual source surface that have not been reviewed against new screenshots.

This pass protects the current Phaser presentation; it does not certify that the current art or layout is the final approved design, and it does not replace the HTML/Phaser fidelity contract.

## Phase 0 verification

The Phase 0 audit was checked against the current repository before editing:

- `src/main.js` remains the active entry point.
- `BootScene` and `TownScene` remain eager; 16 scenes remain lazy-loaded.
- The base render contract remains 1280×720 with Phaser `FIT` and `CENTER_BOTH`.
- The app remains a Phaser/DOM/custom-canvas hybrid.
- The current save remains schema 37 under `kindworks_phaser_v1`, with backup and recovery keys.
- The protected legacy HTML source and SHA-256 remain unchanged.
- The protected gameplay, reward, save, identity, coordinate, collision and Power Wash mask contracts remain applicable.

The Phase 0 note claiming Stage 2 defects were still open is historical: those defects were repaired during the completed pre-visual QA cycle. No Phase 0 production architecture was broadly changed here.

## Safety system established

### Supported landscape profiles

| Profile | Viewport | Family |
| --- | ---: | --- |
| Narrow phone | 568×320 | Phone |
| Modern phone | 844×390 | Phone |
| 4:3 tablet | 1024×768 | Tablet |
| Original reference | 1280×720 | Development/reference |
| Desktop QA | 1366×768 | Desktop |

These profiles are executable data in `src/qa/visualRegressionFixtures.js`, not documentation-only values.

### Deterministic safe save

The `visual-regression-v1` fixture is created from the real schema-37 state factory and is validated by `validateGameState` before it can be used. It covers:

- a fixed town identity, clock and player location;
- 12,500 coins plus representative equipment, consumable, placeable and furniture inventory;
- an equipped mower;
- a completed onboarding state and custom resident;
- persistent NPC narrative/relationship state;
- an adopted active pet;
- restored Wake and Commons milestones;
- representative cleanup and restaurant unlock progression;
- farming bed and orchard state.

The route uses the existing fidelity storage adapter with its own prefix. It never writes the production Phaser key or any legacy HTML key. A fixed QA clock and paused world/NPC/collection simulation prevent test-state drift.

### Development-only route

Use this pattern in a development build:

`?qa=visual-regression&scenario={scenario}`

Supported representative scenarios are Town, personal-home interior, Village Grocer, Corner Café, Lawn Care and Playground Power Wash. The route:

- exists only behind `import.meta.env.DEV`;
- is classified read-only for onboarding/login behaviour;
- hides the fidelity control panel from captured images;
- exposes readiness only through development data attributes;
- is absent from production JavaScript under the production-surface verifier.

### Screenshot baselines

Ten browser-rendered baseline images are recorded in `baselines/`:

| Family | Scene | Evidence |
| --- | --- | --- |
| World | Town | All five supported landscape profiles |
| Interior | House Interior | 1024×768 |
| Shop | Village Grocer | 844×390 |
| Restaurant | Corner Café | 844×390 |
| Cleanup | Lawn Care | 568×320 |
| Special renderer | Playground Power Wash | 1024×768 |

The manifest records dimensions, scene, scenario, viewport, overflow result and SHA-256. The verifier fails for missing/changed evidence, wrong image dimensions, missing family/profile coverage, or a visual-source fingerprint change. This forces an intentional screenshot review whenever one of the 55 tracked visual source files changes.

Exact byte-for-byte equality between two fresh captures is not required because animated canvases and JPEG encoding can change frame-level pixels without a layout change. Stored-baseline integrity is exact; new captures should be compared visually or with a tolerance-based image diff after the deterministic route reaches `data-visual-regression-ready="true"`.

## Smoke coverage

The Phase 1 test file verifies:

- supported responsive profiles and orientation safety;
- scenario-to-scene registration;
- deterministic fixture equality and schema validation;
- isolated test-save seeding and reload;
- game entry wiring through the runtime browser check;
- player cardinal movement input;
- deterministic NPC movement without economy/inventory mutation;
- interaction selection and activation;
- minigame start, scene transition and completion;
- exact-once rewards and duplicate prevention;
- return to Town and saved reload;
- restoration-state change and persistence;
- production exclusion of the QA route.

## Runtime evidence

All ten baseline routes reached the expected Phaser scene and reported ready. For every capture:

- browser viewport equalled the requested dimensions;
- document width/height equalled the viewport;
- no page overflow was present;
- no runtime warning or error was recorded.

The browser work was emulation, not physical-device testing.

## Verification results

| Check | Result |
| --- | --- |
| Phase 1 focused tests | PASS — 8/8 |
| Differential route contract after allow-list update | PASS |
| Complete automated suite | PASS — 656/656 |
| Minigame parity validator | PASS — 14 games, 75 comparisons, 105,795 generated instances |
| Differential parity validator | PASS — 13 activities, 5,850 levels, 19 shared domains, 85 exact rules |
| Production build | PASS — 181 modules, 19 lazy chunks |
| Performance budget | PASS — initial app 3,026,702 B; Phaser 1,374,829 B; total JS 4,795,540 B |
| Production-surface verifier | PASS — 18 development-only markers absent |
| Baseline verifier | PASS — 10 images, 6 families, 5 profiles, 55 visual source files |
| Runtime console | PASS — no warnings/errors during captures |

## Acceptance gate

| Required detection | Evidence | Result |
| --- | --- | --- |
| Unexpected visual layout change | Visual source fingerprint forces recapture; manifest provides reviewed screenshots and dimensions | PASS |
| Broken interaction or scene transition | Integrated interaction → Waste scene → completion → Town smoke plus runtime scenario entry | PASS |
| Changed reward behaviour | Exact reward delta, exact-once ledger behaviour and duplicate completion smoke | PASS |
| Save incompatibility | Schema validation, deterministic envelope, isolated save/reload and restoration reload | PASS |
| Supported landscape-profile failure | Executable profile contract, full Town captures and overflow evidence at all five profiles | PASS |

## Remaining coverage gaps

- No physical phone or tablet was available; all viewport evidence is browser emulation.
- The baseline set is representative by scene family, not every one of the 18 scenes at every profile.
- Frame-level screenshot comparison is review/tolerance based; exact capture hashes are intentionally not treated as stable for animated scenes.
- Type checking and linting remain unconfigured repository-wide.
- The current presentation includes known placeholder/procedural art and prior fidelity differences. Those are baseline facts, not Phase 1 regressions or approvals.

## Files changed

- `src/qa/visualRegressionFixtures.js`
- `src/main.js`
- `tests/visual-readiness-phase-1.test.js`
- `tests/milestone-46-differential-parity.test.js`
- `scripts/verify-visual-regression-baselines.mjs`
- `package.json`
- `docs/qa/visual-readiness/phase-01/BASELINE_MANIFEST.json`
- `docs/qa/visual-readiness/phase-01/baselines/*`
- `docs/qa/visual-readiness/phase-01/PRE_EXISTING_FAILURES.md`
- `docs/qa/visual-readiness/phase-01/REPORT.md`
- `docs/qa/visual-readiness/README.md`

No gameplay data, save schema, production artwork, object coordinates, rewards or completion rules were intentionally changed.
