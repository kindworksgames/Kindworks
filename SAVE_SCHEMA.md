# Kindworks Phaser save contract

> Current migration status: Milestone 40 uses game-state and envelope schema
> 35. Schemas 1 through 34 upgrade in order. Schema 35 adds first-run setup,
> tutorial progress, and duplicate-safe login rewards.
> Historical foundation notes remain for traceability.

Milestone 3 introduced the protected save foundation alongside the preserved HTML game. Milestone 4 added the shared item catalogue, inventory, KindlyCoin ledger, and atomic economy transactions. Milestone 6 added the first persistent cleanup session, exact-target result, and job reward. Subsequent milestones migrated the remaining shared systems and mini-games; Milestone 37 completes Harbour General ownership, stock management, in-person sales and NPC wardrobe demand. Milestone 38 adds validated, read-only Impact content without changing schema 33. Milestone 39 adds the authored resident and household story layer through schema 34. Milestone 40 adds the first-run and returning-player flow through schema 35.

## Storage namespaces

The legacy HTML remains the owner of these keys and Phaser must never write to them:

- `kindworks_living_town_v38`
- `kindworks_living_town_v38_backup`
- `kindworks_living_town_v38_recovery`
- `kindworks_living_town_v12` through `kindworks_living_town_v37`

The Phaser build owns only:

- `kindworks_phaser_v1`
- `kindworks_phaser_v1_backup`
- `kindworks_phaser_v1_recovery`

## Current Phaser envelope schema 35

Every current and backup save is a JSON envelope:

```json
{
  "format": "kindworks-phaser",
  "schemaVersion": 35,
  "writtenAt": "2026-08-25T00:00:00.000Z",
  "appVersion": "0.1.0",
  "data": {},
  "checksum": "kwp1-..."
}
```

The checksum covers every envelope field except the checksum itself. A save is accepted only when its format, schema, timestamp, checksum, and inner game state all validate. Valid schemas 1 through 34 upgrade to schema 35, and the original verified envelope becomes the Phaser backup before replacement.

## Onboarding and login-reward schema-35 contract

- `onboarding` records the named-town gate, completed resident/home setup, five tutorial seen/tried flags, the three-job checklist, starter-grant ownership, login reward history, and the existing first-restoration-gift status.
- Town names use the original strict rule: non-empty, at least one Unicode letter or number, only letters, numbers, spaces, straight/curly apostrophes or hyphens, collapsed whitespace, and at most 24 characters.
- A fresh state owns exactly one 100-coin `starter-grant`. It is never replayed by schema upgrades or returning-player processing.
- A new calendar day pays exactly 10 coins. A return after at least three calendar days pays the 10-coin daily reward plus one 50-coin return bonus.
- Same-day launches, duplicate trusted receipts, and clocks moving backwards pay zero and cannot move the durable login day backwards.
- Production builds require an externally verified trusted-time receipt. The receipt id and monotonically increasing trusted timestamp are stored with the same atomic transaction as the reward.
- Balance, lifetime earnings, ledger records, claim counters, dates, and trusted receipt state are validated and persisted together. A failed write restores the exact previous checkpoint.
- Schemas 1 through 34 gain a safe initialized onboarding domain without replaying starter coins or immediately paying a daily reward. Legacy version-82 setup, tutorial, reward, and gift records project without changing the retained source snapshot.

## NPC narrative schema-34 contract

- Every one of the 35 stable resident records owns a schema-3 `narrativeState`.
- `storyStage` is bounded from 0 through 3 and corresponds to Introduction, Opening, Growth, and Resolution.
- `selectionCount` and the latest 12 unique `selectedDays` retain deliberate conversation evidence without unbounded growth.
- `stageHistory` contains exactly one ordered record for every unlocked post-introduction chapter, with its game day, trigger, and explanation.
- `recentThoughtIds` retains the latest six choices; `seenBeatIds` retains at most 64 story beats.
- The latest thought stores its stable id, bounded text, category, source, and the context that produced it.
- Chapter gates depend on multi-day conversations, completed resident activities, shared town jobs, relationship scores, and persisted restoration milestones.
- Legacy version-82 `npcNarratives` data projects by stable NPC id. Missing narrative data receives a fresh safe state, and the legacy snapshot is never rewritten.
- A failed narrative save restores the full pre-conversation game-state checkpoint and the NPC simulation's in-memory record.

