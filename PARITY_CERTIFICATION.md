# Milestone 43 — HTML-to-Phaser parity certification

## Result

Milestone 43 certifies the Phaser game against the protected final HTML source:

- Source: `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`
- SHA-256: `0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5`
- Source policy: read-only and byte-for-byte protected
- Phaser campaign total: 5,850 levels
- Certified activities: 13, including Fishing and Magnet Fishing

Parity means that the Phaser game preserves the HTML game's authored content,
rules, progression, economy, durable identities and save meaning. Phaser remains
free to improve the rendering, accessibility, responsive layout and controls. It
is therefore a functional and content certification, not a requirement to copy
the old HTML DOM or reproduce every pixel.

## Executable certification

`src/data/parityCertification.js` is the single machine-readable manifest for
this milestone. The game and tests both consume it. It pins the protected source,
all audited counts, every activity, its Phaser scene and HUD, its campaign size,
representative level checkpoints, mobile orientation rule and required viewport
gates.

During development, `?qa=parity` exposes the same certification through
`window.__KINDWORKS_PHASER__.getParityCertification()`. The route creates only a
read-only view of the existing local game state, suppresses first-run and
login-reward prompts, and never writes certification setup into the save or
alters the protected HTML file. The page also publishes its
result through `data-parity-*` attributes so visual QA can confirm that the
running game loaded the certified contract.

## Certified content boundary

### World and permanent identities

| Domain | Certified value |
| --- | ---: |
| World size | 4,200 × 2,800 |
| Houses | 19 |
| Shops | 12 |
| Landmarks | 6 |
| Roads | 9 |
| Bridges | 3 |
| Districts | 10 |
| Residents | 35 |
| Public bins | 5 |
| Animal species | 37 |
| Authored animal identities | 56 |
| Placeable item identities | 35 |
| Released placeable items | 32 |
| Restoration milestones | 8 |
| Home interior themes | 6 |
| Paws & Wonders companions | 11 |
| Harbour General products | 17 |

### Farming, fishing and recipe catalogues

| Domain | Certified value |
| --- | ---: |
| Lawn plots | 20 |
| Allotment beds | 6 |
| Crop types | 3 |
| Orchard capacity | 24 |
| Fishing spots | 3 |
| Fishing catch types | 10 |
| Ornamental fish | 4 |
| Magnet finds | 8 |
| Bakery recipes | 24 |
| Café recipes | 64 |
| Morning Mug recipes | 54 |
| Riverside Kitchen recipes | 32 |
| South Shore Scoops parts | 24 |

### Complete activity coverage

| Activity | Phaser scene | Levels | Mobile rule |
| --- | --- | ---: | --- |
| Waste Collection | `WasteCollectionScene` | 750 | Landscape |
| Lawn Care | `LawnCareScene` | 750 | Landscape |
| River Clear-Out | `RiverClearoutScene` | 750 | Portrait supported |
| House Rescue | `HouseRescueScene` | 750 | Landscape |
| Beach Cleanup | `BeachCleanupScene` | 750 | Landscape |
| Playground Power Wash | `PlaygroundPowerwashScene` | 750 | Landscape |
| Little Bakery | `BakeryScene` | 150 | Landscape |
| Corner Café | `CafeScene` | 150 | Landscape |
| Morning Mug Coffee | `MorningMugScene` | 150 | Landscape |
| Riverside Kitchen | `RiversideKitchenScene` | 150 | Landscape |
| South Shore Scoops | `SouthShoreScoopsScene` | 750 | Landscape |
| Fishing | `FishingScene` | Daily-cast activity | Landscape |
| Magnet Fishing | `FishingScene` | Daily-cast activity | Landscape |

The level campaigns total exactly 5,850 levels. Every level definition remains
covered by its dedicated system tests. The parity suite additionally checks the
first, middle and final level boundary for every campaign: 1/375/750 for a
750-level campaign and 1/75/150 for a 150-level campaign.

## Save and reward parity

The certification relies on the schema-37 reconciliation completed in
Milestone 42. Every supported protected-HTML save version from 12 through 82 is
validated against the current Phaser owners. Stable IDs, balances, inventory,
equipment, farming, homes, furniture, aquarium fish, animals, restorations,
shops, gifts, stories, campaign records and commerce history remain durable.
Reconciliation barriers prevent first-clear coins, gifts, restorations and
verified commerce benefits from replaying.

No save-schema change was required for Milestone 43. The certification manifest
describes and tests the existing schema; it does not migrate or mutate a save.

## Mobile and visual contract

The required QA viewports are:

- 1,280 × 720 desktop
- 844 × 390 mobile landscape
- 390 × 844 mobile portrait

All playable activities require landscape on a phone except River Clear-Out.
Fishing and Magnet Fishing now follow the same rule: at 390 × 844 their controls
are hidden and a full-screen rotate message is shown. River Clear-Out is
deliberately excluded from that barrier and remains playable in portrait.

Browser QA confirmed the running parity route, the desktop town, the protected
HTML reference, the mobile town, Fishing in landscape, Fishing's portrait
barrier, a clean browser console and no page overflow. Visual comparison checks
the same game identity and content while accepting intentional Phaser rendering
and responsive-interface improvements.

All 430 automated tests pass. The minified Vite production build also completes
successfully; its only advisory is the existing large-bundle warning for the
single Phaser application chunk.

## Regression gates

`tests/parity-certification.test.js` fails when any of these change without an
explicitly reviewed new certification:

- the protected HTML checksum;
- an audited content count;
- an activity or campaign level count;
- the one portrait-supported activity;
- a required scene or HUD binding;
- a required landscape barrier;
- the deterministic runtime certification;
- any required viewport; or
- the non-destructive parity QA route.

The existing domain suites remain the authoritative rule-level verification.
Milestone 43 adds a cross-system release gate over them instead of duplicating
their detailed gameplay assertions.

## Release decision

The Phaser implementation is certified as the continuing Kindworks game source.
The protected HTML remains the historical comparison fixture and recovery
reference. Future content changes should update the Phaser source and its tests;
the protected HTML checksum must change only if a new reference source is
deliberately adopted and reviewed.
