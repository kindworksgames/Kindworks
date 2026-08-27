# KindWorks Phase 2 — Mobile UX Improvement Report

## Working baseline

- Branch: `phase-2-mobile-ux-improvement`
- Starting commit: `ae262cd87a443c64f40ce9ed043303c1456804b5`
- Starting branch: `main` (matched `origin/main`)
- Phase 1 contract: `docs/qa/PHASE_1_MIGRATION_PARITY_AUDIT.md`
- Baseline automated tests: 450 passed, 0 failed
- Current automated tests: 464 passed, 0 failed after the River Clear-Out batch
- Baseline build: existing production `dist`, Phaser 4.2.1
- Baseline input: mouse and keyboard through the local browser preview
- Available visual reference: `KindWorks_Visual_Style_Bible_v3.0.pdf`
- Required but unavailable reference: Visual Style Bible v4 and `KW-REF-HOUSE-A-V4`

The v3 reference is used provisionally for established KindWorks tokens only: warm-cloud/cream panels, deep-ink text, sunflower primary actions, willow-green success, terracotta warnings, rounded 16–24px corners, soft shadows, minimum 44px touch targets, mobile-readable silhouettes and one focal effect at a time. No v4-specific art or visual decision will be invented.

## Required viewport matrix

| Device class | Viewport | Baseline captured | Current observation |
| ------------ | -------: | ----------------- | ------------------- |
| Small phone | 568×320 | Yes | Town HUD uses four essential top items; objective and contextual action do not overlap; all eight menu destinations fit without scrolling |
| Phone | 667×375 | Yes | Town HUD, compact objective and 44px menu target pass without crop or overflow |
| Phone | 736×414 | Yes | 721–900px compact-objective breakpoint prevents prompt overlap; 44px menu target passes |
| Wider phone | 812×375 | Yes | Compact objective and action-led prompt preserve the playable map; no document overflow |
| Modern phone | 844×390 | Yes | Town hierarchy, prompt separation and menu target pass with exact viewport dimensions |
| Tablet | 1024×768 | Yes | Full first-job checklist fits without touching the contextual action |
| Large tablet | 1180×820 | Yes | Full town layout passes with no crop or overflow |
| Original reference | 1280×720 | Yes | Full town layout passes with no crop or overflow |
| Desktop QA | 1366×768 | Yes | Full town layout passes with no crop or overflow |
| Portrait safety | 390×844 | Yes | Town pauses behind one rotate icon and resumes at the exact map position |

Baseline evidence is stored outside the repository under `phase2-evidence/baseline/` in the Codex task workspace.

## Screen improvement register

