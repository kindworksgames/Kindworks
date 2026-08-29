# Stage 2 Findings Register

| ID | Severity | Classification | Status | Summary | Reproduction/evidence | Expected | Actual | Suspected cause | Affected files | Required regression |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S2-F01 | P2 | Player-facing presentation defect | CONFIRMED — NOT FIXED | Internal migration/developer labels and diagnostics are visible | Fresh production Town, resident creator, economy/inventory, Shop, Stories, Animals, home and venue HUDs; `rg` confirms the strings | Game-facing labels only | `MILESTONE`, `VERTICAL SLICE`, raw coordinates, legacy catalogue counts and implementation copy display to players | QA/migration copy was embedded in production markup and scene badge updates | `index.html`, `src/scenes/TownScene.js`, multiple scene interface methods | Production-copy test rejects internal terms/coordinates from visible UI |
| S2-F02 | P3 | Stale state after scene entry/re-entry | CONFIRMED — NOT FIXED | House Interior body/root scene markers disagree | Fidelity House Interior twice: body=`HouseInteriorScene`, `#game`=`TownScene`; source lacks root assignment | Both public runtime markers identify House Interior | Root marker stays at Town | Missing `#game.dataset.scene` update in House Interior interface setup/render | `src/scenes/HouseInteriorScene.js` | Enter/exit/re-enter assertion for body/root marker agreement |

## P0

None confirmed.

## P1

None confirmed.

## P2

- S2-F01.

## P3

- S2-F02.

## Observations / coverage gaps

| ID | Type | Status | Detail |
| --- | --- | --- | --- |
| S2-O01 | Assurance | OPEN | Type checking and linting are not configured. |
| S2-O02 | Manual-device gate | OPEN | Live phone/tablet viewport rendering, notches, physical pinch, background/resume and touch latency were unavailable. Automated contracts pass. |
| S2-O03 | Runtime reachability gap | OPEN | Paws & Wonders normal doorway entry was not completed live; source/service coverage passes. |
| S2-O04 | State-render breadth | OPEN | Many completed, failed, locked and error renderings were verified by tests/source rather than live operation. |
| S2-O05 | Development harness | DOCUMENTED | Full-screen Power Wash deliberately hides the fidelity panel; normal exit is required before switching activities. |
| S2-O06 | Development fixture | DOCUMENTED | `?qa=narrative` can stack onboarding and narrative on a fresh QA origin; normal production flow did not reproduce this. |

## Visual-only findings

None added in this functional stage. Final art, animation feel, audio, and pixel-level fidelity remain pre-existing manual gates and were not redesigned.

## User decisions required

No new gameplay/economy/save decision is required to repair S2-F01 or S2-F02. Existing Stage 1 decisions about native packaging, ambient venues, and trusted billing remain open.
