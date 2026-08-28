# Phase 3 House and Lawn Fidelity Recovery

Status: **VERIFIED FUNCTIONAL AND CODE-DRIVEN VISUAL FIDELITY**  
Working branch: `phase-3-legacy-fidelity-recovery`  
Starting commit: `a87e16b`  
Protected source: `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`

## Protected contract recovered

The legacy HTML defines 19 physical cottages, one personal home, five distinct exterior architecture kits, architecture-dependent interior scale, a lawn attached to every physical cottage, progressive exterior weathering before a House Rescue job, and progressive grass/weed growth before a Lawn Care job.

This recovery does not change save schema, level counts, progression, rewards, inventories, ownership, residents, House Rescue completion, Lawn Care completion, homeowner gifts, or offline-time rules.

## Audit findings and recovery

| Area | Legacy behavior | Phaser gap found | Recovery |
| --- | --- | --- | --- |
| Cottage identity | Exact house numbers remain attached to exact world plots. | The Phaser array had been reordered, attaching eight saved identities to the wrong plots. | Replaced generated ordering with the exact 19-house source mapping. Existing `house-N` save keys remain unchanged. |
| Architecture | `starter-cottage`, `bay-cottage`, `cross-gable`, `two-storey`, and `grand-veranda` have distinct silhouettes and sizes. | Phaser had five simplified names, wrong assignments, and only two footprint sizes. | Restored all five source kit names, assignments, roof/body/window/chimney/features, and five distinct interior footprints. |
| Interior scale | Exterior architecture determines the size/complexity of the house interior. | NPC interiors were selected with `houseNumber % 3`, unrelated to their exterior. | NPC interior width, height, and safe complexity now derive from the recovered exterior architecture kit. |
| House aging | Clean homes become weathered, dirtier, then visibly job-ready as world time passes. | Only a floating broom marker was shown. | Added deterministic clean/weathered/dirty/job-ready stages using existing durable House Rescue fields. Town houses now show progressive dust, grime, dirty windows, debris, and cobwebs. |
| First visit | Visiting an eligible NPC home for the first time can activate its House Rescue opportunity while respecting the five-job cap. | The Phaser service had no first-visit activation. | Added bounded first-visit activation, including deterministic displacement/queueing when five other homes are already active. Meadowlight House is always protected. |
| Live House Rescue schedule | Due homes refresh while the player remains in town and after an offline return. | Jobs were refreshed only once when Town was created. | Refresh now runs during Town world updates and immediately after offline resolution. Visual state and interactions redraw with the durable service state. |
| Lawn identity | Every physical cottage owns the exact source lawn/yard. | Lawn coordinates existed, but reordered cottage identities caused eight lawn-to-house mismatches. | Each active lawn resolves its exact unpadded `house-N` identity and authored yard bounds. |
| Lawn visuals | Grass fills the property, becomes longer/denser, gains weeds, and visibly signals when care is due. | Phaser showed a small generic patch and did not redraw live after world advancement. | Added full-yard, four-stage deterministic grass/weed/flower rendering and live refresh after weather-aware world advancement. |
| Reserved slot 19 | The source reserves data slot 19 but has no physical house 19. | Phaser exposed the phantom lawn in the player menu and could accept it as a job. | Slot 19 remains in state for old-save compatibility but is excluded from Town, menus, diagnostics, and both Lawn Care completion entry points. |
| Sprite AI inventory | Every recoverable visual needs a stable production-art label. | New house and lawn states needed explicit labels. | Each architecture, window state, dirt overlay, lawn zone, grass stage, weed patch, and interaction retains a stable semantic Sprite AI label. |

## Exact exterior assignment

| House | Architecture | House | Architecture |
| ---: | --- | ---: | --- |
| 1 | starter-cottage | 11 | bay-cottage |
| 2 | bay-cottage | 12 | cross-gable |
| 3 | cross-gable | 13 | starter-cottage |
| 4 | two-storey | 14 | two-storey |
| 5 | grand-veranda | 15 | grand-veranda |
| 6 | bay-cottage | 16 | bay-cottage |
| 7 | cross-gable | 17 | cross-gable |
| 8 | starter-cottage | 18 | two-storey |
| 9 | two-storey | 20 | starter-cottage / personal-home progression |
| 10 | grand-veranda |  |  |

## Save and gameplay protection

- No save field was renamed, removed, or repurposed.
- House IDs remain `house-1` through `house-18` plus `house-20`; the protected unused slot 19 remains importable.
- Lawn IDs remain `lawn-house-1` through `lawn-house-20` for compatibility.
- Dirt stages are derived from existing `dirty`, `completionCount`, `lastCompletedDay`, `nextDirtyDay`, and current world-day fields.
- The personal home cannot be dirtied by first-visit or respawn logic.
- The existing three-to-six-day House Rescue respawn window and maximum of five simultaneous dirty homes are unchanged.
- The existing Lawn Care thresholds, 750-level campaign, 100-coin town reward, first-clear rules, mower rules, weather growth, offline growth, and homeowner gift integration are unchanged.

## Verification

| Check | Result |
| --- | --- |
| Exact cottage positions and architecture assignments | PASS |
| Active lawns resolve a real house and lie inside its yard | PASS |
| Five distinct exterior silhouettes and interior footprints | PASS |
| Dirt-stage derivation and personal-home protection | PASS |
| First-visit activation and five-job bound | PASS |
| House Rescue 750-level contract | PASS |
| Lawn Care 750-level contract | PASS |
| Phantom slot 19 hidden and unplayable | PASS |
| Focused house/lawn/interior/farming regression | 47/47 PASS |
| Complete automated suite | 557/557 PASS |
| Production build and performance budget | PASS |
| Browser console | No warnings or errors |

### Operated viewports

| Viewport | Scenario | Result |
| --- | --- | --- |
| 568×320 | House 5, lawn proximity and lawn menu | PASS; controls remain usable and all 19 physical lawn cards resolve |
| 844×390 | House 15 and neighbouring architecture variants | PASS; distinct silhouettes, yards, residents and touch HUD remain visible |
| 1024×768 | House 1 lawn and north-cottage row | PASS; full playable town remains dominant |
| 390×844 | Landscape-required Town in portrait | PASS; gameplay is paused behind the one-sentence rotate-device screen |

## Verdict

**PASS — HOUSE AND LAWN FUNCTIONAL FIDELITY RECOVERED.** The protected identities, architecture-to-interior relationship, time-driven House Rescue state, first-visit rule, lawn ownership, lawn growth state, jobs, saves, rewards, and mobile behavior are now represented in Phaser. The code-driven town presentation carries stable Sprite AI labels for later approved raster replacement; that later art pass must preserve the verified geometry and rules.
