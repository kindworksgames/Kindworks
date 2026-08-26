# Harbour General — Milestone 37

Milestone 37 migrates the complete original Harbour General business into the
Phaser game. It is a walkable top-down shop reached from its existing town
building and returns the player to the exact saved town position.

## Ownership and opening hours

- The deed costs exactly 5,000 KindlyCoins.
- Buying the deed is atomic: ownership, the coin balance, lifetime spending,
  the ledger and starter stock either all save or all roll back.
- The shop opens at 07:00 and closes at 21:00 for NPC customers.
- Amelia remains the shopkeeper and does not shop at her own business.

## Displays and stock

- There are exactly six display slots. A product can occupy only one slot;
  assigning it elsewhere swaps the displaced products safely.
- The starter displays are Umbrella, Raincoat, Wool scarf, Reusable bottle,
  Tissues and Newspaper, each with four units.
- All 17 original products, wholesale costs, sale prices and base-demand values
  are preserved.
- Restocking is immediate and buys up to four units at the product's wholesale
  price. No product can exceed 24 units.
- Clearing or changing a display never deletes the stock held for that product.
- Fish and fresh produce remain with their specialist shops and cannot leak
  into Harbour General's catalogue.

## NPC sales and weather wardrobes

- Eligible residents physically route to the shop during opening hours and buy
  in person; this business has no delivery system.
- A 12 percent browse-without-purchase chance is preserved.
- Displayed, available products are weighted by their original base demand and
  clear, rainy, windy or snowy weather multiplier.
- Umbrellas, raincoats, winter jackets, gloves, scarves and wool hats enter a
  persistent per-resident wardrobe. A resident does not repurchase a weather
  item already owned.
- Successful purchases reduce live stock, add the exact retail price to the
  till, update per-item and lifetime statistics, record one of eight recent
  sales, satisfy the resident's errand need and visibly give them a shopping
  bag.

## Till, saving and recovery

- The till holds in-person proceeds separately from the player's wallet.
- Collecting transfers the entire till in one verified transaction and records
  a dedicated ledger entry.
- A failed save restores the exact pre-action state for deed purchase,
  restocking, display changes and till collection.
- Game-state schema 33 adds `harbourGeneral` and normalizes all NPC wardrobes.
  Schema-32 and original-HTML saves upgrade without altering their retained
  legacy snapshot.

## Controls and QA

- Walk with the existing keyboard, pointer or touch controls.
- Select a shelf by approaching or tapping it, browse all 17 products in the
  right-side panel, and use the shared Assign, Restock, Clear and Collect Till
  actions.
- `Esc` or the exit interaction returns to town.
- The interior uses the established mobile landscape layout. Portrait mobile
  shows the rotate-device guidance rather than compressing the playable room.
- Development launch option: `?qa=harbour-general` grants enough test coins and
  places the player at the Harbour General entrance.
- Console diagnostics: `kindworksHarbourGeneralDiagnostics()` and
  `kindworksQaHarbourNpcPurchase()`.
