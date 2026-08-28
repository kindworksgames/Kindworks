# Protected HTML to Phaser Parity Matrix

## Classification key

- **Intentional** — a deliberate Phaser/mobile adaptation that preserves the protected behavior.
- **Missing** — protected behavior/data has no Phaser owner.
- **Incomplete** — owner exists, but a required part is absent or externally blocked.
- **Regressed** — the Phaser implementation behaves worse/differently from the protected/current contract.
- **Visual-only** — gameplay/data contract is present, but art/composition/feel is not pixel-identical or awaits final assets.
- **Data mismatch** — a count, value, identifier, label, or rule differs.
- **Unclear** — intent cannot be resolved from current source/evidence and needs a user decision.

## Evidence scope and limits

The current differential audit finds 1,704 unique named functions, 80 validators, and 218 public API entries in the protected HTML. All 218 public entries map to a Phaser activity/shared domain; all declared data/service/state/scene/test owners exist. Twelve protected source constants contribute 85 exact scalar comparisons, all equal. The minigame audit adds 75 comparisons across 105,795 deterministic level/seed instances.

That is strong functional and data evidence, but not a claim that every legacy helper function was manually called or that the Phaser renderer is pixel-identical. Runtime/manual status is therefore shown separately.

## Minigame parity

| Protected activity | HTML anchor | Phaser owners | Levels / data result | Mechanics/progression/save result | Runtime result | Difference classification |
| --- | --- | --- | ---: | --- | --- | --- |
| Waste Collection | `WASTE_BUILD_VERSION`, waste campaign functions | `src/data/wasteCollection.js`, `CleanupJobService`, cleanup state, `WasteCollectionScene` | 750; exhaustive PASS | Catalogue, covered-card rules, 5-slot tray, failure, resume, first clear, replay and rewards tested | Active level opened | **Intentional** code/DOM-to-Phaser rendering; final rubbish sprites/effects are **Visual-only** |
| Lawn Care | lawn catalogue/generator and mower functions | lawn data/service/state/scene | 750; exhaustive PASS | Swipe/queued route, dead ends, fuel, mower effects, directional cut history, resume/reward tested | Active board opened and exited | **Intentional** board-only mobile UI; final mower/garden/audio/haptics **Visual-only** |
| River Clear-Out | `KindworkLevels`, `CoreRules`, river validators | river data/service/state/scene | 750; exhaustive PASS | Tap/swipe direction, falling pieces, assistance, undo/result rollback, replay, save/reward tested | Scene opened; landscape correctly blocked for portrait | **Intentional** portrait-only adaptation; final silhouettes/water/audio/haptics **Visual-only** |
| House Rescue | item/dirt generators and house-rescue validators | house data/service/state/scene | 750; exhaustive PASS | House-aware geometry, sorting, vacuum coverage, tools, respawn, gifts, resume/rewards tested | Active room opened and exited | **Intentional** Phaser room renderer; remaining bespoke household art **Visual-only** |
| Beach Cleanup | embedded Beach source and catalogue/routes | beach data/service/state/scene | 750; exhaustive PASS | Swipe directions, continuous rake-run undo, grooves, finds, resume/reward tested | Active board opened; exit workaround required | Exit-menu confirmation is **Regressed** (F-01); final beach/rake animation **Visual-only** |
| Playground Power Wash | `PLAYGROUND_CLEANUP_CONFIG` and protected embedded art/mask | powerwash data/service/state/scene | 750; exhaustive PASS | Pixel dirt mask, 97% completion, continuous spray, stationary passes, soap/nozzles/pressure, checkpoint and reward tested | Active approved-art surface opened and exited | Renderer adaptation **Intentional**; final effects/sound polish **Visual-only** |
| Little Bakery | `BAKERY_CONFIG`, recipes, levels, first-clear function | bakery data/service/state/scene | 150; exact rule probes PASS | Three customers/trays, recipes, appliance state, patience, failure/resume/reward tested | Picker opened and exited | Layout is an **Intentional** mobile adaptation; final character/appliance art **Visual-only** |
| Corner Café | `CAFE_CONFIG`, recipes, levels, first-clear function | café data/service/state/scene | 150; exact rule probes PASS | Concurrent service, tray/station ownership, patience, failure/resume/reward tested | Picker opened and exited | **Intentional** mobile adaptation; final art **Visual-only** |
| Morning Mug | `MUG_CONFIG`, recipes, levels, first-clear function | mug data/service/state/scene | 150; exact rule probes PASS | Appliance ownership, cooking/burn timers, reload, failure/reward tested | Picker opened and exited | **Intentional** mobile adaptation; final art **Visual-only** |
| Riverside Kitchen | `RIVERSIDE_CONFIG`, recipes, levels, first-clear function | kitchen data/service/state/scene | 150; exact rule probes PASS | Exact heat, station timers, reload, failure/reward tested | Picker opened and exited | **Intentional** mobile adaptation; final art **Visual-only** |
| South Shore Scoops | `SCOOPS_CONFIG`, parts, reward config | scoops data/service/state/scene | 750; exact rules and exhaustive PASS | Picture assembly, 60% pass threshold, queue/departure, progression/reward tested | Picker opened and exited | Exterior label bridge is **Data mismatch** (South Shore Café vs Scoops); final product/customer art **Visual-only** |
| Fishing | `FISHING_CONFIG`, spots, catch chooser/reel | fishing data/service/state, `FishingScene` | 3 spots, 10 catch types, 4 ornamental fish; exact rule probes PASS | 5 daily casts, targeted water zones, bite timing, catch/inventory/aquarium caps and persistence tested | Fish mode opened and exited | Code-driven rod/line phases **Intentional**; final animation **Visual-only** |
| Magnet Fishing | `MAGNET_FISHING_CONFIG`, recovery catalogue/chooser/retrieve | fishing data/service/state, `FishingScene` | 8 finds; exact rule probes PASS | 5 daily pulls, cast/sink/settle/reel, pity, recent finds, persistence tested | Magnet mode opened and exited | Shared scene is **Intentional**; final magnet/rope animation **Visual-only** |

