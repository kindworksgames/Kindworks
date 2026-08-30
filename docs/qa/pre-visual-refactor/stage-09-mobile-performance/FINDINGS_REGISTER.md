# Stage 9 Findings Register

## Confirmed defects

### S9-RESP-001 — Animal Friends content is clipped and cannot scroll at widths above 720 pixels

- **Severity:** P1
- **Status:** FIXED — verified in browser emulation at all five Stage 9 landscape profiles
- **Reproduction:** At 844×390 or 1024×768 in Town, open Menu → Animals. Inspect or attempt to scroll through the species list and food actions.
- **Expected:** The list and detail columns remain constrained to the visible card and scroll independently, so every species, feeding action and follower action is reachable.
- **Actual:** At 844×390 the card is 793×366 with `overflow:hidden`, but both `.animal-friends-list` and `.animal-detail` have a 3,041-pixel client height. The layout itself is only 555 pixels high. At 1024×768 the card is 963×690 and the same children remain 3,041 pixels high. Their `overflow:auto` never activates because client height equals content height; the parent clips the remainder. At 844×390 the first food actions begin below the visible card. At 1024×768 later species remain clipped.
- **Evidence:** Runtime geometry at 844×390: card bottom 378; list/detail bottom 3,139.5. Runtime geometry at 1024×768: card bottom 729; list/detail bottom 3,171. The card scroll height is 3,129 while its overflow is hidden. The 568×320 breakpoint works differently: the card is vertically scrollable and the species list is a 7,078-pixel horizontal scroller.
- **Affected files:** `src/style.css` Animal Friends rules, particularly `.animal-friends-card`, `.animal-friends-layout`, `.animal-friends-list`, `.animal-detail` and the 720-pixel breakpoint.
- **Suspected root cause:** The two-column grid has a maximum height but no definite constrained track/minimum-size reset. Its grid children retain content-based minimum height, so their own overflow regions expand instead of scrolling.
- **Required regression:** At every Stage 9 landscape profile, assert that the visible card contains constrained scrollports; programmatically scroll to the final species and final food/follower control; operate them and return to Town. Recheck empty, partial, five-pet/follower and large-list states.

### S9-TOUCH-001 — Essential mobile close/exit targets shrink below 44×44 pixels

- **Severity:** P2
- **Status:** FIXED — all affected effective rectangles are at least 44×44
- **Reproduction:** Open Village Grocer or Fresh Market at 568×320 and 844×390 and measure `#shop-panel-close`; open Harbour General at 844×390 and measure `#harbour-exit`.
- **Expected:** Every essential exit/close target has an effective post-transform hit rectangle of at least the project token `--kw-touch-min: 44px` in both axes.
- **Actual:** Shared shop close measures 40×44 at both phone profiles. Harbour exit measures 42×44 at 844×390. All remain visible and clickable, but their effective width violates the touch contract.
- **Evidence:** Exact same-origin viewport geometry, after responsive CSS and transforms, not declared CSS width.
- **Affected files:** `src/shop-reference.css`, `src/style.css` responsive shop/Harbour transforms and close/exit rules.
- **Suspected root cause:** Parent responsive scaling reduces an otherwise 44-pixel declared button after layout.
- **Required regression:** Measure the final `getBoundingClientRect()` for enabled essential controls at 568×320, 844×390, 1024×768, 1180×820 and 1366×768; require width and height ≥44 without covering playable content.

### S9-PROD-001 — House Rescue certified-completion action is not QA-mode guarded in production

- **Severity:** P2
- **Status:** FIXED — production invocation fails closed before service mutation
- **Reproduction:** Build/serve production. The hidden `#house-rescue-qa-complete` element is present. When House Rescue binds, its click listener calls `completeQa()`. Unlike Lawn, Beach, River, Waste and Power Wash, `completeQa()` does not check `this.qaMode` before `HouseRescueService.qaComplete()` mutates the active session.
- **Expected:** Development completion controls are absent from the production bundle or every invocation fails closed outside explicit development QA mode.
- **Actual:** The button is visually hidden from ordinary players, but production code retains a callable completion path that can advance the sort/vacuum session.
- **Evidence:** Fresh production runtime contained six hidden QA controls and no visible QA panel. Static handler comparison shows guards in the other five scenes; House Rescue lines 303–307 call the service directly.
- **Affected files:** `index.html`, `src/scenes/HouseRescueScene.js`, potentially the production-control contract tests.
- **Suspected root cause:** Visibility was treated as the only production boundary when the House Rescue handler was added.
- **Required regression:** In a production-mode House Rescue session, dispatching the hidden control and directly calling the scene completion handler must not change phase, score, reward or save. Development QA mode must retain the certified test path.

## Observations, exclusions and blocked work

- **OBS-S9-01:** Ordinary lazy scene entry produced isolated maximum frames between 83 and 267 ms; a deliberately extreme 30-transition loop produced a 566-ms maximum. Steady-state p95 remained below 19 ms and recovered to about 60 FPS. Treat as a loading-transition optimization candidate, not a confirmed functional defect.
- **OBS-S9-02:** Public assets total about 6.6 MB. The largest individual assets are the 2.4-MB Power Wash master, 1.9-MB dirt reference and 1.8-MB Harbour reference. Build budgets pass; cold cellular transfer was not available.
- **OBS-S9-03:** The development run logged warnings about multiple interrupted activities only after direct QA routing deliberately created overlapping checkpoints. Stage 8 already verified deterministic recovery; this was not reproduced on a fresh production run.
- **EXCLUDED TOOL ARTIFACT:** Three `MutationObserver.observe` errors appeared only while repeatedly replacing an instrumented iframe. A fresh isolated fixture tab and fresh production tab did not reproduce them, so they are not classified as game defects.
- **BLOCKED:** Physical iOS/Android safe areas, real multi-touch, OS suspend/resume, WebView memory pressure, thermal throttling, storage eviction and hardware-specific audio interruption were not testable in browser emulation.

## Severity summary

| Severity | Count |
| --- | ---: |
| P0 | 0 |
| P1 | 0 open / 1 fixed |
| P2 | 0 open / 2 fixed |
| P3 | 0 |
| Observation | 3 |
| User decision required | 0 new / 1 inherited non-blocking |
