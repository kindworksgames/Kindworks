# Stage 8 Persisted-Field Map

## Storage envelope and namespaces

| Purpose | Key | Format | Read order / rule |
| --- | --- | --- | --- |
| Current Phaser save | `kindworks_phaser_v1` | Checksummed JSON envelope: `format`, envelope `schemaVersion`, `writtenAt`, `appVersion`, `data`, `checksum` | First load candidate |
| Verified Phaser backup | `kindworks_phaser_v1_backup` | Previous valid current envelope | Second load candidate |
| Phaser recovery quarantine | `kindworks_phaser_v1_recovery` | Capture record: `format`, `capturedAt`, `sourceKey`, `reason`, `raw`, optional `previousRaw` | Third load candidate when its enclosed save validates; promoted to current on boot. An invalid payload cannot replace an older valid recovery |
| Latest protected HTML save | `kindworks_living_town_v38` | Legacy JSON, optional integrity seal | Read-only import candidate |
| Protected HTML backup/recovery/history | `kindworks_living_town_v38_backup`, `_recovery`, `kindworks_living_town_v12`…`v37` | Legacy JSON/recovery wrapper | Read-only inspection/import candidates |

Current Phaser schema is 37; schemas 1–37 are accepted and upgraded. Protected HTML versions 12–82 are accepted by the importer. A fresh schema-37 snapshot has 36 top-level fields, 527 object nodes, 235 arrays and 7,569 concrete scalar/empty-container leaves (147,832 serialized bytes in the deterministic fixture).

## Complete top-level state map

