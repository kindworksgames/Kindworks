# Kindworks migration audit

## Source of truth

The preserved legacy game is `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`.
It must remain runnable and unchanged while the Phaser version is built alongside it.

## Current structure

- 17,324,288 bytes across 13,381 lines.
- Four style blocks and one main JavaScript block.
- One embedded JSON data block.
- Five embedded image data URLs: one PNG and four WebP images.
- 1,716 named functions, 548 `getElementById` lookups, and 274 event listeners.
- Canvas-rendered town and mini-games combined with a large DOM-based interface.
- A 750-level River game and a 750-level House Rescue progression are explicitly protected by runtime checks.

## Persistence contract

The game stores its current save, backup, and recovery data in `localStorage`:

- `kindworks_living_town_v38`
- `kindworks_living_town_v38_backup`
- `kindworks_living_town_v38_recovery`

Older save keys from versions 12 through 37 are accepted for migration. The Phaser build must preserve this compatibility until a tested save migration is introduced.

## Migration boundaries

The safest extraction order is:

1. Shared data and save-schema adapters.
2. Town rendering and camera input.
3. Player movement and interactions.
4. Economy, inventory, shops, farming, NPCs, animals, and pets.
5. Each mini-game as a separate Phaser scene.
6. Mobile controls, accessibility, performance checks, and Capacitor packaging.

## Current milestone

Milestone 1 established the playable Willowmere town foundation, including
camera follow/zoom, keyboard and touch movement, and initial collision bounds.

Milestone 2 adds the reusable four-direction character animation,
proximity-interaction, and scene-transition foundations. The Little Bakery now
has a safe enter/exit interior shell that returns the player to its authored
door position. Bakery gameplay, economy, inventory, saves, NPCs, and
progression remain intentionally unmigrated.

Milestone 3 establishes shared state and safe persistence. Phaser uses a new
`kindworks_phaser_v1` current/backup/recovery namespace, validates checksummed
schema-1 envelopes, and can inspect legacy versions 12 through 82 without
writing to any `kindworks_living_town_*` key. A legacy copy is created only
after explicit confirmation and retains the complete source snapshot for later
domain-by-domain migration. Economy, inventory, NPCs, animals, shops, farming,
rewards, and mini-game behavior remain intentionally unmigrated.

Milestone 4 extracts the shared 76-item catalogue, four inventory buckets,
KindlyCoin wallet, bounded transaction ledger, and rollback-safe persistence.
Milestone 5 proves the first complete retailer through Fresh Market's exact
seven-product catalogue and purchase flow.

Milestone 6 proves the first complete cleanup vertical slice. A persistent
six-piece rubbish cluster in Willow Commons creates a saved job session,
launches `WasteCollectionScene`, accepts one exact 100% result, awards the
legacy-compatible 100-coin Level 1 reward, removes only that target, and
survives reload without duplicate payment. Dynamic litter, repeat cycles, and
the remaining 749 Waste Collection layouts remain intentionally unmigrated.

Milestones 7 through 15 expanded the shared world simulation, resident creator,
farming, animals and adoption, fishing and magnet fishing, Little Bakery,
Corner Café, and the complete 750-level River Clear-Out campaign.

Milestone 16 migrates the protected House Rescue campaign. All 750 original
difficulty configurations are generated from the preserved formulas: 9–30
rubbish items in waves of nine, three exact sorting categories, 180–267 floor
stains, one to five stain layers, +2/−1 sorting scores, 95% vacuum completion,
and the original 60 + accuracy + level-bonus reward capped at 170 coins. Four
original starter cottages are dirty, no more than five jobs can be active,
completed homes respawn after three to six game days, and the personal home is
never selected. Active work resumes from the Phaser save, completion is atomic,
and House Rescue requires landscape orientation on mobile. The protected HTML
source remains unchanged.

Milestone 17 completes Waste Collection. The exact protected payload now backs
750 authored compact matching boards, 40 rubbish types, 15 checkpoints, and
750 verified five-slot solution certificates in Phaser. Only uncovered cards
can enter the tray, triples clear automatically, five unmatched cards fail the
attempt, and every card/tray move persists for reload. All levels are
selectable; first clears award the original percentage-plus-level coins once,
while replays cannot duplicate rewards and campaign play does not change the
town. The Milestone 6 six-piece Willow Commons occurrence remains intact and
becomes the permanent campaign entrance after its first restoration. The new
schema-14 state upgrades schema 13 safely, and Waste Collection requires
landscape orientation on mobile. The protected HTML source remains unchanged.

