# Lawn Care Board-Only Audit

Date: 2026-08-28  
Implementation commit: `8fa85c5`

## Requested presentation

Active Lawn Care play must show the gameplay board only, apart from:

- Exit at the top right.
- Undo and Hint at the bottom of the board.

No gameplay or progression rules were authorised to change.

## Audit and root cause

The previous Phaser presentation placed the preserved Lawn Care engine inside a dashboard. The square board was centred beside a persistent information rail, despite the game accepting direct four-way board swipes. On a 568×320 phone, the playable board measured only 193×193 pixels. The title, coins, job description, cut percentage, move count, mower name, Hint, Undo, Restart, Exit and a status strip occupied or reserved the remaining space.

The result panel was also participating in the dashboard grid. At 844×390, its assigned grid row was only 34 pixels high while the result content extended far below the viewport, clipping both success and failure recovery.

## Focused correction

- Expanded the Lawn Care board to the full safe landscape width and all height above the compact bottom controls.
- Removed the visible title, wallet, job label, objective copy, completion percentage, move count, mower label, Restart and persistent status strip.
- Kept only the 44px-or-larger Exit, Undo and Hint controls.
- Kept four-way swiping on the board; no direction pad was introduced.
- Made Hint change temporarily to the recommended swipe direction.
- Preserved two-tap exit protection in a compact icon: the first tap shows confirmation and the second exits; it resets after three seconds.
- Centred success and failure in a bounded overlay above the still-visible board.
- Retained live progress feedback through the board accessibility label and screen-reader status without displaying new data.

## Live viewport evidence

| Viewport | Board | Board share | Exit | Undo / Hint | Visible persistent controls |
| --- | ---: | ---: | ---: | ---: | --- |
| 568×320 | 568×268 | 83.8% | 44×44 | 106×44 | Exit, Undo, Hint |
| 667×375 | 667×323 | 86.1% | ≥44×44 | ≥106×44 | Exit, Undo, Hint |
| 736×414 | 736×356 | 86.0% | ≥44×44 | ≥106×44 | Exit, Undo, Hint |
| 812×375 | 812×323 | 86.1% | ≥44×44 | ≥106×44 | Exit, Undo, Hint |
| 844×390 | 844×338 | 86.7% | ≥44×44 | ≥106×44 | Exit, Undo, Hint |
| 1024×768 | 1024×710 | 92.4% | 46×46 | ≥106×44 | Exit, Undo, Hint |
| 1180×820 | 1180×762 | 92.9% | 46×46 | ≥106×44 | Exit, Undo, Hint |
| 1280×720 | 1280×662 | 91.9% | 46×46 | ≥106×44 | Exit, Undo, Hint |
| 1366×768 | 1366×710 | 92.4% | 46×46 | ≥106×44 | Exit, Undo, Hint |

The 390×844 portrait check displayed only the rotate-device state. Returning to landscape restored the exact active attempt without restarting it.

## Interaction and regression proof

- A live swipe changed the active attempt from 7% cut with 11 moves left to 29% with 10 moves left.
- Undo restored the exact 7% / 11-move state.
- Hint exposed the next direction without moving or mutating the level.
- Level 750 remained the protected 11×11 board and retained its original completion/reward data.
- Success and failure overlays were fully visible at short-phone height.
- Exit required two taps; a single tap reset safely after three seconds.
- Browser console errors: none.
- Focused Lawn Care/visual tests: 19/19 PASS.
- Full automated regression: 607/607 PASS.
- Production build: PASS.
- Performance budget: PASS.

## Verdict

**PASS — board-only visual presentation verified; the protected Lawn Care gameplay, 750 levels, rewards, saves and Town integration are unchanged.**
