# Milestone 40 — onboarding, town naming and login rewards

Milestone 40 migrates the original first-run and returning-player flow from the protected version-82 HTML game into Phaser. The original HTML remains byte-for-byte read-only.

## First run

The welcome panel opens automatically for a genuinely new Phaser save. The player must first choose a valid town name, then uses the existing resident creator to create exactly one resident and select the included Level 1 Meadowlight House design. Completion is inferred only from durable state: the town must be named and the one stable custom-resident identity and home must exist.

Town names keep the original validation contract: one through 24 characters after trimming and whitespace collapse; Unicode letters and numbers are supported; spaces, straight and curly apostrophes, and hyphens are the only punctuation; and punctuation-only names are refused. A failed save leaves the previous town identity unchanged.

After setup, a compact checklist guides the player through Lawn Care, Waste Collection, and River Clear-Out in that exact order. Entering each game marks its tutorial as both seen and tried. Re-entry is duplicate-safe. Beach Cleanup and Playground Power Wash retain compatible seen/tried fields for original-save migration even though they are not part of the initial three-job checklist.

The first restoration gift is still owned by the Milestone 30 restoration transaction. Unlocking Wake grants one Town Planter, records its zero-coin ledger entry, and updates onboarding in the same candidate save. Milestone 40 displays that result but does not create a competing gift path.

## Starter and return rewards

A fresh player begins with the existing single 100-coin starter ledger entry. Creating, upgrading, or reopening onboarding never creates a second starter grant.

Each new local calendar day pays 10 KindlyCoins once. If at least three calendar days have elapsed since the last durable login day, that visit also pays a 50-coin return bonus. A three-day return therefore pays 60 coins in one transaction. Same-day launches pay zero. A backwards clock is explicitly reported, pays zero, and cannot move the saved login day backwards.

Production builds do not trust device time. The runtime requires `window.KindWorksBilling.getTrustedTimeReceipt()` to return an externally verified result with `verified: true`, a positive `unixMs`, and a stable non-empty `receiptId`. Timestamps must increase and a receipt cannot be reused. Until the native/server verification bridge is connected, production rewards stay safely unavailable rather than trusting a changeable device clock. Development uses local time so the flow can be tested without commerce infrastructure.

Every successful login update is atomic across the coin balance, lifetime earnings, bounded ledger, login counters, reward days, trusted timestamp, and receipt id. Validation or persistence failure restores the full pre-login checkpoint, allowing a safe retry without duplicate or lost rewards.

## Save migration and verification

Game-state and envelope schema 35 add the onboarding domain. Schemas 1 through 34 initialize it safely from existing town, resident, home, restoration, and starter-ledger state. Original version-82 saves project `playerSetup`, `onboarding`, and `economy.loginRewards` by value while the complete `legacySnapshot` remains untouched.

The focused Milestone 40 tests cover name validation, one starter grant, atomic town naming, resident/home completion, tutorial duplication, daily and return amounts, same-day protection, clock rollback, failed-write rollback, verified trusted time, receipt reuse, and schema-34 migration. The full repository suite and production build are also required before publication.
