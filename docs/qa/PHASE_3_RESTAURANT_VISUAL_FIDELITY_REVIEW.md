# Phase 3 Restaurant Visual Fidelity Review

Status: **CONFIRMED FIDELITY FAILURE — RECOVERY REQUIRED**  
Review branch: `phase-3-legacy-fidelity-recovery`  
Protected visual reference: `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html`  
Review viewport: `1280×720`  
Reviewed: Little Bakery, Corner Café, Morning Mug Coffee, Riverside Kitchen, South Shore Scoops

## Review conclusion

The concern is correct. The Phaser restaurant scenes do not presently reproduce the authored visual experience in the protected HTML game.

The protected HTML contains complete top-down restaurant presentations: individual pixel customers seated at tables, order bubbles, counter tickets, three physical preparation spaces, venue furniture, appliances, ingredient displays, a worker on the floor, carried food, appliance loading/unloading, and distinct visual state changes. South Shore Scoops additionally constructs complete products as crisp procedural artwork and animates customers leaving the queue.

The Phaser versions preserve much of the campaign data and service logic, but their presentation is predominantly large coloured rectangles, a few emoji, static placeholder workers, and an oversized DOM work panel covering the room. These scenes currently communicate the rules, but they do not look or feel like the authored HTML games.

This review does **not** approve the Phaser restaurant visuals as a mobile adaptation. The reduced Phase 2 control hierarchy may remain, but the underlying rooms, actors, food, appliances, animation, and state feedback must be recovered.

## Operated comparison evidence

Each pair was entered and started through the normal visible controls in both builds.

| Venue | Protected HTML | Current Phaser |
| --- | --- | --- |
| Little Bakery | `phase3-evidence/restaurants/legacy-little-bakery.jpg` | `phase3-evidence/restaurants/phaser-little-bakery.jpg` |
| Corner Café | `phase3-evidence/restaurants/legacy-corner-cafe.jpg` | `phase3-evidence/restaurants/phaser-corner-cafe.jpg` |
| Morning Mug | `phase3-evidence/restaurants/legacy-morning-mug.jpg` | `phase3-evidence/restaurants/phaser-morning-mug.jpg` |
| Riverside Kitchen | `phase3-evidence/restaurants/legacy-riverside-kitchen.jpg` | `phase3-evidence/restaurants/phaser-riverside-kitchen.jpg` |
| South Shore Scoops | `phase3-evidence/restaurants/legacy-south-shore-scoops.jpg` | `phase3-evidence/restaurants/phaser-south-shore-scoops.jpg` |

The evidence is intentionally recorded at the original 1280×720 reference size. Phone and tablet matrices remain required after each recovery batch.

## Shared visual gap

| Area | Protected HTML behavior | Current Phaser behavior | Classification |
| --- | --- | --- | --- |
| Room composition | A readable top-down room is divided into dining/queue, order counter, preparation counter, and working kitchen. Furniture and routes explain how the venue operates. | Large flat colour zones and geometric blocks imply the same areas without reproducing the room. | **MISSING** |
| Customers | Individual pixel people have skin, hair, clothing, chairs, tables, names, order bubbles, patience, waiting, active, and leaving states. | Aggregate emoji and text cards represent customers. | **MISSING** |
| Worker | The chef/barista/baker walks to a tray, collects or carries the preparation, walks to the appliance, loads it, waits, unloads it, and returns. | One stationary chef emoji changes to motion/ready/burnt emoji. | **MISSING** |
| Food payload | Ingredients and completed food visibly occupy trays, travel with the worker, enter appliances, and return ready. | The active step is shown as a text/icon token. Nothing physically moves through the room. | **MISSING** |
| Appliances | Appliances are physical fixtures with independent cooking, ready, and burn timing tied to a preparation tray. | Café, Morning Mug, and Riverside use one scene-level transient station state. Bakery now permits tray-specific delays but still lacks authored appliance presentation. | **PARTIAL** |
| Preparation spaces | Three physical trays are visible in the room and keep independent products. | DOM cards track trays but cover the room; physical tray artwork is absent. | **PARTIAL** |
| Input feedback | Selected tickets/trays, highlighted stations, moving worker, carried payload, appliance state, and finished food make the action visible in-world. | Most feedback occurs inside the overlay panel and status sentence. | **PARTIAL** |
| Results | Authored venue identity remains visible around the result and service flow. | Shared result cards are functional, but the placeholder scene remains behind them. | **PARTIAL** |

Protected source anchors include the restaurant DOM and visual systems around lines 498–930 and 1519–1635, the kitchen worker/payload animation around lines 2057–2122, the shared cooking renderer around lines 5250–5313, the Bakery renderer around lines 5505–5557, and the Scoops product/customer renderer around lines 5678–5725.

