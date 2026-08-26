# Kindworks Phaser shop contract

Milestone 24 completes the original ordinary in-game coin shop, equipment,
inventory, and transaction path. It does not introduce real-money purchases,
subscriptions, or object placement; purchased placeables remain inventory until
the dedicated placement milestone.

## Retailers and ownership

- `willowmere-shop` sells all 51 released tools, trees, seating, bins,
  decorations, and furniture products across seven category tabs.
- `town-grocer` preserves legacy `shop-02` and sells three farming seed products
  plus five everyday animal treats.
- `fresh-market` preserves legacy `shop-10` and sells the seven products below.

Every released ordinary product has exactly one owner. QA items, subscription
stock, fishing-only finds, farm harvests, and zero-price starter items are never
offered as coin purchases.

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

## Shared transaction path

1. Resolve a known shop.
2. Reject any item not stocked by that shop.
3. Read the exact shared-catalogue price and current owned quantity.
4. Validate positive quantity, affordability, and inventory capacity.
5. Apply inventory and coin changes to one candidate state.
6. Apply the best eligible lower-tier equipment credit when applicable.
7. Record item, quantity, retailer, unit/list price, credit, signed cost,
   post-transaction balance, reason, and time in the coin ledger.
8. Validate and persist through the safe-save repository.
9. If persistence fails, restore the exact pre-purchase checkpoint.

Closing the shop or changing scenes does not mutate coins or inventory. A completed purchase is immediately visible in the global wallet and inventory HUD and survives reload.

## Player experience

- Willowmere Shop opens from the always-visible Shop button. Village Grocer and
  Fresh Market also open from their physical town doors.
- Category tabs expose only stock owned by that retailer.
- The catalogue shows exact price, affordability, capacity, owned quantity,
  unlock progress, upgrade credit, and equipped state.
- Selecting a product shows its description and a single-unit purchase action.
- Owned equipment has a separate Equip action; equipping never sells or deletes
  the previous tool.
- Insufficient funds reports the exact missing amount without spending coins.
- Success reports the new owned quantity and remaining balance.
- Escape closes the shop, restores focus to the town interaction, and resumes movement.
- The modal traps keyboard focus and supports arrow-key product navigation.

## Equipment and inventory rules

- Mowers cost 0 / 2,000 / 7,500 / 12,000 / 20,000 / 30,000 coins and unlock
  after 0 / 3 / 8 / 15 / 30 / 50 perfect Lawn Care results.
- Vacuums cost 0 / 5,000 / 15,000 / 35,000 / 70,000 coins and provide exact
  power 1–5, reach 36–52, and speed multipliers 1–1.35.
- A new tool receives 50 percent of the highest-priced owned lower paid tier as
  upgrade credit. Only one credit applies.
- Equipment and unique furniture have a limit of one. Seeds, produce, and
  edible catches have a limit of 99. Other legacy stackable inventory retains
  its 9,999 limit.
- Every purchase, equip, and consumable use is immediately validated and saved.
  A failed write restores the complete wallet, inventory, ledger, and equipped
  loadout checkpoint.
