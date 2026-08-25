# Beach Cleanup system

Milestone 19 replaces the embedded Beach Cleanup iframe with a native Phaser
scene while keeping the protected HTML file unchanged.

## Protected rules retained

- Build identity: `1.0.0-kindworks-integrated`.
- 750 deterministic levels generated from the original level-number seed.
- Grids grow from 7×7 to 15×13.
- Obstacles use the original umbrella, chair, and tide-pool bands.
- Hidden rubbish grows from one item to 50 and uses the original 19-item coin
  catalogue, from a one-coin sock to a 100-coin treasure chest.
- The tile being left is raked. A clear requires every sand tile raked and every
  rubbish item recovered.
- No Undo (+25), Light Foot (+40), and Clean Sweep (+35) remain optional, with
  the total native reward capped at 170 coins.
- Arrow keys, WASD, buttons, swipe, undo, restart, and hint controls are
  available. Mobile play requires landscape orientation.

## Campaign and town rewards

Campaign play is selectable across all 750 levels. The first clear of a level
awards the shared 100-percent reward plus its level-band bonus, capped at 170.
The best result is retained and replay clears never award coins again.

When South Shore is dirty, its marker launches the same engine as a town job.
That occurrence banks the native item and challenge coins instead of the
campaign formula. Completion removes visible shoreline litter, increments the
shared completed-job count, and schedules the beach to become dirty again after
a calm interval.

## Persistence and safety

Schema 16 stores campaign results, town-litter state, and one exact in-progress
attempt. Every gameplay mutation validates and saves immediately. If a write
fails, the in-memory state is restored to its full prior checkpoint. Processed
session IDs and ledger metadata prevent duplicate rewards. Legacy Beach Cleanup
progress is projected from the preserved snapshot without writing to any
`kindworks_living_town_*` key.

The source and decoded package hashes are pinned in `src/data/beachCleanup.js`
and covered by tests so an accidental protected-source change cannot be hidden.
