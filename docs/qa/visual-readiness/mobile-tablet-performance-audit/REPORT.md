# KindWorks Visual-Readiness Mobile, Tablet and Performance Audit

> Repair update (2026-08-30): the two high-severity findings were addressed. See `REPAIR_REPORT.md` for the verified before/after measurements and conditional result. This file remains the immutable pre-repair audit.

Date: 2026-08-30  
Branch: `phase-2-ui-simplification`  
Audit type: read-only-first architecture/runtime audit; no production gameplay or presentation repair was made

## Verdict

**CONDITIONAL / NOT READY FOR LOW-END MOBILE RELEASE.**

The responsive shell, landscape scaling, touch geometry, pointer mapping, orientation gate, reference overlay, failure fallback, WebGL recovery and representative scene containment work in Chromium emulation. Every tested gameplay board stayed inside the viewport at all seven requested profiles, document overflow remained zero, center-pointer mapping was exact, and no player-facing control measured below 44×44 CSS pixels.

Two high-severity issues prevent an unconditional pass:

1. The production Town render loop averaged 44.66 ms per frame (about 22 FPS) at 667×375/DPR 2 after a five-second warm-up. A 4× CPU-constrained run averaged 123.26 ms (about 8 FPS). This is a steady render-loop result, not development-module loading.
2. The complete automated suite has one current geometry failure: 16 shop standing points overlap declared navigation obstacles across Village Grocer, Paws & Wonders and Harbour General.

Physical-device notch, thermal, true multi-touch, OS interruption and long-session memory-pressure evidence remains required. Browser emulation is not represented as physical-device certification.

## Environment and method

- Phaser: 4.2.1
- Canonical scene surface: 1280×720
- Browser: Playwright Chromium headless, WebGL, DPR 2 for phone/tablet profiles
- Host: local macOS Codex environment
- Production cross-check: built Vite preview at 667×375, normal and 4× CPU
- Input: browser touch/pointer emulation; no physical finger or multi-touch hardware
- Network throttling: not applied. Vite development serves unbundled modules and network-throttling that path would not model the production package.
- Save isolation: development Fidelity QA save; no real player save used
- Evidence: [`RESULT.json`](../../../../artifacts/visual-readiness-mobile-audit/RESULT.json), [`PRODUCTION_TOWN.json`](../../../../artifacts/visual-readiness-mobile-audit/PRODUCTION_TOWN.json), and the screenshots in [`artifacts/visual-readiness-mobile-audit/screenshots`](../../../../artifacts/visual-readiness-mobile-audit/screenshots)

The representative runtime sweep opened Town, Town Menu, House Interior, Lawn Care, Corner Café and Playground Power Wash at every profile. It separately tested River orientation, the Reference Overlay, the Asset Lab, 21 repeated scene transitions, a forced required-asset failure and WebGL context loss/restoration.

## Device-by-device results

| Profile | Runtime result | Layout, camera and input | Readability / tooling | Status |
| --- | --- | --- | --- | --- |
| Small landscape phone — 568×320 | All five representative scenes and Town Menu opened; no runtime/resource errors | No overflow/crop; all playfields contained; player controls ≥44×44; pointer center mapped to 640×360 (Power Wash 768×512) | House Interior has eight visible 8 px text items; Café has two 9 px items | **PARTIAL** |
| Standard landscape phone — 667×375 | Same containment and input result | FIT scale 0.5208; no off-screen controls; exact pointer mapping | Same House/Café text issue; production Town performance fails target | **FAIL — performance** |
| Wide/notched-class phone — 844×390 | Same containment result; Reference Overlay and Asset Lab fit | FIT scale 0.5417; player controls ≥44×44 | Café has four items below 10 px; emulated safe-area insets are zero, so a real notch is not certified | **PARTIAL** |
| Small tablet — 960×600 | All representative scenes opened and fit | FIT scale 0.75; no crop or control escape | Not present in the formal scale/profile registry or Asset Lab presets; Café has small text | **PARTIAL** |
| Standard tablet — 1024×768 | All scenes, Reference Overlay and Asset Lab fit | 1280×720 content is centred at 1024×576 with 96 px vertical letterbox; no crop | Formal profile exists; Café has small text | **PASS WITH FINDING** |
| Large tablet — 1180×820 | All representative scenes and Reference Overlay fit | FIT scale 0.921875; no crop or control escape | Not present in the formal scale/profile registry or Asset Lab presets; Café has small text | **PARTIAL** |
| Desktop development — 1366×768 | All representative scenes fit | FIT scale 1.0667; no crop or pointer error | Development Asset Lab uses compact 32 px controls on a fine-pointer desktop, as intended; Café small text remains | **PASS WITH FINDING** |

