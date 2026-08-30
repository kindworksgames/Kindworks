# Stage 10 Complete Coverage Matrix

## Registered scenes and intentional Town-owned surfaces

| Scene/surface | Static registration | Automated regression | Stage 10 runtime | Status |
| --- | --- | --- | --- | --- |
| BootScene | Direct | Startup/recovery/parity | Fresh production boot | PASS |
| TownScene | Direct | Movement, camera, interactions, NPC/world, menus | Production at five profiles | PASS |
| HouseInteriorScene | Lazy | Interiors, furniture, aquarium, save/re-entry | 844×390 | PASS |
| VillageGrocerScene | Lazy | Nine products, farming delivery, purchase/reload | 844×390 | PASS |
| PawsWondersScene | Lazy | All 11 companions, gates, adoption, reload | 844×390 direct QA route | PASS |
| HarbourGeneralScene | Lazy | Deed, 17 products, slots, sales, till, rollback | 844×390 | PASS |
| BakeryScene | Lazy | 150 levels, recipes, orders, failure/reward/reload | Levels 1 and 150 | PASS |
| CafeScene | Lazy | 150 levels, recipes, orders, failure/reward/reload | Levels 1 and 150 | PASS |
| MorningMugScene | Lazy | 150 levels, appliances, burn/reload/reward | Levels 1 and 150 | PASS |
| RiversideKitchenScene | Lazy | 150 levels, exact heat, reload/reward | Levels 1 and 150 | PASS |
| SouthShoreScoopsScene | Lazy | 750 levels, queue, 60% rule, reward/reload | Levels 1 and 750 | PASS |
| RiverClearoutScene | Lazy | 750 levels, solver, controls, undo/reward/reload | Levels 1 and 750; landscape gate | PASS |
| HouseRescueScene | Lazy | 750 levels, sort/vacuum, completion/reward/reload | Levels 1 and 750 | PASS |
| WasteCollectionScene | Lazy | 750 boards, certificates, tray, reward/reload | Levels 1 and 750 | PASS |
| LawnCareScene | Lazy | 750 routes, swipe, mower, undo/reward/reload | Levels 1 and 750 | PASS |
| BeachCleanupScene | Lazy | 750 routes, rake grooves, undo/reward/reload | Levels 1 and 750 | PASS |
| PlaygroundPowerwashScene | Lazy | 750 masks, tools, 97%, reward/reload | Levels 1 and 750; performance sample | PASS |
| FishingScene — fish | Lazy/shared | Cast/bite/reel, caps, inventory/aquarium, reload | 844×390 | PASS |
| FishingScene — magnet | Lazy/shared | Cast/sink/retrieve, pity, rewards, reload | 844×390 | PASS |
| Fresh Market modal | Town-owned by design | Seven products, delivery, purchase/reload | 844×390 | PASS |

## Whole-game system coverage

| System family | Evidence | Result |
| --- | --- | --- |
| Production build/import integrity | 180 modules; zero unresolved imports; performance budget pass | PASS |
| Complete automated suite | 648 passed; 0 failed/skipped/todo after repair | PASS |
| HTML/Phaser differential parity | 13 activities, 5,850 levels, 19 shared domains, 85 exact scalar rules | PASS |
| Minigame/reward parity | 14 games, 75 comparisons, 105,795 deterministic instances | PASS |
| Level data/final levels | 5,850/5,850 valid; all 11 final campaign screens opened | PASS |
| Progression/onboarding/unlocks | Fresh and returning state, mandatory creator recovery, final progression | PASS |
| NPCs/narrative | 35 stable residents, routes, stories, stress/save tests | PASS |
| Animals/pets | 37 species, 56 identities, rarity, feeding, adoption/follower/save | PASS with UDR-001 |
| Farming/resources | Three crops, six beds, orchard trees, one-fruit rule, feeding delivery | PASS |
| Economy/rewards | All first-clear/replay/rollback/idempotency contracts | PASS |
| Shops/inventory/equipment | 82 items, 67 released products, placement/equip/effects/reload | PASS |
| Gifts/restoration | Probability/pity, queue, eight restorations, one-time delivery | PASS |
| Save/load/migration | 37 Phaser schemas, 71 HTML versions, backup/recovery/reset | PASS |
| Cross-system journeys | All eight Stage 8 journeys rerun in the full suite | PASS |
| Mobile/tablet shell | 568×320, 844×390, 1024×768, 1180×820, 1366×768 | PASS in emulation |
| Production console/resource smoke | Fresh start/reload clean; no missing asset/texture signal | PASS |
| Performance smoke | Single-game Level 750 Power Wash at 60.64 FPS; budget pass | PASS |
| Static code/data integrity | All requested checks pass; production diagnostics are development-only and enforced by the post-build gate | PASS |
| Physical iOS/Android | No physical device connected | BLOCKED / UNTESTED |
| Native/cloud save | Not implemented in current repository | USER DECISION / UNTESTED |
| External billing receipts | Fail-closed local logic tested; signed store bridge unavailable | BLOCKED EXTERNAL |
| Final visual parity | Functional/data contract passes; bespoke asset/audio/feel remains visual-only | PARTIAL BY DESIGN |
