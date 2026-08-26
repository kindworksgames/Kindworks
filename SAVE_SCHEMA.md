# Kindworks Phaser save contract

> Current migration status: Milestone 24 uses game-state and envelope schema
> 21. Schemas 1 through 20 upgrade in order, with schema 21 normalizing the
> complete ordinary-coin shop, equipment, inventory, and transaction-history
> contract described below. The historical schema-3 foundation notes are retained
> for traceability.

Milestone 3 introduced the protected save foundation alongside the preserved HTML game. Milestone 4 added the shared item catalogue, inventory, KindlyCoin ledger, and atomic economy transactions. Milestone 6 adds the first persistent cleanup session, exact-target result, and job reward. NPC, animal, farming, dynamic cleanup, and the remaining mini-games stay staged for later milestones.

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

## Current Phaser envelope schema 21

Every current and backup save is a JSON envelope:

```json
{
  "format": "kindworks-phaser",
  "schemaVersion": 21,
  "writtenAt": "2026-08-25T00:00:00.000Z",
  "appVersion": "0.1.0",
  "data": {},
  "checksum": "kwp1-..."
}
```

The checksum covers every envelope field except the checksum itself. A save is accepted only when its format, schema, timestamp, checksum, and inner game state all validate. Valid schemas 1 through 20 upgrade to schema 21, and the original verified envelope becomes the Phaser backup before replacement.

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
- The extracted catalogue contains all 76 legacy IDs: 12 equipment, 35 placeables, 15 consumables, 10 furniture items, and 4 aquarium collectibles.
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
  Village Grocer owns its exact three seed and five everyday-treat products;
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
  game day, best result, and last reward. `house-19`, the rendered personal
  home, can never become dirty.
- Active data contains the deterministic item and stain snapshots, sorted
  flags, stain layers remaining, vacuum position, score, mistakes, house/job
  identity, and exact town return position.
- Starting, sorting, vacuum progress, finishing, rewards, home cleanup, level
  unlocks, and day-based respawns all validate and save through the shared
  repository. A persistence failure restores the whole pre-action checkpoint.
- Completion records one `house-rescue-job-reward` ledger entry and increments
  the shared completed-job count in the same atomic save.

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
