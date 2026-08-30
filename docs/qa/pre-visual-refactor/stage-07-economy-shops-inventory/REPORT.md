# Stage 7 QA Report — Economy, Shops, Inventory, Equipment, Upgrades and Gifts

## Verdict

**AUDIT VERDICT (HISTORICAL): NOT READY — STAGE 7 REPAIR REQUIRED.**

**POST-REPAIR RESULT: SAFE TO CONTINUE WITH DOCUMENTED USER DECISIONS.**

The Stage 6 repair gate explicitly permitted continuation: `SAFE TO CONTINUE WITH DOCUMENTED USER DECISIONS`. The audit found no currency-loss, duplication, purchase, reward, inventory, equipment, upgrade, gift, or save-integrity failure. The two P2 responsive-shop findings were subsequently repaired and verified; see `REPAIR_REPORT.md`. `S7-UDR-001` remains a non-blocking product decision.

## Baseline

| Item | Evidence |
| --- | --- |
| Branch | `phase-2-ui-simplification` |
| Starting commit | `3387bcb48964c41edbdc26f4257d2990fcdaf8d5` |
| Worktree | Pre-existing dirty worktree preserved; Stage 7 did not attribute or rewrite earlier changes |
| Stage 6 gate | `SAFE TO CONTINUE WITH DOCUMENTED USER DECISIONS` |
| Phaser source | Current Vite/Phaser build in this repository |
| Protected HTML | `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`, SHA-256 `0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5` |

## Executive result

- The single local gameplay currency is KindlyCoins. No second/premium gameplay currency is persisted.
- The item catalogue contains 82 definitions: 21 consumables, 4 collectibles, 10 furniture items, 12 equipment items and 35 town placeables.
- The three ordinary shops expose 67 correctly defined stock entries: Willowmere Shop 51, Village Grocer 9 and Fresh Market 7. Two Willowmere entries are free starter tools, so the ordinary released inventory surface contains 69 items including those starters.
- Paws & Wonders exposes 11 one-time permanent adoptions with a combined catalogue price of 6,480 coins.
- Harbour General exposes 17 profitable wholesale/retail products, six displays, four-item cases, a 24-per-product cap and a 5,000-coin deed.
- All reward owners, purchases, inventory delivery, equipment effects, home upgrades, homeowner gifts and real-money fail-closed rules passed focused and full automated checks.
- One million deterministic gift-roll samples reproduced the exact configured normal and full-care distributions.
- Live testing proved ordinary purchases, rapid-repeat protection, one-time adoption, restocking, gifted equipment, home upgrades, scrolling inventory and fail-closed purchase support.
- At 568×320, compact DOM shops and fixed 1280×720 Phaser shop scenes make some important controls smaller than a reliable finger target; the fixed canvas shops also render supporting text too small. See `S7-UI-001` and `S7-UI-002`.

## Automated evidence

| Check | Result |
| --- | --- |
| Initial economy/reward/shop/inventory focus suite | PASS — 268/268 |
| Supplemental Stage 7 focus run | PASS — 149/149 (contains deliberate overlap with the first focus suite) |
| Complete repository suite | PASS — 629/629, 0 failures; two independent full runs exited 0 |
| Differential HTML parity | PASS — 13 activities, 5,850 levels, 19 shared domains, 85 exact rules |
| Minigame/reward parity | PASS — 14 games, 75 comparisons, 105,795 level/reward instances |
| Gift probability enumeration | PASS — 1,000,000 normal and 1,000,000 full-care samples exactly matched configured probabilities |
| Production build | PASS — 179 modules transformed |

## Runtime transaction evidence

