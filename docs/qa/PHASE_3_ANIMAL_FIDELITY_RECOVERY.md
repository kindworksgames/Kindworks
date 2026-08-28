# Phase 3 Animal Fidelity Recovery

Status: **VERIFIED FUNCTIONAL AND REFERENCE-ART RECOVERY**

Branch: `phase-3-legacy-fidelity-recovery`

Protected source: `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`

## Recovered contract

| Area | Protected legacy rule | Phaser recovery | Verification |
| --- | --- | --- | --- |
| Catalogue | 37 species, 56 identities, 45 wild animals, 11 Paws companions and 5 rare visitors | Complete definitions retained; every identity resolves to authored art | Automated catalogue and frame-coverage tests pass |
| Wild friendship | Greeting +7, food +14, favourite +5 | Exact gains retained | Focused service tests pass; live Puddle greeting moved 15% to 22% |
| Environmental trust | +2 for land wildlife in a cared-for/calm town; +2 for water wildlife below the protected pollution threshold | Restored from the live environment state | Land and river bonus tests pass |
| Greeting limit | One greeting per 120 game minutes | Exact cooldown retained | Cooldown test passes |
| Adoption | Common `.004/.08/12/3`; rare `.001/.03/5/5`; successful adoption starts at 100 trust | Exact chances, increments, guarantee counters and 100-trust success restored | Common and rare guarantee tests pass |
| Idempotency | Repeating an already-completed adoption or clearing an empty follower is safe | Both operations now return successful unchanged results without an unnecessary save | Service tests pass |
| Care | Release below 50, warning at 65, −6/day, affection +10, treat +16, one offline grace day and offline floor 50 | Exact care resolution restored | Daily/offline/release tests pass |
| Paws companions | Permanent, unlimited, never decay or release and remain at 100 trust | Shop pets bypass decay and are normalized to 100 | Direct and Paws integration tests pass |
| Followers | Only one active follower; inactive companions roam South Meadow | Exact single-active rule and meadow route retained | Service/presentation tests pass |
| Personal home | Active companion enters the personal home; inactive companions remain in South Meadow | Occupancy now includes only the active follower | Home-interior tests pass |
| Relocation | 520-unit trigger, 0.22-second fade out and 0.28-second fade in | Exact transition timing restored | Presentation timing tests pass |
| Wildlife rotation | 0.7-second transition; max four; diverse deterministic roster | Exact transition and bounds restored | Rotation tests pass |
| Route pauses | Fox/wolf 3.8; songbird/crow 0.9; others 1.6 + event phase | Species waits and deterministic route state restored | Motion-state tests pass |
| Placed objects | Dynamic placed objects block wildlife routes | Runtime presentations avoid objects with wildlife obstacle hooks | Obstacle test passes |
| Appearance windows | Cared town widens night, crepuscular and day schedules | Exact normal and welcoming windows restored | Boundary tests pass |
| Rare visits | Five exact schedules, entry/exit paths, replay delay and arrival messages | Exact messages and one persisted notice per visit restored | Rare schedule, path, replay and notice tests pass |

## Recovered artwork

The protected HTML contains a 384×512 reference master with 43 authored 64×64 animal cells. It is recovered without recompression to:

`public/assets/animals/reference-master-v44.png`

SHA-256: `c7a8db375596b9e8ec614b4756c839958612c28bf462641806fc505348bcbae6`

The extraction script refuses a changed payload or checksum. The shared sheet now renders in:

- Town wildlife and adopted followers
- Paws & Wonders habitats and selected-companion detail
- The Animal Friends list and selected-animal portrait
- The active companion inside the personal home

All 56 identities resolve to an authored frame, including the six distinct dog-breed frames. Stable Sprite AI labels remain on the Phaser animal objects.

## Save compatibility

No save schema was changed. Existing animal records remain valid. Normalization only bounds impossible failed-request counters and restores permanent Paws companions to their protected 100-trust rule. Route position, pause and direction are deterministically derived from saved world time and persistent animal event state, so reload does not require a new transient-coordinate payload.

## Runtime verification

| Viewport | Result |
| --- | --- |
| 568×320 | Town sprites and Animal Friends interaction operated; trust feedback updated correctly |
| 844×390 | Authored river ducks and Animal Friends reference portraits visible; no broken interaction |
| 1024×768 | All eleven Paws habitats and the selected-companion reference portrait visible |
| 390×844 portrait | One-sentence rotate screen shown; gameplay hidden and safely paused |
| 1024×768 after rotation | Exact Paws scene resumed without restart or reward |

Production build and performance budget pass. The complete regression suite passes 552/552. The final focused animal/home/Paws/town suite passes 55/55.

## Honest remaining production-art boundary

The exact v44 reference sprites are now present and visible. Phaser currently animates them with authored movement, direction flipping, hopping/bobbing, water/aerial depth, fades and follower relocation. The legacy HTML's later code-driven multi-direction family rig contains additional per-frame leg, wing, tail and idle nuances; reproducing every one of those procedural frame variations remains a separate animation-polish pass. It does not block animal rules, ownership, care, appearance, feeding, following, saves or the recovered reference artwork.

## Verdict

**PASS for animal gameplay, state, ownership, care, schedules, routes, rare encounters and protected reference artwork.** Final multi-frame animation nuance remains explicitly tracked as production animation polish rather than being misreported as pixel-identical.
