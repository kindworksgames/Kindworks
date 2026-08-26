# Milestone 41: optional commerce and KindlyClub

Milestone 41 adds the secure game-side boundary for the optional KindWorks
store. It does not turn the browser build into a real checkout and it does not
contain store secrets. Production purchases remain disabled until the packaged
Apple and Google apps, their product records, and the KindWorks receipt/wallet
server are connected.

## Preserved catalogue

| Product | KindlyCoins | Display price |
| --- | ---: | ---: |
| `coins-1000` | 1,000 | £0.99 |
| `coins-3000` | 3,000 | £2.49 |
| `coins-6000` | 6,000 | £4.79 |
| `coins-13000` | 13,000 | £9.99 |
| `coins-27500` | 27,500 | £19.99 |
| `coins-80000` | 80,000 | £49.99 |

The packaged store bridge may replace these fallback GBP labels with prices
localized by Apple or Google. It may not replace the product IDs or grant
amounts.

| Membership | Monthly benefit | Monthly gift | Display price |
| --- | ---: | --- | ---: |
| `kindlyclub` | 2,000 coins | None | £4.99/month |
| `kindlyclub-creator` | 5,000 coins | Record Player | £9.99/month |
| `kindlyclub-champion` | 10,000 coins | Kindly Heart Planter | £19.99/month |

## Trust boundary

The browser and Phaser scene never manufacture a successful production
purchase. Production requires all of the following:

1. An adult deliberately confirms each checkout.
2. The native bridge reports `walletAuthority: "server"` and starts the Apple
   or Google transaction.
3. The KindWorks server verifies the store receipt and returns a signed result.
4. The client verifies that result with the pinned P-256 public key.
5. The product, entitlement, transaction or period, and complete authoritative
   wallet all match the expected operation.
6. The complete save validates and persists atomically.

The server response supplies the absolute coin balance, lifetime earned total,
lifetime spent total, and a strictly increasing wallet version. The client
never treats a locally calculated real-money balance as authoritative. A stale,
tampered, unsigned, mismatched, or unreconciled response is rejected.

The required native bridge surface is `window.KindWorksBilling`:

- `walletAuthority: "server"`
- `purchaseCoinPack(product)`
- `purchaseSubscription(product)`
- `restorePurchases()`
- `manageSubscriptions()`
- optional localized prices through `localizedPrices` or
  `getCachedLocalizedPrice(productId)`

Checkout methods return the signed server envelope. Restoration returns a
`receipts` array containing the same kind of envelopes. Subscription management
opens the platform's own management flow and never changes entitlement locally.

## Duplicate and failure safety

- Coin transactions are remembered by the server transaction ID; the latest
  5,000 IDs are retained.
- Membership benefits are remembered by subscription ID plus exact period
  start; the latest 240 periods are retained.
- The server wallet version remains the final replay barrier even after those
  bounded histories roll over.
- Monthly coins, the optional gift, membership state, economy ledger, and
  wallet version commit in one save. If a gift cannot fit, none of the monthly
  benefit is applied.
- Any invalid response or persistence failure restores the exact pre-operation
  checkpoint.
- Purchase restoration is safe to repeat. Already processed receipts update no
  balance and grant no second gift.

The commerce domain stores no card number, store password, date of birth, or
advertising identifier. The game does not use personalized advertising. Store
account, payment, refund, family-approval, and cancellation screens belong to
Apple or Google.

## Development sandbox

For visual and interaction testing only, a Vite development build opened with
`?qa=commerce` receives an in-memory no-charge bridge. Its receipts are accepted
only by the separately injected development verifier. This path is removed from
the production build by Vite's development guard and cannot validate a real
purchase. A normal browser or production build visibly reports that purchases
are unavailable.

## Save and QA contract

Game-state schema 36 adds `commerce` with wallet version, bounded processed
transaction/period histories, verified KindlyClub entitlement, and last restore
time. Schemas 1 through 35 gain a safe empty commerce domain. Original HTML
transaction histories and verified membership details project into the new
domain without replaying benefits or changing the retained legacy snapshot.

Automated coverage pins all products and benefits, disconnected-production
behaviour, adult confirmation, authoritative wallet checks, signed-verifier
boundaries, exact one-time grants, monthly gifts, restoration idempotency,
legacy projection, schema upgrades, and persistence rollback.