Milestone 18 completes Lawn Care. The protected `lawn-care` payload is
extracted read-only into 750 unique authored grids with 750 unique source IDs
and families, then all stored optimal routes are replay-verified. The mower
slides until a hedge, gets exactly two moves above par, retains five undo
states, and uses the original 50/85/100 percent star thresholds. Tough weeds
begin at Level 10, woody weeds at Level 50, clusters never exceed six cells,
and mower upgrades alter animation timing only. Campaign attempts resume from
the shared save; first clears award the original percentage-plus-level reward
once and replays pay zero. The same engine now powers neighbourhood jobs, where
the cut percentage is applied proportionally to the real town lawn and each
new regrown occurrence pays atomically. Lawn Care requires landscape on mobile,
leaving River Clear-Out as the only portrait-friendly migrated mini-game. The
new game-state/envelope schema is 15 and the protected HTML remains unchanged.

Milestone 19 completes Beach Cleanup. The protected embedded package's exact
`1.0.0-kindworks-integrated` rules now run natively in Phaser: all 750 levels
use the original seeded 7×7-to-15×13 generator, obstacle bands, one-to-50
rubbish curve, 19-item reward catalogue, leave-a-tile raking rule, undo, swipe
and keyboard controls, and optional No Undo, Light Foot, and Clean Sweep
bonuses. Every generated level has a deterministic certified full clear.
Campaign first clears use the shared percentage-plus-level formula once;
replays pay zero. The town-job entrance at South Shore instead banks the
package's native rubbish finds and bonuses up to 170 coins, atomically removes
the visible shoreline litter, and allows it to return after a calm interval.
Active boards, finds, coins, challenge flags, and the exact town return point
resume from schema 16 saves. Beach Cleanup requires landscape on mobile, so
River Clear-Out remains the only portrait-friendly migrated mini-game. The
protected HTML remains unchanged.

Milestone 20 completes Playground Power Wash. The protected payload's actual
`1.1.0-kindworks-soap-restored` build and `v33-pixel-soap-stains` visual
revision are pinned alongside the source, payload, approved master-art, and
reference-dirt hashes. Phaser now runs all 750 seeded difficulty levels with
the exact three nozzle profiles, water/soap supplies, five-to-ten resistant
stain zones, soap-then-water rule, progressive cleaning strength, and original
97-percent completion tolerance. The native canvas reconstructs the approved
playground composition without modifying the embedded artwork. Campaign first
clears award the shared level-band reward once and replays pay zero. A dirty
Commons Playground instead launches a recurring town occurrence, awards the
native projected reward up to 170 coins, removes its visible grime, and returns
after a deterministic two or three game days. Exact active grime, soap, tool,
supply, and return-position state resumes from schema 17 saves. Playground
Power Wash requires landscape on mobile, so River Clear-Out remains the only
portrait-friendly migrated mini-game. The protected HTML remains unchanged.

Milestone 21 completes Morning Mug Coffee. Its protected catalogue now runs as
a separate Phaser venue with all 54 exact drinks, 28 ingredients, five barista
stations, four cup sizes, 15 chapters, the original first 20 pilot shifts, and
the deterministic Level 21–150 difficulty tiers. Every shift is no-miss, uses
three preparation trays, and validates the complete grind, espresso, water,
milk, foam, syrup, topping, iced-drink, alternative-milk, and tea sequences.
First clears award the original 25 + level + star formula once, capped at 170
coins, through a Morning Mug-specific ledger entry; Corner Café progress is
never changed. Active time, customer patience, orders, trays, completed steps,
return position, and exact next step checkpoint into schema 18 so Save & exit,
page exit, and a complete reload resume safely. Legacy `morningMug` progress is
projected separately, including the original completed-pilot Level 21 unlock.
Morning Mug requires landscape orientation on mobile. The protected HTML source
remains unchanged.

Milestone 22 completes Riverside Kitchen. Its protected catalogue now runs as a
separate Phaser restaurant with all 32 exact meals, 58 ingredients, nine
preparation and heat stations, 15 chapters, the original first 20 pilot shifts,
and the deterministic Level 21–150 difficulty tiers. Every shift is no-miss,
uses three meal trays, supports one-to-three-course diner orders, and validates
the complete plating, preparation-board, low/medium/high pan, simmer/boil pot,
medium/high grill, and roasting sequences, including every ready-to-burn heat
window and the original waste and mistake penalties. First clears award the original
35 + level + 15-per-star formula once, capped at 170 coins, through a
Riverside-specific ledger entry; Corner Café and Morning Mug progress are never
changed. Active time, diner patience, orders, trays, completed meal components,
return position, and exact next step checkpoint into schema 19 so Save & exit,
keyboard Escape, page exit, and a complete reload resume safely. Legacy
`riversideKitchen` progress is projected separately, including the original
completed-pilot Level 21 unlock. Riverside Kitchen requires landscape
orientation on mobile. The protected HTML source remains unchanged.