## Historical game-state schema 3 foundation

| Field | Type | Default | Rule |
| --- | --- | --- | --- |
| `schemaVersion` | integer | `3` | Schemas 1 and 2 are upgraded automatically; all new writes use 3. |
| `createdAt` | ISO timestamp | creation time | Required. |
| `updatedAt` | ISO timestamp | creation time | Required. |
| `source.kind` | string | `new` | `new` or `legacy-import`. |
| `source.legacyVersion` | integer/null | `null` | Required for a legacy import. |
| `source.legacySourceKey` | string/null | `null` | Required for a legacy import. |
| `source.importedAt` | ISO timestamp/null | `null` | Set only when a copy is created. |
| `source.warnings` | string array | `[]` | Import warnings retained for diagnostics. |
| `identity.townName` | string | `Willowmere` | Sanitized to the legacy 24-character rule. |
| `world.day` | positive integer | `1` | Never below one. |
| `world.clockMinutes` | integer | `480` | From 0 through 1439. |
| `player.scene` | string | `TownScene` | Current Phaser scene. |
| `player.x`, `player.y` | finite numbers | authored town spawn | Shared scene position. |
| `player.facing` | string | `down` | `up`, `down`, `left`, or `right`. |
| `progress.completedJobCount` | non-negative integer | `0` | Shared count incremented once for each committed cleanup occurrence. |
| `progress.cleanup` | object | first target available | Active `JobSession`, processed session IDs, bounded history, exact target state, and Waste Collection level progress. |
| `economy` | object | 100 starter coins | Validated balance, lifetime totals, next transaction ID, and bounded ledger. |
| `inventory` | object | two starter tools | Four owned-item buckets, equipped tools, and unresolved legacy records. |
| `legacySnapshot` | object/null | `null` | Complete read-only copy used by later domain migrations. |

## Economy and inventory contract

- The current balance is always `lifetimeCoinsEarned - lifetimeCoinsSpent`.
- Every credit, debit, purchase, equipment change, and consumable use records an ID, signed amount, post-transaction balance, kind, reason, related item/quantity when present, shop metadata when applicable, and timestamp.
- The ledger retains the latest 500 entries.
- The extracted catalogue contains all 82 current IDs, including the complete original ordinary shop stock, farming produce, the orchard sapling, migration-only records, and aquarium collectibles.
- Inventory uses `equipment`, `placeables`, `consumables`, and `furniture` buckets. Aquarium collectibles remain outside normal inventory, matching the legacy game.
- Equipment and unique furniture are capped at one. Seeds, harvested produce, and edible fishing catches are capped at 99; other stackable consumables and placeables retain the original 9,999 limit.
- `starter-mower` and `starter-vacuum` always remain owned and correctly equipped.
- Unknown or wrongly bucketed legacy records are retained in `unresolvedLegacy` instead of being silently discarded.
- A successful mutation validates the complete candidate state and persists it immediately.
- If validation or persistence fails, the in-memory balance and inventory return to the exact pre-transaction checkpoint.
- Legacy HTML storage keys remain read-only throughout economy import and Phaser transactions.

## Complete economy and shops schema-21 contract

- The ordinary-coin catalogue exposes all original groups: Mowers, Vacuums,
  Trees, Seating, Bins, Decorations, Furniture, and Animal Treats, plus the
  migrated Farming seed group. QA, subscription-only, fishing-only, harvested,
  and zero-price stock cannot be purchased through the coin shop.
- Willowmere Shop owns 51 released tools, placeables, and furniture items;
  Village Grocer owns its exact three allotment seeds, one orchard sapling, and
  five everyday-treat products;
  Fresh Market owns its exact seven fish, meat, and pellet products. Released
  ordinary stock has exactly one retailer.
- Locked placeables and mowers read perfect-result counts directly from Lawn
  Care, River Clear-Out, or Waste Collection. A locked purchase cannot reach
  the economy mutation path.
