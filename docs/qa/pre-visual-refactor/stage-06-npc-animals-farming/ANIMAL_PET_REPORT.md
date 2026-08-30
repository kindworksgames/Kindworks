# Stage 6 Animal and Pet Report

## Inventory and deterministic coverage

- 37 species.
- 56 stable identities: 45 wildlife and 11 Paws & Wonders companions.
- Five rare species: wolf, sea otter, beaver, capybara and baby pig.
- 27 regular wildlife species were all observed in a seeded 180-day/30-minute sample.
- The visible wild map cap remained four throughout that sample.
- Common/high-weight animals appeared more often than low-weight animals; cat had 4,300 observations and turtle 202 in the recorded sample.

## Coverage matrix

| Requirement | Status | Evidence |
| --- | --- | --- |
| Every species and unique identity | PASS | Exhaustive definitions, IDs, species references and acquisition sources validate |
| Habitat and route | PASS | Every identity has at least five route points and a valid habitat |
| Rarity and spawn probability | PASS | Weight distribution and original schedule periods/windows remain deterministic |
| Map cap | PASS | Maximum visible unadopted wildlife remained four |
| Water-animal restrictions | PASS | Every non-shop water route remains within 1.5 world units of the authored river path |
| Mutually exclusive rare animals | PASS AFTER REPAIR | One deterministic active visitor owns the visible and notification slot; the next eligible visit receives a handoff |
| Correct food and favourites | PASS | Every accepted/favourite item exists and has shop, farm or fishing acquisition |
| Feeding consumption | PASS | Wrong food consumes nothing; correct/favourite food consumes exactly one and grants bounded trust |
| Friendliness and befriending | PASS | Greetings, cooldown, trust, common fourth-request and rare sixth-request guarantees pass |
| Follower selection/change | PASS | Only one adopted companion can be active; clearing/change is idempotent |
| Follower home entry | PASS | Active companion enters personal home; inactive companions are excluded |
| Other pets in South Meadow | PASS | Adopted non-followers use the exact South Meadow route |
| Five-pet cap and freeing | USER DECISION REQUIRED — S6-UDR-001 | Latest HTML and Phaser intentionally use unlimited companions; older protected text says five/freeing |
| Save/load and duplicate spawning | PASS | Resident IDs are stable; adoption/follower/trust persist; unadopted shop pets are hidden from wild rotation |
| Movement and animation state | PASS | Ground/water/aerial motion, rare entry/return, pause and relocation transitions are deterministic |

## Rare visitor defect

An exhaustive schedule probe sampled 840 days—the combined repeating schedule horizon—at five-minute intervals. Maximum concurrent rare visitors was three. Confirmed overlaps included:

- day 2, 08:30–08:55: wolf and beaver;
- day 8: wolf and baby pig;
- day 18: beaver and baby pig.

This is deterministic. `worldAnimalPresentations()` gathers every active rare definition and appends each until the global four-animal cap is reached. `rareVisitState()` evaluates each schedule independently; there is no exclusive slot or priority arbitration.

The repair adds a shared `activeRareVisitor()` arbiter. Offline replay receives priority; otherwise the earliest active visit wins, followed by stable identity as a tie-breaker. The selector is shared by world presentation and arrival notifications. When the first visit ends, the next still-active visitor receives the slot and its one saved notice. The exhaustive 840-day/five-minute repair test observes all five rare species, confirms the original raw overlap fixture still reaches three, and proves the selected visible visitor never exceeds one.

## Pet-cap/freeing product decision

The repositories contain contradictory contracts:

- older visual-readiness protection text says five-pet cap and freeing;
- the latest protected HTML defines `southMeadowCompanionCap:null` and explicitly reports an error if the limit is not removed;
- Phaser tells the player `no family limit`, permits all 11 Paws companions, and treats shop companions as permanent;
- wild companions can automatically return to the wild below 50 trust, but there is no voluntary free/release command.

Because the latest HTML is the functional source of truth, this audit does not call the current unlimited behaviour a confirmed migration defect. The user must choose whether to retain the latest unlimited model or restore the older five/free contract.

## Live evidence

At 1280×720, Animal Friends listed the complete stable roster. Nearby goat Nettle accepted one greeting, trust changed 15%→22%, the feedback explained the +7 result, and reload retained 22%. Incompatible/no-inventory food controls remained disabled. The surface reported zero adopted and no family limit, directly confirming the contract conflict is player-visible.
