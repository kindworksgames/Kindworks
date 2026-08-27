# Milestone 46 — Differential HTML-to-Phaser Parity Audit

## Decision

Milestone 46 passes its automated differential audit. The current Phaser game
preserves the protected HTML game's authored content, gameplay rules,
progression, rewards and save meaning across all mapped domains. The audit found
one real omission in Magnet Fishing and fixed it: a successful recovery now
removes the same eligible visible river-rubbish target, records that target in
progress and the coin ledger, and delays river respawn for 180 game minutes.

This is a behavioral and data certification. It does not claim that Phaser's
canvas rendering is pixel-identical to the historical HTML/DOM implementation.
Final Sprite AI art, animation/audio feel and physical-device touch ergonomics
remain explicit manual release gates.

## Protected reference

- File: `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`
- SHA-256: `0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5`
- Size: 17,324,288 bytes
- Parsed lines: 13,382
- Named function declarations: 1,716 occurrences / 1,704 unique names
- Validator identifiers: 80
- Getter identifiers: 161
- Configuration constants: 65
- Protected public API entries: 218
- Unmapped protected public API entries: 0

The audit reads this file only. Its checksum is tested before any parity result
can pass, and Milestone 46 does not alter it.

## Activity coverage

| Activity | Levels | Phaser owners | Dedicated regression suite | Result |
| --- | ---: | --- | --- | --- |
| Waste Collection | 750 | data, campaign state, service and scene | `waste-collection.test.js` | Pass |
| Lawn Care | 750 | data, campaign state, service and scene | `lawn-care.test.js` | Pass |
| River Clear-Out | 750 | data, campaign state, service and scene | `river-clearout.test.js` | Pass |
| House Rescue | 750 | data, campaign state, service and scene | `house-rescue.test.js` | Pass |
| Beach Cleanup | 750 | data, campaign state, service and scene | `beach-cleanup.test.js` | Pass |
| Playground Power Wash | 750 | data, campaign state, service and scene | `playground-powerwash.test.js` | Pass |
| Little Bakery | 150 | data, campaign state, service and scene | `bakery-service.test.js` | Pass |
| Corner Café | 150 | data, campaign state, service and scene | `cafe-service.test.js` | Pass |
| Morning Mug Coffee | 150 | data, campaign state, service and scene | `morning-mug-service.test.js` | Pass |
| Riverside Kitchen | 150 | data, campaign state, service and scene | `riverside-kitchen-service.test.js` | Pass |
| South Shore Scoops | 750 | data, campaign state, service and scene | `south-shore-scoops-service.test.js` | Pass |
| Fishing | Daily activity | data, state, shared fishing service and scene | `fishing-service.test.js` | Pass |
| Magnet Fishing | Daily activity | data, state, shared fishing service and scene | `fishing-service.test.js` | Pass after gap fix |

The 11 level campaigns total exactly 5,850 levels. Their existing domain suites
exhaustively validate the generated catalogues and cover boundary scaling,
success, failure, first-clear reward, replay protection, persistence failure,
resume or cancellation and legacy-save projection as applicable.

## Shared-system coverage

All 19 shared domains have explicit Phaser owner files and test owners:

1. Town map, buildings, roads, bridges and districts
2. Player movement, collision, interaction and navigation
3. World clock, weather, litter, river flow, lawns and businesses
4. Residents, schedules, needs, relationships and navigation
5. Resident narratives, thoughts and progression
6. Wildlife, diet, friendship, adoption and Paws & Wonders
7. Economy, inventory, equipment and ordinary shops
8. Town-object placement, movement and storage
9. Village Grocer, allotment and orchard farming
10. Weekly municipal bin collection
11. Restoration stages, festival, cinema and impact projects
12. Personal home, interiors and furniture
13. Homeowner gift probability, queue and use
14. Aquarium ownership, stocking and display
15. Harbour General ownership, stock and sales
16. Town identity, custom resident and onboarding rewards
17. Verified purchases, subscriptions and trusted time
18. Save, backup, recovery and protected-HTML reconciliation
19. Recurring town jobs and campaign integration

The 218 protected public API entries map to one of the 13 activity or 19 shared
domains. No interface is left unowned.

## Exact source-to-Phaser rule probes

The executable audit parses scalar values directly from the protected source and
compares them with the live Phaser modules. It currently compares 85 exact
values across these 12 contracts:

