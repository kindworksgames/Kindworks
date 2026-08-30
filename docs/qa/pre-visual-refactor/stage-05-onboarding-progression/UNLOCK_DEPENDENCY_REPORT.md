# Stage 5 Unlock Dependency and Flag Audit

## Dependency result

All durable campaign and restoration dependencies are acyclic and reachable from a valid completed setup. No level band, shop item, restoration milestone, house upgrade, farming bed, cinema gate, or Paws & Wonders item was found permanently unreachable.

The setup dependency itself is not safely enforced: the player can leave the required resident/home phase and enter the town. That is S5-F01, not a dependency cycle.

## Progression-flag inventory

| Domain | Canonical fields | Written by | Read by | Result |
| --- | --- | --- | --- | --- |
| Identity/setup | `identity.townName`, `onboarding.townNamed`, `onboarding.complete`, `customResident.profile`, `customResident.home.houseId` | Onboarding and resident services | boot/controllers, town identity, validation | **Defect in UI enforcement/recovery, not field validity** |
| First-session journey | `journey.moved`, `journey.metResident`, `journey.completed.{lawn,waste,river}`, `journey.freePlay` | Town interaction and completion services | onboarding guide | PASS; completed jobs can be derived from real campaign state |
| Tutorial markers | `tutorialSeen.*`, `tried.*` for Lawn, River, Waste, Beach, Playground | minigame entry/completion | onboarding/minigame presentation | PASS |
| Campaign progression | per-game `nextLevel`, `completed`, `best`/perfect results | each minigame service | level selectors, locks, rewards, shops | PASS |
| Restoration | ordered `unlocked`, `revealed`, `unlockDay`, counters, processed event IDs | restoration service | world, NPC, cinema, Paws, UI | PASS |
| Shop equipment | derived perfect-count requirements plus inventory/equipped IDs | minigame and shop services | shop quote/equip/minigame loadout | PASS |
| Personal home | `customResident.home.level` and design | resident/home service | renderer, capacity, upgrade quote | PASS |
| Farming | bed `unlocked`, denormalized `unlockedBeds`, crop/tree state | farming service | planting, UI, validation | PASS |
| Animals/pets | adopted identities and active follower | animal/Paws services | world/home/UI | PASS at dependency level; full behavior belongs to Stage 6 |
| NPC narrative | `storyStage`, stage history/evidence, relationships, restoration evidence | narrative service | narrative gates/thoughts | PASS at dependency level; full behavior belongs to Stage 6 |
| Harbour General | `owned`, stock/display/till state | business service | business scene and NPC shopping | PASS; deed price is 5,000 |

### Exact campaign field ownership

| State owner | Unlock/select fields | Completion/result fields | Interrupted-session field |
| --- | --- | --- | --- |
| `lawnCare.progress` | `nextLevel` | `completed`, `best` | `lawnCare.activeSession` |
| `progress.cleanup.progress.waste` | `nextLevel` | `completed`, `best` | cleanup campaign active-session owner |
| `river` | `nextLevel` | `completed`, `best`, `totalStars`, `restorationPoints`, `lastLevel`, `lastOutcome` | transient River session owner |
| `houseRescue` | `selectedLevel`, `unlockedLevel` | `completed`, `best`, `totalStars`, attempts/lifetime counters | `active` plus per-home occurrence state |
| `beachCleanup.progress` | `nextLevel` | `completed`, `best` | `beachCleanup.activeSession` |
| `playgroundPowerwash.progress` | `nextLevel` | `completed`, `best` | `playgroundPowerwash.activeSession` |
| `bakery` | `unlockedLevel` | `completed`, `best`, `totalStars`, shifts/lifetime counters, `lastLevel`, `lastOutcome` | active shift owner |
| `cafe` | `unlockedLevel` | `completed`, `best`, `totalStars`, shifts/lifetime counters, `lastLevel`, `lastOutcome` | active shift owner |
| `morningMug` | `unlockedLevel` | `completed`, `best`, `totalStars`, shifts/lifetime counters, `lastLevel`, `lastOutcome` | `activeShift` |
| `riversideKitchen` | `unlockedLevel` | `completed`, `best`, `totalStars`, shifts/lifetime counters, `lastLevel`, `lastOutcome` | `activeShift` |
| `southShoreScoops` | `unlockedLevel`, `selectedLevel` | `completed`, `best`, `totalStars`, shifts/lifetime counters, `restorationTier`, `lastLevel`, `lastOutcome` | `activeShift` |

Normalization and validation read these fields, the corresponding service writes them, and the scene/selector reads the same canonical owner. No conflicting campaign source of truth was found.

## Written/read consistency

No canonical unlock field was found that is read but can never be written, and no canonical campaign completion field was found that is written but ignored.

Two compatibility mirrors are deliberately not authoritative gates:

- `onboarding.starterGrantClaimed` is retained in normalization, diagnostics, and legacy reconciliation while the starter ledger/fresh-state creation is the actual duplicate barrier.
- `onboarding.firstRestorationGiftGranted` mirrors `restorationMilestones.firstRestorationGift.granted`; the restoration domain is authoritative.

NPC `storyFlags["stage.*"]` record historical chapter reachability, while `storyStage`, `stageHistory`, relationships, job counts, and restoration evidence drive advancement. This is redundant evidence, not a stuck flag.

These mirrors are observations for Stage 8/10 cleanup analysis. They must not be removed during Stage 5 repair because old-save compatibility has not yet completed its dedicated audit.

## Premature access

After naming the town on a fresh save, the visible close control permits the setup modal to close even though no resident or home exists. The ordinary town menu is then usable and exposes Shop, Inventory, Create resident, Animals, Impact, Stories, and save controls. This is a confirmed premature-access path.

The later first-session guide is instructional rather than a broad feature lock, matching the protected HTML's first-job checklist. Stage 5 therefore does not classify ordinary post-setup town browsing as a defect.

## Repeated one-time reward protections

The automated suite confirmed duplicate protection for:

- the one 100-coin starter grant;
- same-day daily login rewards;
- return bonuses and trusted-time receipt replay;
- campaign first-clear rewards;
- accepted restoration event IDs;
- the Wake Town Planter gift;
- completed shop and home transactions.

No repeatable one-time reward was found in this stage.
