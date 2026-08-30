# Stage 6 Combined Coverage Matrix

Legend: PASS, FAIL, PARTIAL, USER DECISION REQUIRED, COVERAGE LIMITATION.

| System | Catalogue/static validation | Deterministic or statistical validation | Runtime/player journey | Save/reload | Status |
| --- | --- | --- | --- | --- | --- |
| NPC spawning and identity | 35/35 IDs, homes and narratives | Fresh state and schema | Town runtime | Existing service reload tests | PASS |
| NPC routes/schedules | All destinations graph-reachable | Full-day plus seven-day/minute stress | Town movement visible | Route/session reload tests | PASS |
| NPC local separation | Deterministic presentation-slot owner | 14-resident crowding fixture plus unchanged seven-day simulation | Theo and Ella selected separately | Saved coordinates unchanged | PASS — S6-NPC-001 FIXED |
| NPC litter/care/bin behaviour | All hooks resolve | Deterministic environment tests | Town integration | Atomic rollback/reload | PASS |
| Narrative/thoughts/relationships | 35 four-stage arcs, 67 pairs | Gate and thought determinism | Maya 0/2→1/2 | Maya retained 1/2 | PASS |
| Locate custom resident | API and return point | Direct control/autonomy tests | Not available before fresh resident creation in isolated route | Persisted | PASS WITH SCOPE NOTE |
| Wildlife catalogue/habitats/diets | 37 species, 45 wildlife IDs | All regular species sampled | Animal Friends complete roster | Persisted | PASS |
| Wildlife weighting/map cap | Definitions valid | 180-day/30-minute seeded sample | Nearby/away status updates | Deterministic | PASS |
| Rare exclusivity | Shared active-visitor arbiter | 840-day/5-minute exhaustive schedule; all five observed | Representative overlap/handoff tested programmatically | Notice keys/counts remain valid | PASS — S6-ANIMAL-001 FIXED |
| Feeding/trust/adoption | All diets resolve | Correct/wrong food and probability guarantees | Nettle 15%→22% | Nettle retained 22% | PASS |
| Follower/home/Meadow | Shared state owners resolve | One active follower and home tests | Representative automated scene tests | Persisted | PASS |
| Five-pet/free action | Conflicting documentation | Latest HTML explicitly removes cap | UI says no family limit | Unlimited state validates | USER DECISION REQUIRED |
| Allotment/crops/plots | Six beds, three crops | Every bed/crop lifecycle | Grocer purchase | Coins/seeds retained | PASS |
| Orchard | Starter plus 23 additional slots | One-fruit and regrowth cycles | Town interaction covered by existing tests | Persisted | PASS |
| Food/fish acquisition/consumption | All source IDs resolve | Shop/fishing/farming/feed tests | Grocer purchase live | Persisted | PASS |
| Physical-device lifecycle | N/A | Browser/service tests only | No physical iOS/Android | Native kill/resume untested | COVERAGE LIMITATION |

## Exact automated scope

- Complete suite after repair: 629/629.
- Stage 6 focused batch after repair: 146/146.
- Stage 6 new inventory/probability/lifecycle tests: 5/5.
- Stage 6 repair tests: 3/3.
- Production build: PASS.
- No production mutation was introduced by this audit.
