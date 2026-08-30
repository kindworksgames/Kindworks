# Stage 10 Findings Register

## Confirmed defects

| ID | Severity | Status | System | Expected | Actual | Evidence / reproduction | Suspected cause | Required repair regression |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S10-PROD-001 | P2 | **FIXED — VERIFIED** | Production diagnostics and development tooling | Production should expose only player-required runtime behaviour; QA/debug/state/catalogue tools and internal backend-style counters must be development-only | Production exports and diagnostic publishers are now compiled out. At 844×390 the three globals were undefined and `#game` had zero internal data attributes; the development Fidelity panel and Sprite-AI coverage remained available | `scripts/verify-production-surface.mjs` passes against every production JavaScript chunk; 648/648 tests, both parity validators, build and focused runtime checks pass | Development certification and visual-asset instrumentation were added incrementally, but only individual mutation methods had been guarded | Fixed with build-time guards and a permanent post-build rejection gate; see `REPAIR_REPORT.md` |

No P0–P3 defect remains open.

## Observations and non-defects

| ID | Classification | Evidence | Disposition |
| --- | --- | --- | --- |
| S10-OBS-001 | Assurance observation | No lint or type-check command is configured | Consider adding small repository-native static checks later; not a functional blocker by itself |
| S10-OBS-002 | Intentional archived assets | Harbour/Magnet legacy reference images and provenance manifests are shipped from `public` but are not loaded. Existing Phase 0 documentation classifies them as archived references | Preserve until the approved asset-manifest migration decides their final location |
| S10-OBS-003 | Test-fixture artifact | One null-access error appeared only when the Stage 9 outer iframe fixture itself was reloaded before the embedded game exposed its QA global. It did not reproduce on a direct development reload or two production reloads, and no application error appeared in the 18-scene sweep | Do not classify as a game defect; make the outer fixture tolerate an embedded app that is still loading if it is retained for future QA |
| S10-OBS-004 | Expected visual-only gap | Code-built/procedural visuals and final asset/audio/animation polish remain non-identical to the HTML/reference art | Belongs to the visual-readiness refactor; gameplay/data parity evidence is separate |

## User decisions required

| ID | Decision | Current protected behaviour | Why Stage 10 cannot choose |
| --- | --- | --- | --- |
| S10-UDR-001 | Companion cap and voluntary freeing | Latest protected HTML and Phaser allow all 11 permanent Paws companions and no voluntary freeing | Older requirements specify a five-pet cap and freeing. A change needs ownership/refund/UI/save-migration rules |
| S10-UDR-002 | Native/cloud save and Capacitor release scope | Browser-local checksummed saves are the implemented contract | Native wrapper, cloud sync, keychain/storage eviction and device migration policy are outside this repository state |
| S10-UDR-003 | Production billing integration | Commerce correctly fails closed without a trusted billing/receipt/time bridge | Store products, signed receipts and server/trusted-time integration require an external release decision |
| S10-UDR-004 | South Shore venue name | Both protected source and Phaser retain the Café/Scoops dual naming bridge | This is a content naming decision, not a safely inferable code repair |
