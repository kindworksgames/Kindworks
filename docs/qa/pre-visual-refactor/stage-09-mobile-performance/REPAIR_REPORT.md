# Stage 9 Repair Report

## Result

**READY FOR NEXT QA STAGE.**

All three confirmed Stage 9 findings were reproduced, repaired at their responsive-layout or QA-action boundary, and verified without changing gameplay, progression, saves, economy, inventory, NPCs, animals, rewards, level data, scene coordinates or the protected HTML source.

## Finding resolution

| Finding | Root cause | Correction | Regression evidence | Status |
| --- | --- | --- | --- | --- |
| S9-RESP-001 | The Animal Friends card had only a maximum height while its two-column grid retained content-based minimum heights. The apparent scroll regions therefore grew to 3,041 pixels and were clipped by the card. | The card now has explicit header/content/status grid tracks and a viewport-and-padding-aware height. The content track and both columns reset their minimum sizes; the list and detail column are bounded independent scrollports. The established ≤720-pixel stacked layout remains a card-level scroller. | At 844×390 the card is 793.38×339.36 and fully contained. The list is a 205-pixel scrollport over 3,041 pixels of content and the detail is a 205-pixel scrollport. The last species was selected inside the list; the final food and South Meadow controls were reached after scrolling the detail. Containment was also measured at 568×320, 1024×768, 1180×820 and 1366×768. | **FIXED** |
| S9-TOUCH-001 | Fresh Market and Village Grocer explicitly allowed 40-pixel close buttons, and Harbour General allowed a 42-pixel exit width. | Each responsive clamp now uses the shared `--kw-touch-min` token as its lower bound. No board or shop area was reduced. | Village Grocer and Fresh Market measure 44×44 at 568×320 and 844×390, 49.91×49.91 at 1024×768 and 1366×768, and 53.30×53.30 at 1180×820. Harbour measures 44×44 on both phone profiles and at least 53.76 pixels wide on the tablet/desktop profiles. | **FIXED** |
| S9-PROD-001 | House Rescue relied on hiding its certified-completion button; unlike the other cleanup scenes, the action itself did not fail closed outside explicit QA mode. | Completion is routed through a small guarded action. Unless `qaMode === true`, it returns before calling the service or presenting a result. Explicit development QA mode retains the certified path. | Regression tests prove production mode makes zero service/result calls and explicit QA mode still completes. The production bundle compiles `qaMode` to false and places the guard before `qaComplete()`. The hidden production control remains non-mutating. | **FIXED** |

## Files changed by this repair

- `src/style.css`
- `src/shop-reference.css`
- `src/scenes/HouseRescueScene.js`
- `src/qa/houseRescueQaCompletion.js`
- `tests/stage-09-repair.test.js`
- Stage 9 QA documentation and stage register

The worktree already contained extensive earlier QA, migration and visual changes. They were preserved and are not attributed to this repair.

## Verification evidence

| Check | Result |
| --- | --- |
| Original findings reproduced before edit | PASS |
| Focused Stage 9 repair suite | PASS — 11/11 including connected House Rescue/touch tests |
| Complete project suite | PASS — 645/645, 0 failed, 0 skipped |
| Differential HTML parity | PASS — 13 activities, 5,850 levels, 19 shared domains, 85 exact rules |
| Minigame/reward parity | PASS — 14 games, 75 comparisons, 105,795 instances |
| Production build | PASS — 180 modules transformed |
| Performance budget | PASS — 19 lazy chunks, 4,827,925 total JavaScript bytes |
| Animal Friends at 568×320 | PASS — 552×291.20 contained card; 7,078-pixel horizontal species list remains scrollable |
| Animal Friends at 844×390 | PASS — bounded 205-pixel list/detail scrollports; final species, food and meadow controls reached |
| Animal Friends at 1024×768 | PASS — 962.56×690 contained card; list client/scroll heights 551/3,041 |
| Animal Friends at 1180×820 | PASS — 980×690 contained card; list client/scroll heights 551/3,041 |
| Animal Friends at 1366×768 | PASS — 980×690 contained card; list client/scroll heights 551/3,041 |
| Shop/Harbour effective touch rectangles | PASS — every measured profile is at least 44×44 |
| Smallest-phone activity smoke | PASS — 17/17 canvases loaded with no document overflow; River alone used its intended orientation gate |
| Lazy Bakery transition recheck | PASS — `BakeryScene`, no overflow and no console error after the transition settled |
| Fresh production runtime | PASS — `TownScene`, two canvases, no warning/error and no failed image |
| Production House Rescue bundle | PASS — QA mode compiled false; guarded action precedes service mutation |

## Gameplay and save protection

- No persisted field, schema, reward, level, ownership record or progression flag changed.
- Animal selection, feeding, adoption and follower operations are unchanged; only their scroll containment changed.
- Shop and Harbour actions are unchanged; only their minimum effective touch geometry changed.
- House Rescue normal sorting, vacuuming, completion and reward paths are unchanged.
- The protected HTML and all parity-certified constants remain unchanged.

## Remaining risk

No Stage 9 P0–P3 finding remains open. Physical iOS/Android safe areas, true multi-touch, operating-system suspension/termination, WebView memory pressure, storage eviction, thermal throttling and hardware audio interruption remain explicitly untested. Browser emulation is not represented as physical-device coverage. The inherited companion-cap/freeing product decision also remains non-blocking and unchanged.

