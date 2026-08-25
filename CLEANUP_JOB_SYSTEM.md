# Kindworks Phaser cleanup-job contract

Milestone 6 proves the first complete town-to-mini-game vertical slice. It intentionally migrates one authored Waste Collection occurrence, not the full dynamic litter simulation or all 750 Waste Collection layouts.

## First cleanup target

`commons-rubbish-cluster` is a six-piece park job in Willow Commons:

| Item ID | Legacy type | Display label |
| --- | --- | --- |
| `commons-bottle` | `bottle` | Plastic bottle |
| `commons-can` | `can` | Empty can |
| `commons-cup` | `cup` | Takeaway cup |
| `commons-wrapper` | `wrapper` | Food wrapper |
| `commons-paper` | `paper` | Wet newspaper |
| `commons-tissue` | `tissue` | Dirty tissue |

The cluster has one stable town coordinate and one stable job ID. Completing it removes that exact target from town. Cancelling the mini-game leaves it untouched.

## Transaction path

1. The player approaches the visible cluster in Willow Commons.
2. Starting the job writes a persistent `JobSession` containing the exact target, item snapshot, assigned level, and town return position.
3. `WasteCollectionScene` renders the six snapshotted pieces and supports pointer, touch, keyboard, and accessible-button collection.
4. The result is accepted only when all six expected IDs are present. Unknown or duplicate IDs do not increase completion.
5. One atomic candidate state marks the target clean, records the 100% three-star result, advances Waste Collection from Level 1 to Level 2, increments the shared completed-job count, awards coins, writes the job ledger metadata, clears the active session, and restores the town position.
6. The full candidate validates and saves before the result is shown as committed.
7. If validation or persistence fails, the exact pre-result state is restored and the result can be tried again.

Processed session IDs make result submission idempotent. The same occurrence cannot pay twice, and a completed one-time target cannot be started again.

## Reward parity

The extracted legacy rule is preserved:

- Results below 50% pay no coins.
- Eligible results pay one coin per rounded completion percentage point.
- Every 50 levels after Level 1 adds five coins.
- The level bonus is capped at 70 coins.
- A single cleanup reward is capped at 170 coins.

This first authored job requires 100%, so Level 1 awards exactly 100 KindlyCoins. The result uses the shared wallet and coin ledger and survives reload.

## Recovery and scope

- Reloading with an active saved session resumes `WasteCollectionScene`.
- Exiting safely records a cancellation, restores the saved town position, and changes neither the target nor the wallet.
- Schema-1 and schema-2 Phaser saves upgrade automatically to schema 3 with a fresh available cleanup target.
- Legacy HTML keys remain read-only.
- Dynamic litter spawning, partial town restoration, repeating cleanup cycles, advertisements, campaign level selection, and Levels 2–750 remain later milestones.