Milestone 23 completes South Shore Scoops. The protected component-counter
source now generates the exact 750 deterministic shifts across 75 unique
chapters, 19 product families, 24 containers/flavours/finishes/extras, and the
original 48-customer roster. Only one customer is active while the next two
remain visible; orders contain one or two products, two-item trays begin at
Level 8, patience follows the original 50-to-26-second curve, and the original
60-percent accuracy plus 60-percent-served requirement decides completion.
Picture construction retains ordered parts, early-level next-part guidance,
undo, discard, wrong-build penalties, waste, happiness, and sequential customer
handoff. First clears award the original 18-to-45 coin formula once, with
duplicate-payout rollback protection. Ten distinct completion thresholds now
persistently decorate and restore the South Shore venue, ending at Level 750.
Every part tap, tray action, service result, departure, and elapsed second is
checkpointed into schema 20; Save & exit, keyboard Escape, page exit, and a
complete reload restore the exact customer, patience, build, tray, queue and
town return point. Legacy `southShoreScoops` progress projects separately,
including the completed 150-level pilot's Level 151 unlock. South Shore Scoops
requires landscape orientation on mobile, with its complete 844×390 counter
fitting without scrolling. All 234 automated tests and the production build
pass, and live browser QA reports no warnings or errors. The protected HTML
source remains unchanged.

Milestone 24 completes the ordinary-coin economy, shops, equipment, inventory,
and transaction-history gap. The full released catalogue is now divided across
Willowmere Shop (51 tools, placeables, and furniture products), Village Grocer
(three seed products and five everyday animal treats), and Fresh Market (seven
fish, meat, and pellet products), with every ordinary product owned by exactly
one retailer. All original category groups, exact prices, and the 21 Lawn Care,
River Clear-Out, and Waste Collection perfect-result unlock conditions are
pinned. Mowers and vacuums can be bought and equipped separately; upgrades
receive only the original 50-percent credit from the best previously owned
lower paid tier. The equipped mower continues to drive Lawn Care and the
equipped vacuum now drives House Rescue power, reach, speed profile, colour,
and icon. Seeds, produce, and edible catches use their 99-item limit;
equipment and unique furniture remain single-owner; other legacy stacks retain
9,999. Purchases, equips, and consumable uses write detailed bounded history,
and a failed save restores the exact wallet, inventory, ledger, and loadout.
Schema 21 safely normalizes schema-20 inventory while retaining known ownership,
valid equipment selection, unresolved legacy records, and existing transaction
metadata. All 242 automated tests pass. The protected HTML source remains
unchanged.

Milestone 25 completes original town-object placement for all 35 catalogue
definitions (32 normally released, one subscription-only, and two hidden QA
fixtures). Purchases now show an exact footprint and behaviour preview, while
owned items can enter placement from either Shop or Inventory. Canvas tap/drag,
arrow-key nudging, 90-degree rotation, confirmation, and cancellation share one
mobile-friendly placement interface. Saved objects render in Phaser, block the
player, can be managed in place, moved without inventory mutation, or stored
back as exactly one owned item. Validation preserves the original per-item
river and road clearances and additionally protects ponds, harbour water,
cottages, shops, entrances, lawns, permanent fixtures, collision regions, and
other objects; resident destinations and public bins must remain reachable.
The safe cap is 500 objects. Every mutation is atomic, and forced persistence
failure restores the exact previous town, inventory, ledger, and active item.
Schema 22 imports valid legacy `economy.placedObjects` with exact coordinates
and normalized rotation, returns rejected known items to inventory, and leaves
the protected legacy snapshot unchanged. Validated hooks are ready for resident
destinations, usable bins, wildlife avoidance, rubbish-spawn exclusion, player
collision, and night lighting. All 251 automated tests and the production build
pass. The protected HTML source remains unchanged.

Milestone 26 completes the Village Grocer, allotment, and orchard migration.
The Grocer is now a walkable top-down Phaser interior with the original nine
physical product displays, cashier and customer, keyboard and touch movement,
collision, shelf interaction, and safe checkout. Farming retains the six
original beds, three crops, unlock costs, seed prices, growth times, yields,
weather effects, and offline progression. The orchard supports one starter
tree and up to 23 purchased saplings, for 24 separately positioned trees. Each
tree persists its exact town coordinates, stable identity, 4,320-minute
maturity, 720-minute one-apple production cycle, weather-adjusted progress,
and individual harvest history. Sapling purchase and placement are separately
atomic, respect the complete town validation map, and roll back cleanly on a
failed save. Schema 23 imports original crop beds, every original orchard slot,
saved positions, fruit and growth state, and owned saplings without mutating
the protected source snapshot. The protected HTML source remains unchanged.

