# Stage 6 Findings Register

## Confirmed defects

### S6-NPC-001 — Residents occupy identical graph-node coordinates

- Severity: **P2**
- Classification: NPC movement/collision defect
- Status: **FIXED**
- Reproduction:
  1. Create a fresh deterministic game state with all 35 stable residents.
  2. Advance `NpcTownLifeService` once per game minute for seven days.
  3. At each snapshot, compare visible residents' world coordinates.
  4. Observe pairs sharing exactly the same `x,y`, often at shared work/leisure nodes.
- Expected: residents using the same destination remain individually selectable and visually distinct through deterministic local spacing, occupancy slots, or collision avoidance.
- Actual: multiple residents snap to the identical graph-node position and can remain there for hundreds of game minutes.
- Evidence: 10,080 snapshots; 75,865 exact resident-pair samples; peak 38 near-overlap pairs. Finn/Leo shared `dock` for 735 minutes/day; Ella/Lily shared `square` for 504.
- Affected files: `src/systems/NpcTownLifeService.js`, potentially shared navigation-node presentation/selection code in `src/scenes/TownScene.js`.
- Suspected root cause: `moveResident()` assigns every arrival to the exact node coordinates; no occupancy offset, personal-space rule or local separation exists.
- Save impact: none expected if correction remains derived/presentation-local; do not persist new coordinates or alter routes unnecessarily.
- Workaround: wait for a resident's schedule to diverge or use a context/list surface where available.
- Required regression test: deterministic all-resident seven-day stress must retain valid routes while preventing exact coordinate equality for visible residents; selection must still resolve each resident; water/building/bridge constraints must remain unchanged.
- Correction: added deterministic, derived presentation slots for coincident visible residents. `TownScene` now uses the same derived position for sprite rendering and tap/proximity interactions. Authoritative resident coordinates, routes and save schema are unchanged.
- Verification: 14-resident collision fixture passes with unique deterministic positions and no state mutation; live adjacent targets independently opened Theo and Ella; full suite 629/629.

### S6-ANIMAL-001 — Rare visitors are not mutually exclusive

- Severity: **P2**
- Classification: animal scheduling/rarity contract defect
- Status: **FIXED**
- Reproduction:
  1. Enumerate every minute or five-minute step over the 840-day combined rare-schedule horizon.
  2. Call the same rare schedule/visibility functions used by `worldAnimalPresentations()`.
  3. Count active unadopted rare definitions.
  4. Observe two or three simultaneous rare visitors.
- Expected: at most one rare visitor is active according to the protected mutual-exclusivity contract.
- Actual: independently evaluated schedules overlap. Confirmed examples include wolf+beaver on day 2 at 08:30–08:55 and three concurrent visitors elsewhere in the schedule horizon.
- Evidence: exhaustive 840-day/5-minute probe; maximum concurrent rare visitors three.
- Affected files: `src/data/animals.js` (`RARE_ANIMAL_ENCOUNTERS`, `rareVisitState`, `worldAnimalPresentations`), and possibly `src/systems/AnimalService.js` notification/replay arbitration.
- Suspected root cause: every rare definition is appended when active until the global wildlife cap; no deterministic exclusive priority/slot is chosen.
- Save impact: preserve stable resident IDs, rare visit counts, notices, missed-encounter replay and adopted rare animals.
- Workaround: none; overlapping rares are deterministic.
- Required regression test: exhaustive full-horizon schedule must assert 0–1 unadopted rare visitor at every minute, deterministic winner selection, one notice per visit, and no lost offline replay.
- Correction: added one shared deterministic rare visitor arbiter used by presentation and notifications. Offline replay wins first; otherwise earliest active visit wins with stable identity tie-breaking, followed by handoff when it ends.
- Verification: exhaustive 840-day/five-minute horizon observes all five species and never selects more than one; day-2 wolf→beaver handoff and one-notice-per-visit pass; full suite 629/629.

## User decision required

### S6-UDR-001 — Five-pet/freeing contract conflicts with latest HTML

- Classification: contradictory product contracts
- Status: **USER DECISION REQUIRED**
- Older expectation: maximum five owned pets and a player-triggered free/release action.
- Latest protected HTML: `southMeadowCompanionCap:null`; its own validation requires that the companion limit be removed.
- Current Phaser: player-facing `no family limit`; all 11 Paws companions can be adopted; shop companions are permanent; wild companions may automatically return to wild below 50 trust.
- Decision required: retain latest HTML unlimited/permanent Paws behaviour, or restore a five-companion cap plus voluntary freeing. The choice affects product rules and cannot be inferred safely during QA.
- No code change is authorized in this audit.

## Observations and coverage limitations

### S6-O01 — Interior autonomous NPC representation

- Severity: Observation
- Town residents route to authored home/venue nodes and become hidden from the exterior when inside. They do not instantiate as autonomous walkable avatars inside every house or preparation-room scene.
- Stage 4 separately certified service customers/workers and station flow. Treat expansion to universal interior NPC roaming as a feature decision, not a Stage 6 repair.

### S6-COV01 — Physical devices unavailable

- Severity: Coverage limitation
- Browser runtime at 1280×720 and deterministic system tests passed. Native iOS/Android background, kill/reopen, and physical touch interaction were not tested here.

## Severity count

- P0: 0
- P1: 0
- P2: 2 fixed, 0 open
- P3: 0
- User decisions required: 1
- Observations: 1
- Coverage limitations: 1