| Screen | Original problem | Change made | Viewports tested | Gameplay regression result | Before evidence | After evidence | Commit |
| ------ | ---------------- | ----------- | ---------------- | -------------------------- | --------------- | -------------- | ------ |
| Wave 0 baseline | No protected Phase 2 branch, tracking report or full viewport baseline | Created branch, captured all required baseline sizes and established the functional contract | All required sizes plus 390×844 portrait | 450/450 tests passed before changes | `phase2-evidence/baseline/` | N/A | `593b456` |
| Global landscape shell | Portrait displayed active, overlapping town gameplay and did not pause its systems | Added one global orientation controller, a single-sentence safe rotate state, exact game-loop freeze/wake, service pause reasons and River portrait exemption | 568×320, 667×375, 736×414, 812×375, 844×390, 1024×768, 1180×820, 1280×720, 1366×768, 390×844 | Production build and performance budget pass; 454 full tests pass; movement, wallet open/close, rotate/resume and saved town state pass | `phase2-evidence/baseline/town-390x844-before.png` | `phase2-evidence/wave1/town-390x844-after.png` plus full Wave 1 matrix | `1469a93` |
| Shared control states | Controls used unrelated pressed, disabled, selected and focus treatments; dynamically rendered controls had no shared state contract | Added reusable tokens and one delegated controller for normal, pressed, disabled and selected states across fixed and dynamic buttons | All required landscape sizes plus 390×844 portrait; wallet inspected at 844×390 | 206/206 live controls enhanced on the saved test game; wallet tab switch and close pass; no overflow; no runtime warning/error logs; production build and performance budget pass; 456/456 tests pass | `phase2-evidence/wave2/wallet-844x390-before.png` | `phase2-evidence/wave2/wallet-844x390-after.png` | `1d8cb7e` |
| Shared loading and error feedback | Lazy activity imports changed an invisible attribute and failures were console-only, leaving players without a clear transition or recovery message | Added one shared `Loading…` state and one dismissible “That area couldn’t open. Try again.” notification, wired into every lazy scene transition | 568×320, 844×390, 1024×768, 1280×720 and 390×844 portrait in Waste Collection | Entered through the normal town action, loading cleared, portrait paused, safe exit returned to the same position, Sprite AI coverage stayed complete, runtime logs clean, build/performance pass and 458/458 tests pass | No visible loading/error component existed | `phase2-evidence/wave2/waste-844x390-loading-cleared.png` | `cc89540` |
| Town HUD and secondary navigation | Seventeen visible buttons competed with the map; eight secondary destinations occupied the top HUD; the first-job card and nearby-action card overlapped at phone breakpoints; Waste Collection inherited the town objective; compact-menu labels and Save fell outside the smallest panel | Kept day, weather, coins and one Menu entry; moved all eight secondary destinations into a pausing, focus-contained menu; shortened labels; compacted the current objective and contextual detail at phone widths; hid town-only objective/menu outside Town; added width- and height-adaptive layouts | All nine required landscape sizes plus 390×844 portrait; menu inspected at 568×320 and 844×390 | Menu-to-Inventory, Escape, complete Tab focus cycle, touch/keyboard movement, portrait exact-state resume, normal Town-to-Waste entry and safe return all pass; location remains exact, wallet remains 100, runtime logs clean, build/performance pass and 460/460 tests pass | `phase2-evidence/baseline/town-568x320-before.png`; `phase2-evidence/baseline/town-844x390-before.png` | `phase2-evidence/wave3/` full matrix, including `town-568x320-after.png` and `town-menu-568x320-after.png` | `3c7034e` |
| Lawn Care | At 568×320 every mower direction and the status message were below the viewport; the scrollable fixed-width HUD distorted the square board; phone and tablet controls were below the 44px target; instructions repeated mechanics and `Save & exit` did not describe its two-step cancellation flow | Added a non-scrolling three-row landscape shell, square aspect-preserving board, unused-width D-pad, compact contextual side rail, always-visible feedback, 44px controls, short action-led messages and an accurate `Exit` label | All nine required landscape sizes plus 390×844 portrait; success and failure at 568×320 | Live swipe changed 7%/0 moves to 29%/1 and Undo restored 7%/0; safe-route completion reached 100% in 9 moves and paid exactly +100; 29%/11-move failure paid +0; Replay, confirmed Exit, exact Town return, rotation, active-attempt reload and clean runtime logs pass; build/performance pass and 462/462 tests pass | `phase2-evidence/wave4-lawn/lawn-568x320-before.png`; `phase2-evidence/wave4-lawn/lawn-844x390-before.png` | `phase2-evidence/wave4-lawn/` full matrix, including `lawn-568x320-after.png` and `lawn-568x320-success-after.png` | `54150a2` |
| River Clear-Out | River was allowed in both orientations despite its tall 10×16 Tetris board; the 390×844 board used only 252×403 pixels; at 320px wide the original side rail clipped the Hint control; the level picker and result used almost full-height empty panels; Exit was only 37px wide and instructions repeated the completion rule | Made River the explicit portrait-only exception, added the one-sentence upright-device pause state, rebuilt the portrait shell around an aspect-correct board, added a 320px control-rail breakpoint, 44px controls, compact level/reward cards and shorter contextual copy | All nine required landscape sizes as protected rotate states; 320×568, 375×667, 390×844, 414×736, 768×1024 and 820×1180 portrait gameplay | Real movement/rotation/drop/undo and Hint pass; six unplanned drops produced the expected 0%, +0 failure; Replay reset exactly; certified completion produced 100%, three rows, three stars and +100; wallet persisted at 310 after reload; two-step Exit and exact Town return pass; production build/performance pass and 464/464 tests pass | `phase2-evidence/wave4-river/river-390x844-before.png`; `phase2-evidence/wave4-river/river-390x844-picker-before.png` | `phase2-evidence/wave4-river/river-390x844-production-after.png`; `phase2-evidence/wave4-river/river-320x568-production-after.png`; `phase2-evidence/wave4-river/river-390x844-success-after.png`; `phase2-evidence/wave4-river/river-844x390-rotate-after.png` | `cdc0ab4` |

