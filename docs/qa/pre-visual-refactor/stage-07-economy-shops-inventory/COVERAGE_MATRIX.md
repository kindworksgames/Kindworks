# Stage 7 Coverage Matrix

| Area | Data validation | Transaction/reload tests | Runtime | Responsive | Status |
| --- | --- | --- | --- | --- | --- |
| Wallet/ledger | Complete fields, limits and transaction IDs | Credit/debit/rollback/lifetime totals pass | Wallet and support views inspected | 568×320 scroll/fit | PASS |
| Willowmere Shop | 51 definitions, categories, prices, unlocks | All products and placement destinations pass | Maple purchase/reload; locked equipment visible | 568×320 fits | PASS |
| Village Grocer | 9 definitions and retailer mapping | Seed/sapling/food transactions pass | Rapid-repeat Carrot Seed purchase | 568×320 target-size failure | FAIL — S7-UI-001 |
| Fresh Market | 7 definitions and retailer mapping | Food/fish delivery and animal consumption pass | Minnow purchase and Animal Friends handoff | Shares compact-shop target risk | FAIL — S7-UI-001 |
| Inventory | 82 unique definitions; bucket/limit validation | Empty buckets, large catalogue, add/remove/cap/save pass | 10-type inventory scrolled; actions opened correct owner | 568×320 fits and scrolls | PASS |
| Equipment | 6 mower and 5 production vacuum tiers plus QA-only tool excluded | Prices, unlocks, credits, equip/save and gameplay effects pass | Gifted Swift Sweep equipped | Inventory action reachable | PASS |
| Town placeables | Every definition has valid destination/rules | Purchase→place→reload→move/store pass | Maple delivered and place action shown | Shop/inventory responsive | PASS |
| Furniture | 10 definitions; unique tank rules | Purchase→place→reload→move/store pass | Five-item fixture visible in inventory | Inventory scroll passes | PASS |
| Paws & Wonders | 11 unique permanent companions and valid diets | Adoption, funds, duplicate, save and all-11 ownership pass | Sunny purchase and immediate duplicate attempt | 568×320 fixed-scale failure | FAIL — S7-UI-002 |
| Companion follower/freeing | Current unlimited model validated | Follow/roam/save pass | Animal Friends inspected | Responsive panel previously covered | USER DECISION REQUIRED for five-cap/freeing |
| Harbour General | 17 products, six slots, positive margins | Deed, stock, assignment, NPC sale, till/reload and rollback pass | Umbrella restock 4→8, −480 coins | 568×320 fixed-scale failure | FAIL — S7-UI-002 |
| Personal home | Four levels and redesign price table | Sequential upgrades, max level, funds, rollback and migration pass | Level 1→2, −15,000, capacity 1→2 | DOM dialog responsive | PASS |
| Minigame rewards | All authored formulas and level domains | First-clear/replay/failure/rollback coverage passes | Representative reward flows covered by Stages 3–4 | N/A to shop UI | PASS |
| Farming/fishing resources | Seeds, produce, orchard, catch tables and caps valid | Purchase/plant/grow/harvest/feed/catch/save pass | Minnow delivery and animal handoff | Relevant screens covered earlier | PASS |
| Homeowner gifts | Odds, price tiers, exclusions and limits valid | Eligibility, cooldown, pity, duplicate, queue, save/reload pass | Swift Sweep reveal and equip | Dialog fits 1280; phone shell shared | PASS |
| Verified commerce | Six packs, three tiers and policy valid | Tamper, duplicate receipt, restore and rollback pass | Web support screen correctly disabled | 568×320 wallet shell fits | PASS / EXTERNAL CHECKOUT BLOCKED BY DESIGN |

## Exact level/reward coverage

- Differential validator: all 5,850 protected levels and 85 exact shared rules.
- Minigame parity validator: 105,795 generated comparisons, including every level catalogue and exhaustive reward samples.
- Campaign reward owners tested: Lawn, Waste, River, Beach, Power Wash, House Rescue, Corner Café, Little Bakery, Morning Mug, Riverside Kitchen and South Shore Scoops.
- Resource rewards tested: fishing inventory catches, magnet coin recoveries, farming harvests, restoration planter gift, homeowner item gifts and verified membership gifts.

## Status definitions

- `PASS`: expected behaviour was evidenced and no confirmed defect remains in this stage scope.
- `FAIL`: a confirmed Stage 7 defect is open.
- `BLOCKED BY DESIGN`: an external integration cannot be exercised locally and the local client correctly fails closed.
- `USER DECISION REQUIRED`: current source-of-truth documents conflict; no product rule was selected during QA.
