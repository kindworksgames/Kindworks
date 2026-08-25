# Kindworks Phaser save contract

Milestone 3 introduced the protected save foundation alongside the preserved HTML game. Milestone 4 adds the shared item catalogue, inventory, KindlyCoin ledger, and atomic economy transactions. NPC, animal, farming, shop, and mini-game behaviour remain staged for later milestones.

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

## Phaser envelope schema 2

Every current and backup save is a JSON envelope:

```json
{
  "format": "kindworks-phaser",
  "schemaVersion": 2,
  "writtenAt": "2026-08-25T00:00:00.000Z",
  "appVersion": "0.1.0",
  "data": {},
  "checksum": "kwp1-..."
}
```

The checksum covers every envelope field except the checksum itself. A save is accepted only when its format, schema, timestamp, checksum, and inner game state all validate. A valid Milestone 3 schema-1 envelope is upgraded to schema 2 and the original verified envelope becomes the Phaser backup before replacement.

## Game-state schema 2

| Field | Type | Default | Rule |
| --- | --- | --- | --- |
| `schemaVersion` | integer | `2` | Schema 1 is upgraded automatically; all new writes use 2. |
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
| `progress.completedJobCount` | non-negative integer | `0` | Preserved projection only; job behavior is not migrated. |
| `economy` | object | 100 starter coins | Validated balance, lifetime totals, next transaction ID, and bounded ledger. |
| `inventory` | object | two starter tools | Four owned-item buckets, equipped tools, and unresolved legacy records. |
| `legacySnapshot` | object/null | `null` | Complete read-only copy used by later domain migrations. |

## Economy and inventory contract

- The current balance is always `lifetimeCoinsEarned - lifetimeCoinsSpent`.
- Every credit, debit, and purchase records an ID, signed amount, kind, reason, related item/quantity when present, and timestamp.
- The ledger retains the latest 500 entries.
- The extracted catalogue contains all 76 legacy IDs: 12 equipment, 35 placeables, 15 consumables, 10 furniture items, and 4 aquarium collectibles.
- Inventory uses `equipment`, `placeables`, `consumables`, and `furniture` buckets. Aquarium collectibles remain outside normal inventory, matching the legacy game.
- Equipment and unique furniture are capped at one. Other inventory stacks are capped at 9,999.
- `starter-mower` and `starter-vacuum` always remain owned and correctly equipped.
- Unknown or wrongly bucketed legacy records are retained in `unresolvedLegacy` instead of being silently discarded.
- A successful mutation validates the complete candidate state and persists it immediately.
- If validation or persistence fails, the in-memory balance and inventory return to the exact pre-transaction checkpoint.
- Legacy HTML storage keys remain read-only throughout economy import and Phaser transactions.

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