| Protected contract | Phaser contract | What is pinned |
| --- | --- | --- |
| Corner Café | `CAFE_CONFIG` | levels, trays, customers, grace and reward formula constants |
| Morning Mug | `MORNING_MUG_CONFIG` | levels, trays, customers, grace and reward caps |
| Riverside Kitchen | `RIVERSIDE_KITCHEN_CONFIG` | levels, trays, customers, grace and reward caps |
| Little Bakery | `BAKERY_CONFIG` | chapters, trays, customers, grace and reward caps |
| South Shore Scoops rules | `SOUTH_SHORE_SCOOPS_CONFIG` | levels, chapters, passing accuracy and queue rules |
| South Shore Scoops rewards | `SOUTH_SHORE_SCOOPS_REWARD_CONFIG` | minimum, maximum, accuracy and level reward steps |
| House Rescue | `HOUSE_RESCUE_RULES` | dirty homes, coverage, rewards, respawn and wave limits |
| Fishing | `FISHING_CONFIG` | casts, timing, bite window, quality and storage limits |
| Magnet Fishing | `MAGNET_FISHING_CONFIG` | casts, timing, pity limits, history and 180-minute cleanup delay |
| Harbour General storage | `HARBOUR_GENERAL_CONFIG` | schema, slots, case size, stock and history limits |
| Harbour General building | `HARBOUR_GENERAL` | deed price and opening hours |
| Homeowner gifts | `HOMEOWNER_GIFT_CONFIG` | cooldown, care window, pity and bounded histories |

A difference in any pinned scalar now fails `npm run parity:differential` and the
Milestone 46 regression suite.

## Gap found and corrected

The protected Magnet Fishing flow selects visible rubbish from river sections
03 and 02, preferring cans, then section priority, then the item nearest the
middle of the river segment. On a successful pull it removes that item and moves
the next river spawn at least 180 game minutes into the future.

Before this milestone, Phaser awarded the named find and coins but reported
`visibleRiverCleanupIntegrated: false`; it did not mutate the living river. The
corrected transaction now:

- selects and removes the same eligible visible river item deterministically;
- applies the 180-game-minute respawn grace even when no eligible item exists;
- increments `riverItemsRemoved` only when a visible item was removed;
- stores the river item and section IDs in recent finds and the coin ledger;
- persists the economy, fishing and environment changes atomically; and
- rolls all of them back together if saving fails.

A dedicated regression test verifies the visible removal, target-section
restriction, delay, metadata, saved result, diagnostics and rollback behavior.

## Evidence model

The certification combines several independent layers:

1. The immutable protected-source checksum.
2. A parsed source inventory and complete public-interface ownership map.
3. Exact scalar rule comparisons against imported Phaser modules.
4. Exhaustive catalogue tests for every generated campaign level.
5. Deterministic service tests for rules, boundaries, failure and rewards.
6. First-clear and replay tests that prevent duplicate progression or coins.
7. Save, reload, rollback, schema-upgrade and legacy-reconciliation tests.
8. Read-only runtime QA through `?qa=differential-parity`.
9. Production build and performance-budget verification.

No single automated check can honestly prove artistic or experiential identity.
The remaining manual gates are therefore recorded rather than hidden:

- final Sprite AI art and sprite appearance;
- animation feel and audio timing;
- physical-phone and tablet touch ergonomics; and
- pixel-level composition where Phaser intentionally replaces legacy rendering.

These are release-quality gates, not known missing gameplay systems.

## Regression commands

- `npm run parity:differential` runs the protected-source comparison.
- `npm test` runs all domain, save, journey and parity tests.
- `npm run build` produces the release build and enforces performance budgets.
- `?qa=differential-parity` exposes the deterministic certification in a
  non-mutating development browser route.

## Completed verification

- Differential audit: pass; 218 of 218 public API entries mapped and all 85
  exact scalar comparisons equal.
- Full automated suite: 450 tests passed, 0 failed.
- Production build: pass; 160 modules transformed and all 16 lazy scene chunks
  emitted.
- Performance budget: pass; 2,998,403-byte initial application,
  1,374,829-byte Phaser engine and 4,622,052 bytes of JavaScript in total.
- Live browser QA: pass at 1,280×720, 844×390 and 390×844. The read-only route
  reported 13 activities, 19 shared domains, 12 rule probes and the protected
  checksum, with no page overflow or console errors.
- Protected HTML checksum after all work: unchanged.

## Release interpretation

After Milestone 46, the evidence supports treating Phaser as behaviorally and
data-complete against the protected HTML reference for the audited game scope.
Future rule or content changes must either preserve these contracts or update
the reference decision and associated tests deliberately. Final asset creation
and physical-device acceptance remain separate milestones.
