# Stage 4 Combined Coverage Matrix

Status vocabulary: PASS, FAIL, PARTIAL, BLOCKED, UNTESTED, or N/A.

| Check | Bakery | Café | Morning Mug | Riverside | Scoops | Harbour General |
| --- | --- | --- | --- | --- | --- | --- |
| Normal world entry | PASS | PASS | PASS | PASS | PASS | PASS |
| Direct QA entry | PASS | PASS | PASS | PASS | PASS | PASS |
| Early/boundary/middle/late/final entry | PASS AFTER REPAIR¹ | PASS | PASS | PASS | PASS | N/A |
| Complete service/business loop | PASS² | PASS² | PASS² | PASS² | PASS | PASS |
| Customer/order count | PASS | PASS | PASS | PASS | PASS | PASS |
| Order generation | PASS | PASS | PASS | PASS | PASS | N/A |
| Recipe progression | PASS | PASS | PASS | PASS | PASS | N/A |
| Ingredient references | PASS | PASS³ | PASS | PASS | PASS | N/A |
| Preparation sequence | PASS | PASS | PASS | PASS | PASS | N/A |
| Appliance/timer states | PASS | PASS | PASS | PASS | N/A | N/A |
| Carrying/tray/cup/plate/counter | PASS | PASS | PASS | PASS | PASS | N/A |
| Serve/correct delivery | PASS | PASS | PASS | PASS | PASS | N/A |
| Wrong action handling | PASS | PASS | PASS | PASS | PASS | PASS |
| Free pathfinding | N/A⁴ | N/A⁴ | N/A⁴ | N/A⁴ | N/A | N/A |
| No table/counter traversal | PASS BY DESIGN⁴ | PASS BY DESIGN⁴ | PASS BY DESIGN⁴ | PASS BY DESIGN⁴ | N/A | N/A |
| Customer departure/replacement | PASS | PASS | PASS | PASS | PASS | PASS |
| Success and failure | PASS | PASS | PASS | PASS | PASS | PASS |
| Scoring/rewards | PASS | PASS | PASS | PASS | PASS | PASS |
| Retry and exit | PASS | PASS | PASS | PASS | PASS | PASS |
| Save/reload | PASS | PASS | PASS | PASS | PASS | PASS |
| Rapid/repeated input guards | PASS | PASS | PASS | PASS | PASS | PASS |
| Responsive phone/tablet layout | PASS⁵ | PASS⁵ | PASS⁵ | PASS⁵ | PASS⁵ | PASS⁵ |
| Live browser interaction | PARTIAL² | PARTIAL² | PASS entry/exit | PASS entry/exit | PASS | PARTIAL⁶ |
| Programmatic full campaign validation | PASS 150/150 | PASS 150/150 | PASS 150/150 | PASS 150/150 | PASS 750/750 | PASS catalogue/business rules |
| Overall | **PASS AFTER REPAIR¹** | **PASS** | **PASS** | **PASS** | **PASS** | **PARTIAL⁶** |

1. `S4-F01` was fixed after the audit. Bakery's launch label now follows the selected level; live Levels 150 and 50, including exit/re-entry, passed.
2. Browser-control latency makes real-time restaurant success unreliable; successful complete loops were exercised through the actual service/state modules on 15 representative levels per restaurant. Live runtime covered wrong actions, appliance states, failure, replay, and exit.
3. Two raw ingredient definitions are unused in both Phaser and the protected HTML. Soup-base steps are used instead; this is an observation, not a Phaser regression.
4. These games do not expose free player walking. The worker moves between fixed authored prep/station anchors, so pathfinding and walking across furniture are not applicable behaviors.
5. Browser emulation, not physical devices. Responsive contracts and touch-sized controls also pass automated tests.
6. The complete Harbour business model passes automated service tests and the live layout was operated. A reliable semantic hook for coordinate-based canvas purchase taps was unavailable, so physical touch purchase testing remains outstanding.

## Exact runtime level samples

| Game | Live browser entry/start samples | Complete-loop simulation samples |
| --- | --- | --- |
| Little Bakery | 1, 10, 11, 50, 100, 150 | 1, 2, 10, 11, 20, 21, 40, 41, 50, 75, 100, 101, 125, 149, 150 |
| Corner Café | 1, 10, 11, 50, 100, 150 | 1, 2, 10, 11, 20, 21, 40, 41, 50, 75, 100, 101, 125, 149, 150 |
| Morning Mug | 1, 10, 11, 50, 100, 150 | 1, 2, 10, 11, 20, 21, 40, 41, 50, 75, 100, 101, 125, 149, 150 |
| Riverside Kitchen | 1, 10, 11, 50, 100, 150 | 1, 2, 10, 11, 20, 21, 40, 41, 50, 75, 100, 101, 125, 149, 150 |
| South Shore Scoops | 1, 8, 50, 151, 300, 500, 750 | 1, 2, 7, 8, 10, 16, 20, 30, 38, 45, 50, 75, 100, 150, 151, 200, 300, 425, 500, 550, 650, 749, 750 |
