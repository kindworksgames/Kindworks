# Playground Power Wash system

Milestone 20 replaces the embedded Playground Power Wash iframe with a native
Phaser scene while keeping the protected HTML file unchanged.

## Protected rules retained

- Actual embedded build identity: `1.1.0-kindworks-soap-restored`, visual
  revision `v33-pixel-soap-stains`.
- 750 deterministic levels use the original `9973 × level + 42` seed and exact
  difficulty curves from four dirt blobs/40 grit to 300 blobs/6,000 grit.
- Precision, Standard, and Wide nozzles retain their original radius, drain,
  and cleaning-power constants.
- Five soap-resistant stain zones grow to ten. Plain water cannot remove them;
  soap must be applied first and then rinsed.
- Water pressure and soap drain while spraying and regenerate through the
  original level-based recovery curve.
- A raw clean reading of at least 97 percent completes the level, displays 100
  percent, and removes the final visual residue.
- Pointer hold/drag and keys 1–4 are available. Mobile play requires landscape
  orientation, leaving River Clear-Out as the only portrait-friendly migrated
  mini-game.

The approved embedded master artwork and reference dirt image remain pinned by
their binary SHA-256 hashes. The native scene reconstructs the playground as a
pixel-art canvas and layers deterministic grid grime, resistant stains, soap,
and nozzle coverage over it; it does not modify or replace those source assets.

## Campaign and town rewards

Campaign play is selectable across all 750 levels. A level's first clear
awards the shared 100-coin base plus five coins per 50-level band, capped at
170. Its best result is retained, and replay clears never award coins again.

When the Commons Playground is dirty, its town marker launches the same engine
as a cleanup occurrence. Completion awards the embedded game's native
projected reward (`round(100 + level × 20/24)`, capped at 170), removes visible
town grime, increments the shared completed-job count, and schedules the
playground to become dirty again after a deterministic two or three game days.

## Persistence and safety

Schema 17 stores campaign results, the Commons Playground lifecycle, and one
exact in-progress attempt including grime strengths, resistant and soaped cell
IDs, supplies, active tool/nozzle, strokes, and town return point. Every
gameplay mutation validates and saves immediately. A failed write restores the
full previous state. Processed session IDs and ledger metadata prevent duplicate
rewards. Legacy Playground Power Wash progress is projected from the preserved
snapshot without writing to any `kindworks_living_town_*` key.

Automated tests pin the protected source, decoded payload, approved master art,
reference dirt art, exact build and visual revision, all 750 unique generated
levels, soap-first behavior, 97-percent tolerance, reward idempotency, town
recurrence, resumable play, schema migration, and persistence rollback.
