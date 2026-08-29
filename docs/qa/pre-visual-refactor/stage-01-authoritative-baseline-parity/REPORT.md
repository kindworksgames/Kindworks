# Stage 1 — Authoritative Baseline and HTML-to-Phaser Parity Audit

## Audit verdict

**STAGE 1 REPAIR VERIFIED — SAFE TO CONTINUE WITH DOCUMENTED USER DECISIONS.**

The current Phaser repository has a coherent, buildable, test-backed functional baseline. The protected HTML checksum matches the repository contract; all 611 automated tests pass; the exhaustive minigame comparison passes 105,795 deterministic level/seed instances; the differential audit maps all 218 protected public API entries and compares 85 scalar rules without a mismatch. All 18 Phaser scenes remain registered, and the Stage 1 inventory/runtime coverage remains intact.

This is not a claim of complete visual fidelity. The repository itself explicitly leaves final sprite appearance, animation/audio feel, physical-device touch ergonomics, and pixel-level composition as manual gates. The one confirmed P3 runtime defect in Beach Cleanup's exit-confirmation flow is now fixed and verified. There are no open confirmed P0, P1, P2 or P3 functional defects from this stage.

The audit itself changed no production behavior. Its dedicated repair changed only Beach Cleanup's exit-confirmation UI state and added a regression test; gameplay rules, saves, economy, progression, rewards and visuals were not changed. See [REPAIR_REPORT.md](REPAIR_REPORT.md).

## Baseline identity

| Item | Authoritative result |
| --- | --- |
| Repository | `/Users/youyoulu/Documents/GitHub/Kindworks` |
| Branch | `phase-2-ui-simplification` |
| Starting commit | `421c9bd1b41c5d8e677637bbf7b07da43331b207` |
| Remote alignment | Local branch matched `origin/phase-2-ui-simplification` at audit start |
| Pre-existing untracked file | `KindWorks Migration Starter .json` — preserved and not inspected or modified |
| Phaser HTML shell | `index.html` |
| JavaScript entry point | `src/main.js`, loaded by `index.html` as `/src/main.js` |
| Eager Phaser scenes | `BootScene`, `TownScene` |
| Lazy Phaser scenes | 16 entries in `src/scenes/lazyScenes.js` |
| Phaser version | `4.2.1` resolved from the `^4.2.1` dependency |
| Build tool | Vite `8.2.2` |
| Design resolution | 1280×720, `Phaser.Scale.FIT`, centred, pixel-art mode |
| Protected HTML source | `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html` |
| Protected HTML SHA-256 | `0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5` |
| Protected HTML size | 17,324,288 bytes; 13,382 lines |
| Legacy save version | 82; accepted legacy versions 12–82 |
| Phaser save schema | 37; accepted Phaser schemas 1–37 |

Only one legacy game HTML file exists at repository root besides the Phaser shell and generated `dist/index.html`. Its filename and checksum exactly match `PARITY_SOURCE_FILE` and `PARITY_SOURCE_SHA256`, so it is the applicable source of truth for this audit.

## Install, build, run, and test contract

| Purpose | Command | Result |
| --- | --- | --- |
| Install/verify dependencies | `pnpm install --frozen-lockfile` | PASS; lockfile current, no dependency change |
| Development server | `pnpm dev` | PASS; Vite ready on the local QA origin |
| Type checking | — | NOT CONFIGURED; project is JavaScript and has no TypeScript check script/configuration |
| Linting | — | NOT CONFIGURED; no lint script or ESLint configuration/dependency exists |
| Full automated tests | `pnpm test` | PASS: 611 passed, 0 failed, 0 skipped |
| Minigame source parity | `pnpm parity:minigames` | PASS: 14 games, 75 comparisons, 105,795 deterministic instances |
| Differential parity | `pnpm parity:differential` | PASS: 13 activities, 5,850 levels, 19 shared domains, 85 exact rules |
| Production build | `pnpm build` | PASS; 178 modules transformed; performance budget PASS |
| Production preview | `pnpm preview` | PASS; Town and first-run onboarding rendered |

Production output contained the Phaser engine, main application, and 16 lazy-scene chunks. The repaired build emitted 4,812,437 JavaScript bytes and remained within the repository's configured performance budget.

The absence of type checking and linting is an assurance gap, not a failed command. It is recorded as an Observation and must not be described as a pass.

## Save mechanism and supported devices

### Save contract

- The active runtime uses browser `localStorage` through `SaveRepository`.
- Current key: `kindworks_phaser_v1`.
- Backup key: `kindworks_phaser_v1_backup`.
- Recovery/quarantine key: `kindworks_phaser_v1_recovery`.
- Each save is an envelope with format, schema version, timestamp, app version, cloned state, and checksum.
- Writes validate the complete state, preserve a valid previous save as backup, write the candidate, read it back, and validate the read-back before reporting success.
- Invalid current saves are quarantined and a valid backup can be recovered.
- Compatible protected HTML saves from versions 12–82 are inspected and projected into Phaser state without overwriting the legacy key.
- The checksum is corruption detection, not cryptographic account security.

