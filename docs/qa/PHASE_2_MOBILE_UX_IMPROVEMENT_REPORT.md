# KindWorks Phase 2 — Mobile UX Improvement Report

## Working baseline

- Branch: `phase-2-mobile-ux-improvement`
- Starting commit: `ae262cd87a443c64f40ce9ed043303c1456804b5`
- Starting branch: `main` (matched `origin/main`)
- Phase 1 contract: `docs/qa/PHASE_1_MIGRATION_PARITY_AUDIT.md`
- Baseline automated tests: 450 passed, 0 failed
- Current automated tests: 458 passed, 0 failed after the second Wave 2 batch
- Baseline build: existing production `dist`, Phaser 4.2.1
- Baseline input: mouse and keyboard through the local browser preview
- Available visual reference: `KindWorks_Visual_Style_Bible_v3.0.pdf`
- Required but unavailable reference: Visual Style Bible v4 and `KW-REF-HOUSE-A-V4`

The v3 reference is used provisionally for established KindWorks tokens only: warm-cloud/cream panels, deep-ink text, sunflower primary actions, willow-green success, terracotta warnings, rounded 16–24px corners, soft shadows, minimum 44px touch targets, mobile-readable silhouettes and one focal effect at a time. No v4-specific art or visual decision will be invented.

## Required viewport matrix

| Device class | Viewport | Baseline captured | Current observation |
| ------------ | -------: | ----------------- | ------------------- |
| Small phone | 568×320 | Yes | Wave 1 shell passes with no crop/overflow; town objective and HUD crowding remains for Wave 3 |
| Phone | 667×375 | Yes | Wave 1 shell passes; town hierarchy remains queued for Wave 3 |
| Phone | 736×414 | Yes | Wave 1 shell passes; secondary town actions remain queued for Wave 3 |
| Wider phone | 812×375 | Yes | Wave 1 shell passes; bottom/side rail decision remains queued per game |
| Modern phone | 844×390 | Yes | Wave 1 shell passes with exact viewport dimensions and no overflow |
| Tablet | 1024×768 | Yes | Wave 1 shell passes with exact viewport dimensions and no overflow |
| Large tablet | 1180×820 | Yes | Wave 1 shell passes with exact viewport dimensions and no overflow |
| Original reference | 1280×720 | Yes | Wave 1 shell passes with exact viewport dimensions and no overflow |
| Desktop QA | 1366×768 | Yes | Wave 1 shell passes with exact viewport dimensions and no overflow |
| Portrait safety | 390×844 | Yes | Town pauses behind one rotate icon and “Turn your device sideways to play.” |

Baseline evidence is stored outside the repository under `phase2-evidence/baseline/` in the Codex task workspace.

## Screen improvement register

| Screen | Original problem | Change made | Viewports tested | Gameplay regression result | Before evidence | After evidence | Commit |
| ------ | ---------------- | ----------- | ---------------- | -------------------------- | --------------- | -------------- | ------ |
| Wave 0 baseline | No protected Phase 2 branch, tracking report or full viewport baseline | Created branch, captured all required baseline sizes and established the functional contract | All required sizes plus 390×844 portrait | 450/450 tests passed before changes | `phase2-evidence/baseline/` | N/A | `593b456` |
| Global landscape shell | Portrait displayed active, overlapping town gameplay and did not pause its systems | Added one global orientation controller, a single-sentence safe rotate state, exact game-loop freeze/wake, service pause reasons and River portrait exemption | 568×320, 667×375, 736×414, 812×375, 844×390, 1024×768, 1180×820, 1280×720, 1366×768, 390×844 | Production build and performance budget pass; 454 full tests pass; movement, wallet open/close, rotate/resume and saved town state pass | `phase2-evidence/baseline/town-390x844-before.png` | `phase2-evidence/wave1/town-390x844-after.png` plus full Wave 1 matrix | `1469a93` |
| Shared control states | Controls used unrelated pressed, disabled, selected and focus treatments; dynamically rendered controls had no shared state contract | Added reusable tokens and one delegated controller for normal, pressed, disabled and selected states across fixed and dynamic buttons | All required landscape sizes plus 390×844 portrait; wallet inspected at 844×390 | 206/206 live controls enhanced on the saved test game; wallet tab switch and close pass; no overflow; no runtime warning/error logs; production build and performance budget pass; 456/456 tests pass | `phase2-evidence/wave2/wallet-844x390-before.png` | `phase2-evidence/wave2/wallet-844x390-after.png` | `1d8cb7e` |
| Shared loading and error feedback | Lazy activity imports changed an invisible attribute and failures were console-only, leaving players without a clear transition or recovery message | Added one shared `Loading…` state and one dismissible “That area couldn’t open. Try again.” notification, wired into every lazy scene transition | 568×320, 844×390, 1024×768, 1280×720 and 390×844 portrait in Waste Collection | Entered through the normal town action, loading cleared, portrait paused, safe exit returned to the same position, Sprite AI coverage stayed complete, runtime logs clean, build/performance pass and 458/458 tests pass | No visible loading/error component existed | `phase2-evidence/wave2/waste-844x390-loading-cleared.png` | Pending |