All final canvas scales are fractional for these exact profiles. Phaser uses `pixelArt`, `roundPixels`, CSS `image-rendering: pixelated`, nearest-neighbour asset contracts and correct pointer normalization. No camera seam, texture bleed or pointer offset was observed, but non-integer scaling can still produce uneven pixel columns; this should be treated as an art-direction/device review item rather than silently changing the world scale.

## Responsive architecture assessment

| Requirement | Result | Evidence |
| --- | --- | --- |
| Phaser scale mode | **PASS** | `Phaser.Scale.FIT`, `CENTER_BOTH`, 1280×720, pixel art and rounded pixels in `src/main.js` |
| Camera scaling | **PASS** | Canonical camera stayed 1280×720; Town bounds 4200×2800; content letterboxed rather than cropped |
| Safe areas/notches | **PARTIAL / HARDWARE BLOCKED** | `viewport-fit=cover` and widespread `env(safe-area-inset-*)` rules exist; headless Chromium reports zero insets |
| HUD anchoring / Town Menu | **PASS in emulation** | Menu and essential Town controls remained contained at every profile |
| Popups/modals | **PASS for representative Town Menu** | No overflow; close target remained ≥44×44 |
| Text readability | **FAIL (medium)** | House Interior renders essential/context text at 8 px on 568/667; Café renders 9 px text across profiles |
| Touch targets | **PASS in emulation** | Zero player-facing control below 44×44 in the representative sweep |
| Pointer mapping | **PASS** | Every Phaser canvas centre mapped to 640×360; Power Wash centre mapped to 768×512 |
| Fullscreen transitions | **NOT IMPLEMENTED / DECISION REQUIRED** | No Fullscreen API or fullscreen-change handler is present |
| Orientation handling | **PASS in emulation** | Lawn blocks in portrait; River blocks in landscape and plays in portrait; shell code pauses world systems and sleeps/wakes the game loop |
| Asset crispness/filtering | **PASS by configuration; visual hardware review pending** | Pixelated CSS, nearest filtering and rounded pixels are active |
| Scene-layout resolution | **PASS** | Every representative scene resolved schema-v2 layout data with canonical 1280×720 |
| Reference Overlay alignment | **PASS for tested tool surface** | 568×320, 844×390, 1024×768 and 1180×820 were contained, two-panel, error-free |
| Asset Lab emulation | **PARTIAL** | Fits and stays touch-safe on tested phones/tablet; only five formal viewport presets are available |

## Orientation and interruption

- Lawn at 390×844: correctly blocked with “Turn your device sideways to play.”
- River at 844×390: correctly blocked with “Turn your device upright to play.”
- River at 390×844: active and not blocked.
- The implementation explicitly pauses world simulation, NPC life and municipal collection, then sleeps/wakes the Phaser loop and refreshes scale.
- Programmatic orientation locking is not attempted, which is a safe browser-compatible choice.
- Actual iOS/Android backgrounding, browser chrome resizing and orientation-state restoration on hardware were not available.

## Performance measurements

### Production Town — 667×375, DPR 2

| Constraint | Scene ready | Warm-up | Mean frame | p95 | Approx. mean FPS | Frames >33.34 ms | Result |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Normal headless Chromium | 1.49 s | 5 s | 44.66 ms | 51.90 ms | 22.4 | 106/135 | **FAIL** |
| 4× CPU constraint | 4.14 s | 5 s | 123.26 ms | 135.10 ms | 8.1 | 48/49 | **FAIL** |

The production check emitted no console error or failed resource. Because headless Chromium is not a physical GPU, the exact FPS cannot be projected directly onto a phone; however, the result is repeatable in development and production and is severe enough to require profiling before release.

### Development instrumentation

- Seven-profile scene-ready time: 2.92–3.60 s, average 3.08 s. This includes the audit's fixed 500 ms settling window and Vite development modules.
- Twenty-one scene opens: 531–1,171 ms, average 624 ms, including a fixed 420 ms post-scene settling interval. The first Lawn lazy load was the maximum.
- Town: 473 Phaser children, 441 texture/cache records, 441 unique source objects, no active scene timer or particle system.
- Town approximate decoded Phaser texture memory: 2.29 MB; largest measured source 384×512 (about 0.79 MB RGBA).
- Fishing after transition stress: 23 textures, one active scene, nine children, zero timers/particles.
- Power Wash native image cache: five entries; two 1536×1024 canvases account for about 12.6 MB decoded RGBA before tool images.
- Maximum WebGL texture size reported by the audit environment: 8192 px.
- Fifteen-second post-stress soak: used heap 126.90 MB → 126.28 MB after collection; total allocated heap 132.43 MB → 128.61 MB; objects, canvases, active scenes, timers and textures were stable.
- Post-transition Fishing render: mean 16.66 ms, p95 18.5 ms, no frame above 33.34 ms.
- 4× CPU Power Wash: mean 41.54 ms, p95 51.9 ms (about 24 FPS).