## Change register

| Change ID | System | UX reason | Files changed | Behaviour changed? | Save impact | Tests added | Status |
| --------- | ------ | --------- | ------------- | ------------------ | ----------- | ----------- | ------ |
| KW-P2-000 | Baseline protection | Prevent Phase 2 work from changing validated behaviour invisibly | Phase 1 report; this report | No | None | Existing 450-test suite rerun | Verified |
| KW-P2-001 | Global responsive shell | Prevent broken portrait gameplay and protect exact running state during rotation | `index.html`; `src/main.js`; `src/style.css`; `src/ui/ResponsiveShellController.js`; responsive shell tests; this report | Yes: non-River portrait now pauses; River remains portrait-supported | No schema or durable-state change; current state is persisted before sleep and resumed without offline advancement | 4 responsive shell tests, including all required landscape sizes and exact pause/wake calls | Verified |
| KW-P2-002 | Shared UI interaction foundation | Make every fixed and dynamically rendered button communicate input and availability consistently | `src/main.js`; `src/style.css`; `src/ui/InteractionFeedbackController.js`; interaction feedback tests; this report | No gameplay rule change; presentation state follows existing button state | None | 2 focused state/token tests; full 456-test suite | Verified |
| KW-P2-003 | Shared loading and error states | Explain scene imports and recover visibly when a lazy activity cannot open | `src/main.js`; `src/scenes/lazyScenes.js`; `src/style.css`; `src/ui/SharedOverlayController.js`; shared overlay tests; this report | No gameplay rule change; scene loading now has visible transient feedback | None | 2 focused copy/wiring tests; full 458-test suite | Verified |
| KW-P2-004 | Town HUD and navigation | Make the map dominant, remove equally prominent secondary choices, prevent mobile overlap and keep every destination reachable | `index.html`; `src/main.js`; `src/style.css`; `src/ui/TownMenuController.js`; `src/ui/OnboardingController.js`; `src/ui/SaveStatusController.js`; town-menu tests; this report | No gameplay rule change; the town menu adds a runtime-only pause reason while open | None; no schema, balance, reward, ownership, placement or progression data changed | 2 focused town-menu tests; full 460-test suite | Verified |
| KW-P2-005 | Lawn Care mobile gameplay | Keep the mower board and all essential feedback operable on the smallest landscape phone without changing 750-level parity | `index.html`; `src/scenes/LawnCareScene.js`; `src/style.css`; Lawn mobile UX tests; this report | No gameplay rule change; layout, labels and transient feedback only | None; active-session payload, campaign progress, rewards and town lawn state unchanged | 2 focused mobile UX tests plus existing 9 Lawn Care rule tests; full 462-test suite | Verified |
| KW-P2-006 | River Clear-Out portrait gameplay | Match the tall Tetris board to the user-approved portrait exception while preventing clipped controls and empty full-height panels | `index.html`; `src/scenes/RiverClearoutScene.js`; `src/style.css`; `src/ui/ResponsiveShellController.js`; responsive-shell and River mobile UX tests; this report | Yes: River now pauses in landscape and plays only in portrait; no level, completion, reward or difficulty rule changed | None; active attempt, 750-level campaign, wallet and save schema remain unchanged | 2 new River mobile UX tests, expanded orientation tests and full 464-test suite | Verified |

### KW-P2-001 protected rule record

