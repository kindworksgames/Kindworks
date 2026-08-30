# Harbour General — Stage 4 QA

## Result

**PARTIAL — business logic passes; physical touch operation remains untested.**

## Scope

Harbour General is the player-owned convenience/general-store business activity identified in the Stage 1 inventory. It is not a numbered campaign.

## Coverage and results

| Area | Result |
| --- | --- |
| Ownership/deed state | PASS |
| 17-product catalogue and unique IDs | PASS |
| Six physical displays | PASS |
| Buy cost, sell price, and positive margin | PASS |
| Stock capacity and four-case restock | PASS |
| Place on shelf | PASS |
| Customer selection, checkout, and till | PASS |
| Opening hours 07:00–21:00 | PASS |
| Insufficient funds and invalid actions | PASS |
| Rapid repeat/transaction guards | PASS |
| Save/reload of ownership, stock, shelf, and till | PASS |
| Live business layout/state/re-entry | PASS |
| Browser-emulated 568×320 and 844×390 visibility | PASS |
| Physical-device purchase/restock touch | UNTESTED |

Live inspection used an owned-business fixture with 20,000 coins. Six displays, selected-product details, stock/on-shelf values, margins, customers, checkout, and till were visible without a blank screen or runtime error. Canvas controls did not expose a dependable semantic target to browser automation, so service-layer tests—not an unreliable coordinate click—are the evidence for transactions.

No product definition, duplicate ID, invalid margin, unreachable display, or save integration defect was found.

