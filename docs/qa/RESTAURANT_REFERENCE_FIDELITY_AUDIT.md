# KindWorks restaurant reference-fidelity audit

Date: 2026-08-28  
Branch: `phase-2-ui-simplification`

## Scope and reference contract

This recovery covers Little Bakery, Corner Café, Morning Mug Coffee, Riverside Kitchen and South Shore Scoops. The supplied Corner Café image is treated as the layout reference for the four indoor service venues. The supplied South Shore Scoops image is the separate layout reference for the ice-cream game. Neither bitmap is shipped or drawn as a static background.

Protected recipes, appliances, timers, arrivals, patience, no-miss rules, level catalogues, rewards, saves and return-to-town integration are unchanged.

## Findings and corrections

| Screen | Original defect | Verified correction |
| --- | --- | --- |
| Four indoor venues | Detached dashboard cards and a bottom action strip obscured the authored room | A compact warm service bar now carries venue, coins, best stars, served count and time. Dining, three order tickets, three preparation trays and the physical kitchen remain the dominant board. Ingredient and station controls now sit over the kitchen work area. |
| Four indoor venues | Wide room-name banners and grey placeholder customers made the room look schematic | Room names are compact signs. Empty seats are genuinely empty; only active customers render. Customer picture orders and patience remain attached to their table, and the same order appears on the counter ticket. |
| South Shore Scoops | Generic indoor panel did not match the seaside counter reference | Phaser now draws a striped awning, wooden venue sign, seaside service window, three customer positions and picture bubbles, physical container/drink areas, six flavour tubs, sauce and topping areas, build mat, serving tray and current-order card. |
| Mobile layout | DOM controls could cover the room or drift outside a 16:9 canvas on 4:3 tablets | Controls are positioned by gameplay zone. Short phones use compact grids; 4:3 tablet overlays align to the centred 16:9 Phaser canvas. Portrait pauses behind the existing rotate-device state and resumes the same shift. |
| Asset inventory | Several procedural objects and generated buttons had no stable future-art identifier | Every room zone, table, order ticket, prep tray, kitchen station/appliance area, Scoops counter group, live star display and generated action button now exposes a stable `KW-*` label. |

## Browser-operated verification

| Venue/system | Viewports operated | Result |
| --- | --- | --- |
| Corner Café | 568×320, 844×390 | Board, current tea, served/time, nine actions and contextual Undo/Discard remained visible. Selecting Cup advanced the real recipe to Tea bag. |
| Little Bakery | 844×390 | Active Level 1 shift opened with nine operable controls and the shared three-zone layout. |
| Morning Mug Coffee | 844×390 | Active Level 1 resumable shift opened with six operable controls and the shared three-zone layout. |
| Riverside Kitchen | 844×390 | Active Level 1 burger shift opened with ten operable controls, visible exact-heat station and shared three-zone layout. |
| South Shore Scoops | 568×320, 844×390, 1024×768 | Customer picture bubbles, current order, parts, build state and contextual actions were operated. A deliberately incorrect Serve produced the protected retry response without breaking the shift. |
| Orientation | 390×844 then 844×390 | One rotate message appeared in portrait. The exact active Scoops order resumed in landscape without restart or reward. |

The development-only Phase 3 fidelity control remains visible in captured QA screenshots; it is excluded from the normal production route.

## Automated regression

- Focused restaurant/mobile/appliance suite: 24 passed, 0 failed.
- Full project suite: 591 passed, 0 failed.
- Production build: passed.
- Performance budget: passed (`4,782,579` total JavaScript bytes; 19 lazy chunks).

## Verdict

**PASS for this restaurant reference-fidelity batch.** The visual composition now follows the correct reference family for each venue while preserving the validated gameplay contract. Final Sprite AI artwork can replace the labelled procedural assets later without redesigning the layout or interaction model.