Milestone 27 completes the persistent living-environment simulation. The save
now preserves all 20 legacy lawn profile slots while correctly treating House
19 as the original reserved-but-unauthored identity and House 20 as the real
personal home, leaving 19 physical lawns on the map. Each real property keeps
its own soil health, moisture, shade, growth rate, weed susceptibility,
maintenance cadence and household-care behaviour. Weather drives continuous
moisture, grass and weed changes, and residents can perform bounded evening
weeding without mowing work that belongs to the player.

The original 66 land anchors now hold persistent street, park and beach litter.
Light items move with the wind, nearby pieces form local Waste Collection
snapshots, litter can enter the river, estuary rubbish can wash ashore, beach
items can leave on the tide, and the Civic Assistant and Park Caretaker can
perform bounded sweeps only while working. Twelve businesses retain customer,
waste and overflow state and create correctly typed rubbish at nearby public
anchors. The five exact river reaches hold individual persistent objects with
stable IDs, type-specific flow, bridge/reed/bend snags, timed releases,
downstream jams, shoreline transfer and escape-to-sea history. A successful
authored cleanup removes only the exact land or river IDs snapshotted when the
job began.

Cleanliness is derived from land, river, lawn and business conditions and
reports the live restoration workload in town. A first full restoration, or a
later substantial backlog, starts the original three-game-day calm, defers new
litter and river arrivals, pauses lawn regrowth, and prevents immediate
re-dirtying. World-clock advancement, offline resolution and environment
changes are committed in one validated transaction. Schema 24 upgrades schema
23, converts original `lawns`, `litter`, `landRuntime`, `riverGarbage`,
`riverRuntime`, `businesses` and `socialRestorationRuntime` records, and keeps
the complete protected legacy snapshot untouched. All 270 automated tests and
the production build pass. The protected HTML source remains unchanged.

Milestone 28 completes advanced resident and public-bin behaviour. All 35
original residents now preserve their individual tidiness, sociability and
recreation traits, exact initial needs, symmetric friendship graph and changing
relationship scores. Needs continue through waking and sleeping time;
residents can hold mutual timed conversations, remember completed social
events, carry visible business-specific takeaway items, choose an available
bin, and react contextually to the player and the town's live restoration
condition. Household evening weeding is now attributed to the resident who
performed it, while mowing remains player work.

The five original public bins are authored at Old Market Road, Commercial
Loop, Willow Commons, South Meadow and South Shore with their original
coordinates, capacity and starting fill. They are real navigation destinations
with persistent fullness, tip, spill and collection-ready state. Residents also
discover and use every valid player-placed small, park, recycling or commercial
bin without modifying its exact transform. Empty carried items are disposed of
responsibly unless a resident makes a bounded, cleanliness-sensitive littering
decision; that decision activates an exact nearby persistent litter anchor and
records its resident source. In a neglected town a low-tidiness resident can
rarely tip one nearby bin, producing two to four exact persistent spill items.
In a cared-for or restored town highly tidy residents can pick up nearby litter
or right a cleaned tipped bin, with a temporary cleanup-protection area that
prevents an immediate repeat mess.

All resident, conversation, carried-item, relationship, greeting, care and bin
state is committed atomically with the shared environment and placed-object
state. A failed write restores the entire prior town. Schema 25 upgrades schema
24 and converts the original advanced `npcs` and `socialRestorationRuntime`
records, including public bins and behaviour counters, without changing the
protected legacy snapshot. All 277 automated tests and the production build
pass. The protected HTML source remains unchanged.

Milestone 29 completes the original weekly municipal-bin collection. The
service begins automatically every seventh game day at 07:00, starting on Day
7, and preserves Gavin's original identity, role and Willowmere recycling
lorry. The route snapshots all five authored public bins and every valid
player-placed small, park, recycling or commercial bin present when the lorry
leaves the depot. Player bins on that snapshot cannot be moved or stored until
the route finishes.

The lorry uses a separate connected graph containing only the nine authored
streets and three road bridges. It cannot enter a footpath, track, lawn or
remote destination. At each closest kerb stop Gavin dismounts and walks the
remaining distance, so South Meadow, Willow Commons, South Shore and remote
player placements remain serviceable without allowing the vehicle off-road.
Each stop retains the original bin coordinates and rotation. Gavin walks to the
bin, rights it and removes its persistent spill when necessary, lifts it, rolls
it to the lorry, empties its exact current fill, returns it, places it at the
exact saved transform, walks back and boards before the next drive leg. The
player collides safely with the visible lorry while the service is active.

Public and player-bin fill, last-empty day and collection count are committed
with the shared town state. The complete lorry, collector, lifted-bin, route,
phase, load and progress state is checkpointed throughout the route, supports
safe mid-route reload, and rolls back a failed write. Completion returns the
lorry to the depot, records the totals and advances the next service day by
exactly seven days. Schema 26 upgrades schema 25, adds the municipal domain and
placed-bin collection history, and converts the original
`garbageCollection` record without changing the protected legacy snapshot.
All 285 automated tests and the production build pass. The protected HTML
source remains unchanged.