| Owner | Persisted fields |
| --- | --- |
| Root metadata | `schemaVersion`, `createdAt`, `updatedAt` |
| `source` | `kind`, `legacyVersion`, `legacySourceKey`, `importedAt`, `warnings[]` |
| `identity` | `townName` |
| `world` | `day`, `clockMinutes`; `weather.{schemaVersion,current,history[]}`; `simulation.{gameMinutesPerRealSecond,lastResolvedAt,maxOfflineGameMinutes,totalOfflineGameMinutes,lastOfflineGameMinutes,lastOfflineWasCapped}` |
| `player` | `scene`, `x`, `y`, `facing` |
| `progress` | `completedJobCount`; `cleanup.{schemaVersion,nextSessionId,activeSession,processedSessionIds[],history[],targets,progress}` |
| `economy` | `schemaVersion`, `coins`, `lifetimeCoinsEarned`, `lifetimeCoinsSpent`, `nextTransactionId`, `ledger[]` |
| `inventory` | `schemaVersion`, `equipment`, `placeables`, `consumables`, `furniture`, `equipped.{mower,vacuum}`, `unresolvedLegacy[]` |
| `townPlacement` | `schemaVersion`, `nextSerial`, `objects[]`, `importReport.{accepted,returnedToInventory,rejectedUnknown}` |
| `npcs` | `schemaVersion`, `lastResolvedAbsoluteMinute`, `eventSerial`, `residents`, `publicBins`, `socialRuntime`, `conversationHistory[]` |
| `municipalCollection` | `schemaVersion`, `active`, `phase`, `phaseTimer`, `nextServiceDay`, `lastCompletedDay`, `collectionsCompleted`, `startedDay`, `startedMinute`, `completedAtGameMinute`, `stops[]`, `stopIndex`, `binsEmptied`, `totalBins`, `load`, `completedIdentities[]`, `drivePath[]`, `drivePathIndex`, `truck`, `collector`, `activeBin`, `lastEvent` |
| `restorationMilestones` | `schemaVersion`, `unlocked`, `revealed`, `unlockDay`, `counters`, `festivalUntilGameMinute`, `processedEventIds[]`, `firstRestorationGift`, `lastUnlockedId` |
| `onboarding` | `schemaVersion`, `townNamed`, `complete`, `creatorStep`, `creatorDraft`, `tutorialSeen`, `tried`, `journey`, `starterGrantClaimed`, `loginRewards`, `firstRestorationGiftGranted` |
| `commerce` | `schemaVersion`, `walletVersion`, `processedTransactions[]`, `processedPeriods[]`, `kindlyClub`, `lastRestoreAt` |
| `customResident` | `schemaVersion`, `residentId`, `profile`, `home`, `location`, `autonomy` |
| `homeInteriors` | `schemaVersion`, `placements[]`, `nextPlacementId`, `visits` |
| `farming` | `schemaVersion`, `lastResolvedAbsoluteMinute`, `allotment.{unlockedBeds,beds[]}`, `orchard.{nextTreeSerial,purchasedSaplings,trees[]}`, `lawns` (20 stable lawn records) |
| `environment` | `schemaVersion`, `lastResolvedAbsoluteMinute`, `eventSerial`, `land`, `river`, `businesses` (12 stable venue records), `businessWasteEvents[]`, `businessOverflowEvents[]`, `calm`, `cleanliness` |
| `animals` | `schemaVersion`, `activeAnimalId`, `lastResolvedDay`, `lastResolvedAbsoluteMinute`, `eventSerial`, `departureEvents[]`, `residents` (56 stable identity records) |
| `fishing` | `schemaVersion`, day/cast/catch/streak totals, `caughtByItem`, `aquariumByItem`, `releasedByItem`, `magnet` counters, pity counters, item maps and `recentFinds[]` |
| `bakery` | `schemaVersion`, `unlockedLevel`, `completed`, `best`, `totalStars`, `shifts`, `lifetimeServed`, `lifetimeCoins`, `lastLevel`, `lastOutcome` |
| `cafe` | Same durable campaign shape as Bakery |
| `river` | `schemaVersion`, `nextLevel`, `completed`, `best`, `totalStars`, `restorationPoints`, `attempts`, `lifetimePieces`, `lifetimeRows`, `lastLevel`, `lastOutcome` |
| `houseRescue` | `schemaVersion`, `selectedLevel`, `unlockedLevel`, `completed`, `best`, `totalStars`, `attempts`, `lifetimeItemsSorted`, `lifetimeStainLayers`, `lastLevel`, `homes` (19 playable home records), `active` |
| `lawnCare` | `schemaVersion`, `nextSessionId`, `processedSessionIds[]`, `history[]`, `progress.{nextLevel,completed,best}`, `activeSession` |
| `beachCleanup` | Lawn-style campaign plus `southShore.{dirty,litterCount,dirtySinceDay,lastCleanedDay,nextDirtyDay,cleanings,lastRewardCoins}` |
| `playgroundPowerwash` | Lawn-style campaign plus `playground.{dirty,lastCleanedDay,nextDirtyDay,dirtySinceDay,cleanings,attempts,lastCompletionPercent,lastRewardCoins}` |
| `morningMug` | Restaurant campaign fields plus `activeShift` |
| `riversideKitchen` | Restaurant campaign fields plus `activeShift` |
| `southShoreScoops` | Restaurant campaign fields plus `selectedLevel`, `restorationTier`, `activeShift` |
| `homeownerGifts` | `format`, `misses`, `totalGifts`, `totalGiftValueReceived`, `households`, `processedEventIds[]`, `history[]`, `queue[]` |
| `harbourGeneral` | `schemaVersion`, `owned`, `purchasedDay`, `slots[]`, stock maps for 17 products, `tillCoins`, lifetime sales/spend/loss totals, `salesByItem`, `recentSales[]` |
| Legacy audit retention | `legacyReconciliation`, `legacySnapshot` |

## Repeated record shapes

- Transaction/history records persist stable IDs, amount or item/quantity, reason/kind, resulting balance, source identifiers and timestamp/day as applicable.
- NPC records persist identity, position/node/route, schedule/activity, needs, relationships, narrative stage/history, interaction and behaviour counters.
- Animal records persist identity, trust/friendliness, adoption/follower status, food/care timing, route/visibility/rare-visit state and event counters.
- Farm bed/tree/lawn records persist stable IDs, coordinates where applicable, ownership/unlock, crop/tree/status, planted/mature/ready timing, yields/harvests and care/growth state.
- Active minigame records persist session ID, assigned level/mode, board/engine state, undo or preparation state, resources/timers, reward/processed identity and return position/facing.
- Level maps use stringified stable level IDs; processed-session/transaction/event arrays provide reward and transaction idempotency.

## Persisted fields that must remain protected

Coins and ledger reconciliation; item ownership and loadouts; house and placeable ownership/transforms; progression, unlocks, best results and level counts; NPC and animal identity/state; farming and environment timers; gift eligibility/delivery; shop state; active minigame checkpoints; return position; legacy source snapshot; all processed-ID collections preventing duplicate grants.
