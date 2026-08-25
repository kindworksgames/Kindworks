# Kindworks Phaser Lawn Care contract

## Milestone 18 source parity

The protected `lawn-care` payload is read from
`kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html` by the
read-only extraction script and written to a generated JavaScript data module.
The generated module records both the original HTML SHA-256 and the embedded
payload SHA-256. The protected HTML is never rewritten.

The catalogue contains exactly 750 authored levels. Every grid, source-level
ID, and source-family ID is unique. The stored optimal route for every level is
replayed during the exhaustive catalogue test. Optimal move counts are
nondecreasing from 9 to 25, and every playable attempt receives exactly two
additional moves.

## Play rules

- A direction makes the mower slide until the next hedge or board edge.
- Every crossed grass cell is cut; already-cut cells remain safe to cross.
- The latest five pre-move board states can be restored with Undo.
- 100% earns three stars, at least 85% earns two, at least 50% earns one, and a
  lower result does not clear the level.
- Tough weeds begin at Level 10 and woody weeds begin at Level 50. Generated
  weed clusters are deterministic and never larger than six connected cells.
- Mower equipment changes weed-cutting animation durations only. It never adds
  moves, fuel, or a mechanical advantage.

Keyboard arrows/WASD, large direction buttons, touch swipes, restart, undo, and
a certified route hint all use the same engine. A development-only completion
button replays the stored optimal certificate for browser QA.

## Campaign and reward safety

All 750 levels are selectable. A campaign session persists the exact mower
position, facing, cut cells, moves, undo stack, assigned level, and town return
point. Reloading resumes that attempt before the town scene opens.

A result below 50% pays nothing. An eligible first clear pays its rounded
completion percentage plus five coins for each 50-level band after Level 1.
The bonus is capped at 70 and the complete reward at 170. A cleared level can
improve its saved best result, but cannot pay the first-clear reward twice.

## Neighbourhood jobs

The Farming panel now starts the same playable Lawn Care engine instead of
instantly completing a lawn. A town lawn can start only when its persisted grass
height or weed pressure crosses the existing job threshold. The campaign's
next level supplies the job layout without changing campaign progress.

If `p` is the completed percentage from 0 to 1, the exact committed effect is:

```text
grass height = 5 + (starting grass height - 5) × (1 - p)
weed pressure = 3 + (starting weed pressure - 3) × (1 - p)
```

Each newly regrown occurrence records one completed town job and one atomic
reward. Campaign replays and town occurrences are deliberately separate.

## Mobile and recovery

Lawn Care requires landscape orientation on phones and shows a dedicated
rotate prompt in portrait. River Clear-Out remains the only migrated mini-game
designed for portrait play. Cancelling a lawn attempt changes neither campaign
progress nor town grass. Any persistence failure restores the complete
pre-action state, including the wallet and active board.
