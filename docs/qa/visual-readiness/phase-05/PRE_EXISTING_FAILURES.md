# Phase 5 Pre-existing Findings

## Extended development-browser Town idle can exhaust clone memory

An initial deterministic Town regression load reached `TownScene`, reported ready, rendered correctly and produced no immediate warning/error. After the same development tab remained open for about 18 minutes while the complete automated suite ran, Chromium reported `DataCloneError: ... out of memory` from the existing `GameStateService.getSnapshot()` calls reached by `TownScene.update()` diagnostics and `HomeownerGiftController`.

This was not reproduced in the Phase 5 calibration scene. Phase 5 does not edit `GameStateService`, `TownScene.update`, cleanup diagnostics or the homeowner-gift controller, and the production build plus complete functional suite pass. It is therefore recorded as a pre-existing long-session/performance risk rather than hidden or attributed to the scale system.

Recommended future investigation: stop cloning the complete state every render frame for diagnostics, cache immutable diagnostic projections, and repeat a controlled long-session memory profile. This is outside the approved Phase 5 pilot scope.