- Owned mower and vacuum upgrades receive one credit only: 50 percent of the
  highest-priced previously owned lower paid tier. The starter tier has no
  resale value, later or unrelated equipment grants no credit, and the quoted
  list price, credit, and final cost are saved in the purchase ledger entry.
- Buying and equipping are separate atomic operations. An equipment item must
  be owned before it can be equipped; the prior item remains owned, and the
  equipped mower or vacuum is persisted immediately.
- Lawn Care reads the selected mower profile. House Rescue reads the selected
  vacuum's exact power, reach, movement multiplier, colour, and icon.
- Consumable removal is atomic and records a zero-coin use transaction. The
  existing Farming and Animal Friends services remain the authority for when a
  seed, crop, fish, or treat may actually be used.
- Schema-20 inventory is re-projected into current limits without dropping
  known ownership or valid equipped tools. Unknown records remain visible in
  `unresolvedLegacy`; existing transaction history and its retailer/credit
  metadata remain unchanged.

## Town placement schema-22 contract

- `townPlacement` owns one domain schema, the next stable object serial, up to
  500 placed objects, and a legacy-import report. Each object persists its
  stable ID, catalogue item/type, exact finite `x`, `y`, normalized rotation,
  placement timestamps, public-bin state when applicable, and derived
  behaviour hooks.
- All 35 original placeable definitions are recognized. The 32 released items
  are available through ordinary progression; the subscription-only keepsake
  and two hidden QA fixtures are not added to the normal shop.
- Validation keeps every footprint inside the authored world and clear of the
  river, ponds, harbour water, roads, cottages, businesses, entrances, active
  lawns, permanent fixtures, collision zones, and other placed objects. Public
  bins and resident destinations must remain reachable from the authored
  public navigation graph.
- A new placement removes exactly one owned item only after the candidate town
  and complete game state validate. Moving changes no inventory. Storing
  removes the object and returns exactly one item, subject to its inventory
  limit. Every action writes a zero-coin placement ledger record.
- Place, move, and store replace one full in-memory candidate, save it through
  the safe repository, and restore the exact previous town, inventory, and
  ledger if persistence fails.
- Legacy `economy.placedObjects` are copied into this domain without changing
  the protected source snapshot. Valid known objects retain exact coordinates
  and normalized rotation. Duplicate, unsafe, over-limit, or otherwise invalid
  known objects return to Phaser inventory; unknown IDs are counted explicitly.
- Behaviour hooks expose resident destinations, usable public bins, wildlife
  obstacle radii, rubbish-spawn exclusion radii, player collision, interaction
  kind/capacity, and automatic night glow. Hooks are derived from catalogue
  metadata and validated on every save rather than trusted as arbitrary input.

## Farming and orchard schema-23 contract

- Farming schema 2 owns six allotment beds, three original crop definitions,
  lawn state, one purchased-sapling counter, one stable tree serial, and up to
  24 separately positioned apple-tree records.
- Every apple tree persists a stable ID, exact finite world coordinates,
  growing or mature status, maturity progress, fruit-production progress, one
  available-fruit slot, harvest totals, and planting time. Trees block the
  player and cannot overlap protected town geometry, placed objects, or one
  another.
- A sapling costs exactly 2,800 KindlyCoins at Village Grocer. Purchase and
  placement are separate atomic actions: purchase creates an owned sapling;
  placement consumes one only after the proposed tree and complete save pass
  validation. A failed save restores the wallet, sapling, tree collection, and
  active placement exactly.
- Saplings mature after 4,320 game minutes. Each mature tree produces at most
  one apple every 720 effective game minutes. Current weather modifies both
  progress rates, and elapsed/offline time resolves through the same world-time
  path before interaction.
- Schema-22 upgrades normalize the existing Phaser starter orchard. For a
  legacy import, schema 23 also projects every known original orchard slot,
  exact saved position, crop bed, and purchased sapling without changing the
  protected legacy snapshot. Modern crop and lawn progress remain authoritative
  when an older Phaser save and legacy snapshot coexist.

## Cleanup transaction contract

