# Asset Lab feature matrix

Status meanings: **PASS** verified in source and/or runtime; **PARTIAL** useful implementation exists but does not meet the complete requirement; **FAIL** missing or misleading; **BLOCKED** no representative registered content allowed a reliable runtime test.

| Capability | Status | Evidence / limitation |
| --- | --- | --- |
| Browse every current composed-manifest asset | PASS | 37/37 entries selected at runtime |
| Browse complete production inventory | FAIL | 7/15 contract categories, 5/18 planned scene groups, 0/74 exact production family IDs |
| Search by semantic asset ID | PASS | Runtime verified |
| Search by filename | PASS | Runtime verified |
| Search by category, scene, status | PASS | Search text and dedicated category/scene/status facets |
| Dedicated category filter | PASS | Runtime verified; only present catalog categories appear |
| Dedicated state filter | FAIL | Per-asset state selector only |
| Dedicated direction filter | FAIL | Per-asset facing selector/tag search only |
| Dedicated animation filter | FAIL | Per-asset animation selector only |
| Dedicated approval filter | PARTIAL | Status can approximate approval; approval workflow is not modeled explicitly |
| Dedicated validation-status filter | FAIL | No deep validator result model in Lab |
| Family/status/tag filters | PASS | Runtime verified |
| Preview static images | PASS | Runtime verified |
| Preview spritesheets | PARTIAL | Animation playback works; arbitrary frame/grid inspection absent |
| Preview atlases | BLOCKED | Loader path exists; no current atlas asset and no atlas frame browser |
| Animation play/pause | PASS | Runtime controls verified |
| Animation restart | FAIL | No explicit restart control |
| Animation frame stepping | PASS | Previous/next verified |
| Animation scrubbing | FAIL | No timeline/range/frame-number control |
| Playback speed | PASS | 0.25x, 0.5x, 1x, 2x |
| Change state | PASS | All declared states traversed |
| Change direction | PASS | All declared facings traversed |
| Change variant | PASS | All declared variants traversed |
| Inspect canvas/technical bounds | PASS | Full frame/native/gameplay sizing shown |
| Inspect actual visible/opaque bounds | FAIL | Declared visual bounds/full frame only; pixels are not analyzed |
| Display origin and ground anchor | PASS | Overlay verified |
| Display sockets | PASS | Overlay available when declared |
| Display frame boundaries/grid | FAIL | Absent |
| Display collision shapes | PASS | Declared prefab geometry |
| Display interaction zones | PASS | Declared prefab geometry |
| Display navigation obstacles | PASS | Declared prefab geometry |
| Display standing points | FAIL | No dedicated standing-point/destination overlay |
| Display mobile touch zones | PASS | Declared prefab geometry |
| Preview native size | PASS | Runtime control verified |
| Preview intended gameplay scale | PASS | Runtime control verified |
| Representative backgrounds | PASS | Neutral, grass, road, interior, water, light, dark |
| Nearby calibration assets and scale ruler | PASS | Calibration NPC and 100-unit ruler |
| Test actual day/night pipeline | FAIL | Flat light/dark colors only |
| Supported resolution/aspect frames | PARTIAL | Five frames; no actual layout reflow or safe-area simulation |
| Show actionable registry/load warnings | PARTIAL | Runtime load errors can appear; fallback placeholders are falsely valid |
| Show deep contract validation | FAIL | CLI validator output not integrated |
| Show manifest metadata | PARTIAL | Concise summary only |
| Show complete contract metadata | FAIL | No complete contract panel |
| Identify scenes using asset | PARTIAL | Scene-pack declaration only, not real consumers/instances |
| Detect missing assets | FAIL | 22 missing-art placeholders show zero warnings |
| Detect orphaned assets | FAIL | Separate validator can; Lab cannot |
| Previous/current comparison | PASS | Fishing proof asset verified |
| Layer isolation | PASS | Runtime verified |
| Shadow toggle | PASS | Runtime verified |
| Screenshot export | PASS | Control present |
| Contact-sheet export | PARTIAL | Works for small catalog; monolithic canvas is unsafe at scale |
| Reload changed asset efficiently | FAIL | Full page refresh required |
| Handle 1,000-asset library | FAIL | Eager 1,000 options/loads; projected 55,000 px sheet |
| Handle 5,000-asset library | FAIL | ~1.1 s catalog construction; projected 275,000 px/1.056 GB sheet |
| Narrow-phone visual accuracy | PARTIAL | Profile frame exists; no real scene reflow/safe areas |
| Narrow-phone usability | FAIL | ~30 px buttons/13 px checkbox targets; preview squeezed |
| Tablet usability | PARTIAL | Operable under emulation; scroll-heavy panel |
| Error handling without crash | PASS | Fallback prevents crash |
| Error handling without concealing required failures | FAIL | Fallback is reported valid for all 22 placeholders |
| Production exclusion | PASS | Query route does not expose Lab; 31-marker guard passed |