Milestone 30 completes the original eight-stage Willowmere restoration arc in
its exact order: Wake, Commons, High Street, River, Station and Cinema, Shore,
Green, then Festival. The Phaser state preserves the original cleanup totals,
lawn/river/waste mix, perfect-cleanup counts, four map-zone counts, physical
placement counts and all original alternate litter gates. Cleanup and placement
events are recorded only by accepted town work, carry stable duplicate-event
identities, and unlock at most one restoration per completion.

Every unlock is permanent and changes the visible town: the Old Market fountain
flows, Commons reopens with repaired seating, High Street gains tables and
displays, fish and ducks return to the river, KindWorks Cinema opens with its
marquee, South Shore regains umbrellas and harbour activity, wildlife returns
to greener spaces, and the Festival leaves a permanent restoration plaque.
Restored destinations also enter resident leisure schedules and business
activity. The Festival's bunting, crowd and heightened activity last for the
original one in-game day while the achievement itself remains permanently
unlocked.

Each restoration uses the original icon, title, wording, camera focus and zoom
in an accessible animated dialog. Town movement, resident simulation and world
time pause during the reveal; nearby residents react; an optional synthesized
chime and supported-device haptic pattern play; reduced-motion preferences are
honoured; and dismissal restores camera follow and focus. Wake atomically grants
the original Town Planter once. Unlock, gift, ledger, reveal and festival state
save together, roll back completely after a failed write, and reload without
replaying completed work. Schema 27 upgrades schema 26, imports the original
`milestones` and onboarding gift records, and safely bootstraps pre-v36 cleanup
history without changing the protected legacy snapshot. All 295 automated tests,
the production build, desktop browser QA and 390×844 mobile browser QA pass. The
protected HTML source remains byte-for-byte unchanged.

Milestone 31 completes the original personal-home progression. The last South
Shore cottage now uses the stable `home20`/`house-20` identity throughout town
rendering, collision, House Rescue protection, diagnostics and saved state;
the temporary unauthored `house-19` alias migrates without creating or losing a
physical home. All existing Phaser and original-HTML creator/home records retain
their level and exterior design when upgraded to schema 28.

Meadowlight House now has the exact four original tiers: the included Level 1
Small Starter Cottage, 15,000-coin Level 2 Family Cottage, 40,000-coin Level 3
Spacious Home and 90,000-coin Level 4 Grand Home. Their original 0.68, 0.86,
1.04 and 1.22 scales drive the visible town cottage and expand companion
capacity from one to two, three and five. Higher tiers add visible wings,
dormers and the grand porch while keeping the authored doorway approach stable
and updating collision to the new footprint.

The resident panel exposes all four tiers, current wallet, capacity, next price
and affordability. The first wall, roof colour and roof style remain included;
later redesigns charge the original 600, 900 and 2,200 base prices with the
current tier's exact multiplier and nearest-50 rounding. An upgrade can apply
the selected exterior within its fixed price, as in the protected game. Profile
editing can no longer bypass those purchase paths. Every redesign and upgrade
updates the shared wallet, lifetime spending, bounded ledger and home in one
validated save, with an exact rollback if persistence fails.

All 305 automated tests and the production build pass. Desktop browser QA
verified live quoting, one-time redesign and upgrade charges, capacity changes,
schema-28 reload persistence, the on-map cottage and a clean console. A 390×844
mobile browser check confirmed the complete progression controls remain
readable, tappable and free of horizontal overflow. The protected HTML source
remains byte-for-byte unchanged.

Milestone 32 completes the bird's-eye home-interior and furniture system. All
19 physical cottages now open from town into stable, distinct interiors with
authored floor layers, perimeter walls, internal partitions, doorway clearance,
built-in furniture and collision rules. Meadowlight House follows the player's
current purchased tier; the other 18 cottages preserve their named households,
live resident schedules and current House Rescue cleanliness. Every room object,
resident and dirty area can be inspected, and a dirty cottage starts or resumes
its exact House Rescue job before returning to the same interior.

All ten original furniture products are now usable indoors: Cosy Sofa, Reading
Armchair, Woven Home Rug, Oak Coffee Table, Bookshelf, Leafy House Plant, Floor
Lamp, Dining Table, Small Wardrobe and Ornamental Fish Tank. The personal home
supports up to 60 saved placements with tap or keyboard placement, quarter-turn
rotation, collision-aware movement and storage back to inventory. Rugs retain
their floor-layer behaviour while solid furniture respects walls, doors,
partitions, built-ins and other solid items. The aquarium remains an empty,
placeable furnishing here; fish capacity and swimming belong to Milestone 33.

