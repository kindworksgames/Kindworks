# Stage 9 Runtime Evidence

## Activity routes exercised

Every route below was opened at 568×320, 844×390, 1024×768, 1180×820 and 1366×768 through the development Fidelity selector:

1. Lawn Care
2. Waste Collection
3. House Rescue
4. Beach Cleanup
5. Fishing
6. Magnet Fishing
7. Little Bakery
8. Corner Café
9. Morning Mug
10. Riverside Kitchen
11. South Shore Scoops
12. House Interior
13. Village Grocer
14. Fresh Market
15. Harbour General
16. River Restoration
17. Playground Power Wash

For every route the audit captured the body scene key, exact iframe dimensions, orientation state, body overflow, visible enabled controls, post-transform control rectangles and viewport intersection. No activity route returned a blank/wrong scene. No primary activity playfield was clipped.

## Exact responsive exceptions

| Viewport | Scene/screen | Element | Effective rectangle | Classification |
| ---: | --- | --- | ---: | --- |
| 568×320 | Village Grocer | `#shop-panel-close` | 40×44 | S9-TOUCH-001 |
| 568×320 | Fresh Market | `#shop-panel-close` | 40×44 | S9-TOUCH-001 |
| 844×390 | Village Grocer | `#shop-panel-close` | 40×44 | S9-TOUCH-001 |
| 844×390 | Fresh Market | `#shop-panel-close` | 40×44 | S9-TOUCH-001 |
| 844×390 | Harbour General | `#harbour-exit` | 42×44 | S9-TOUCH-001 |
| 844×390 | Animal Friends | list/detail client height | 3,041 px inside 366-px clipped card | S9-RESP-001 |
| 1024×768 | Animal Friends | list/detail client height | 3,041 px inside 690-px clipped card | S9-RESP-001 |

At 568×320 Animal Friends switches to its mobile flow: the 285-pixel-high card has `overflow:auto`, and the 56-species list is a 7,078-pixel-wide horizontal scroller. That working breakpoint is the control comparison for S9-RESP-001.

## Orientation evidence

- 390×844 + Lawn: body `data-orientation-blocked=true`; message exactly “Turn your device sideways to play.”
- 390×844 + River: body not blocked; River exit measured 44×44; Hint 92×54; Undo 364×44.
- Landscape → portrait → landscape Lawn journey: scene remained `LawnCareScene`; cut-cell count remained exactly 4 in all three states.
- No level restart, reward or duplicate state was observed during that journey.

## Production evidence

Fresh `dist` preview at `127.0.0.1:5188`:

- `TownScene` active.
- Exactly one Phaser canvas.
- Zero visible Fidelity controls or panels.
- Runtime console contained only Phaser's engine banner.
- Zero application warnings, errors or rejected promises.
- Zero failed-resource messages.
- Six static QA elements existed but were hidden. Five corresponding scene completion methods fail closed without development QA mode. House Rescue does not; see S9-PROD-001.

## Tooling artifact discrimination

Accumulated logs from one heavily reused iframe showed three `MutationObserver.observe` type errors during navigation replacement. A brand-new exact fixture tab produced only Vite connection records, and a brand-new production tab produced only the Phaser banner. The errors were therefore recorded as an iframe/browser-instrumentation artifact, not a product finding.

## Physical-device boundary

No physical phone or tablet was connected. The audit does **not** claim evidence for:

- real finger accuracy or multi-touch rejection;
- iOS/Android notch and home-indicator behaviour;
- browser chrome expansion/collapse;
- OS background suspension or forced termination;
- WebView storage eviction;
- thermal throttling, battery use or low-memory termination;
- Bluetooth/audio-focus interruption.

Those remain release-device tests even after Stage 9 repairs.

