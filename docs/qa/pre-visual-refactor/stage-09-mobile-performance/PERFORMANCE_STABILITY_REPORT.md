# Stage 9 Performance and Stability Report

## Method

The Stage 9 fixture samples `requestAnimationFrame`, Phaser's `game.loop.actualFps`/`delta`, active scenes, Phaser child/timer counts, texture count, canvas count, DOM count, Resource Timing entries and Chromium's non-standard heap counters. It is development-only and does not modify gameplay. Measurements were taken with the game tab foregrounded; background-tab samples were discarded because Chromium throttles animation frames.

The values are browser-emulation measurements on one Mac, not mobile-hardware certification.

## Startup and resources

| Measurement | Result |
| --- | ---: |
| Phaser object ready after iframe document load | 252.9 ms |
| First active scene | 252.9 ms |
| Last observed development resource response | 2,111.9 ms |
| Development resource entries | 158 |
| Cached local transfer size reported | 47,100 bytes |
| Production JavaScript | 4,827,700 bytes |
| Initial application chunk | 3,051,391 bytes |
| Phaser engine chunk | 1,374,829 bytes |
| Lazy chunks | 19 |
| Public assets | about 6.6 MB |

The local transfer value is cache-affected and must not be presented as a cold-network payload.

## Foreground frame samples at 844×390

| Scene/family | Phaser FPS | p95 frame | p99 frame | Max frame | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| Beach Cleanup, isolated 10 s | 60.14 | 16.8 ms | 33.3 ms | 99.9 ms | 589 sampled frames; 5 over 33 ms during startup window |
| Lawn Care | 60.71 | 18.1 ms | 18.6 ms | 199.9 ms | Includes direct lazy-scene transition |
| Waste Collection | 60.40 | 18.2 ms | 18.7 ms | 199.9 ms | Rolling window still includes preceding transition |
| Little Bakery | 60.81 | 18.1 ms | 18.6 ms | 83.4 ms | 42 Phaser children; zero scene timers |
| Village Grocer | 59.94 | 18.3 ms | 18.7 ms | 102.0 ms | 68 children; zero scene timers |
| Power Wash | 60.05 | 18.6 ms | 18.7 ms | 266.7 ms | Cold/lazy art setup spike; steady state recovered |

Because the rolling buffer holds 1,800 frames, scene rows intentionally include the transition into the scene as well as steady play.

## Rapid transition stress

- Sequence: Lawn → Waste → Beach → Bakery → Café → Village Grocer, repeated five times.
- Total: 30 scene starts at approximately 220-ms spacing, far faster than normal play.
- Every requested scene became the body scene in the expected order.
- Final Phaser FPS: 59.86.
- Final active scenes: one (`VillageGrocerScene`).
- Final active scene timers: zero.
- Canvas count: two before and after (Phaser plus activity canvas surface).
- DOM nodes: 1,627 before and after.
- Used heap changed from 806.2 MB to 835.5 MB during the stress window; the following garbage-collection/soak baseline dropped to 657.1 MB, so this is not retained-growth evidence.
- Maximum frame: 565.8 ms; p95 18.7 ms; 59/1,800 frames over 33 ms while deliberately replacing scenes.

## One-minute foreground soak

The post-stress Village Grocer scene was left active for 60 seconds.

| Metric | Start | End |
| --- | ---: | ---: |
| Phaser FPS | 60.09 | 60.66 |
| p95 frame | 18.0 ms | 17.0 ms |
| Max frame in rolling window | 98.4 ms | 18.8 ms |
| Frames over 20 ms | 2 | 0 |
| Active scenes | 1 | 1 |
| Scene timers | 0 | 0 |
| DOM nodes | 1,627 | 1,627 |
| Textures | 73 | 73 |
| Used heap | 657.1 MB | 672.0 MB |
| Total allocated heap | 740.2 MB | 740.8 MB |

No sustained frame degradation, scene retention, timer growth, DOM growth, texture growth or runaway spawning was observed.

## Runtime logs and resource failures

- Fresh development fixture: Vite connection records and Phaser banner only; no warning, error, rejected promise or failed resource.
- Fresh production preview: Phaser banner only; one canvas; `TownScene` active; no warning, error, rejected promise or failed resource.
- No missing-texture message was observed across the 17-activity sweep.
- Application source contains only intentional error logging for failed lazy scene loads/returns plus the persistent-activity conflict warning. No stray application `console.log`/`debugger` statement was found.

## Limitations

- Chromium heap figures include development/browser tooling and are useful only for within-run deltas.
- No cold 4G/5G profile, CPU throttle or GPU throttle was available.
- No physical-device thermal, battery, memory-pressure or WebView lifecycle measurement was performed.
- Maximum NPC/animal activity is covered by deterministic service stress tests and the busy Fidelity state; a physical-device high-density town profile remains release work.