## Venue findings

### Little Bakery

The three-customer/three-tray gameplay model has now been recovered in Phaser and independently verified. Its artwork is still not faithful.

Missing or simplified:

- Six actual customer tables and individual seated customer sprites.
- Order bubbles placed beside the correct customer.
- The physical order counter with three tickets.
- Three full-size preparation spaces with visible food state.
- Flour and milk fixtures, oven area, bakery bench, displays, and venue props.
- Baker walking, facing, carrying dough/product, loading stations, and returning.
- Tray-owned appliance state presented in the room.
- Finished bread/pastry/cake product artwork.
- Authored ready, failure, and service movement feedback.

Current owner: `src/scenes/BakeryScene.js`. The placeholder nature is visible in `drawInterior()` and its three emoji text objects. The protected recipes, 150 levels, arrival schedule, patience, rewards, unlocks, and save behavior must remain unchanged.

Classification: **GAMEPLAY MODEL RECOVERED; VISUAL FIDELITY FAILED**.

### Corner Café

The three trays, scheduled arrivals, per-customer patience, exact recipes, rewards, and no-miss rule remain represented. The authored café presentation is absent.

Missing or simplified:

- Pixel café dining room with six tables, chairs, individual diners, cups, and order bubbles.
- Physical counter tickets and prep trays.
- Hot-water/toaster fixtures as in-world appliances.
- Worker route, carried dish, load/wait/unload/return flow.
- Independent appliance ownership and visible appliance state.
- Visible tea, toast, breakfasts, lunches, bakery treats, and desserts as completed food.
- Customer service/departure animation.

Current owner: `src/scenes/CafeScene.js`. Its `drawInterior()` uses geometric room bands and static emoji. Its single `this.station` blocks the venue globally and does not represent independent physical appliances.

Classification: **FUNCTIONALLY STRONG; VISUAL AND APPLIANCE FIDELITY FAILED**.

### Morning Mug Coffee

The protected drink catalogue, three trays, queue, exact preparation steps, save/resume contract, rewards, and no-miss flow remain represented. The scene reuses a simplified generic cooking-room presentation instead of the authored coffee venue.

Missing or simplified:

- Morning Mug-specific furniture, service counter, coffee equipment, storage, and preparation surfaces.
- Individual seated customers and drink bubbles.
- Barista walking, carrying cups, loading grinder/machine, retrieving drinks, and serving.
- Physical cups and increasingly complex drink artwork.
- Independent grinder, espresso, steam, cold, and finishing station state.
- Visible burnt state even though burn windows exist in the protected data.
- Saved transient appliance state during a work/ready/burn window.

Current owner: `src/scenes/MorningMugScene.js`. It uses one stationary barista emoji and one scene-level `this.station`; the scene only exposes working and ready states.

Classification: **FUNCTIONALLY STRONG; VISUAL, BURN, AND APPLIANCE FIDELITY FAILED**.

### Riverside Kitchen

The protected 150 levels, 32 recipes, three trays, exact heat settings, arrival/patience rules, rewards, and no-miss flow remain represented. The authored restaurant room and physical cooking flow are absent.

Missing or simplified:

- Full restaurant dining room, six tables, individual diners, place settings, and meal bubbles.
- Physical pass, order tickets, three meal trays, and kitchen fixtures.
- Chef movement and carried plates/components.
- Independent pan, pot, grill, oven, chopping, mixing, and plating presentation.
- In-world working, ready, burnt, clearing, retry, and serve animations.
- Save-safe transient appliance state; `this.station` currently exists only in the scene.
- Authored burger, pasta, salad, soup, fish, steak, and roast presentation.

Current owner: `src/scenes/RiversideKitchenScene.js`. It has working/ready/burnt logic for the selected scene-level station, but not the independent physical equipment and worker/payload model in the protected HTML.

Classification: **FUNCTIONALLY STRONG; VISUAL AND TRANSIENT-STATE FIDELITY FAILED**.

### South Shore Scoops

Scoops has the clearest visual regression. Its campaign, queue, build sequence, two-item trays, 60% pass threshold, rewards, restoration progress, and resume state remain represented, but its central picture-making presentation has been reduced.

Missing or simplified:

- Complete procedural product renderer for cones, cups, sundaes, waffles, shaved ice, drinks, lemonade, and lollies.
- Crisp shape, scoop, sauce, topping, cup, cone, stick, straw, waffle, and garnish composition.
- Individual customer pixel avatars and large order bubbles.
- The numbered station layout and spacious build board.
- Large selected-order artwork used as the visual target.
- Physical tray artwork for completed first items.
- The protected customer departure animation before the next order advances.
- Customer/current/preview/selected/patience visual states.