| Flow | Evidence | Result |
| --- | --- | --- |
| Willowmere Shop | Bought Young Maple for 1,500; balance 3,000→1,500; inventory gained one; reload retained the item | PASS |
| Village Grocer | Rapid double-click on Carrot Seeds caused one purchase only; balance 3,000→2,970; quantity 1→2 | PASS |
| Fresh Market | Bought River Minnows for 140; balance 2,970→2,830; item appeared under food and opened Animal Friends safely | PASS |
| Large inventory | 10 item types across tools, town items, food and furniture remained scrollable at 568×320 | PASS |
| Optional support | Six coin packs and three memberships were disabled without a verified server wallet; restore/manage actions remained unavailable | PASS — fail closed |
| Paws & Wonders | Adopted Sunny once for 420; balance 20,000→19,580; immediate repeated tap showed `Already adopted` and did not charge again | PASS |
| Harbour General | Restocked four umbrellas for 480; balance 20,000→19,520; stock 4→8 | PASS |
| Homeowner gift | Revealed a saved Swift Sweep worth 5,000 and equipped it without a coin deduction | PASS |
| Personal home | Bought Level 2 for 15,000; balance 200,000→185,000; capacity 1→2; next upgrade became Level 3 | PASS |

The development fixture credits used to reach expensive systems are excluded from economy conclusions. Exact balance persistence is covered by repository-level transaction/reload tests because some development URLs intentionally top the wallet back up on reload.

## Viewport evidence

| Screen | 568×320 | 1024×768 | 1280×720 |
| --- | --- | --- | --- |
| Willowmere Shop | Fits; catalogue remains visible and scrollable | Covered by shared responsive shell | Purchase flow passed |
| Village Grocer | No clipping, but 42×31 product targets are undersized | Fits; visible controls at least 44px | Purchase and rapid-repeat flow passed |
| Fresh Market | Shared compact-shop implementation carries the same narrow-target risk | Fits through shared shop shell | Purchase/inventory flow passed |
| Inventory | Fits and scrolls through multiple sections | Covered by responsive shell | Full section content inspected |
| Paws & Wonders | Complete room fits, but fixed-canvas text/actions become too small | Fixed-canvas scaling inspected | Adoption/duplicate flow passed |
| Harbour General | Complete shop fits, but arrows/actions/text become too small | Fixed-canvas scaling inspected | Restock flow passed |

This is browser emulation, not physical iOS/Android testing. Physical-device usability remains a Stage 9/release gate.

## Finding summary

| ID | Severity | Summary | Status |
| --- | --- | --- | --- |
| S7-UI-001 | P2 | Village Grocer/Fresh Market narrow-phone product targets can shrink to about 42×31 CSS pixels | CONFIRMED — NOT FIXED |
| S7-UI-002 | P2 | Paws & Wonders and Harbour General scale fixed 1280×720 interfaces down without responsive reflow, making controls/text too small at 568×320 | CONFIRMED — NOT FIXED |
| S7-UDR-001 | User decision required | Latest HTML/current Phaser allow all 11 companions; older requirements ask for a five-pet cap and freeing | PRESERVED; inherited from Stage 6 |

No P0, P1 or P3 finding was confirmed in this stage.

## Untested or bounded areas

- No real App Store/Play Store purchase was attempted. Web production correctly refuses local billing; external billing needs signed receipts and a connected server wallet.
- No physical phone/tablet was available. Viewport evidence is emulated.
- A completely empty valid player inventory is not a normal reachable state because starter tools are owned by default. Empty subsections, including the aquarium section, were tested instead.
- Maximum catalogue ownership and all 67 ordinary purchases were validated programmatically rather than manually buying every item through the UI.
- Harbour General NPC sales and till collection were deterministic service/runtime tests; Stage 7 did not wait through an uncontrolled live NPC shopping schedule.

## Protected contracts

Stage 7 changed none of the following: save schema, wallet balance rules, reward formulas, first-clear markers, shop prices, inventory limits, equipment effects, ownership, placement coordinates, pet identities/follower state, farming state, home levels, gift probabilities, commerce receipt rules, level data or scene completion rules.

## Repair gate result

`S7-UI-001` and `S7-UI-002` are fixed. The repair changed responsive presentation and touch geometry only. Prices, products, rewards, stock, adoptions, inventory, home progression and gift rules remain protected. The Stage 7 focus rerun, complete 632-test suite, required emulated viewport profiles, both parity validators, production build and performance budget all passed. Stage 8 may proceed while `S7-UDR-001` remains documented.