- Original rule: individual mini-games displayed separate portrait barriers at narrow widths; Town had no barrier and the shared Phaser loop and world systems continued running.
- Demonstrated problem: 390×844 rendered the complete town with a tall, overlapping HUD and active controls. Rotation could allow world time, NPCs and timed gameplay to continue while the player could not safely see or operate it.
- Smallest effective change: a shared controller detects the active scene and viewport, freezes the Phaser loop, adds an `orientation` pause reason to the world, NPC and municipal systems, and displays one global overlay. It wakes only after landscape returns. `RiverClearoutScene` is explicitly exempt.
- New rule: all active game scenes require landscape except River Clear-Out. Portrait pauses without completing, restarting, rewarding or mutating a level. Returning to landscape wakes the same scene and refreshes scale.
- Save compatibility: the save schema and payload are unchanged. The orientation reason is runtime-only; the current validated state is persisted before the game loop sleeps.
- Runtime proof: at 390×844 the body reported `orientationBlocked=true`, `rotate-device`, and the fixed sentence. After returning to 844×390 it reported `orientationBlocked=false`, the same `TownScene`, same location and same coin balance. Touch movement and wallet open/close then worked normally.

### KW-P2-002 verification note

The first live implementation attempt observed every CSS class mutation while adding its own class. Computer-controlled testing caught the resulting browser feedback loop before commit. The controller was corrected to observe only disabled and accessibility selection attributes, then resynchronise the clicked control and its sibling group once after the real click. The rebuilt game reported 206 controls, 206 enhanced controls and zero controls without a state at every required viewport. Wallet and Inventory tabs changed between `selected` and `normal` correctly, disabled controls remained disabled, the panel closed normally, portrait protection still worked and the browser runtime log contained no warnings or errors.

### KW-P2-004 verification note

- Original presentation: the saved Town state exposed 17 visible buttons at every measured size. Shop, Inventory, Resident, Animals, Welcome, Impact, Stories and Save competed directly with exploration. At 568×320 the first-job card and contextual action overlapped; at 736–844px the expanded checklist still touched the action; Waste Collection displayed the Town objective behind its own HUD.
- Smallest effective change: preserve all eight destination buttons and their existing controllers, but move them behind one `Menu` control. The menu contributes its own modal pause reason, closes in the capture phase before a destination opens, traps keyboard focus, closes with Escape and uses three columns only below 420px landscape height. The phone objective shows one short goal and its next action; larger tablets retain the full checklist.
- Runtime proof: the 568×320 menu displayed all eight destinations, including Save, with 44px controls and no internal scroll. A complete Tab cycle returned from Save to Close. Menu → Inventory kept the inventory dialog open, closing restored movement, and a real right-arrow input changed `WILLOW COMMONS · 1244, 1294` to `1257, 1294`.
- Integration proof: Waste Collection was entered through `Collect 4 pieces of rubbish`; only its own HUD was visible. Safe exit returned to `TownScene` at `1244, 1294` with `🪙 100`, proving no cleanup reward or location change was introduced.
- Responsive proof: every required landscape viewport reported exact viewport/document dimensions, no objective/action overlap and a 44px Menu target. A 390×844 rotation retained the exact Town position when returning to 844×390. Browser warnings/errors remained empty.

### KW-P2-005 verification note

- Original rule: the mower slides until a hedge, Level 1 has an 11-move limit and 9-move par, at least 50% is required, Undo retains five moves, town-job results update the exact lawn, and the original reward/progression/save rules apply across all 750 levels.
- Demonstrated problem: at 568×320 the direction rail began at y=312 in a 320px viewport and the status began at y=351. Players could see only the board and side panel, not operate the mower or read feedback. The 7×7 Level 1 board was also stretched to 378×206.
- Smallest effective change: retain the existing DOM, service and scene logic; make the short-landscape HUD a fixed header/play/status grid; move directions and Undo into unused width beside an aspect-correct board; hide the already-explained mower/legend copy at phone heights; keep Hint and Restart contextual; raise every active control to 44px; shorten only transient copy.
- Live input proof: a real horizontal swipe moved the mower from 7%/0 moves to 29%/1; the visible Undo restored 7%/0. Repeated live Hint plus direction clicks completed the certified path at 100%, 9/11 moves and 3 stars, raising the test wallet from 100 to 200 exactly once.
- Failure/recovery proof: alternating right/left inputs exhausted all 11 moves at 29%, displayed `This lawn needs another pass`, paid +0 and left 200 coins. Replay reset to 7%/0. Exit required the explicit second click and returned to `WILLOW COMMONS · 1257, 1226` without changing the wallet.
- Responsive/save proof: all nine landscape sizes kept the HUD and status inside the viewport, board aspect ratio at 1.0, document dimensions exact and smallest live button at 44px. A 390×844 rotation and a full reload both preserved 7%, 0/11 moves and 200 coins. Runtime warnings/errors remained empty.

