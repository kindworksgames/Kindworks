# Stage 8 Cross-System Journeys

All automated journeys use `MemoryStorage` or the isolated Fidelity QA namespace. No real player save was read or modified.

| Journey | Coverage and evidence | Result |
| --- | --- | --- |
| 1. Job → minigame → reward → save → reload → shop purchase | Lawn/Waste/River/Beach/Power Wash first-clear suites verify atomic reward and processed-session identity; release-candidate journey reloads the shared state; shop suites then verify deduction, delivery, ledger metadata and second reload. | PASS |
| 2. Buy equipment → use in minigame → save/reload | Willowmere Shop suite purchases/equips the ordered mower and vacuum upgrades atomically; Lawn and House Rescue read the persisted loadout and apply only performance multipliers. Save failure restores wallet, inventory, history and loadout. | PASS |
| 3. Obtain food → feed animal → befriend/select follower → save/reload | Stage 6 audit purchases/plants/harvests all crops, feeds the rabbit once, consumes one carrot, persists trust and validates the saved state. Animal suites cover adoption thresholds, a single active follower, South Meadow roaming and reload. | PASS |
| 4. Restore location → NPC behaviour → gift → inventory → save/reload | Restoration milestone, NPC social-life and homeowner-gift suites verify cleanup counters, behaviour changes, one processed gift event, inventory delivery, queue acknowledgement and reload. Failed completion rolls all connected state back. | PASS |
| 5. Acquire ingredient → cooking loop → serve → reward → world return | Bakery/Café/Morning Mug/Riverside Kitchen/Scoops suites validate exact recipe ingredients, serving, first-clear reward once, active-shift checkpoint, cancellation/return position and reload. | PASS |
| 6. Repeated world/shop/interior/minigame entry and exit | Stage 2 lifecycle matrix plus persistent-activity recovery covers Town, shops, interiors and all 11 resumable activities. Runtime opened Lawn through the isolated normal boot, refreshed, closed the tab and reopened to the same level/board. | PASS |
| 7. Interrupt rewards, purchases, saves, growth, feeding and transitions | Service-level failing repositories verify checkpoint rollback for economy, shops, equipment, farming, animals, minigame final rewards, gifts, collection and commerce. Browser refresh/reopen preserved the active Lawn checkpoint. Legacy-import failure now leaves the live pre-import state unchanged. | PASS |
| 8. Rapid connected actions / duplicate listeners | Rapid repeat purchase/adoption/completion tests reject capacity, already-owned and processed IDs; reward ledgers and inventory do not duplicate. Stage 2 re-entry/listener tests pass. | PASS |

## Exact runtime evidence

- Isolated URL: development-only `?qa=fidelity&stage=8` namespace.
- Opened Lawn Care Level 1 through the QA route; board reported 7% cut and 11 moves left.
- Browser refresh returned to Lawn Care Level 1 with the same 7%/11-move checkpoint.
- Closing the browser tab and reopening the same isolated URL returned to that same checkpoint.
- The QA control continued to report `Isolated save active`; this namespace deliberately does not touch ordinary KindWorks saves.
- Physical mobile lifecycle/background-kill testing is not claimed; that belongs to Stage 9/release testing.
