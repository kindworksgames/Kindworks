# Phase 1 Pre-existing Failures and Constraints

This register is deliberately separate from Phase 1 regressions.

## Automated failures

No automated failure remains after the Phase 1 changes.

During implementation, the existing differential-parity test correctly rejected the newly added read-only QA route because its exact allow-list did not include `visual-regression`. The route remained development-only and read-only; the allow-list test was updated and rerun successfully. This was a Phase 1 integration correction, not a gameplay defect.

## Pre-existing constraints

| ID | Type | Status | Detail |
| --- | --- | --- | --- |
| VR1-C01 | Coverage constraint | OPEN | No physical phone/tablet run was available; browser emulation is clearly labelled. |
| VR1-C02 | Tooling constraint | OPEN | Repository-wide type checking is not configured. |
| VR1-C03 | Tooling constraint | OPEN | Repository-wide linting is not configured. |
| VR1-C04 | Visual baseline fact | OPEN | Current procedural/placeholder artwork and known HTML/Phaser visual differences are captured but not approved as final art. |
| VR1-C05 | Coverage constraint | OPEN | Representative family baselines do not equal all 18 scenes at all five viewports. |
| VR1-C06 | Comparison constraint | DOCUMENTED | Animated canvas captures are not byte-stable; source fingerprints, exact stored-image integrity and tolerance-based comparison are used instead. |

None of these constraints invalidates the Phase 1 regression-safety gate. They must remain visible when later phases claim broader scene or physical-device coverage.
