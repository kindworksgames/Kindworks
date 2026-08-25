# Kindworks Phaser cleanup-job and Waste Collection contract

## Milestone 17 campaign expansion

Milestone 17 completes the Waste Collection migration while retaining the
Milestone 6 town occurrence below. The protected embedded payload is extracted
read-only into a generated Phaser data module with its source and payload
SHA-256 values recorded. It contains exactly 750 compact authored boards, 40
rubbish types, the original reordered source-level map, 15 checkpoints, and
750 certified five-slot solution paths. No runtime board generation or
placeholder fallback is used.

Campaign rules match the protected build: only cards with no overlapping card
on a higher layer are selectable; selected cards enter a sorted five-slot
tray; every triple clears automatically; clearing every card wins; reaching
five unmatched cards loses the attempt. Each selected card, tray entry, match,
level, and town return position is persisted so interrupted play resumes
exactly. A retry resets only the current attempt.

All 750 levels are selectable, matching the original campaign picker. A first
clear records three stars and 100%, advances `nextLevel`, and awards the shared
percentage-plus-level reward once. Replays update or retain best progress but
cannot pay again. Campaign clears do not remove town objects or increment the
town cleanup-job count. The original Willow Commons occurrence still removes
only its six authored pieces, increments the town count, and records Level 1
as already cleared; a later Level 1 campaign replay therefore pays nothing.

Waste Collection requires landscape orientation on mobile. Pointer/touch card
selection, accessible card buttons, keyboard escape, an `H` hint shortcut, a
safe-card hint button, and a development-only certified completion control are
provided. River Clear-Out remains the sole migrated mini-game intentionally
supporting portrait play.

Milestone 6 proved the first complete town-to-mini-game vertical slice. The historical contract below remains in force for that exact first occurrence.

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
- Dynamic litter spawning, partial town restoration, repeating cleanup cycles,
  and advertisements remain later milestones. Campaign selection and Levels
  2–750 are complete in Milestone 17.
