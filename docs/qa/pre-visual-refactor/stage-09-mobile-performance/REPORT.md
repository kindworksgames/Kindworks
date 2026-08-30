# Stage 9 QA Report — Mobile/Tablet Usability, Performance and Stability

## Verdict

**NOT READY — STAGE 9 REPAIR REQUIRED.**

The Stage 8 repair report explicitly permits continuation: all Stage 8 P0–P2 findings are fixed and its final gate is `READY FOR NEXT QA STAGE`. Stage 9 found no crash, save regression, sustained frame-rate failure, retained scene, timer leak, missing resource or production console exception. All 17 directly routable activities fit five exact emulated landscape profiles without document overflow or off-screen primary playfields.

Stage 9 nevertheless confirms one P1 responsive-layout failure and two P2 production/mobile failures. Animal Friends cannot scroll most of its species list at widths above 720 CSS pixels because the list grows to 3,041 pixels inside a clipped card. Three essential close/exit targets render below the project's 44×44-pixel touch contract. House Rescue also leaves an unguarded certified-completion action in the production DOM; it is visually hidden, but its production scene handler does not require development QA mode.

This was an audit only. No production behaviour or styling was repaired.

## Baseline and environment

- Branch: `phase-2-ui-simplification`
- Starting commit: `3387bcb`
- Browser: Codex in-app Chromium, WebGL renderer, Phaser 4.2.1
- Runtime build: Vite development build at `127.0.0.1:5187`
- Production smoke build: Vite preview at `127.0.0.1:5188`
- Viewport fixture: same-origin iframe with exact CSS dimensions and development-only metrics; it does not ship in the production entry point.
- Input: browser-controlled mouse/keyboard/pointer emulation plus automated touch/swipe contracts. This is **not physical-device touch testing**.
- Save isolation: the existing Fidelity QA namespace; no real player save was used.
- Existing dirty worktree changes were preserved.

## Execution summary

| Check | Result |
| --- | --- |
| Previous repair gate | PASS — Stage 8 says `READY FOR NEXT QA STAGE` |
| Complete automated regression | PASS — 641/641, 0 failed, 0 skipped |
| Production build | PASS — 179 modules, 1.47 seconds |
| Performance budget | PASS — 19 lazy chunks; 4,827,700 JavaScript bytes |
| Differential HTML parity | PASS — 13 activities, 5,850 levels, 19 domains, 85 exact rules |
| Minigame/reward parity | PASS — 14 games, 75 comparisons, 105,795 instances |
| Exact viewport activity sweep | PASS — 17/17 at each of five landscape profiles |
| Portrait orientation checks | PASS — landscape play pauses; River remains playable in portrait |
| Orientation state restoration | PASS — Lawn remained on the same scene with exactly four cut cells |
| Thirty rapid scene changes | PASS cleanup — one active scene, two canvases, zero active scene timers, unchanged 1,627 DOM nodes |
| One-minute foreground soak | PASS — 60.66 FPS; p95 17.0 ms; no >20 ms frame in final 1,800-frame window |
| Fresh production runtime console | PASS — Phaser banner only; no application warning/error |
| Failed resources | PASS — none observed in fresh development or production runs |
| Physical iOS/Android hardware | BLOCKED / NOT TESTED — no device was available |

## Confirmed findings

| Finding | Severity | Summary | Status |
| --- | --- | --- | --- |
| S9-RESP-001 | P1 | Animal Friends species/food content expands far beyond its clipped card at 844×390 and 1024×768; most species cannot be reached because the apparent `overflow:auto` children have no constrained client height. | CONFIRMED, NOT FIXED |
| S9-TOUCH-001 | P2 | Shared shop close is effectively 40×44 at 568×320 and 844×390; Harbour exit is 42×44 at 844×390, below the 44×44 contract after responsive transforms. | CONFIRMED, NOT FIXED |
| S9-PROD-001 | P2 | House Rescue's hidden certified-completion button and listener exist in production, and `completeQa()` lacks the QA-mode guard used by the other cleanup scenes. | CONFIRMED, NOT FIXED |

Full reproductions and required regression tests are in [FINDINGS_REGISTER.md](FINDINGS_REGISTER.md).

## What passed

- Town, every cleanup/action game, all five restaurant games, fishing/magnet fishing, three shops and House Interior loaded at 568×320, 844×390, 1024×768, 1180×820 and 1366×768.
- Those activity surfaces had no page overflow, no clipped playable board and no enabled interactive element outside the viewport.
- River correctly requested portrait in landscape and operated at 390×844; Lawn and other landscape activities displayed the one-sentence rotate gate in portrait.
- Lawn progress survived landscape → portrait → landscape without scene restart or duplicated progress.
- DOM gameplay boards use `touch-action:none`; buttons use `touch-action:manipulation`; the existing gesture tests cover directional swipes and tap/drag separation.
- Foreground steady-state samples for Beach, Lawn, Waste, Bakery, Village Grocer and Power Wash settled at approximately 60 FPS. Ordinary-scene p95 frame time stayed below 19 ms.
- Transition stress produced transient long frames but recovered immediately; no scene, canvas, DOM-node or timer accumulation was found.
- The production build exposed no Fidelity panel. Six static QA elements were hidden; five completion handlers are QA-mode guarded. House Rescue is the exception recorded as S9-PROD-001.

## Performance and stability interpretation

The measured maximum transition spikes (up to 266.7 ms during an ordinary lazy Power Wash open and 565.8 ms during an intentionally unrealistic 30-change/220-ms stress loop) are recorded as observations, not confirmed sustained defects. After the stress loop Phaser reported 59.86 FPS, and the subsequent one-minute soak had no frame over 20 ms in its final 1,800-frame window.

The JavaScript heap values include the in-app browser, QA instrumentation and development modules. Used heap fluctuated with garbage collection; total allocated heap changed by only about 0.5 MB during the one-minute stable-scene soak. This is not evidence of a leak, but a physical WebView memory profile remains required before release.

See [PERFORMANCE_STABILITY_REPORT.md](PERFORMANCE_STABILITY_REPORT.md) and [RUNTIME_EVIDENCE.md](RUNTIME_EVIDENCE.md) for the measurements and limitations.

## Audit-only files added or updated

- `docs/qa/pre-visual-refactor/stage-09-mobile-performance/REPORT.md`
- `docs/qa/pre-visual-refactor/stage-09-mobile-performance/COVERAGE_MATRIX.md`
- `docs/qa/pre-visual-refactor/stage-09-mobile-performance/PERFORMANCE_STABILITY_REPORT.md`
- `docs/qa/pre-visual-refactor/stage-09-mobile-performance/RUNTIME_EVIDENCE.md`
- `docs/qa/pre-visual-refactor/stage-09-mobile-performance/FINDINGS_REGISTER.md`
- `docs/qa/pre-visual-refactor/stage-09-mobile-performance/fixtures/viewport-frame.html`
- Stage register entry in `docs/qa/pre-visual-refactor/README.md`

No production file was changed by Stage 9.

## Required repair order

1. Repair S9-RESP-001 and verify every animal, food action, follower action and close action at 844×390, 1024×768, 1180×820 and 1366×768 as well as the already-working 568×320 breakpoint.
2. Repair the effective touch geometry in S9-TOUCH-001 without reducing the game board.
3. Remove or QA-gate House Rescue's production completion listener (S9-PROD-001) and add a production-bundle regression test.
4. Rerun the complete Stage 9 profile sweep, 30-transition cleanup check, production console/resource smoke, performance budget and full test suite before Stage 10.