The 15-second soak and 21 transitions found no growth, but they are not a release-grade long-session test. A 30–60 minute physical-device soak remains required.

### Build footprint

- Production build: **PASS**, 200 modules.
- Initial application chunk: 3,022,683 bytes; Phaser engine: 1,374,829 bytes.
- Total JavaScript: 4,895,989 bytes; 23 lazy chunks.
- Static performance budget: **PASS**. This budget does not measure steady rendering FPS.
- Asset validation/build warning: one exact duplicate-content pair remains between the legacy Fishing reference and its runtime Fishing background.

## Stability and failure handling

| Test | Result |
| --- | --- |
| 21 repeated scene transitions | PASS cleanup: one active scene, zero active timers/particles; no growing heap |
| Repeated scene-scoped loading | PARTIAL: Fishing background was requested three times across three entries; no retained texture leak |
| WebGL context loss/restoration | PASS: context lost and restored; Town remained the active scene; only expected Phaser warnings |
| Required Fishing background failure | PASS fallback: Fishing entered, fallback texture existed, save schema 37 remained current/backup-safe |
| Asset failure diagnostics | PASS: semantic ID, manifest entry, expected contract, actual load error, requiredness, file and scene were reported |
| Normal runtime console/resources | PASS: no application error, rejection or failed request in representative runs |
| Missing/invalid texture budget | PASS build validators; 8192 px runtime maximum recorded |
| Long-session / thermal / low-memory termination | BLOCKED on physical hardware |

## Findings register

### VR-MOB-001 — Town steady rendering is below a mobile-safe target

- **Severity:** High
- **Status:** Confirmed in development and production headless Chromium
- **Expected:** Stable Town movement should sustain at least 30 FPS on representative constrained hardware, with 60 FPS preferred.
- **Actual:** Production 667×375/DPR 2 averaged about 22 FPS normally and about 8 FPS under 4× CPU. Development Town also remained below 30 FPS after warm-up.
- **Likely contributors:** 473 active Town display children, 441 distinct texture/source records, procedural or highly fragmented drawing, and per-frame Town work. Heap and retained-scene evidence does not indicate a leak.
- **Repair specification:** profile renderer/update costs separately; record per-system CPU time; freeze or dirty-update static terrain/building layers; consolidate compatible small generated textures into atlases/render textures; cull off-camera decorative work and DOM updates; eliminate allocations in update loops; set production frame-time gates for normal and constrained profiles. Do not remove NPC/animal/gameplay systems to obtain the target.
- **Required regression:** production build, 667×375/DPR 2, five-second warm-up, three independent 30-second samples; p95 ≤33.34 ms on the agreed minimum device; repeat with busy NPC/animal state and camera movement.

### VR-MOB-002 — Sixteen interior standing points overlap navigation obstacles

- **Severity:** High
- **Status:** Confirmed by the full suite; pre-existing geometry-isolation regression, not caused by this audit
- **Affected:** four Village Grocer displays, nine Paws & Wonders displays and Harbour slots 3–5.
- **Expected:** Every interaction standing point is outside collision/navigation geometry with the required character clearance.
- **Actual:** The independent geometry retest reports each point inside one or more declared obstacle rectangles.
- **Root cause:** `displayGeometry()` derives the standing point from the display rectangle's bottom plus 38 logical pixels without validating clearance against fixture/navigation rectangles.
- **Repair specification:** keep artwork and display positions unchanged; declare or compute explicit logical standing points from obstacle boundaries, validate character-radius clearance, verify each route from spawn, and render the geometry overlay at phone/tablet profiles.
- **Required regression:** the existing independent retest must pass; browser-control each affected store at 568×320 and 1024×768; confirm the player/NPC can reach and operate every product without crossing fixtures.

### VR-MOB-003 — Formal viewport and Asset Lab profile coverage is incomplete

