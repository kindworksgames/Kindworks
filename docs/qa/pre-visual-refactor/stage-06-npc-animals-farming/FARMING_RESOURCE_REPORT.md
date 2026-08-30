# Stage 6 Farming and Resource Report

## Authoritative farming model

| Resource | Contract | Result |
| --- | --- | --- |
| Allotment beds | Six total; first unlocked; later costs 1,000, 2,500, 4,500, 7,000, 10,000 | PASS |
| Carrots | 30-coin seed, 360 growth minutes, yield 6 | PASS |
| Fresh greens | 80-coin seed, 420 growth minutes, yield 4 | PASS |
| Wild berries | 120-coin starter, 540 growth minutes, yield 4 | PASS |
| Starter apple tree | One positioned mature/fruiting tree | PASS |
| Added apple trees | 2,800-coin sapling; safe purchase/place; 24-tree total capacity | PASS |
| Apple maturity/fruit | 4,320 maturity minutes; 720 growth minutes per fruit; one fruit per harvest | PASS |

## Coverage matrix

| Requirement | Status | Evidence |
| --- | --- | --- |
| Starting apple tree | PASS | Fresh state contains one positioned tree and immediate bounded harvest |
| Buying and placing trees | PASS | Grocer purchase and valid town placement are atomic; invalid placement consumes nothing |
| One-apple harvest rule | PASS | First harvest gives one; immediate repeat returns `fruit-not-ready`; next cycle gives one |
| Willow Allotment | PASS | Six authored bed IDs and town interactions validate |
| Planting and crop variety | PASS | All three crops were purchased and planted across all six beds |
| Growth and timers | PASS | Weather-aware online/offline progress and save/reload pass |
| Harvesting | PASS | Correct yields enter inventory; full inventory preserves the ready crop |
| Buying additional plots | PASS | All five paid unlocks are sequential, bounded and atomic |
| Fish and food acquisition | PASS | Fishing, Fresh Market, Village Grocer and crop harvest routes all resolve to real inventory items |
| Inventory delivery | PASS | Seed purchase, produce harvest, apple harvest and fish acquisition persist |
| Animal consumption | PASS | Feeding consumes one suitable produce item and updates trust atomically |
| Duplicate harvest prevention | PASS | Empty/not-ready tree and non-ready bed cannot pay or deliver again |
| Scene exit during growth | PASS PROGRAMMATICALLY | Growth is world/save based rather than scene-local; refresh after elapsed time resolves once |
| Save/reload | PASS | Purchase, seed count, coins, beds, crop timers, trees and produce remain valid after repository reload |

## Live evidence

At 1280×720, the isolated Village Grocer path displayed seeds, sapling and animal food. Buying one carrot-seed packet changed coins from 100 to 70 and inventory from one to two. Reload and re-entry showed 70 coins and two seed packets. This confirms the live UI reaches the same atomic service proven by the programmatic bed/growth/harvest checks.

## HTML parity notes

The latest HTML contains the same six-bed, three-crop and positioned-orchard foundation. Phaser retains the one-fruit rule while using the current weather-aware growth model and full positioned-tree state. No farming data mismatch or missing resource route was found.

## Coverage limitations

- Multi-day growth was time-advanced deterministically; it was not observed for real-world hours.
- No physical mobile background/kill test was available. Native lifecycle persistence remains a Stage 8/9 gate.
