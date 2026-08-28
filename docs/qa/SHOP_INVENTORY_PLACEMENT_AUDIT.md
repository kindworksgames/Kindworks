# KindWorks Shop, Inventory and Placement Audit

## Scope and baseline

- Branch: `phase-2-ui-simplification`
- Starting commit: `b52b587`
- Protected source: current Phaser catalogue, prices, unlocks, save schema and previously validated farming/equipment rules
- Visual references: the seven supplied Willowmere Shop mower, vacuum, tree, seating, bin, decoration and furniture images
- Reference-use rule: the images were analysed as layout and styling references only. They were not pasted into the game or used as non-interactive shop backgrounds.

## Findings and corrections

| ID | Finding | Correction | Result |
| -- | ------- | ---------- | ------ |
| SHOP-001 | Existing tests covered separate shop, inventory and placement services but did not prove the complete contract for every released product. | Added one exhaustive contract suite covering every shop product, destination, purchase, reload, placement and equipment line. | VERIFIED |
| SHOP-002 | The shop offered direct placement only for town objects. Owned furniture required an unexplained inventory detour. | Added a contextual `Furnish home` action that enters the personal resident's home with that exact owned item ready to position. | VERIFIED LIVE |
| SHOP-003 | Purchased orchard saplings correctly lived in the protected farming domain, but were absent from the inventory screen and therefore appeared lost. | Kept the save structure unchanged, surfaced purchased saplings as inventory-visible farming stock and routed `Plant in town` to orchard placement. | VERIFIED |
| SHOP-004 | Product destinations and tool benefits were implicit. | Added one explicit destination contract for town, personal home, orchard, allotments, Animal Friends, Lawn Care and House Rescue; the selected-product panel now explains the relevant destination/effect. | VERIFIED |
| SHOP-005 | The prior shop layout did not reflect the supplied Willowmere references and had no search or sorting. | Rebuilt the interface as code-native wood-and-parchment composition with a category rail, functional search, functional price/name sorting, product shelves, selected-product detail and contextual action area. | VERIFIED LIVE |
| SHOP-006 | Small-phone controls risked shrinking below the shared touch target. | Kept the category rail internally scrollable and restored 44px category, close, buy and placement actions at the narrow landscape breakpoint. | VERIFIED RESPONSIVE |

## Complete released-stock contract

| Product family | Released products | Purchase and reload | Correct destination/use | Runtime effect/placement |
| -------------- | ----------------: | ------------------- | ----------------------- | ------------------------ |
| Town objects | 32 | PASS | Willowmere town | All 32 independently purchased, positioned, confirmed and saved |
| Home furniture | 10 | PASS | Personal resident's home | All 10 independently purchased, positioned, confirmed and saved |
| Mower upgrades | 5 purchasable + starter | PASS | Lawn Care | Every successive tier strictly reduces resistant-grass/weed travel time |
| Vacuum upgrades | 4 purchasable + starter | PASS | House Rescue | Every successive tier strictly increases power, reach and movement speed |
| Allotment seeds | 3 | PASS | Unlocked allotment beds | Stored in consumable inventory and routed to farming |
| Apple sapling | 1 | PASS | Clear open town ground | Remains owned farming stock until confirmed planting consumes it |
| Animal foods | 12 | PASS | Animal Friends | Stored in consumable inventory and routed to animal interaction |
| **Total purchasable products** | **67** | **PASS** | **Every product has one explicit destination** | **PASS** |

The 67-product purchase test uses exact existing prices and unlock requirements, performs the purchases through `ShopService`, reloads the persisted save and verifies the correct protected ownership domain for every item.

## Live browser verification

The rebuilt development game was operated through the visible interface, without runtime state injection:

1. Opened Willowmere Shop through the Town menu.
2. Filtered Mowers to `SwiftCut` and verified the shelf and detail selection updated.
3. Sorted Decorations by highest price and verified the visible order changed from the 75,000-coin monument down to the 800-coin products.
4. Purchased a Leafy House Plant; balance changed from 200,000 to 199,150 and owned quantity changed from 0 to 1.
5. Used `Furnish home: Leafy House Plant`; the game entered Meadowlight House with the exact item active.
6. Moved the preview to a valid clear position, confirmed it and observed `1 / 60 placed` with `Leafy House Plant saved in your home.`
7. Purchased a Young Maple; balance changed from 199,150 to 197,650.
8. Used `Place in town: Young Maple`, moved the preview away from cottages, road and river, confirmed a clear position and returned to ordinary Town play.

Responsive shop operation was checked at 568×320, 812×375, 844×390, 1024×768 and the 1280×720 reference setting. The smallest layout keeps the shop internally scrollable rather than shrinking all controls into an unusable full-catalogue view.

## Automated verification

- Dedicated end-to-end shop contract: 6/6 tests pass.
- Complete repository suite: 586/586 tests pass.
- Production build: PASS.
- Performance budget: PASS.
- Initial application bundle: 3,022,179 bytes.
- Phaser engine bundle: 1,374,829 bytes.
- Lazy chunks: 19.

## Save and gameplay protection

- No price, unlock requirement, reward formula, item identity or existing placement coordinate was changed.
- No save-schema version change was required.
- Orchard saplings remain in the already validated `farming.orchard.purchasedSaplings` domain; the inventory screen now represents that owned stock without duplicating it.
- Purchases, equips, placements and persistence failures retain the existing atomic rollback behavior.

## Verdict

**PASS — the released Willowmere shop catalogue now has a verified purchase-to-inventory-to-correct-use contract, and the interactive layout follows the supplied references without using them as static pasted screens.**