Furniture inventory, transforms, serials, visits and inspections save through
the shared verified state, with atomic rollback after failed persistence. Schema
29 upgrades schema 28 and imports original `homeFurniture` positions and turns
without changing the protected legacy snapshot. All 316 automated tests and the
production build pass. Desktop browser QA verified entry, inspection, placement,
rotation, movement, storage, resident schedules and the House Rescue round trip.
Responsive 400×842 portrait and 842×400 landscape browser checks confirmed the
interior and controls remain readable and usable. The protected HTML source
remains byte-for-byte unchanged.

Milestone 33 completes the original home-aquarium system. The four exclusive
Reedbank ornamental species are restored as separate, persistent residents:
Goldfish, Koi, Angelfish and the legendary Oranda Goldfish. Each retains its
original rarity, distinct silhouette and exact colour palette. A placed
Ornamental Fish Tank is required to house them, every species has its original
99-fish capacity, and none of these living fish can enter the ordinary food or
consumable inventory.

An ornamental catch now joins the placed tank atomically with its fishing
counters. Without a placed tank it is safely returned to Reedbank; if that
species has reached 99, the additional catch is also safely returned. Those
outcomes are explained in the fishing interface, while full species are
excluded from normal catch selection whenever other valid catches remain. A
failed save restores the exact pre-catch aquarium, counters and inventory.

The personal-home tank displays up to eight swimming fish in a fair
species-by-species cycle, with water, sand, plants and bubbles. Inspection lists
the exact species counts, the home badges show total fish and species, the
inventory has a separate Home Aquarium collection, and the shop explains
whether the unique tank is unowned, waiting to be placed or already housing
fish. An occupied tank can be moved or rotated but cannot be stored; if a home
redesign cannot retain the placed tank, its residents are safely released before
the tank returns to furniture inventory.

Schema 30 upgrades schema 29 with bounded per-species aquarium counts. Original
HTML saves preserve fish when their tank is placed, safely release unhoused fish,
convert any old ornamental consumable entries into releases, record those
reconciliations in the bounded ledger and leave the protected legacy snapshot
untouched. All 328 automated tests and the production build pass. Desktop,
390×844 portrait and 844×390 landscape browser QA verified the animated tank,
species inspection, inventory collection, occupied-tank safeguard, responsive
layout and a clean console. The protected HTML source remains byte-for-byte
unchanged.

Milestone 34 completes the original homeowner gratitude-gift system. Every
accepted House Rescue completion and every NPC-owned lawn completed to at least
80 percent now receives one stable, duplicate-protected gift chance. Each
household records lawn and indoor care separately, recognises full inside-and-
out care completed within the original seven-day window, and observes its own
seven-day gift cooldown while still remembering care completed during that
cooldown. Normal work retains the original eight-percent chance; full household
care raises it to ten percent; rare and exceptional gifts remain exactly one
percent combined. Fifteen consecutive eligible misses guarantee the sixteenth
chance through the original pity rule.

Eligible gifts use the exact four price tiers and context-sensitive stock:
mowers or town placeables for lawn care, vacuums or furniture for House Rescue,
and the complete eligible catalogue after full household care. Starter,
subscription, QA, aquarium, locked, full-inventory and Record Player items are
excluded. A missing tier safely downgrades until valid stock exists. The selected
item, household cooldown, pity counter, processed event, inventory quantity,
zero-coin value ledger, bounded history and delivery queue commit in the same
verified transaction as the completed job. Queue saturation leaves an event
retryable, duplicate events cannot grant twice, and any failed write restores
the exact pre-job state.

Waiting gifts open only when the player is safely back in town and no other
modal is active. The accessible two-stage reveal preserves the homeowner's
original dialogue, household name, gift tier and shop value, pauses the town,
traps keyboard focus, honours reduced motion and offers Keep for later plus the
correct Equip, Furnish or Place action. The item is already safely owned before
the reveal; acknowledgement atomically removes only its queue entry and marks
history revealed, while a failed acknowledgement leaves the gift waiting.

Schema 31 upgrades schema 30 with the bounded format-2 homeowner-gift domain.
Original zero-padded household identities, cooldowns, pity state, processed
events, history and queued deliveries convert without changing the protected
legacy snapshot; a queued legacy record without a matching owned item is safely
dropped instead of duplicating inventory. All 345 automated tests and the
production build pass. Desktop, 390×844 portrait and 844×390 landscape browser
QA verified both reveal stages, keyboard focus, safe dismissal, immediate tool
equipping, no overflow, 44-pixel-or-larger mobile tap targets and a clean console.
The protected HTML source remains byte-for-byte unchanged.

