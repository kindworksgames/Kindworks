# Kindworks Phaser shop contract

Milestone 5 proves one complete ordinary retailer through the shared Milestone 4 economy. It intentionally does not migrate adoption, farming stock, recipes, placement, rotating stock, subscriptions, or real-money coin packs.

## First retailer

`fresh-market` preserves the legacy `shop-10` identity and sells exactly:

| Item ID | Display name | Price |
| --- | --- | ---: |
| `river-minnows` | River Minnows | 140 |
| `fresh-sardines` | Fresh Sardines | 220 |
| `river-trout` | River Trout | 360 |
| `pond-pellets` | Pond Pellets | 80 |
| `chicken-pieces` | Chicken Pieces | 180 |
| `beef-strips` | Beef Strips | 260 |
| `prepared-meat` | Prepared Meat Bites | 210 |

Every stock ID must exist in the shared item catalogue, identify `fresh-market` as its retailer, be a released consumable, and have a positive integer price.

## Shared purchase path

1. Resolve a known shop.
2. Reject any item not stocked by that shop.
3. Read the exact shared-catalogue price and current owned quantity.
4. Validate positive quantity, affordability, and inventory capacity.
5. Apply inventory and coin changes to one candidate state.
6. Record item, quantity, retailer, signed cost, reason, and time in the coin ledger.
7. Validate and persist through the safe-save repository.
8. If persistence fails, restore the exact pre-purchase checkpoint.

Closing the shop or changing scenes does not mutate coins or inventory. A completed purchase is immediately visible in the global wallet and inventory HUD and survives reload.

## Player experience

- Fresh Market opens from its physical town door.
- The catalogue shows all seven products, exact price, affordability, and owned quantity.
- Selecting a product shows its description and a single-unit purchase action.
- Insufficient funds reports the exact missing amount without spending coins.
- Success reports the new owned quantity and remaining balance.
- Escape closes the shop, restores focus to the town interaction, and resumes movement.
- The modal traps keyboard focus and supports arrow-key product navigation.