- **Severity:** Medium
- **Status:** Confirmed
- **Actual:** `SUPPORTED_LANDSCAPE_VIEWPORTS`, visual baselines and Asset Lab expose 568×320, 844×390, 1024×768, 1280×720 and 1366×768 only. The requested 667×375, 960×600 and 1180×820 profiles are absent even though runtime layout passed them.
- **Repair specification:** add stable IDs for standard phone, small tablet and large tablet to the single scale/profile source; generate matching Asset Lab frames and representative regression captures; make validators require all seven profiles.

### VR-MOB-004 — Player-facing text is too small in House Interior and Café

- **Severity:** Medium
- **Status:** Confirmed
- **Actual:** House Interior exposes eight 8 px items at 568×320 and 667×375. Café exposes 9 px status/help copy and additional sub-10 px text at larger profiles.
- **Repair specification:** remove or defer non-essential copy; raise essential text to an agreed mobile minimum (recommended 11–12 CSS px with sufficient contrast); preserve the full-screen gameplay composition; add computed-font and clipping checks.

### VR-MOB-005 — Fullscreen transitions have no implementation or test surface

- **Severity:** Medium / user decision required
- **Status:** Confirmed gap
- **Actual:** no request/exit/fullscreen-change handler exists. Browser-managed scaling and orientation still work.
- **Repair specification:** decide whether fullscreen is required. If yes, add an explicit user-gesture action, handle rejection, refresh Phaser scale on enter/exit, preserve scene state, and test orientation/safe areas before and after. Do not force fullscreen on load.

### VR-MOB-006 — Physical safe-area and mobile-interruption certification is absent

- **Severity:** Medium release-risk; not a confirmed code defect
- **Status:** Blocked by hardware
- **Evidence:** CSS and viewport contracts exist; emulation reports all insets as zero.
- **Required test:** current iPhone notch/Dynamic Island, older iPhone home indicator, Android cut-out phone, and 4:3 tablet; rotate, background/foreground, browser chrome change, notification interruption and resume without reward duplication.

### VR-MOB-007 — Scene-scoped Fishing background reloads on each entry

- **Severity:** Low
- **Status:** Confirmed observation
- **Actual:** three Fishing entries produced three resource records for the same background. Scene cleanup is correct and no leak occurred.
- **Repair specification:** measure transfer size/cache hit in production; if material, promote immutable core scene artwork to shared lifetime or retain the validated texture between re-entries while keeping unload tests for genuinely scene-specific assets.

### VR-MOB-008 — Exact duplicate Fishing artwork remains in legacy and runtime paths

- **Severity:** Low
- **Status:** Confirmed by production validation
- **Repair specification:** retain legacy provenance but avoid shipping duplicate bytes, for example by documenting one archival-only source and producing one runtime copy. Do not delete the source-of-truth reference without approval.

## Verification commands and results

| Verification | Result |
| --- | --- |
| Focused responsive/scale/Asset Lab/visual-comparison/Stage 9 suite | PASS — 31/31 |
| Complete project suite | **FAIL — one test** (`house/shop entrances, standing points and interior touch targets stay outside collision geometry`) |
| Production build and post-build validators | PASS |
| Type-check | Not configured as a project command |
| Lint | Not configured as a project command |
| Mobile browser sweep | Completed — seven profiles, five representative scene surfaces each |
| Orientation checks | Completed — three cases |
| Reference Overlay | Completed — four profiles |
| Asset Lab | Completed — four profiles |
| Transition stress | Completed — 21 transitions |
| Production Town performance | Completed — normal and 4× CPU |

## Repair order

1. Fix and browser-verify the 16 invalid standing points without moving art or collision geometry.
2. Profile and optimize Town until the agreed minimum-device production frame-time gate passes.
3. Add the three missing formal device profiles to scale contracts, Asset Lab and visual baselines.
4. Correct mobile text sizing in House Interior and Café.
5. Make the fullscreen product decision and implement only if approved.
6. Resolve duplicate/repeated Fishing resource delivery if production transfer measurements justify it.
7. Complete physical-device notch, touch, thermal, background/resume and 30–60 minute soak certification.

## Audit-only files introduced

- `scripts/audit-mobile-visual-readiness.mjs`
- `scripts/measure-production-town.mjs`
- `artifacts/visual-readiness-mobile-audit/RESULT.json`
- `artifacts/visual-readiness-mobile-audit/PRODUCTION_TOWN.json`
- representative screenshots under `artifacts/visual-readiness-mobile-audit/screenshots/`
- this report

No production scene, gameplay rule, layout, save field, level, economy value or artwork was changed by this audit.