- Starting a job saves the exact target/item snapshot, assigned level, and return position before changing scenes.
- A valid full result marks that exact target complete, advances its progress, awards the shared wallet, and records job/session metadata in one atomic save.
- Processed session IDs prevent duplicate rewards.
- Cancelling restores the town position without cleaning the target or changing coins.
- Any save failure restores the exact pre-transaction in-memory checkpoint.

## House Rescue schema-13 contract

- `houseRescue` tracks selected/unlocked levels, per-level best score/stars/
  mistakes/completion count, campaign totals, lifetime work, all 19 rendered
  cottages, and one resumable active session.
- Each home has a stable job serial, dirty flag, completion history, next due
  game day, best result, and last reward. `house-20`, the rendered personal
  home, can never become dirty.
- Active data contains the deterministic item and stain snapshots, sorted
  flags, stain layers remaining, vacuum position, score, mistakes, house/job
  identity, and exact town return position.
- Starting, sorting, vacuum progress, finishing, rewards, home cleanup, level
  unlocks, and day-based respawns all validate and save through the shared
  repository. A persistence failure restores the whole pre-action checkpoint.
- Completion records one `house-rescue-job-reward` ledger entry and increments
  the shared completed-job count in the same atomic save.

## Personal home schema-28 contract

- `home20` and `house-20` are the stable original node and cottage identities.
  The town still contains 19 physical cottages; the unauthored `house-19` alias
  is skipped and schema-27 House Rescue records migrate safely to `house-20`.
- Home levels are exact and sequential: Small Starter Cottage at Level 1
  (included, scale 0.68, one-companion capacity), Family Cottage at Level 2
  (15,000 coins, scale 0.86, capacity two), Spacious Home at Level 3 (40,000
  coins, scale 1.04, capacity three), and Grand Home at Level 4 (90,000 coins,
  scale 1.22, capacity five).
- The first wall, roof colour and roof style are included when the resident is
  created. Later profile edits cannot change the paid home state. Exterior
  redesigns use base prices of 600, 900 and 2,200 coins, multiplied by the
  current level's 1.00, 1.35, 1.75 or 2.25 rate and rounded to the nearest 50.
- An upgrade may apply the selected exterior design as part of its fixed level
  price, matching the original game. Redesign-only purchases charge every
  changed exterior field and record the exact before/after design.
- Every redesign and upgrade debits the shared wallet once, reconciles lifetime
  spending, appends a bounded transaction with home metadata, validates the
  complete candidate state and persists immediately. Failed validation or
  persistence restores the exact home, wallet and ledger checkpoint.
- Schema 28 normalizes existing Phaser home state, converts the original HTML
  creator/home records without losing the saved level or design, and leaves the
  complete protected legacy snapshot unchanged.

## Waste Collection schema-14 contract

- `progress.cleanup.schemaVersion` is 2. Its existing target, bounded history,
  processed-session set, and Level 1 best result remain compatible with the
  Milestone 6 state.
- A campaign `activeSession` records the exact authored level, removed card
  IDs, sorted tray type IDs, moves, matches, lifecycle, and exact town return
  position. Structural validation rejects unknown cards, duplicate removals,
  invalid tray types, over-capacity trays, or inconsistent move totals.
- Campaign moves, retries, cancellation, completion, best results, next-level
  selection, first-clear coins, and ledger metadata validate and save through
  the shared repository. Any failed write restores the full pre-action state.
- Each successfully cleared level has one best `{ stars, percent }` record.
  `completed` must equal the number of best results at or above 50 percent.
- A first clear writes at most one `campaign-first-clear` transaction. Replay
  clears pay zero and campaign play never increments the town occurrence count.

## Lawn Care schema-15 contract

- `lawnCare.progress` stores `nextLevel`, the derived completion count, and one
  best `{ stars, percent }` result per cleared level. Completion always equals
  the number of best results at or above 50 percent.
- One resumable `activeSession` stores campaign or town-job mode, assigned
  authored level, mower row/column/facing, exact cut-cell IDs, move count, the
  latest five undo frames, town return position, and the starting town-lawn
  measurements when applicable.
- Every move, undo, retry, cancellation, completion, first-clear reward, and
  town-lawn effect validates and saves through the shared repository. A failed
  write restores the exact board, wallet, lawn values, and progress checkpoint.
