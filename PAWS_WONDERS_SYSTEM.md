# Paws & Wonders — Milestone 36

Milestone 36 restores the complete original Paws & Wonders adoption system in
Phaser without altering the protected HTML game or introducing a second animal
inventory.

## Stable original identities

- Map node: `biz_arcade`
- Shop identity: `shop-11`
- Current scene: `PawsWondersScene`
- Shopkeeper: Evie, `Pet shop keeper`
- Resting location after adoption: `south-meadow`

The shop contains exactly eleven permanent animal identities: six distinct dog
breeds, four unusual companions, and the featured Baby Triceratops. Catalogue
names, breeds, personalities, descriptions, prices and compatible care foods
are pinned in `src/data/pawsWonders.js`.

## Physical shop

The original open top-down composition is implemented as a walkable Phaser
interior. Every companion has a tappable habitat contained inside one of three
authored fixtures: dog lounges, specialist habitats, or the mystery nest. Evie
and Noah keep their original shop-floor roles. The right detail panel always
shows the selected companion's temperament, food, location, permanent adoption
status, exact price and any restoration lock.

Keyboard and touch movement share the normal player controller. `E` or Space
inspects the closest habitat, `A` adopts the selected available companion, and
Escape or the visible return button leaves for the exact saved town position.
Mobile landscape is required so the habitat floor and detail panel remain
legible; portrait shows the established rotate-phone screen.

## Adoption rules

- Every adoption uses ordinary KindlyCoins at the exact original price.
- Each companion can be adopted only once and remains permanently adopted.
- Sprout's mystery egg unlocks after exactly three restoration milestones.
- There is no total companion-family cap.
- A newly adopted companion starts at 100 trust and roams in South Meadow.
- An already active follower remains active; the new companion never replaces it.
- The animal, care dates, coins, lifetime spending and bounded coin ledger entry
  commit in one verified save transaction.
- A failed save restores the complete pre-adoption checkpoint.

Milestone 35's ordinary friendship adoption action intentionally continues to
reject shop pets; they must be adopted through Paws & Wonders.

## Verification

`tests/paws-wonders.test.js` pins the complete catalogue and layout, stable town
and NPC identities, care-food compatibility, three-milestone egg gate, coin
reconciliation, active-follower preservation, permanent reload, duplicate and
insufficient-funds handling, full eleven-companion family, and failed-save
rollback. The complete project suite contains 364 passing tests.

Desktop and 844×390 mobile-landscape browser checks cover shop entry, physical
layout, a real 420-coin adoption, the South Meadow confirmation, sold state,
orientation switching, return to town and a clean console. A 390×844 portrait
check confirms the dedicated rotation guidance with no page overflow.
