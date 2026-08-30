# Stage 7 Complete Economy Map

## Currency domains

| Domain | Persisted owner | Sources | Sinks / transfers | Notes |
| --- | --- | --- | --- | --- |
| KindlyCoins | `state.economy` | starter grant, trusted daily/return rewards, minigames/jobs, magnet recoveries, Harbour till, verified coin packs/memberships, development-only fixtures | ordinary shops, Paws adoptions, Harbour deed/restock, home redesign/upgrades | The only local gameplay currency |
| Real money | External store/server wallet | Six declared coin packs; three KindlyClub tiers | Verified receipt creates authoritative wallet/membership state | No local checkout; unavailable external integration is fail-closed |
| Premium currency | None | None | None | KindlyClub is a verified membership, not a second currency |

Development fixture credits are labelled `development-fixture`, DEV-only and excluded from balance analysis.

## Coin sources

| Source | Rule | Duplicate protection |
| --- | --- | --- |
| New-player setup | One 100-coin starter grant | Durable onboarding markers and ledger |
| Login | 10 coins once per trusted new day; 50 additional return coins after a three-day gap | Trusted-time receipt/day markers; rollback safe |
| Lawn / Waste / River cleanup campaigns | First-clear only; 0 below 50%; otherwise rounded percent plus 5 coins per 50-level band, capped at 170 | Completed-level/processed-session IDs |
| Lawn town work | Occurrence-specific completion reward; farming lawn job also has a protected 100-coin owner | Target/job session identity |
| Beach campaign | 100 plus 5 per 50-level band, capped at 170, first-clear only | Completed-level/session IDs |
| Beach town work | Native finds/bonus result banked once | Town-job session identity |
| Power Wash campaign | Same 100→170 first-clear band model | Completed-level/session IDs |
| Power Wash town work | Native reward `round(100 + level × 20/24)`, capped at 170 | Town-job session identity |
| House Rescue | Protected accuracy/level formula on valid completion | Home/job and campaign session IDs |
| Corner Café, Little Bakery, Morning Mug, Riverside Kitchen | Authored level/star formulas; first clear only | Completed-level markers |
| South Shore Scoops | Accuracy threshold plus bounded level bonus; capped by authored maximum; first clear only | Completed-level markers |
| Magnet Fishing | Named recovery: 12, 18, 22, 40, 65, 140, 350 or 800 coins | Cast completion transaction and processed state |
| Harbour General | Collected till transfers already-recorded NPC sales into the wallet | Atomic till collection |
| Verified commerce | 1,000/3,000/6,000/13,000/27,500/80,000 packs; 2,000/5,000/10,000 monthly membership coins | Verified transaction and membership-period IDs |

Failure, cancellation, retry and campaign replay paths were tested to pay zero or restore the exact checkpoint as appropriate.

## Coin sinks

| Sink | Range / rule | Delivery |
| --- | --- | --- |
| Willowmere Shop | 51 stock entries across tools, trees, seating, bins, decorations and furniture; two starter tools cost 0 and are default-owned | Inventory, then equipment/home/town placement |
| Village Grocer | 9 products, 30–2,800 coins | Seeds, sapling and animal foods into consumables |
| Fresh Market | 7 products, 80–360 coins | Fish/meat/pond food into consumables |
| Paws & Wonders | 11 permanent one-time companions, 390–1,200 coins; total catalogue 6,480 | Permanent animal identity; duplicate adoption refused |
| Harbour General deed | 5,000 once | Business ownership plus six starter cases |
| Harbour General restock | Wholesale price × immediate four-item case, maximum 24 per product | Business stock, not player inventory |
| Personal-home upgrades | Level 2: 15,000; Level 3: 40,000; Level 4: 90,000 | Permanent level/scale/capacity 1→2→3→5 |
| Personal-home redesign | Wall 600, roof colour 900, roof style 2,200 multiplied by level 1/1.35/1.75/2.25 and rounded to nearest 50 | Same stable home identity, changed appearance only |

All ordinary transactions validate price, affordability, ownership/limit and inventory delivery before committing. A failed save restores wallet, inventory and ledger together.

## Resource and item flows

| Resource | Sources | Sinks / use | Inventory/save owner |
| --- | --- | --- | --- |
| Crop seed packets | Village Grocer | Plant one allotment bed | Consumables → farming bed |
| Carrots | Ready allotment harvest | Animal food/other consumers | Consumables, cap 99 |
| Greens | Village Grocer food or grown greens | Feeding compatible animals | Consumables |
| Berries | Village Grocer food or grown berries | Feeding compatible animals | Consumables |
| Apples | Starting/placed apple trees, exactly one per ready harvest | Feeding compatible animals | Consumables, cap 99 |
| Apple saplings | Village Grocer | Valid town orchard placement; grows and fruits | Consumable until placement; orchard state afterward |
| Fish | Fishing catch tables or Fresh Market | Animal food; ornamental species route to a placed aquarium or safe release | Consumables/collectibles/aquarium |
| Animal food | Village Grocer, Fresh Market, farming/fishing | One compatible feed consumes one item | Consumables |
| Town placeables | Willowmere Shop, restoration/membership gifts | Place, move, rotate, store in valid town coordinates | Placeables plus placement state |
| Furniture | Willowmere Shop, homeowner/membership gifts | Place, move, rotate, store in personal home | Furniture plus home-interior placement state |
| Equipment | Starter ownership, Willowmere Shop, homeowner gifts | Equip mower/vacuum; stronger tiers alter exact protected profiles | Equipment plus equipped slots |
| Companion adoptions | Paws & Wonders | Select one follower; others roam South Meadow | Animal/pet state, not ordinary inventory |
| Homeowner gifts | Eligible lawn/house care | Item is added before reveal; optional immediate equip/use | Inventory, gift queue/history and zero-value ledger |

## Inventory limits and ownership

- Default stack limit is bounded; food, fish, seed and harvest definitions commonly cap at 99.
- Apple saplings cap at 24.
- Unique furniture/equipment and already-adopted permanent pets reject duplicates.
- Town and home placements consume an owned inventory unit and storing restores it atomically.
- Aquarium fish are separate from ordinary consumables and cap at 99 per species.
- Harbour business stock is separate from player inventory and caps at 24 per product.
- All 67 ordinary shop destinations, all town placeables and all furniture definitions passed purchase/delivery/placement contract tests.

## Homeowner gifts

| Rule | Normal care | Full care |
| --- | ---: | ---: |
| Small (value 1–1,800) | 5.0% | 6.5% |
| Thoughtful (1,801–5,000) | 2.0% | 2.5% |
| Rare (5,001–15,000) | 0.9% | 0.9% |
| Exceptional (15,001+) | 0.1% | 0.1% |
| No gift | 92.0% | 90.0% |

Eligibility requires at least 80% lawn completion or valid House Rescue care. Inside-and-out care within seven days uses the full-care table. A household has a seven-day cooldown. Fifteen misses arm a guaranteed sixteenth eligible gift. The record player is excluded from random homeowner stock; unavailable tiers downgrade safely. Event IDs, processed history, queue limits and atomic inventory delivery prevent duplicates.

## Equipment benefits

- Mowers progress through speed multipliers `1.00, 1.05, 1.10, 1.25, 1.45, 1.65` with protected perfect-count unlocks.
- Vacuums progress through power `1–5`, radius `36–52` and speed multiplier `1.00–1.35`.
- An equipment purchase receives at most 50% credit for the best lower owned tier; the quote and transaction use the same calculation.
- Tests prove every higher tier is strictly stronger in at least one relevant gameplay property and that the equipped definition is read by its minigame.