- Campaign first clears use the original rounded completion percentage plus
  five coins per 50-level band, with the level bonus capped at 70 and total
  capped at 170. Replays pay zero.
- Town occurrences can recur only after regrowth. The result percentage moves
  grass toward height 5 and weeds toward pressure 3 proportionally, increments
  the shared town-job count, and pays that new occurrence atomically.

## Beach Cleanup schema-16 contract

- `beachCleanup.progress` stores the next selected level, derived completion
  count, and best `{ stars, percent }` result for all 750 deterministic levels.
- One resumable `activeSession` stores campaign or South Shore town-job mode,
  the exact level, player cell, raked and collected cell IDs, recovered item
  records, native coins, challenge flags, move count, undo frames, and town
  return point.
- Campaign first clears award the shared 100-percent reward plus five coins per
  50-level band, capped at 170. Replays pay zero.
- A South Shore occurrence awards the embedded game's native rubbish finds and
  optional bonuses, capped at 170, then removes the town litter and schedules
  the next dirty day. Each later occurrence has a new atomic reward.
- Every step, undo, restart, cancellation, completion, reward, town effect, and
  litter return validates through the shared repository. Failed persistence
  restores the exact beach, wallet, campaign, and town checkpoint.

## Playground Power Wash schema-17 contract

- `playgroundPowerwash.progress` stores the next selected level, derived
  completion count, and best `{ stars, percent }` result for all 750
  deterministic levels.
- One resumable `activeSession` stores campaign or Commons Playground town-job
  mode, the exact level, normal-grime strengths, resistant and soaped cell IDs,
  water and soap supply, active tool/nozzle, stroke count, and town return point.
- A raw result of at least 97 percent is committed as a 100-percent clear.
  Campaign first clears award the shared level-band reward capped at 170;
  campaign replays pay zero.
- A Commons Playground occurrence awards the original projected native reward
  capped at 170, removes town grime, increments the shared occurrence count,
  and schedules the next dirty day two or three game days later.
- Every tool change, spray, restart, cancellation, completion, reward, town
  effect, and recurrence validates through the shared repository. Failed
  persistence restores the exact board, supplies, wallet, campaign, and town
  checkpoint.

## Legacy compatibility map

The importer accepts legacy versions 12 through 82. Known top-level introduction boundaries are preserved as follows:

| Legacy version | Important state available from this boundary |
| --- | --- |
| 12 | Base day/time, lawns, litter, river rubbish, jobs |
| 13 | Full NPC movement state |
| 14 | River runtime |
| 15 | Land-litter runtime and lawn-ID correction boundary |
| 18 | Mini-game progress/recovery |
| 23 | Shared economy and inventory |
| 36 | Town milestones |
| 37 | Social-restoration runtime |
| 39 | Animals and companions |
| 40 | House Rescue |
| 44 | Homeowner gifts |
| 47 | Allotment |
| 49 | Orchard |
| 53 | Corner Café |
| 54 | Little Bakery |
| 55 | Riverside Kitchen |
| 57 | Fishing |
| 58 | Farming foundation |
| 61 | Magnet fishing |
| 68 | NPC narratives |
| 71 | Weekly rubbish collection |
| 73 | Playground powerwashing state |
| 74 | Weather |
| 75 | Harbour General |
| 79 | South Shore Scoops |
| 82 | Current home/aquarium and NPC narrative state |

Missing optional fields produce explicit warnings and safe defaults. Unsupported versions, malformed JSON, invalid field shapes, and mismatched integrity seals fail with a precise report.

## Import and recovery rules

1. Inspect current, backup, older legacy keys, and the quarantined recovery payload read-only.
2. Select the first compatible valid candidate.
3. Show the candidate version to the player.
4. Create a Phaser copy only after the player presses the import button.
5. Preserve the complete legacy snapshot in the Phaser state for later staged migration.
6. Never remove, rename, overwrite, or repair a legacy key from Phaser.
7. Validate a Phaser candidate before writing it.
8. Back up the previous valid Phaser save before replacement.
9. Read back and verify the new current save.
10. Quarantine failed Phaser data in the Phaser recovery key only.
