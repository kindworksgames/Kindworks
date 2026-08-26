# Milestone 42: complete legacy-save reconciliation

Milestone 42 closes the staged import process for the protected HTML game. A
compatible version-12 through version-82 save is inspected read-only, copied,
canonicalized in memory, projected into its final Phaser systems, validated,
and then saved only under the Phaser namespace. The original HTML payload and
all `kindworks_living_town_*` storage keys remain permanently unchanged.

## Final domain ownership

| Legacy data | Final Phaser owner |
| --- | --- |
| Coins and ledger | `economy` |
| Owned and equipped items | `inventory` |
| Placed town objects | `townPlacement` |
| Beds, crops and positioned apple trees | `farming` |
| Personal home and room furniture | `customResident` and `homeInteriors` |
| Ornamental fish | `fishing.aquariumByItem`, housed by `homeInteriors` |
| Wildlife and adopted pets | `animals` |
| Permanent town restoration | `restorationMilestones` |
| Harbour General ownership and stock | `harbourGeneral` |
| Household cooldowns and gratitude gifts | `homeownerGifts` |
| Resident story and thought history | `npcs.residents[].narrativeState` |
| Cleanup and venue campaigns | Each dedicated campaign state |
| One-time claim barriers | Completed levels and processed event histories |

## Stable identities

Reconciliation happens on an in-memory clone. It fixes only known historical
aliases and never edits the retained source snapshot:

- version-12–15 lawn IDs 09–12 are attached to the corrected physical homes;
- `home20`, `house19`, and `house-19` resolve to the permanent personal-home
  identity `house-20` where appropriate;
- old `homeFurnitureState`, `scoops`, and `miniGameProgress` shapes resolve to
  their current owners;
- useful placements missing a durable identity receive a deterministic ID
  based on their source order;
- old fixed orchard slots retain separate positioned `apple-tree-N` identities.

Every applied mapping is recorded in `legacyReconciliation.stableIdMappings`.
Unknown inventory records are not guessed: they remain visible in
`inventory.unresolvedLegacy` for diagnosis.

## Reconciliation record

Schema 37 adds `legacyReconciliation` to imported Phaser saves. It contains:

- the HTML source version and a deterministic fingerprint excluding its seal;
- the immutable final-owner map;
- stable-ID mappings applied during the copy;
- counts for balances, inventory, placements, crops, trees, furniture,
  aquarium fish, adopted animals, restorations, business stock, gifts and
  narrative stages;
- compact completed-level ranges for all eleven migrated campaigns;
- processed homeowner, restoration and commerce IDs;
- starter-grant and first-restoration-gift claim flags;
- an explicit invariant that HTML keys are read-only.

Existing schema-36 Phaser imports derive this record from their untouched
`legacySnapshot` and current final states. Fresh games store `null` because
there is no legacy source to reconcile.

## Duplicate and failure safety

Imported completed levels are already marked complete in their dedicated
campaign states, so replaying them can improve a score but pays no first-clear
coins. Homeowner gift event IDs, restoration event IDs, commerce transaction
IDs and membership periods similarly remain idempotent. The 100-coin starter
grant and first-restoration Town Planter are imported as already claimed when
the source says so.

The normal Phaser repository validates the whole candidate and checksum before
writing. It owns only `kindworks_phaser_v1`, its backup, and its recovery key;
it never removes, repairs, or overwrites an HTML save key.

## Verification

The Milestone 42 suite contains one fixture for every supported HTML version
from 12 through 82, a dense version-82 all-domain fixture, stable-alias tests,
exact wallet/inventory assertions, replay attempts, deterministic upgrade
checks, and explicit storage-write inspection. These run alongside the full
game regression suite and production build.