### KW-P2-006 protected rule record

- Original rule: River Clear-Out was exempt from the shared landscape barrier, so its 10×16 Tetris board could run in portrait or landscape. Levels require at least 50% recovery; first clears award the existing reward once; failed attempts award nothing; the existing 750-level data, active-session payload and town integration are protected.
- Demonstrated problem: River is the user-approved portrait-only exception, but landscape remained playable. The old 390×844 layout left the board at 252×403, placed it beside a tall rail and left 252 pixels unused below the HUD. At 320×568 the production Hint button extended to x=373, outside the 320px viewport. The success card occupied a fourth implicit grid row and left most of the screen blank.
- Smallest effective change: make the orientation policy scene-specific, showing `Turn your device upright to play.` only for River; keep the same DOM and engine; place the board above a compact control rail; hide only secondary Par and Difficulty figures at 320px; give level and reward content centred cards; shorten transient copy and enforce 44px touch targets.
- New rule: River Clear-Out pauses safely whenever width exceeds height and resumes the exact attempt in portrait. Every other active game remains landscape-only. No completion, reward, queue, board, level or save rule changed.
- Live gameplay proof: left, rotate, right and Drop produced 1/34 pieces and enabled Undo; Undo returned exactly to 0/34. Six straight drops ended at 0%, displayed the failure result and paid +0. Replay restored 0/34; the certified solution completed at 100%, five pieces, three rows and three stars, raising the wallet from 210 to 310 exactly once.
- Responsive proof: every required landscape viewport reported `orientationBlocked=true`, `orientationExpected=portrait`, exact document dimensions and unchanged 0/34 state. Portrait phone/tablet checks retained a 0.625 board ratio, HUD and status inside the viewport, no document overflow and no visible control below 44px. The production 390×844 board measured 355×568 with no QA control; the 320×568 board measured 191×306 and all controls ended at or before x=307.
- Save/integration proof: the 310-coin wallet persisted after a full production reload. Return to Alder Brook restored `TownScene`; a separate active attempt kept 1/34 through the first Exit tap, required `Confirm Exit`, then returned without a reward. The save schema and durable payload are unchanged.

## Baseline interaction inventory

### Town — persistent controls

Essential and always visible:

- Town identity/location
- Current objective
- Coins
- Contextual interaction
- Movement controls on touch layouts
- One menu/pause entry

Secondary and suitable for one organised menu:

- Shop
- Inventory
- Resident profile
- Animal Friends
- Impact
- Stories
- Save diagnostics
- Welcome/login history
- Optional commerce status

Contextual:

- Job finder
- Object placement controls
- Nearby resident, animal, building, bin or job action
- Zoom when the map is being explored

The baseline town exposed 17 visible buttons at every measured viewport. KW-P2-004 reduces the same saved Town state to 10 visible controls: four essential/contextual actions plus six movement/zoom controls. All eight secondary destinations remain available in the Town menu. The smallest-phone objective now presents one goal and one next action instead of repeating the complete three-job list.

## Deferred ideas

These are not implementation requirements until supported by evidence or the missing v4 reference:

- New decorative icon artwork or house-derived ornamentation
- Art-direction changes beyond established v3 tokens
- Rewriting validated mini-game mechanics for novelty
- Repricing, reward rebalancing or level-curve changes
- Removing legacy import/reconciliation code
- Adding a broad music system that does not exist in the validated baseline

## Verification rules

Every implementation entry must include:

1. Before and after screenshots.
2. Small phone, modern phone, tablet, 1280×720 and portrait checks at minimum.
3. Browser console review.
4. Relevant focused tests.
5. Full automated regression suite before commit.
6. Save/reload and scene-return checks where state is involved.
7. A commit hash recorded in both registers.