Milestone 35 completes the original wildlife system. All 37 original species
now have persistent Phaser data, exact safe diets and favourites, day, night,
crepuscular or all-day schedules, authored habitat anchors, bounded local
territories and their original family-based animation metadata. The live town
uses the original staggered weighted rotation: three regular visitors, never
two of the same species, and no more than four wild animals when a rare visitor
arrives. The 45 natural Willowmere identities are available in the wildlife
panel; all 11 Paws & Wonders identities are preserved in state but remain
unavailable for new shop adoption until Milestone 36.

Land routes remain inside the world, keep clear of static buildings and the
river, and return through safe territory anchors. Seven water species follow
the Willow River corridor with ripples and water-aware depth. Seven aerial
species retain obstacle overflight, while the original flutter rigs receive
lift and aerial shadows. Every species uses its original animation family,
motion, frame count and size class, with direction, cadence, scale, shadow and
depth derived from its live movement.

The five original rare visitors—wolf, sea otter, beaver, capybara and baby
pig—retain their exact period, offset day, start time, visit duration, entry,
exit, forest and town configuration. They visibly travel between forest and
town during entry and return phases. A complete encounter missed while the
game is closed receives one delayed ten-game-minute replay; expired replay
state is cleaned safely. Clear, rain, wind and snow plus all four seasons now
change appropriate land, water, bird and insect activity without changing
their persistent friendship progress.

Animal state format 2 records absolute wildlife resolution, rare replays and
visit history. Schema 32 expands every schema-31 save from the former eight-
animal foundation to all 56 identities, retains names, trust, adoption, active
followers and care history, and recovers additional original HTML animal
records without changing the protected legacy snapshot. Feeding, greeting,
adoption, daily care, one active follower, South Meadow roaming, rollback and
reload behaviour remain intact.

All 356 automated tests and the production build pass. Desktop browser QA
verified the 45-animal panel, three-to-four bounded live visitors, a water-
animal interaction, saved trust after reload and a clean console. Responsive
390×844 portrait and 844×390 landscape checks confirmed no page or panel
overflow, a complete within-viewport landscape card and 44-pixel-or-larger
controls. The protected HTML source remains byte-for-byte unchanged.

Milestone 36 completes the original Paws & Wonders adoption shop. The stable
`shop-11` building and `biz_arcade` navigation node now open a walkable top-down
Phaser interior instead of changing the town map identity. The original dog
lounges, specialist habitats, mystery nest, Evie's keeper desk, Noah visitor and
right-side adoption panel are restored as physical shop-floor features. All
eleven permanent animal identities from Milestone 35 are connected to their
original catalogue entries: six distinct dog breeds, four unusual companions,
and Sprout the featured Baby Triceratops.

Names, breeds, personalities, descriptions, safe care foods and exact prices
remain pinned. Sprout's patterned mystery egg stays locked until exactly three
restoration milestones. Ordinary KindlyCoins fund each permanent one-time
adoption, with no companion-family cap. The adopted animal begins at 100 trust
and roams in South Meadow, while any existing active follower remains unchanged.
The animal record, care dates, wallet, lifetime spend and dedicated bounded
ledger entry commit in one verified save; duplicate, locked and unaffordable
requests change nothing, and any failed write restores the full checkpoint.

Keyboard, pointer and touch interaction share the normal character controls;
habitats can be approached or tapped, `A` adopts the selected companion, and
the shop returns the player to the exact Willowmere position. Mobile landscape
keeps the complete floor and detail panel usable, while portrait uses the
established rotate-phone screen. The wildlife panel now directs these preserved
shop-only identities into Paws & Wonders rather than advertising a future phase.

All 364 automated tests and the production build pass. Desktop browser QA
verified entry, all eleven visible habitats, a real 420-coin Sunny adoption,
permanent sold state, South Meadow confirmation, balance reconciliation, return
to town and a clean console. Responsive 844×390 landscape and 390×844 portrait
checks confirmed no page overflow, a complete playable landscape room and clear
orientation guidance. The protected HTML SHA-256 remains
`0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5`.

Milestone 37 completes the original Harbour General business. The existing
`shop-07` building and `biz_takeaway` navigation node now open a walkable
top-down store run by Amelia. The exact 5,000-coin deed, 07:00–21:00 hours, six
display slots, four-unit immediate wholesale cases, 24-unit product cap and all
17 original products, prices and demand values are preserved. The six original
starter displays each receive four units when the deed is purchased.

The player can select any live display, assign or swap every catalogue item,
clear a shelf without losing warehouse stock, restock at wholesale and collect
the complete till. Ownership, balance, lifetime spending, stock, till and ledger
changes are validated and saved together; any failed write restores the exact
checkpoint. The business records lifetime gross, stock spend, sales, lost sales,
per-product totals and the latest eight in-person purchases.

