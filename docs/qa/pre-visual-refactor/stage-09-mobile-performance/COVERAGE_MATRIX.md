# Stage 9 Mobile/Tablet Coverage Matrix

## Exact emulated profiles

| Profile | Dimensions | Activities loaded | Overflow/playfield | Touch targets | Orientation | Result |
| --- | ---: | ---: | --- | --- | --- | --- |
| Narrow landscape phone | 568×320 | 17/17 | No page overflow or clipped primary playfield | FAIL: shared shop close 40×44 | Landscape play active; River rotate gate | FAIL |
| Wider landscape phone | 844×390 | 17/17 | No page overflow or clipped primary playfield | FAIL: shop close 40×44; Harbour exit 42×44 | Landscape play active; River rotate gate | FAIL |
| Small tablet / 4:3 | 1024×768 | 17/17 | Activity playfields fit; Animal Friends list clips | Major controls ≥44 in activity sweep | Landscape play active; River rotate gate | FAIL |
| Large tablet | 1180×820 | 17/17 | No activity page overflow or clipped playfield | Activity controls ≥44 | Landscape play active; River rotate gate | PARTIAL — Animal Friends defect applies above 720 px |
| Desktop development | 1366×768 | 17/17 | No activity page overflow or clipped playfield | Activity controls ≥44 | Landscape play active; River rotate gate | PARTIAL — Animal Friends defect applies above 720 px |
| Portrait gate | 390×844 | River + Lawn | River fits; Lawn hidden behind rotate state | River controls ≥44 | River active; Lawn paused with one sentence | PASS |

All profiles above are same-origin Chromium emulation, not physical devices.

## Screen and system families

| Family | Runtime coverage | Responsive result | Input/stability result | Status |
| --- | --- | --- | --- | --- |
| Boot/loading and Town | Fresh dev + fresh production; exact landscape profiles | HUD/canvas fit, zero page overflow | Startup, movement contracts, pause/resume and production console pass | PASS |
| Town menu and global HUD | Wider/narrow phone plus automated shell checks | Fits and remains reachable | Focus/pause contracts retained | PASS |
| Onboarding / creator / first-session guide | Fresh/returning fixtures and Stage 5 regressions at responsive profiles | Dialog CSS and no-overflow contracts pass | Interrupted tutorial recovery remains covered | PASS (emulated) |
| Wallet/inventory/save | Stage 7/8 large/empty inventory and save flows plus responsive shell | Panels have bounded internal scrolling | Purchases/save/reload regressions pass | PASS (emulated) |
| Animal Friends | 568×320, 844×390 and 1024×768 live geometry | 568 breakpoint scrolls; >720 two-column layout clips thousands of pixels | Essential later species/food actions unreachable | **FAIL — S9-RESP-001** |
| Willowmere/Fresh Market shop overlay | Live Village Grocer and Fresh Market at all profiles | Full panel fits | Close target width falls to 40 px on phone | **FAIL — S9-TOUCH-001** |
| Paws & Wonders / animal shop systems | Stage 6/7 automated UI/state plus Animal Friends runtime | No new playfield issue found | Physical scrolling not tested | PARTIAL |
| Harbour General | Live at all landscape profiles | Shop fits | Exit width falls to 42 px at 844×390 | **FAIL — S9-TOUCH-001** |
| Village Grocer / Fresh Market | Live at all landscape profiles | Shelves/details fit; no body overflow | Purchase regressions pass | FAIL only for shared close target |
| House Interior | Live at all landscape profiles | Full room fits | Entry/re-entry/save tests pass | PASS |
| Lawn Care | Live at all profiles + rotation journey | Board visible; controls clear | Swipe contracts, state restoration and frame sample pass | PASS (emulated) |
| River Restoration | Live landscape gate + 390×844 play | Portrait board and controls fit | Tap/swipe and pause contracts pass | PASS (emulated) |
| Waste Collection | Live at all profiles | Board/tray fit | Rapid scene/frame sample pass | PASS (emulated) |
| House Rescue | Live at all profiles | Board/interior fit | Production QA completion path remains callable | **FAIL — S9-PROD-001** |
| Beach Cleaning | Live at all profiles | Board/tray fit | Swipe contracts and 60-FPS sample pass | PASS (emulated) |
| Fishing / Magnet Fishing | Both modes live at all profiles | Water/play UI fits | Tap/cast contracts and re-entry tests pass | PASS (emulated) |
| Power Wash | Live at all profiles | Integrated full-screen controls fit | 60-FPS steady state; transient load spike recorded | PASS with observation |
| Corner Café | Live at all profiles | Restaurant fills viewport | Touch/order regressions pass | PASS (emulated) |
| Little Bakery | Live at all profiles | Restaurant fills viewport | 60-FPS sample and order regressions pass | PASS (emulated) |
| Morning Mug | Live at all profiles | Restaurant fills viewport | Touch/order/re-entry regressions pass | PASS (emulated) |
| Riverside Kitchen | Live at all profiles | Restaurant fills viewport | Touch/order/re-entry regressions pass | PASS (emulated) |
| South Shore Scoops | Live at all profiles | Counter/play area fits | Touch/order/re-entry regressions pass | PASS (emulated) |
| Impact, narrative and secondary dialogs | Automated dialog/focus/scroll coverage plus Town runtime | No new page overflow identified | External media/network not invoked | PASS locally / external BLOCKED |

## Input and interruption coverage

| Requirement | Result | Evidence |
| --- | --- | --- |
| Swipe sensitivity/directions | PASS in automated emulation | Mobile gesture parity covers Lawn, River and Beach directional mapping |
| Tap/drag conflict | PASS in automated emulation | Pointer thresholds, capture/cancel and interaction tests pass |
| Browser scroll prevention | PASS | Gameplay boards compute `touch-action:none`; action buttons use `manipulation` |
| Hover independence | PASS by code/runtime inspection | Primary controls are buttons/pointer surfaces; no required hover-only action found |
| Multi-touch | PARTIAL | Pointer guards tested; accidental real multi-touch requires hardware |
| Resize/orientation | PASS in emulation | Responsive controller tests plus live landscape/portrait/landscape journey |
| State on rotation | PASS | Lawn stayed `LawnCareScene` with exactly four cut cells before/during/after |
| Safe area/notch | PARTIAL | CSS `env(safe-area-inset-*)` present; no notched hardware available |
| OS interruption | PARTIAL | Visibility/pagehide tests pass; actual mobile background/termination blocked |