No minigame level-count or protected scalar-rule mismatch was found.

## Shared systems parity

| Domain | Protected HTML behavior | Phaser owner/evidence | Current result | Difference classification |
| --- | --- | --- | --- | --- |
| Town layout | 4,200×2,800 map; 19 houses; 12 shops; 6 landmarks; 9 roads; 3 bridges; 10 districts | `src/data/town.js`, `TownScene`; count certification/tests | Counts equal; Town booted | Code-driven composition **Intentional**; final venue/prop sprites **Visual-only** |
| Movement/navigation | Free map browse; explicit owned-resident control; collision/interactions | `TownCameraController`, `MovementController`, `NavigationGraph`, `InteractionSystem` | Tests PASS; Town free-browse observed | Pinch physical-device feel remains **Visual-only/manual** |
| Living world | Clock, weather, seasonal effects, litter, river garbage, lawn/house dirt, business activity | world/living-environment services and tests | Present and save-backed | Final transition/effect art **Visual-only** |
| Authored NPCs | 35 residents, schedules, needs, relationships, conversations, business/social/litter behavior | `NpcTownLifeService`, NPC data/tests | Present; tests PASS | Portrait/pose art **Visual-only** |
| Owned resident | Create appearance → hobbies → house; autonomous life when not controlled; explicit control | `CustomResidentService`, custom state/tests | Current schema 37 has schedule, needs, 35 relationships, conversations, shopping/care counters; direct control pause/return tested | Old reports claiming missing autonomy are stale; current result has no functional gap |
| NPC narratives | Thoughts, stages, saved history, deliberate dialogue | narrative data/service/controller/tests | Present and persisted | Dialogue portrait art **Visual-only** |
| Animals/pets | 37 species, 56 identities, spawn rules, diets, trust, adoption, follow/roam, home occupancy | animal and Paws services/data/tests | Counts and rules PASS | Final frame-by-frame animation **Visual-only** |
| Economy | Shared coins, lifetime totals, ledger, atomic transactions | economy service/state/tests | PASS | None found |
| Inventory/equipment | Consumables, furniture, equipment, ownership/equip state | inventory/economy/shop services/tests | PASS | Inventory art **Visual-only** |
| Willowmere Shop | Purchase/equip/place correct categories; 35 known placeables, 32 released | shop service/item/placement tests | PASS; 3 non-released items are subscription/QA fixtures | Hidden fixtures **Intentional** |
| Town placement | Trees/benches/bins/decorations in valid Town positions; move/store | placement service/data/tests | PASS | Final item sprites **Visual-only** |
| Furniture/home | Personal home, 6 themes, furnishing and aquarium | custom resident/home interior/aquarium services/tests | PASS | Bespoke furniture/resident art **Visual-only** |
| Houses/lawns | Architecture-linked interior size, dirt/overgrowth timing, 20 lawns | home/living environment/lawn data/tests | PASS | Final house/grass stage art **Visual-only** |
| Farming | Buy 3 crop seed types; 6 persistent beds; harvest; buy/place/harvest apple trees; orchard cap 24 | farming service/data, Grocer scene/tests | PASS | Final crop/sapling art **Visual-only** |
| Fresh Market | Seven protected animal-food products, purchase/inventory | ShopController/Fresh Market config/tests | PASS; modal operated | Full-screen Phaser shop is **Intentional**; final staff/product art **Visual-only** |
| Paws & Wonders | 11 permanent companions and milestone-gated egg | Paws service/data/scene/tests | PASS by automation/source; not manually entered this stage | Final pet/interior art **Visual-only** |
| Harbour General | Deed, 6 displays, 17 products, stock, till, sales, NPC purchases | Harbour service/data/scene/tests | PASS; scene operated | Code-driven shop **Intentional**; final stock/staff art **Visual-only** |
| Municipal collection | Weekly lorry/bin route, exact bin transforms, persistent mid-route state | municipal service/data/tests | PASS | Vehicle/collector art **Visual-only** |
| Restoration/Impact/Cinema | 8 milestones, reveal/rewards, festival/cinema gate, privacy-gated media | restoration/impact services/controllers/tests | PASS; conditional screens not manually forced here | Deferred media loading **Intentional** |
| Homeowner gifts | Eligibility, probability/pity, queue, keep/use, persistence | gift service/data/tests | PASS | Gift presentation **Visual-only** |
| Onboarding | Town name; resident appearance, hobbies and home across steps; contextual journey; login rewards | onboarding/custom services/controllers/tests | PASS; first-run Town dialog observed | Multi-step flow **Intentional** and matches later protected behavior |
| Saving | Current/backup/recovery, checksum, validation, read-back, migration, rollback | SaveRepository/importer/state tests | PASS | Browser-local persistence **Intentional**; native/cloud save is **Incomplete/decision-dependent** |
| Commerce | Coin packs/subscriptions only after trusted verification; duplicate protection; fail closed | commerce service/verifier/tests | Logic PASS; no production bridge in repo | External production integration **Incomplete** by design |
| Cleanup integration | Town jobs link to campaign scenes and shared economy/environment | cleanup service/data/tests | PASS | None found |

