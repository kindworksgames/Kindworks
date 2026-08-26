# Milestone 39 — NPC narratives and home stories

Milestone 39 migrates the authored story layer from the protected version-82 HTML game into Phaser. The original HTML remains read-only.

## Authored coverage

- All 35 principal Willowmere residents have a stable narrative profile.
- Every profile contains two or more traits, one hope, one concern, four distinct chapters, and authored notes for trusted neighbours.
- The catalogue contains 140 resident chapters in total.
- All 19 physical home identities have an authored name, district, approach, and household description.
- Story text is stored separately from runtime logic in `src/data/npcNarratives.js` so authored material cannot drift during simulation updates.

## Chapter progression

Each resident begins at Introduction and can progress through Opening, Growth, and Resolution. A single evaluation can unlock no more than one chapter.

The gates use durable game evidence:

1. Meaningful, deliberate conversations on different game days.
2. Resident routines completed by the living-town simulation.
3. Shared town jobs completed by the player.
4. Relationship growth with an authored trusted neighbour.
5. A relevant area restoration for Growth.
6. Town-wide restoration and at least one later day for Resolution.

Repeated clicks on one day cannot replace multi-day familiarity. Every unlock records the chapter, day, trigger, and explanation in bounded persistent history.

## Contextual thoughts

Thoughts are assembled from the resident's current action, destination, job, home, time, weather, town-care condition, relationship, current story chapter, completed jobs, open businesses, and restoration progress.

Selection is deterministic for the same saved context. The latest six thought identities are retained, so an immediate repeat is avoided. Time ticks and screen refreshes never silently rotate thoughts: a new thought is chosen and saved only after the player deliberately talks with a resident.

## Player access

- Approach any visible resident and use the normal `E`/Space or touch interaction.
- Select a resident from the new Stories button in the town HUD.
- Inspect a resident who is physically inside a home.
- Review all four chapters, current evidence, home story, trusted-neighbour notes, and the latest saved thought in one responsive panel.

## Persistence and compatibility

Game-state schema 34 upgrades schema 33 by normalising narrative state for all 35 resident identities. Legacy version-82 `npcNarratives` records are converted by stable NPC id, including chapter, thought, selection-day, and history data. The complete legacy snapshot remains unchanged.

Every thought or chapter mutation validates and saves the complete candidate state. If persistence fails, the exact pre-conversation checkpoint is restored in memory and on the NPC simulation service.

## Verification contract

- 35 profiles, 140 chapters, and 19 home stories are present.
- Fresh, upgraded, and imported records validate.
- Multi-day and restoration gates cannot be bypassed.
- Consecutive thoughts do not repeat when another candidate exists.
- Business, job, home, relationship, and restoration references are available.
- Failed writes roll back exactly.
- Keyboard, pointer, touch, portrait, and landscape layouts remain supported.

