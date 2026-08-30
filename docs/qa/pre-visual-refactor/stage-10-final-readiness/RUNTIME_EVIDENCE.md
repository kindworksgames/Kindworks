# Stage 10 Runtime and Performance Evidence

## Environment and method

- Same-origin Chromium emulation in the Codex in-app browser on macOS.
- Production preview: Vite production build at `127.0.0.1:5200`.
- Development-only Fidelity harness: `127.0.0.1:5201/?qa=fidelity&stage=10`, isolated from ordinary KindWorks storage.
- No physical iOS or Android device was available. Emulation is not represented as physical-device testing.
- Performance sampling used the repository's Stage 9 same-origin frame fixture. Competing game tabs were closed before the accepted measurement.

## Production startup and responsive shell

The production build started in `TownScene`; body and root scene markers agreed. Two fresh production loads and one production reload emitted no production warning/error. The normal onboarding and Town UI contained no Stage 2 forbidden development wording.

| Profile | Viewport result | Visible production surface | Result |
| --- | --- | --- | --- |
| Narrow phone | 568×320 | Town canvas 568×319.5; required onboarding 568×320 | PASS — no page overflow |
| Wider phone | 844×390 | Town canvas 693.33×390, centred; onboarding 844×390 | PASS — no page overflow |
| Small tablet | 1024×768 | Town canvas 1024×576, centred vertically | PASS — no page overflow |
| Large tablet | 1180×820 | Town canvas 1180×663.75, centred vertically | PASS — no page overflow |
| Desktop QA | 1366×768 | Town canvas 1365.33×768 | PASS — no page overflow |

## Scene and activity operation

All 18 registered scenes were operated or reached through their intended owner:

- Boot and Town through fresh production startup.
- House Interior, Village Grocer, Paws & Wonders and Harbour General through isolated direct/normal scene routes.
- Bakery, Café, Morning Mug, Riverside Kitchen and South Shore Scoops through the Fidelity route.
- River, House Rescue, Waste, Lawn, Beach, Power Wash and Fishing through the Fidelity route; Fishing was exercised in both fish and magnet modes.
- Fresh Market was operated as its intentional Town-owned full-screen modal rather than claimed as a separate scene.

At 844×390 every route retained exact document dimensions with no page overflow. River alone showed its intended rotate gate in landscape. Scene markers agreed after transitions. The activity sweep produced no application error or warning. Fishing's first read occurred before its lazy transition settled; a deliberate settle/recheck reached `FishingScene` with the HUD visible and no error.

## Level-boundary evidence

- The early runtime sweep opened Level 1 for every campaign.
- The final runtime sweep opened and verified the requested final level in all 11 campaigns: Lawn 750, River 750, Waste 750, House Rescue 750, Beach 750, Power Wash 750, Bakery 150, Café 150, Morning Mug 150, Riverside Kitchen 150 and Scoops 750.
- Middle, mechanic-boundary and late bands were rerun through the complete automated suites and existing deterministic representative tests; all 5,850 records were also data-validated. This is not a claim that 5,850 levels were manually played.

## Performance smoke

Accepted single-game sample: Power Wash Level 750 at 844×390 after other running game tabs were closed.

| Metric | Result |
| --- | ---: |
| Game ready | 251.8 ms |
| First active scene | 251.8 ms |
| Sample | 1,640 frames / 27.50 seconds |
| Mean frame time | 16.76 ms |
| p95 / p99 | 17.90 / 18.60 ms |
| Maximum frame | 83.30 ms |
| Frames over 20 / 33 / 50 ms | 3 / 3 / 2 |
| Phaser loop | 60.64 FPS; 16.66 ms delta |
| Active scene objects/timers | 3 children / 0 timers |
| Textures / canvases / DOM nodes | 22 / 2 / 1,352 |
| Resource observation | 163 entries; final load response at 1,564.3 ms |
| Heap observation | 204.0 MB at the shorter sample → 163.4 MB at 27.5 s |

The initial multi-tab sample was rejected because three simultaneous Phaser games competed for the same browser process and reduced the measured rate to about 44 FPS. The isolated accepted sample returned to 60 FPS and did not show monotonic heap growth.

## Runtime limitations

- Physical notch/safe-area rendering, true multi-touch/pinch, thermal throttling, WebView memory pressure, hardware audio interruption, OS background termination, storage eviction and native wrapper behaviour remain blocked.
- Long-duration soak beyond the Stage 9 coverage was not repeated manually in Stage 10; the Stage 10 route sweep and automated lifecycle/listener tests are the current regression evidence.
- External billing and network media were not invoked.