### Device/runtime support found in this repository

- Supported now: modern web browsers with ES2022, WebGL/canvas, JavaScript modules, and `localStorage`.
- Responsive contracts exist for phones, tablets, and desktop, including safe-area CSS and an orientation pause/resume shell.
- River Clear-Out is the sole portrait-only activity. Town and every other activity require landscape.
- The repository contains no Capacitor dependency/configuration and no `ios` or `android` native project. Native iOS/Android packaging is therefore not part of the current build.
- Real-money commerce requires an external trusted billing/receipt bridge and trusted time. In its absence, production grants fail closed; ordinary in-game coin purchases remain local and functional.

## Runtime inspection

### Development build

- Town booted at 1366×768 in the isolated `?qa=fidelity` namespace.
- The fidelity panel exposed 17 player activities/interiors.
- All 17 routes opened and reported the expected active scene or Town-owned modal.
- Landscape activities reported landscape orientation. River Clear-Out reported portrait and correctly paused behind the rotate-device state at the landscape audit viewport.
- House Rescue, Power Wash, Fishing, Magnet Fishing, all five venue games, House Interior, Fresh Market, and Harbour General returned to Town through their normal controls.
- Village Grocer returned after its selected-product modal was closed, then its exit was used.
- Beach Cleanup now keeps its menu open after the first Exit tap, exposes a visible and correctly named Confirm Exit action, resets safely after three seconds, and returns to Town on confirmation without a console error. Finding F-01 is FIXED.

### Production preview

- Production Town booted and displayed first-run onboarding.
- Console output contained Phaser's normal startup banner only: 0 errors and 0 warnings.
- No failed-resource or network error appeared in console output or the preview server log.
- The development server emitted no 404/resource failures. Warnings about multiple interrupted activities were generated only by deliberately interrupting several isolated QA activities during early harness navigation; they did not occur in production and are not a production defect.

### Runtime coverage boundary

This stage opened all fidelity-harness routes, but did not manually complete every success/failure/restart path or every one of 5,850 levels. Level breadth is covered by exhaustive deterministic automation. Conditional dialogs and panels were inventoried from source and their dedicated automated tests; not every conditional surface was forced open manually in this stage. Those distinctions are preserved in the inventory rather than being called manual passes.

## Existing tests and developer controls

### Automated coverage found

- 611 Node tests across save/state migration, economy, shops, placement, world simulation, NPCs, custom resident autonomy, animals, farming, homes, all minigames, mobile gestures/layout contracts, orientation, recovery, accessibility, release gates, and performance-related contracts.
- Exhaustive generated-level tests for all 5,850 campaign levels.
- Protected-source differential inspection: 1,704 unique named functions, 80 validators, and 218 public API entries; no public API entry is unmapped to a Phaser activity/shared domain.
- Exact source-to-Phaser probes compare 85 scalar rules across 12 protected constants.

### Development-only controls

- `?qa=fidelity` and `?qa=animal-fidelity`: isolated-save activity harness and representative level selector.
- Certification routes: `parity`, `differential-parity`, `release-candidate`.
- Focus routes/fixtures include `paws`, `harbour-general`, `impact`, `aquarium`, `placement`, `village-grocer`, `collection`, `restoration`, `homeowner-gift`, `home`, `interior`, `narrative`, `animals`, `environment`, `advanced-npc`, `powerwash`, `beach`, `house-rescue`, `river`, `cafe`, `morning-mug`, `riverside-kitchen`, `scoops`, `bakery`, `fresh-market`, `waste`, `farming`, `orchard`, `lawn`, `fishing`, and `magnet`.
- `window.__KINDWORKS_PHASER__` exposes diagnostics and guarded QA helpers in development. Fidelity storage is namespaced and does not mutate the production/legacy save keys.
- Scene-local certified-completion controls are guarded by `import.meta.env.DEV`/QA modes and hidden in production.

## Protected gameplay and save contracts

The following are baseline contracts for future repair stages. A repair must add a regression test before changing any of them.

