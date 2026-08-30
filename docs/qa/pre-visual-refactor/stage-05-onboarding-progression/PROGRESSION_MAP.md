# Stage 5 Progression Map

## Main player journey

```text
Fresh save
  -> one-time 100-coin starter ledger entry
  -> name town
  -> create one resident
       Appearance -> Hobbies -> Your house
  -> save resident + Level 1 personal home
  -> first-session guide
       Explore town
       -> meet a neighbour
       -> complete Lawn Care
       -> complete Waste Collection
       -> complete River Clear-Out
       -> mark free play complete
  -> independent town exploration and campaign progression
```

The intended first-time chain is linear. S5-F01 and S5-F02 break enforcement/recovery between town naming and resident/home completion; the remaining map is internally consistent.

## Campaign progression owners

| Campaign | Persistent owner | Total | First available | Advance rule | Maximum/final behavior |
| --- | --- | ---: | ---: | --- | --- |
| Lawn Care | `lawnCare.progress` | 750 | 1 | successful first clear unlocks next | level 750 remains final; replay cannot grant first-clear reward twice |
| Waste Collection | `progress.cleanup.progress.waste` | 750 | 1 | successful first clear unlocks next | level 750 certified and terminal |
| River Clear-Out | `river.nextLevel/completed/best` | 750 | 1 | successful first clear unlocks next | level 750 terminal; replay guarded |
| House Rescue | `houseRescue.unlockedLevel/completed/best` | 750 | 1 | successful first clear unlocks next | level 750 terminal; home occurrence is separate from campaign unlock |
| Beach Cleanup | `beachCleanup.progress` | 750 | 1 | successful first clear unlocks next | level 750 terminal; replay guarded |
| Playground Power Wash | `playgroundPowerwash.progress` | 750 | 1 | successful first clear unlocks next | level 750 terminal; reward cap retained |
| Little Bakery | `bakery.unlockedLevel/completed/best` | 150 | 1 | no-miss successful first clear unlocks next | level 150 terminal |
| Corner Café | `cafe.unlockedLevel/completed/best` | 150 | 1 | no-miss successful first clear unlocks next | level 150 terminal |
| Morning Mug | `morningMug.unlockedLevel/completed/best` | 150 | 1 | no-miss successful first clear unlocks next | level 150 terminal |
| Riverside Kitchen | `riversideKitchen.unlockedLevel/completed/best` | 150 | 1 | no-miss successful first clear unlocks next | level 150 terminal |
| South Shore Scoops | `southShoreScoops.unlockedLevel/completed/best` | 750 | 1 | at least 60% served on first clear unlocks next | level 750 terminal; rewards capped |

Fishing and Magnet Fishing use daily cast limits and persistent catches/recovery progress rather than numbered campaigns.

## Restoration progression

Restoration is strictly ordered. Evaluation unlocks at most one milestone for an accepted event.

| Order | Milestone | Dependency and gate |
| ---: | --- | --- |
| 1 | Wake | 5 accepted cleanups across at least 2 cleanup types |
| 2 | Commons | Wake plus 3 Commons cleanups, or 8 total with park litter at most 4 |
| 3 | High Street | Commons plus 1 High Street cleanup and 12 total |
| 4 | River | High Street plus 3 River clears and at most 14 river items |
| 5 | Station | River plus 1 Station cleanup, or 18 total |
| 6 | Shore | Station plus 2 Shore cleanups and 22 total, or 26 total with shore litter at most 8 |
| 7 | Green | Shore plus at least 4 placed trees, 1 bin, and 1 seating item |
| 8 | Festival | Green, all earlier milestones, 28 accepted cleanups, and 6 placed objects |

Additional effects:

- Wake grants one Town Planter when inventory capacity permits; deferred delivery remains retryable and cannot duplicate.
- Cinema access depends permanently on Station.
- Festival celebration lasts one game day while the unlock remains permanent.
- Restoration changes world/NPC behavior without rewriting campaign progress.

## Shop, equipment, home, farming, and pet progression

### Perfect-job unlocks

- Mowers: Lawn perfect counts 3, 8, 15, 30, and 50.
- Trees/decor: Willow River 1; Flowering Cherry Lawn 5; Apple Tree Waste 2; Flowering Tree Lawn 10; Grand Oak Lawn 20.
- Seating/bins: Iron Bench Waste 3; Riverside Bench River 2; Picnic Table Waste 4; Recycling Bin Waste 5; Commercial Bin Waste 10.
- Landmarks: Small Fountain River 5; Town Clock Waste 15; Premium Picnic Area Waste 10; Grand Fountain River 12; Gazebo Lawn 40; Town Centre Monument Waste 30.

All conditions are satisfiable within the corresponding 750-level campaign. No shop item depends on buying itself or on an unreachable campaign.

### Personal home

| Level | Name | Cost | Companion capacity |
| ---: | --- | ---: | ---: |
| 1 | Small Starter Cottage | included | 1 |
| 2 | Family Cottage | 15,000 | 2 |
| 3 | Spacious Home | 40,000 | 3 |
| 4 | Grand Home | 90,000 | 5 |

Upgrades are sequential. Redesign prices scale by current home level and do not skip upgrade requirements.

### Farming

- Six allotment beds; the first begins unlocked.
- Bed unlock costs: 0, 1,000, 2,500, 4,500, 7,000, 10,000.
- The starter orchard tree exists immediately.
- Purchased saplings cost 2,800 and remain inventory-visible until valid placement.
- Growth is time/weather driven and independent of numbered campaigns.

### Paws & Wonders

- Ten ordinary permanent companions use price/ownership rules only.
- Sprout, the baby triceratops, additionally requires exactly three restoration milestones.
- Wild-animal befriending and the maximum-five owned-pet rule are a separate system and remain Stage 6 scope.

## Dependency-cycle result

No circular dependency was found among setup, campaigns, restoration, shops, equipment, home upgrades, farming beds, cinema, or Paws & Wonders. The only progression break is the premature setup dismissal/recovery path documented as S5-F01 and S5-F02.
