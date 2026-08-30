# Stage 8 Findings Register

## Confirmed defects

### S8-REC-001 — One missing defaultable current field can make all progress inaccessible without a backup

- **Severity:** P1
- **Status:** FIXED
- **Reproduction:** Create an otherwise valid schema-37 envelope with meaningful progress, remove `world.weather.history`, recompute the checksum, provide no backup, then boot. The current envelope is rejected, copied to the recovery quarantine and the running game starts from a new default state.
- **Expected:** A missing optional/defaultable field is normalized, or the quarantined state is recoverable without replacing all progress with a fresh game.
- **Actual:** `SaveRepository.load()` reads only current and backup. `bootstrapState()` creates a fresh state after both fail. The Phaser recovery key is written but never read. The Save panel does not explain that recoverable progress exists.
- **Evidence:** `tests/stage-08-audit.test.js` reproduces town `Do Not Lose Me`, 54,321 coins and nine apples becoming an in-memory fresh Willowmere state with 100 coins while the raw envelope remains only in recovery.
- **Additional affected defaultable fields:** Representative removals from weather/simulation history, cleanup history, economy ledger, unresolved inventory, placement import report, NPC conversation history, restoration processed IDs, creator draft, home visits, farm beds, animal departure events, fishing recent finds, restaurant/minigame outcome/session fields, gift queue and Harbour recent sales were rejected in the same matrix.
- **Affected files:** `src/state/SaveRepository.js`, `src/state/bootstrapState.js`, state-domain upgrade/validation initializers, `src/ui/SaveStatusController.js`.
- **Suspected root cause:** Current-schema data bypasses additive normalization assumptions; recovery is implemented as write-only quarantine rather than a validated recovery candidate or explicit user recovery flow.
- **Required regression:** Remove each defaultable field from a checksummed current envelope with no backup; require normalized state or explicit recovery without progress loss. Verify corrupt required fields still fail closed, recovery never duplicates currency/items/rewards and a verified backup remains preferred.
- **Repair:** Missing additive values are filled from domain normalizers without replacing present invalid values. Normalized saves are persisted, valid recovery payloads are load candidates, and invalid current data cannot overwrite an older valid recovery.
- **Verification:** 25 missing-field cases preserve identity and 4,321 coins; a corrupt required coordinate still fails. Recovery-only boot restores and persists `Recovered Willow` with 777 coins.

### S8-MIG-001 — Failed legacy-import persistence leaves unsaved imported progress active in memory

- **Severity:** P2
- **Status:** FIXED
- **Reproduction:** Inspect a valid legacy v82 save, make the Phaser repository write fail, and choose “Bring progress across.”
- **Expected:** The existing running state remains unchanged when persistence fails, matching the displayed failure message.
- **Actual:** `createSafeSave()` replaces `gameState` with imported progress before attempting `repository.save()`. A failed write leaves the imported state live until refresh, although the panel says existing data was unchanged. Refresh then loses the apparent import.
- **Evidence:** The Stage 8 focused test observes live `legacy-import` / `Test Willow` state with no loadable Phaser save after simulated storage failure.
- **Affected file:** `src/ui/SaveStatusController.js`.
- **Suspected root cause:** Import uses replace-then-save without a checkpoint rollback or save-before-publish transaction boundary.
- **Required regression:** Inject repository failure during import; require exact pre-import state, unchanged legacy keys, accurate error copy and no current/backup/recovery corruption.
- **Repair:** The imported candidate is validated and saved before it is published to the live game state.
- **Verification:** A simulated write failure leaves the live fresh state unchanged and creates no Phaser save.

### S8-RESET-001 — No player-facing reset/new-game path exists after a current save is present

- **Severity:** P2
- **Status:** FIXED
- **Reproduction:** Load a healthy current save and open Save Status. The primary action is hidden. Repository/UI searches find no production reset or new-game transaction.
- **Expected:** A deliberate, confirmed reset/new-game flow that preserves a recoverable backup and cannot be triggered accidentally.
- **Actual:** “Start a new save” exists only before the first Phaser save. A returning player cannot reset from the player interface.
- **Evidence:** `SaveStatusController.render()` hides the primary action whenever `hasCurrent` is true; no production owner removes/replaces current state as a confirmed reset.
- **Affected files:** `src/ui/SaveStatusController.js`, save/reset UI markup and save repository ownership.
- **Required regression:** Confirmed reset creates a valid fresh save, preserves the prior verified save as a recoverable backup, does not touch legacy HTML keys, survives reload, prevents double-tap and offers cancellation.
- **Repair:** Save Status now provides an armed two-step new-game action. Confirmation uses the verified repository save path and reloads only after the fresh state is durable; closing cancels and failed persistence leaves progress unchanged.
- **Verification:** Automated backup/failure checks and isolated browser operation pass through confirmation, cancellation, reset, refresh and close/reopen.

## Observations and external limits

- A valid backup successfully recovers corrupt JSON/checksum/current-state failures without currency or inventory duplication.
- Browser refresh and close/reopen were tested in emulation with an isolated development namespace. Physical iOS/Android termination and WebView storage-eviction behaviour remain Stage 9/release work.
- External signed billing receipts were not available; local receipt idempotency and rollback were exercised, while platform recovery remains an external integration boundary.
- The Stage 6/7 unlimited-companion versus five-pet/freeing decision remains unchanged and does not invalidate save integrity testing.

## Severity summary

| Severity | Count |
| --- | ---: |
| P0 | 0 |
| P1 | 0 open / 1 fixed |
| P2 | 0 open / 2 fixed |
| P3 | 0 |
| User decision required | 0 new / 1 inherited non-blocking |