1. Protected HTML SHA-256 remains unchanged.
2. Campaign counts remain exactly 5,850: six 750-level cleanup games, four 150-level venue games, and one 750-level Scoops campaign; Fishing and Magnet Fishing remain non-level activities.
3. Level generation, completion thresholds, first-clear/replay behavior, rewards, reward caps, and failure rollback remain unchanged unless a separately approved gameplay repair demonstrates the need.
4. Shared coin balance, lifetime totals, ledger ordering, prices, inventory quantities, equipment, ownership, placed coordinates, farming/orchard state, pets, aquarium, Harbour stock/till, restoration, narratives, and onboarding progress remain durable.
5. Save writes remain atomic at the service level: failed persistence rolls the complete mutation back.
6. Existing Phaser schemas 1–37 and legacy HTML versions 12–82 remain importable/upgradable.
7. Interrupted activity recovery remains deterministic and must not duplicate rewards.
8. Town is free-browse by default; the owned resident is controlled only after explicit selection. Its current autonomous schedule/needs/relationship state must remain additive and save compatible.
9. River Clear-Out remains portrait-only; all other activities remain landscape-only with safe pause/resume.
10. Production QA shortcuts, forced rewards/catches, direct entitlements, and untrusted commerce grants remain unavailable.

## Severity-ranked findings

### P0

None confirmed.

### P1

None confirmed. Historic Phase 3 reports previously stated that the owned resident lacked autonomy, but current code and passing tests show that repair was implemented in commit `f249c0d`: schedule, needs, 35 relationships, conversations, shopping/community counters, direct-control pause, and graph return are present. Those reports now carry an explicit post-audit resolution and no longer present the gap as current.

### P2

None confirmed as a functional defect in this stage.

### P3

#### F-01 — Beach Cleanup confirmation is hidden after the first Exit tap — **FIXED**

- Final status: **FIXED**.
- Classification: **regressed interaction / P3**.
- Reproduction: enter Beach Cleanup; open the menu; tap Exit.
- Expected: the confirmation action remains visible and immediately actionable.
- Previous actual: the `<details>` menu collapsed, status said “Tap Confirm Exit,” but Confirm Exit was hidden inside the collapsed menu.
- Root cause: the click handler closed the menu before arming confirmation, so the newly relabelled action was immediately hidden.
- Correction: request confirmation first, keep the menu open while confirmation is armed, expose the correct accessible name, and reset the button deterministically if the window expires.
- Data/save impact: none observed; the activity can still be cancelled safely.
- Suspected owner: `src/scenes/BeachCleanupScene.js` plus Beach menu markup/styles in `index.html`/`src/style.css`.
- Regression: `tests/beach-mobile-ux.test.js` prevents the close-before-arm ordering from returning and checks the visible-menu, accessible-name and timeout-reset contract.
- Verification: live development operation proved the first action visible, the second action returned to Town, timeout reset restored `Exit`, and console errors remained zero. The full 611-test suite, both parity validators, production build/performance budget and production preview all pass.

### Visual-only / manual-gate findings

- Final per-object Sprite AI artwork remains intentionally incomplete or code-driven in several areas.
- Animation feel, audio timing, haptics, and pixel-level composition are not fully proven by automated parity.
- Physical-device pinch and touch ergonomics were not operated in this desktop audit.
- These do not invalidate the functional/data parity result, but they block an unconditional “the Phaser game looks exactly like the HTML” claim.

### Observations

- O-01: no type-check or lint gate is configured.
- O-02: **FIXED** — the Phase 3 documents now preserve the historical finding while clearly recording its `f249c0d` resolution and current test coverage.
- O-03: differential coverage is broad but not a proof that all 1,704 legacy functions were independently behaviorally replayed. It proves API ownership, file/marker presence, exact selected rules, exhaustive campaigns, and the tested service behaviors.
- O-04: two map businesses—The Willow Arms and Riverstone Restaurant—are ambient business destinations rather than player interiors. The same locations exist as business/navigation nodes in the protected HTML, so this is classified intentional rather than missing.
- O-05: the map label “South Shore Café” leads to the game titled “South Shore Scoops.” The protected HTML contains the same café business and Scoops activity, but the player-facing naming bridge is a small data/presentation mismatch worth clarifying in a later content pass.

### User decisions required

- U-01: decide whether native iOS/Android packaging belongs before or after the visual-refactor sequence. The current repository is a browser build, not a Capacitor project.
- U-02: decide whether The Willow Arms and Riverstone Restaurant should remain ambient destinations or receive future interactive interiors. They are not missing migrated minigames according to the protected source contract.
- U-03: decide when the external trusted billing/receipt service will be supplied. No local audit can complete real-money production commerce without it.

## Requested deliverables

- [Complete game inventory](GAME_INVENTORY.md)
- [HTML/Phaser parity matrix](HTML_PHASER_PARITY_MATRIX.md)
- [Machine-readable audit summary](evidence/audit-summary.json)

## Stage exit decision

The authoritative baseline and its dedicated repair are complete. The codebase is safe to proceed to the next separately requested QA stage with U-01 through U-03 and the visual/physical-device gates still documented. It must not be described as unconditional full visual parity, and no visual-readiness refactor should treat those manual gates as already passed.