## Change register

| Change ID | System | UX reason | Files changed | Behaviour changed? | Save impact | Tests added | Status |
| --------- | ------ | --------- | ------------- | ------------------ | ----------- | ----------- | ------ |
| KW-P2-000 | Baseline protection | Prevent Phase 2 work from changing validated behaviour invisibly | Phase 1 report; this report | No | None | Existing 450-test suite rerun | Verified |
| KW-P2-001 | Global responsive shell | Prevent broken portrait gameplay and protect exact running state during rotation | `index.html`; `src/main.js`; `src/style.css`; `src/ui/ResponsiveShellController.js`; responsive shell tests; this report | Yes: non-River portrait now pauses; River remains portrait-supported | No schema or durable-state change; current state is persisted before sleep and resumed without offline advancement | 4 responsive shell tests, including all required landscape sizes and exact pause/wake calls | Verified |
| KW-P2-002 | Shared UI interaction foundation | Make every fixed and dynamically rendered button communicate input and availability consistently | `src/main.js`; `src/style.css`; `src/ui/InteractionFeedbackController.js`; interaction feedback tests; this report | No gameplay rule change; presentation state follows existing button state | None | 2 focused state/token tests; full 456-test suite | Verified |
| KW-P2-003 | Shared loading and error states | Explain scene imports and recover visibly when a lazy activity cannot open | `src/main.js`; `src/scenes/lazyScenes.js`; `src/style.css`; `src/ui/SharedOverlayController.js`; shared overlay tests; this report | No gameplay rule change; scene loading now has visible transient feedback | None | 2 focused copy/wiring tests; full 458-test suite | Verified |

### KW-P2-001 protected rule record

- Original rule: individual mini-games displayed separate portrait barriers at narrow widths; Town had no barrier and the shared Phaser loop and world systems continued running.
- Demonstrated problem: 390×844 rendered the complete town with a tall, overlapping HUD and active controls. Rotation could allow world time, NPCs and timed gameplay to continue while the player could not safely see or operate it.
- Smallest effective change: a shared controller detects the active scene and viewport, freezes the Phaser loop, adds an `orientation` pause reason to the world, NPC and municipal systems, and displays one global overlay. It wakes only after landscape returns. `RiverClearoutScene` is explicitly exempt.
- New rule: all active game scenes require landscape except River Clear-Out. Portrait pauses without completing, restarting, rewarding or mutating a level. Returning to landscape wakes the same scene and refreshes scale.
- Save compatibility: the save schema and payload are unchanged. The orientation reason is runtime-only; the current validated state is persisted before the game loop sleeps.
- Runtime proof: at 390×844 the body reported `orientationBlocked=true`, `rotate-device`, and the fixed sentence. After returning to 844×390 it reported `orientationBlocked=false`, the same `TownScene`, same location and same coin balance. Touch movement and wallet open/close then worked normally.

### KW-P2-002 verification note

The first live implementation attempt observed every CSS class mutation while adding its own class. Computer-controlled testing caught the resulting browser feedback loop before commit. The controller was corrected to observe only disabled and accessibility selection attributes, then resynchronise the clicked control and its sibling group once after the real click. The rebuilt game reported 206 controls, 206 enhanced controls and zero controls without a state at every required viewport. Wallet and Inventory tabs changed between `selected` and `normal` correctly, disabled controls remained disabled, the panel closed normally, portrait protection still worked and the browser runtime log contained no warnings or errors.

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

Baseline town exposes 17 visible buttons at every measured viewport. At 568×320, the first-session objective panel covers the central play field and several top actions compete for limited width. At 390×844, the game remains playable in portrait and the global HUD becomes a tall stack instead of pausing behind a rotate prompt.

## Deferred ideas

These are not implementation requirements until supported by evidence or the missing v4 reference:

- New decorative icon artwork or house-derived ornamentation
- Art-direction changes beyond established v3 tokens
- Rewriting validated mini-game mechanics for novelty
- Repricing, reward rebalancing or level-curve changes
- Removing legacy import/reconciliation code
- Adding a broad music system that does not exist in the validated baseline
- Waste Collection currently leaves the first-session objective card visible behind its job HUD, causing two overlapping primary panels at 844×390. Fix with the town/mini-game HUD consolidation; do not alter Waste gameplay rules in the shared-overlay batch.

## Verification rules

Every implementation entry must include:

1. Before and after screenshots.
2. Small phone, modern phone, tablet, 1280×720 and portrait checks at minimum.
3. Browser console review.
4. Relevant focused tests.
5. Full automated regression suite before commit.
6. Save/reload and scene-return checks where state is involved.
7. A commit hash recorded in both registers.
