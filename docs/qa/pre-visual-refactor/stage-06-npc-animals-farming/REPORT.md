# Stage 6 — NPCs, Narrative, Animals, Pets, Farming, Harvesting, and Feeding

## Audit verdict

**NOT READY — STAGE 6 REPAIR REQUIRED.**

This audit verdict is retained as historical evidence. The subsequent repair fixed both P2 findings. See [REPAIR_REPORT.md](REPAIR_REPORT.md). The current gate is **SAFE TO CONTINUE WITH DOCUMENTED USER DECISIONS**.

The preceding Stage 5 repair report explicitly states `READY FOR NEXT QA STAGE`; no unresolved Stage 5 P0 or P1 invalidated this audit.

Stage 6 found no P0 or P1 defect. It confirmed two P2 defects and one genuine product-contract conflict:

1. town residents can share the exact same graph-node coordinate for long periods because route movement has no local occupancy/separation rule;
2. independently authored rare-animal schedules can make two or three rare visitors active simultaneously, contrary to the protected mutual-exclusivity contract;
3. the older five-pet/freeing contract conflicts with the latest protected HTML and current Phaser implementation, both of which use an unlimited companion family. This requires a user decision and was not changed.

No production code was changed during this audit. The only executable addition is the audit-only regression inventory in `tests/stage-06-audit.test.js`.

## Authoritative baseline

- Branch: `phase-2-ui-simplification`
- Starting commit: `3387bcb48964c41edbdc26f4257d2990fcdaf8d5`
- Protected HTML: `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`
- Protected HTML SHA-256: `0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5`
- Previous gate: `READY FOR NEXT QA STAGE`

The existing dirty worktree contains earlier verified repairs, QA documents, visual-readiness work, and unrelated user changes. All were preserved.

## Evidence summary

### Automated and deterministic

- Stage 6 focused system batch: **139 passed, 0 failed**.
- New Stage 6 inventory/probability/farming tests: **5 passed, 0 failed**.
- Complete project suite: **626 passed, 0 failed, 0 skipped**.
- Production build: **PASS**, 179 modules transformed.
- NPC catalogue: 35 stable residents, 19 homes, 133 navigation nodes, 138 links, 67 relationship pairs, and 35 four-stage narratives.
- NPC stress probe: 10,080 one-minute snapshots across seven deterministic days.
- Wildlife catalogue: 37 species, 56 identities, 45 wildlife identities, 11 Paws & Wonders companions, and five rare species.
- Regular wildlife sample: 180 days at 30-minute intervals; all 27 regular species observed; maximum visible wild visitors remained four.
- Rare schedule probe: 840 days at five-minute intervals; maximum concurrent rare visitors was three.
- Farming: all three crops purchased, planted across all six beds, grown, harvested, persisted, and consumed through animal feeding; starter and repeat apple harvests verified.

### Live browser journey at 1280×720

The production-like Vite build was operated through the player interface using the isolated development save route `?qa=animal-fidelity`:

- Wildlife: selected nearby goat Nettle, greeted once, observed trust rise from 15% to 22%, reloaded, and observed 22% retained.
- Narrative: opened Maya through Town menu → Stories, deliberately talked, observed conversation evidence rise from 0/2 to 1/2, reloaded, and observed 1/2 retained.
- Farming supply: opened Village Grocer through the development-only activity control, bought one carrot-seed packet, observed coins 100→70 and inventory 1→2, reloaded, and observed both retained.
- Console/player surface: no blank screen, crash, failed interaction, or save recovery error occurred during these journeys.

The development route is isolated from production and legacy save keys. No real player save was read, reset, or overwritten.

## Requirement outcome

| Area | Result | Reason |
| --- | --- | --- |
| NPC identity, homes, spawning, schedules, routes, save/load | **PASS** | Every stable definition and destination validates; full-day and re-entry tests pass |
| NPC obstacle/path graph | **PASS AFTER REPAIR** | Structural routes remain unchanged; deterministic save-neutral presentation slots now separate coincident residents and their tap targets |
| NPC dirty/clean behaviour, littering, thoughts, stories, relationships | **PASS** | Deterministic services and live deliberate conversation pass |
| Locate NPC | **PASS WITH SCOPE NOTE** | It locates the player-owned custom resident, matching the latest HTML action; it is not a global 35-resident search |
| Animal species, habitats, diets, rarity weights, cap, movement, persistence | **PASS** | Exhaustive catalogue checks and seeded sampling pass |
| Rare mutual exclusivity | **PASS AFTER REPAIR** | Original schedules remain intact; one deterministic eligible rare owns the visible/notification slot at a time |
| Feeding, trust, befriending, follower, home entry, South Meadow | **PASS** | Service, home-interior, Paws, and reload tests pass |
| Maximum five pets and voluntary freeing | **USER DECISION REQUIRED** | Older contract conflicts with latest HTML's explicit unlimited family and current permanent Paws companions |
| Starter tree, added trees, one-fruit harvest, save/reload | **PASS** | Atomic purchase/place and repeat-harvest tests pass |
| Six-bed allotment, crops, growth, weather, harvest, plots | **PASS** | All crop/bed paths and offline/weather-aware growth pass |
| Food/fish acquisition, inventory delivery and animal consumption | **PASS** | Grocer, market, fishing, farming and feeding integration pass |

## Classification boundaries

- `S6-NPC-001` is a confirmed Phaser functional defect, not a visual-only complaint. The graph stops structural water/building crossings, but exact co-location harms selection and creates visibly duplicated residents.
- `S6-ANIMAL-001` is confirmed against the current protected contract. The schedule data is independently evaluated; it is not a random fluke.
- `S6-UDR-001` is not silently labelled a migration regression because the latest HTML explicitly sets `southMeadowCompanionCap:null` and self-validates that the companion limit was removed.
- Interior town-NPC arrival is represented by reaching the authored door/destination and becoming hidden from the exterior town. Restaurant customers and workers use their separate Stage 4 service model. No claim is made that all 35 autonomous town residents walk around interior preparation stations.

## Protected contracts

The audit did not alter save schema/keys, progression, coins, inventory, houses, farming timers, crop yields, apple limits, animal diets, trust thresholds, adoption probability, follower identity, resident identities, routes, narrative records, jobs, rewards, or scene transitions.

## Current next action

Stage 7 may proceed. Resolve `S6-UDR-001` only after the user chooses which contradictory contract is authoritative.