## Scene and screen differences

| HTML surface | Phaser equivalent | Status | Classification / note |
| --- | --- | --- | --- |
| Single-page canvas/DOM Town | `TownScene` plus shared DOM HUD/controllers | Present | **Intentional** architecture change |
| HTML modal minigames | Lazy Phaser scenes with DOM HUDs | Present | **Intentional** architecture change; behavior/data tested |
| Campaign level selectors | Venue pickers; current-level direct entry for some cleanup games; DEV fidelity selector | Present but presentation differs | **Intentional** mobile simplification where previously approved; no level data removed |
| Wallet/inventory/commerce tabs | Economy panel tabs | Present | Commerce external bridge **Incomplete** |
| General shop | Willowmere Shop modal | Present | Layout **Intentional**, art **Visual-only** |
| Village Grocer | `VillageGrocerScene` + real product modal | Present | Code-driven composition **Intentional** |
| Fresh Market | Town-owned full-screen `ShopController` modal | Present | Remaining in Town rather than separate scene is **Intentional** |
| Paws shop | `PawsWondersScene` | Present | Not manually opened in this stage; automated PASS |
| Harbour General | `HarbourGeneralScene` | Present | Operated |
| House interiors | `HouseInteriorScene` | Present | Shared scene handles all houses intentionally |
| Personal-home creator/progression | Three-page resident panel plus personal-home progression | Present | **Intentional** staged onboarding |
| Farming tabs | Farming modal/controller | Present | Automated PASS |
| Animal panels | Animal Friends modal + Paws scene | Present | Automated PASS |
| NPC thought/story cards | NPC story modal/context selection | Present | Automated PASS |
| Restoration/gift/impact dialogs | Dedicated controllers/modals | Present | Conditional runtime |
| Local cleanup popup | `cleanup-hud` and `cleanup-result` over Town | Present | **Intentional** Town-owned sub-screen |
| Loading/error states | `SharedOverlayController` | Present | **Intentional** Phaser lazy-load requirement |
| Rotate-device overlay | `ResponsiveShellController` | Present | **Intentional** mobile safety adaptation |

## Known differences and disposition

| ID | Difference | Classification | Severity / disposition |
| --- | --- | --- | --- |
| D-01 | Beach Exit collapses its menu before Confirm Exit can be tapped | **Regressed** | P3 confirmed; repair later |
| D-02 | Final bespoke sprites, some animation/audio/haptic feel, and pixel composition are not source-identical | **Visual-only** | Blocks full visual-fidelity claim; belongs to visual/art stages |
| D-03 | Physical phone/tablet multi-touch has not been operated in this desktop Stage 1 | **Unclear/manual gate** | Device QA required |
| D-04 | No native Capacitor iOS/Android wrapper exists | **Incomplete** if native publishing is in scope | User decision required |
| D-05 | No trusted production billing/receipt backend exists in repo | **Incomplete** external integration | User decision required; fail-closed behavior is correct |
| D-06 | South Shore exterior says Café while the activity is Scoops | **Data mismatch** | P3/content clarification; same dual naming exists in protected source |
| D-07 | Willow Arms and Riverstone have no player interiors | **Intentional** under current protected contract | Ambient business nodes in both versions; user may choose future expansion |
| D-08 | Three known placeables are not ordinary released shop items | **Intentional** | One subscription gift, two DEV QA fixtures |
| D-09 | Historic docs still claim owned-resident autonomy is missing | Documentation **Regressed/stale** | Current source/tests prove fixed; documentation repair recommended |
| D-10 | Type check and lint are not configured | **Incomplete assurance** | Observation; not a runtime parity failure |

## Bottom line

No missing migrated minigame, campaign count, protected scalar rule, public API domain, or registered Phaser scene was confirmed. Functional/data parity has strong automated evidence and representative runtime evidence. The honest remaining gaps are one P3 exit-confirmation interaction, external native/billing decisions, stale documentation, and the explicitly unfinished visual/manual gates.