Residents now route to Harbour General when their errand need and schedule make
them eligible. A 12 percent browse-only chance and exact clear, rain, wind and
snow demand multipliers choose among displayed stock. Umbrellas, raincoats,
winter jackets, gloves, scarves and wool hats enter each resident's persistent
weather wardrobe and are not purchased twice. Successful shoppers leave with a
visible bag; Harbour General intentionally has no delivery system.

Schema 33 adds the bounded Harbour General domain and normalizes all 35 resident
wardrobes while preserving schema-32 progress and original legacy snapshots.
The dedicated Phase 37 contract and QA notes are recorded in
`HARBOUR_GENERAL_SYSTEM.md`.

All 378 automated tests and the production build pass. Desktop browser QA
verified the 5,000-coin deed, shop entry, six starter displays, all 17 catalogue
items, immediate stock changes, saved ownership and stock after reload, and a
clean console. Responsive 844×390 landscape and 390×844 portrait checks
confirmed no page overflow, a complete playable store and the required
orientation guidance. The protected HTML SHA-256 remains
`0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5`.

Milestone 38 completes the original KindWorks Impact presentation and connects
it to the existing KindWorks Cinema building. The preserved schema-2 dataset,
three preview records, River cleaning, Free lawn care and Rubbish cleaning
filters, verified contribution totals, project count and three focus areas now
run through a dedicated validated content service. Missing and duplicate ids,
unsupported categories or statuses, unsafe links, negative amounts and
dishonest demo or completed claims cannot enter verified totals. The embedded
preview data remains available after network, timeout, response or validation
failure, so the panel never becomes empty offline and correctly begins at £0
and zero supported projects.

YouTube watch, short, embed, Shorts and Live links are accepted only from exact
YouTube hosts. Preview cards make no video request. A privacy-enhanced
`youtube-nocookie.com` player is created only after an explicit player action,
while a separate canonical YouTube action uses `noopener,noreferrer`. The
interface preserves the original transparency promise, adds accessible filters,
Escape dismissal, trapped keyboard focus, 44-pixel touch controls and distinct
Impact and Cinema headings.

The original `shop-13` cinema building is now interactive at its physical door.
It remains visibly closed and refuses entry until the already-persisted Station
restoration milestone unlocks. Once restored, the door opens the cinema view of
the Impact programme, while the existing permanent marquee, crowd and resident
schedule integration remain active. The global Impact button is available
before reopening so players can always inspect the transparency promise. No new
save data is introduced and schema 33 remains unchanged. The dedicated contract
is recorded in `IMPACT_CINEMA_SYSTEM.md`.

All 389 automated tests and the production build pass. Browser QA verified the
locked and restored door states, exact zero totals, three preview cards, category
filtering, deferred video loading, keyboard dismissal and a clean console.
Responsive 390×844 portrait and 844×390 landscape checks confirmed no page
overflow, a bounded scrolling panel, top-reset on each opening and a 44×44 close
control. The protected HTML SHA-256 remains
`0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5`.

Milestone 39 restores the original authored Willowmere story layer. All 35
principal residents now have their exact traits, hope, concern, trusted-neighbour
notes and four-stage arc, for 140 persistent story chapters in total. The 19
physical household identities also preserve their authored names, districts,
approaches and descriptions. Story data is isolated from simulation logic and
validated against every stable resident and home identity.

Contextual thoughts now draw from the resident's live activity, destination,
job, home, time, weather, town condition, relationship, story chapter, completed
jobs, open business and restoration progress. A thought changes only after a
deliberate player conversation, never from a clock tick or panel refresh. The
latest six identities prevent immediate repetition, and the chosen text and
context persist in the shared save.

Opening, Growth and Resolution chapters require increasingly durable evidence:
conversations on different days, completed resident routines, shared cleanup
work, stronger authored relationships, relevant area restoration and finally
town-wide restoration. One evaluation unlocks at most one chapter, and every
unlock records its game day, trigger and explanation. Repeated same-day clicks
cannot rush a story.

Residents can be approached directly through the existing keyboard and touch
interaction prompt, selected from the new Stories HUD view, or met as physical
occupants inside their authored homes. The responsive story panel exposes the
current chapter, saved thought, complete revealed history, next evidence, home
story and relationship notes. Schema 34 safely converts schema-33 records and
original version-82 `npcNarratives` by stable id, while failed writes restore the
exact checkpoint. The contract is recorded in `NPC_NARRATIVE_SYSTEM.md`.

All 397 automated tests and the production build pass. Browser QA verified all
35 resident cards, saved non-repeating thoughts, keyboard dismissal, resident
switching, a clean console, no page overflow, independent panel scrolling and
44-pixel controls at 1280×720, 844×390 landscape and 390×844 portrait. The
protected HTML SHA-256 remains
`0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5`.
