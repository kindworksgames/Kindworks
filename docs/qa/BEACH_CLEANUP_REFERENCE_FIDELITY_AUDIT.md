# Beach Cleanup Reference Fidelity Audit

Date: 28 August 2026  
Branch: `phase-2-ui-simplification`  
Implementation commit: `f2c78a9`  
Reference: `Pixel Beach Cleanup_ Boardwalk and L-shaped Rake.png`  
Legacy source: `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`

## Verdict

**PASS — verified focused fidelity recovery.** The Phaser Beach Cleanup now follows the reference's board-first composition without shipping the reference image as a static background. The protected 750-level engine, progression, rewards, save payload and town integration are unchanged.

## Audit findings and corrections

| Finding | Root cause | Verified correction |
| --- | --- | --- |
| The sand board was visually secondary to stacked instructions, progress cards, bonuses, hints and status rows | Migration exposed engine diagnostics and optional actions as persistent UI | Removed the duplicate instruction and raked-stat panels; retained only level, coins, contextual Undo/Reset, Found, and one Menu |
| The scene did not resemble the legacy/reference boardwalk beach | The Phaser backdrop and DOM used generic emoji and detached cream panels | Rebuilt the navy shell, timber boardwalk frame, sand grid, shore water strip and narrow Found rail with responsive code-native layers |
| The raker was a generic emoji | Temporary presentation never expressed the protected L-shaped rake | Added a code-native top-down raker and directional L-shaped rake, with stable Sprite AI labels for later asset replacement |
| Umbrellas and chairs were generic emoji | Placeholder icons did not read as world objects | Added scalable, code-native umbrella and deck-chair silhouettes inside the live obstacle cells |
| Hidden rubbish cells displayed a faint dot before being raked | The renderer used `·` for an uncollected rubbish tile | Removed the marker completely and gave ordinary sand and rubbish the same pre-rake visual and accessible label |
| Optional challenges competed with the board | Bonus toggles were always visible | Moved all three unchanged bonus rules behind Menu → Bonus |
| Secondary actions could remain over gameplay | The disclosure stayed open after an action | Hint, Exit and bonus selection now close the temporary menu immediately |
| Progress copy duplicated the visual rake trail | Every step wrote a visible raked-count message | Ordinary progress remains available to assistive technology but is visually silent; finds, hints, errors and undo feedback remain short toasts |

## Preserved gameplay contract

- 750 deterministic Beach Cleanup levels.
- Four-way swipe movement and continuous held-swipe movement.
- The player rakes the tile being left.
- Five authored groove lines for straight paths and L-shaped corners.
- Hidden rubbish is collected only on its real cell.
- Bounded Undo, optional No Undo, Light Foot and Clean Sweep challenges.
- Existing campaign unlocks, first-clear-only rewards and replay behaviour.
- Existing Level 750 reward cap.
- Existing South Shore town-job restoration and exact return position.
- Exact active-attempt save/reload data and legacy-save compatibility.

No save schema, level data, difficulty curve, reward formula, balance, inventory or completion rule changed.

## Browser-operated verification

| Viewport | Result |
| ---: | --- |
| 568×320 | Complete board, water edge, Found rail and 44px controls visible; no document scroll or direction pad |
| 844×390 | Reference hierarchy retained; board dominates; two hidden-item slots remain compact |
| 1024×768 | Tablet layout uses the full safe viewport without oversized side panels |
| 1280×720 | Original reference viewport preserves boardwalk/sand/water hierarchy |
| 390×844 portrait | Active game hidden behind the single sentence “Turn your device sideways to play.”; Level 24 state resumed unchanged |

Direct interaction checks:

- A physical horizontal swipe moved the raker.
- Leaving a sand cell produced the protected five-line rake trail.
- Undo returned the raked count from 1 to 0 and restored the previous swipe state.
- Undo and Reset appeared contextually only after movement.
- Menu exposed Hint, Bonus and Exit without deleting any feature.
- The active level and Found state survived portrait/landscape rotation.

## Automated verification

- Beach-focused engine, save, gesture and UI tests: 16 passed, 0 failed.
- Full repository regression suite: 590 passed, 0 failed.
- Production build: passed.
- Performance budget: passed.

## Asset policy

The supplied reference is not copied into the build and is not loaded by Phaser. It is used only as a layout and art-direction specification. Every interactive object has a semantic `data-asset-label`, including the sand board, boardwalk frame, shore water, raker, L-shaped rake, umbrellas, chairs and discovered objects, so final Sprite AI art can replace the code-native silhouettes without changing gameplay logic.
