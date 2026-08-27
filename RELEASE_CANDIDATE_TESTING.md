# Milestone 44 — release-candidate playtesting

## Outcome

Milestone 44 establishes the first Phaser web release candidate. It does not add
new gameplay. It verifies that the player can reach the migrated systems through
the real interface, that representative progression boundaries are present, and
that the most important cross-system journeys survive saving, reloading,
recovery and protected-HTML import.

The machine-readable contract is `src/data/releaseCandidate.js`. It builds on
the Milestone 43 parity manifest rather than replacing it. Development builds
expose the result through
`window.__KINDWORKS_PHASER__.getReleaseCandidateCertification()` and the
read-only `?qa=release-candidate` route. That route suppresses first-run and
login-reward processing and never writes a test fixture into the player's save.

## Twelve release journeys

| Journey | Required checkpoints |
| --- | --- |
| New player welcome | Name town, create resident, select included home, receive the single starter grant, see the first-job checklist |
| Town exploration | Keyboard movement, touch movement, zoom, nearby interaction, safe return from a modal |
| Restoration activities | Waste Collection, Lawn Care, River Clear-Out, House Rescue, Beach Cleanup, Playground Power Wash |
| Food-service venues | Little Bakery, Corner Café, Morning Mug, Riverside Kitchen, South Shore Scoops |
| Fishing and collections | Fishing, Magnet Fishing, aquarium housing, safe release, separate daily limits |
| Residents, animals and homes | Resident stories, Animal Friends, Paws & Wonders, home interiors, homeowner gifts |
| Economy and ownership | Shop, inventory, equipment, farming, town placement, Harbour General |
| Town restoration | Eight permanent milestones, reveals, gifts, festival, KindWorks Cinema |
| Save, exit and continue | Verified current save, reload, backup, recovery, active-session checkpoint |
| Protected HTML save copy | Inspect, copy, reconcile, reload, prevent reward replay, preserve source |
| Responsive and input | Desktop, mobile landscape, mobile portrait, 44-pixel controls, orientation, no overflow |
| Production safety | Commerce fail-closed, trusted-time fail-closed, no personalized advertising, clean console, production build |

Every journey has at least five explicit checkpoints. The manifest fails if a
journey is removed or the count changes without a reviewed update.

## Representative activity matrix

All 11 level campaigns are smoke-gated at their first, middle and final levels:

- 750-level campaigns: Levels 1, 375 and 750
- 150-level campaigns: Levels 1, 75 and 150
- Fishing and Magnet Fishing: one mode checkpoint each

That produces exactly 35 release-candidate activity checkpoints. The dedicated
domain suites remain responsible for verifying all 5,850 generated levels and
the detailed rules inside every activity.

## Save and migration journeys

The fresh-player release test uses the same production services as the game. It
names a town, creates one resident and the included Meadowlight starter home,
records Lawn Care, Waste Collection and River Clear-Out, then reloads the
verified schema-37 save. Town identity, resident identity, setup state, checklist
and coin balance must remain exact.

The legacy journey starts from the dense, integrity-sealed version-82 fixture.
It uses the real legacy inspector and importer, writes a separate Phaser save,
reloads that save and checks the migrated town, 50,000-coin balance, Level 3
personal home, aquarium fish and reconciliation record. The original HTML save
string must be byte-for-byte unchanged and the legacy and Phaser storage keys
must remain different.

The recovery journey writes two verified Phaser checkpoints, damages the current
envelope, and requires the repository to return the previous verified backup.
This is a deliberate in-memory test; no browser or user save is damaged.

## Live interface playtest

The running 1,280×720 release-candidate route reported:

- release ready: true;
- 12 player journeys;
- 35 activity checkpoints;
- save schema 37;
- the protected HTML SHA-256;
- TownScene active;
- no horizontal or vertical page overflow; and
- no browser warnings or errors.

The playtest opened and closed the actual Save, Shop, Inventory, Welcome, Animal
Friends, Resident Stories and KindWorks Impact interfaces. A first-run journey
then named `Release Willow`, created `Meadow`, selected three hobbies and the
included Meadowlight House, and verified that all three welcome steps and the
first-job checklist were shown as complete. This used an isolated local testing
origin and did not affect repository data.

The responsive contract continues to require 1,280×720 desktop, 844×390 mobile
landscape and 390×844 mobile portrait. Mobile controls are gated at a minimum of
44 pixels, page overflow is forbidden, and every activity except River Clear-Out
requires landscape. Milestone 43 supplied the live portrait Fishing check; the
Milestone 44 suite keeps that orientation rule and all three viewport gates in
the release contract.

All 438 automated tests pass with zero failures. The minified Vite production
build also completes successfully. Its only advisory is the existing large
single-bundle warning for the Phaser application; bundle splitting and startup
profiling belong to the following performance milestone.

## Production boundaries

This is a Phaser web release candidate, not yet an App Store or Play Store
binary. Optional purchases and production login rewards deliberately remain
fail-closed until the native billing and trusted-time/server-wallet bridges are
connected. Physical iPhone, iPad and Android validation belongs after Capacitor
packaging; this milestone does not claim testing on hardware that does not yet
have a native build.

The next release sequence is therefore:

1. final performance and presentation polish;
2. Capacitor iOS and Android packaging; and
3. physical-device, platform-service and store-submission testing.

## Release decision

The Phaser web build is eligible to continue as the Kindworks release candidate
when the Milestone 43 parity certificate, all automated tests, the production
build and the browser health check are green. Any later change to a journey,
activity boundary, save schema, supported HTML versions, viewport rule or
production-safety boundary must update this contract and its tests deliberately.
