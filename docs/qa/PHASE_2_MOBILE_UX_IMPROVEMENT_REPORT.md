# KindWorks Phase 2 — Mobile UX Improvement Report

## Working baseline

- Branch: `phase-2-mobile-ux-improvement`
- Starting commit: `ae262cd87a443c64f40ce9ed043303c1456804b5`
- Starting branch: `main` (matched `origin/main`)
- Phase 1 contract: `docs/qa/PHASE_1_MIGRATION_PARITY_AUDIT.md`
- Baseline automated tests: 450 passed, 0 failed
- Baseline build: existing production `dist`, Phaser 4.2.1
- Baseline input: mouse and keyboard through the local browser preview
- Available visual reference: `KindWorks_Visual_Style_Bible_v3.0.pdf`
- Required but unavailable reference: Visual Style Bible v4 and `KW-REF-HOUSE-A-V4`

The v3 reference is used provisionally for established KindWorks tokens only: warm-cloud/cream panels, deep-ink text, sunflower primary actions, willow-green success, terracotta warnings, rounded 16–24px corners, soft shadows, minimum 44px touch targets, mobile-readable silhouettes and one focal effect at a time. No v4-specific art or visual decision will be invented.

## Required viewport matrix

| Device class | Viewport | Baseline captured | Current observation |
| ------------ | -------: | ----------------- | ------------------- |
| Small phone | 568×320 | Yes | Objective card covers the play area; top HUD is clipped and crowded |
| Phone | 667×375 | Yes | Play area remains secondary to persistent HUD and objective surfaces |
| Phone | 736×414 | Yes | Usable but crowded; secondary actions stay permanently visible |
| Wider phone | 812×375 | Yes | Breakpoint does not yet create a deliberate compact control rail |
| Modern phone | 844×390 | Yes | Persistent HUD consumes too much horizontal attention |
| Tablet | 1024×768 | Yes | Fits, but top actions remain equally prominent and objective panel is oversized |
| Large tablet | 1180×820 | Yes | Fits; hierarchy remains desktop-first rather than play-first |
| Original reference | 1280×720 | Yes | All controls fit, but 10 top actions compete with the play area |
| Desktop QA | 1366×768 | Yes | Fits; persistent optional commerce label and secondary actions add noise |
| Portrait safety | 390×844 | Yes | Full town remains active instead of showing the required rotate-device screen |

Baseline evidence is stored outside the repository under `phase2-evidence/baseline/` in the Codex task workspace.

## Screen improvement register

| Screen | Original problem | Change made | Viewports tested | Gameplay regression result | Before evidence | After evidence | Commit |
| ------ | ---------------- | ----------- | ---------------- | -------------------------- | --------------- | -------------- | ------ |
| Wave 0 baseline | No protected Phase 2 branch, tracking report or full viewport baseline | Created branch, captured all required baseline sizes and established the functional contract | All required sizes plus 390×844 portrait | 450/450 tests passed before changes | `phase2-evidence/baseline/` | N/A | Pending |

## Change register

| Change ID | System | UX reason | Files changed | Behaviour changed? | Save impact | Tests added | Status |
| --------- | ------ | --------- | ------------- | ------------------ | ----------- | ----------- | ------ |
| KW-P2-000 | Baseline protection | Prevent Phase 2 work from changing validated behaviour invisibly | Phase 1 report; this report | No | None | Existing 450-test suite rerun | Verified |

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

## Verification rules

Every implementation entry must include:

1. Before and after screenshots.
2. Small phone, modern phone, tablet, 1280×720 and portrait checks at minimum.
3. Browser console review.
4. Relevant focused tests.
5. Full automated regression suite before commit.
6. Save/reload and scene-return checks where state is involved.
7. A commit hash recorded in both registers.