The protected product renderer is implemented around `scoopsProductSvg()` and `scoopsProductHtml()`. The current `src/scenes/SouthShoreScoopsScene.js` creates products from compact icon/colour tokens instead of rebuilding those compositions.

Classification: **FUNCTIONALLY STRONG; CORE PICTURE-GAME VISUAL FIDELITY FAILED**.

## Protected behavior that must not change

Restaurant art recovery must not alter:

- Little Bakery: 150 levels, 24 recipes, three trays, scheduled arrivals, no misses, reward/unlock/save rules.
- Corner Café: 150 levels, 64 recipes, three trays, arrival schedule, exact steps, reward/unlock/save rules.
- Morning Mug: 150 levels, 54 recipes, exact drink steps, resumable shifts, reward/unlock/save rules.
- Riverside Kitchen: 150 levels, 32 recipes, exact heat settings, burn windows, resumable shifts, reward/unlock/save rules.
- South Shore Scoops: 750 levels, 24 parts, order plans, two-item trays, 60% pass rule, reward cap, restoration and resume rules.
- Shared economy, first-clear protection, replay protection, town entrances/returns, customer patience, completion, and failure rules.

## Required labelled visual inventory

Every recovered object must receive a stable asset label before Sprite AI production. At minimum, the inventory must include:

- `KW-REST-SURFACE-*`: venue floors, walls, tiles, rugs, counters, passes, benches, windows, doors, shelves, signs, and lighting.
- `KW-REST-FURNITURE-*`: tables, chairs, stools, trays, ticket rails, display cases, sinks, fridges, storage, bins, and decorations.
- `KW-REST-CUSTOMER-*`: body, skin, hair, clothing, seated, waiting, ordering, patient, impatient, receiving, happy, leaving, and empty-seat states.
- `KW-REST-WORKER-*`: idle, walk directions, collect, carry, load, wait, unload, return, serve, mistake, ready, and burnt-response states for chef, barista, and baker.
- `KW-REST-APPLIANCE-*`: idle, selected, working, ready, burnt, clearing, disabled, and tray/payload occupancy for every appliance.
- `KW-REST-FOOD-*`: every ingredient, intermediate preparation, completed recipe, carried payload, tray item, order picture, served item, and failed/burnt item.
- `KW-BAKERY-*`, `KW-CAFE-*`, `KW-MUG-*`, `KW-RIVERSIDE-*`, `KW-SCOOPS-*`: venue-specific fixtures, identity art, food families, and special animations.

Labels must be attached to runtime objects and included in the existing Milestone 45 inventory so a later Sprite AI export can account for every visible object and state.

## Recovery order

Do not rebuild all five venues in one untestable change.

1. **Shared kitchen presentation foundation**
   - Create reusable customer, table, ticket, tray, worker, carried-payload, appliance, and food-render state contracts.
   - Keep the existing responsive HUD and service APIs.
   - Add deterministic visual-state tests and asset labels.

2. **Little Bakery visual recovery**
   - Apply the foundation to the newly recovered concurrent tray model.
   - Reproduce the protected room, six tables, counter, three trays, bakery fixtures, and worker route.
   - Verify early, middle, and late recipes plus simultaneous appliance use.

3. **Corner Café visual recovery**
   - Restore the protected café room and product flow.
   - Replace the single scene-level station with independent visible appliance instances without changing recipe rules.

4. **Morning Mug visual recovery**
   - Restore the specialist coffee identity, drink visuals, worker flow, independent appliance states, visible burnt state, and save-safe transient timing.

5. **Riverside Kitchen visual recovery**
   - Restore the dining room, pass, equipment, meal art, worker flow, independent heat stations, burn/retry flow, and save-safe transient timing.

6. **South Shore Scoops visual recovery**
   - Port the protected procedural product renderer first.
   - Restore customer avatars, order pictures, numbered stations, build board, tray art, and departure animation.

7. **Full venue regression matrix**
   - Test early/middle/final representative levels, wrong actions, appliance work/ready/burn, simultaneous customers, success, failure, replay, save/reload, rotation, town return, touch input, and every required phone/tablet landscape viewport.

## Review verdict

**FAIL for restaurant visual fidelity.**

The restaurant data and much of the gameplay logic are substantially migrated, and Little Bakery’s concurrent model is now recovered. The restaurant presentation is not yet a faithful Phaser migration. Phase 3 must treat the five venue visual recoveries as required work, not optional future art polish.
