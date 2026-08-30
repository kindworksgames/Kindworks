# Stage 4 independent gameplay-geometry isolation re-test

Date: 2026-08-30  
Branch: `phase-2-ui-simplification`  
Starting commit: `3387bcb`  
Method: fresh adversarial inspection and testing; the prior repair summary was not used as proof.

## Verdict

**STAGE 4 NOT APPROVED — REPAIR REQUIRED.**

Replacement artwork itself remained isolated from the tested collision, navigation, interaction, save, reward, and minigame outcome contracts. However, the independent route audit found 16 declared interior standing points inside navigation obstacles. That is an unresolved high-severity geometry-contract defect and fails the Stage 4 gate.

No P0/P1 regression, save corruption, reward change, or artwork-dependent route change was found.

## Adversarial replacement method

The test did not compare filenames or trust declarations alone. It inspected three real repository images with materially different native canvases and alpha padding, then resolved each through a fresh semantic `VisualRegistry` as the same representative background prefab:

| Test file | Native canvas | Alpha / visible bounds | Resolved gameplay display | Result |
| --- | ---: | --- | ---: | --- |
| `/assets/animals/reference-master-v44.png` | 384×512 | alpha; visible 382×491 at (0,11) | 1280×720 | PASS |
| `/assets/powerwash/tool-precision.png` | 80×101 | alpha; visible 39×89 at (21,8) | 1280×720 | PASS |
| `/assets/powerwash/playground-master.png` | 1536×1024 | opaque | 1280×720 | PASS |

Additional controlled metadata cases used 8×4096 and 8199×8 canvases, extreme transparent padding, and authored origins outside the normal 0–1 range. Logical geometry digests did not change. An invalid 96×31 animation-frame contract was rejected before runtime and did not mutate logical geometry.

This is a registry/prefab and gameplay-contract substitution test using real image bytes; production manifests were not edited and no approved runtime artwork was overwritten.

## Coverage and evidence

| Area | Evidence | Result |
| --- | --- | --- |
| Canvas size, padding and origin independence | Three real image substitutions plus two adversarial metadata fixtures; prefab display stayed 1280×720 and geometry digest stayed identical | PASS |
| Animation-frame dimensions | Deliberately invalid 96×31 sheet rejected before runtime | PASS (safe rejection) |
| NPC routes | 104 outdoor graph segments sampled every 2 logical pixels; 0 obstacle violations. Live service route and deterministic placed-object detour retained route IDs | PASS |
| Animal movement | 481 ground-animal route segments across 56 animal definitions; 0 obstacle violations | PASS |
| Town entrances | All 19 house and 12 shop entrance/standing contracts clear their own collision footprints with player clearance | PASS |
| Interior navigation destinations | 16 standing points intersect declared navigation obstacles | **FAIL** |
| Mini-game input and outcome | Lawn Care browser swipe changed 7%/11 moves to 29%/10 moves. Baseline and replacement runs produced identical move, completion, reward, and protected save digest | PASS |
| River input | At 320×568, tapping the board changed an I piece from horizontal indices `[103,104,105,106]` to vertical `[113,123,133,143]` | PASS |
| Mobile touch targets | Lawn at 568×320: Exit 44×44, Undo 106×44, Hint 106×44. Village Grocer at 844×390: product targets 65.9–525.3×74, Close 44×44, Buy 232×44 | PASS |
| Tablet interaction | House Interior at 1024×768: Exit and Furnish controls 44px high; canvas 1024×576, centred | PASS (emulated tablet) |
| Save isolation | Fresh persisted-state scan found 0 texture paths, asset paths, sprite IDs, or frame names. Replacement Lawn completion produced the identical protected-state digest | PASS |
| Source isolation | 11 principal gameplay sources scanned for texture/frame/display-bound geometry reads; 0 prohibited dependencies found | PASS for inspected production paths |
| Development runtime | Narrow phone, modern phone, portrait River, and tablet flows operated; no runtime errors or missing resources recorded | PASS |
| Production build/runtime | Production build succeeded; 31 development markers absent; 844×390 production scene loaded with 0 errors/warnings and no QA tools | PASS |

Browser viewport checks are emulation in the in-app browser, not physical-device testing.

## Confirmed finding

### GEO-RETEST-01 — Interior standing points overlap navigation obstacles

- Severity: **High / P2**
- Status: **CONFIRMED — NOT FIXED (audit-only request)**
- Affected contract source: `src/data/interiorGeometry.js`, especially the generic standing-point calculation at lines 10–18 and the three interior contracts at lines 33–82.
- Root cause: `displayGeometry()` places a standing point at `display bottom + 38`, while the corresponding fixture/navigation obstacle can extend farther into the aisle. The existing schema validator confirms structure but does not enforce standing-point reachability or player clearance from obstacles.
- Runtime impact today: the current product buttons use independent interaction/touch zones, so the tested shop remains operable and no present player soft lock was reproduced. The invalid destinations are nonetheless unsafe for future player/NPC station navigation and mean the logical geometry contract is not internally valid.
- Save impact: none observed.
- Required repair:
  1. Author standing points from fixture boundaries and real aisle geometry, not display-card bounds.
  2. Validate every standing point against navigation obstacles using the player clearance radius.
  3. Validate that each required standing point is path-reachable from its scene spawn point.
  4. Keep visual positions, touch zones, inventory/economy, and saves unchanged.
  5. Rerun this complete re-test after repair.

Affected destinations:

- Village Grocer: 4 (`carrot-seeds`, `fresh-greens-seeds`, `wild-berry-starters`, `orchard-apple-sapling`)
- Paws & Wonders: 9 (`labrador`, `spaniel`, `dachshund`, `corgi`, `border-collie`, `husky`, `chinchilla`, `meerkat`, `baby-triceratops`)
- Harbour General: 3 (`slot-standing-3`, `slot-standing-4`, `slot-standing-5`)

Exact coordinates and intersecting obstacle IDs are recorded in `EVIDENCE.json`.

## Verification commands

- Independent targeted suite: 9 tests; 8 passed, 1 failed on GEO-RETEST-01.
- Complete project suite: 776 tests; 775 passed, 1 failed on the same finding. No unrelated test failed.
- Production build and all configured visual/asset/layout validators: PASS.
- Runtime production smoke at 844×390: PASS with no console errors/warnings and no development tools exposed.

## Evidence files

- `EVIDENCE.json` — machine-readable replacement, route, animal, standing-point, source, and save results.
- `tests/gameplay-geometry-isolation-independent-retest.test.js` — executable adversarial regression suite.
- `scripts/retest-gameplay-geometry-isolation.mjs` — repeatable evidence exporter.
- `screenshots/lawn-narrow-568x320.png`
- `screenshots/town-live-844x390.png`
- `screenshots/house-interior-1024x768.png`
- `screenshots/production-town-844x390.png`

## Approval condition

Stage 4 can be reconsidered only after GEO-RETEST-01 is repaired and both the targeted test and complete suite pass without changing gameplay or save contracts.
