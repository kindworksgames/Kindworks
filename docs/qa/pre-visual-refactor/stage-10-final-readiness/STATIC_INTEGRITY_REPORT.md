# Stage 10 Static Code and Data Integrity Report

## Repository identity

| Item | Evidence |
| --- | --- |
| Repository | `/Users/youyoulu/Documents/GitHub/Kindworks` |
| Branch | `phase-2-ui-simplification` |
| Starting commit | `3387bcb48964c41edbdc26f4257d2990fcdaf8d5` |
| Protected HTML | `kindworks_little_bakery_v65_house_rescue_reintegrated_fixed.html` |
| Protected SHA-256 | `0b85bd71385b83e7a13676f7593ce376245959fa4ebf1a6b9a0e6765297aa5a5` — exact match |
| Phaser entry | `index.html` → `src/main.js` → `BootScene` → `TownScene` or one recovered lazy scene |

The worktree already contained the complete Stage 1–9 QA/repair series and unrelated visual/migration changes. Stage 10 did not modify production behaviour.

## Static integrity results

| Inspection | Result | Evidence |
| --- | --- | --- |
| Duplicate DOM IDs | PASS | 610 `index.html` IDs; zero duplicates |
| Duplicate scene registrations | PASS | 18 scene definitions; 2 direct and 16 lazy registrations; zero duplicate keys |
| Missing/unregistered scenes | PASS | Every defined scene is registered; every statically resolved scene reference targets a known key |
| Missing imports | PASS | Zero unresolved relative imports; production build transformed 180 modules |
| Unreachable scenes | PASS | Boot/Town and all 16 lazy scenes have entry owners; all 18 were exercised in the Stage 10 runtime pass, with Fresh Market intentionally remaining a Town-owned modal |
| Conflicting entry points | PASS | One Phaser entry and one protected read-only legacy HTML source; generated `dist/index.html` is not treated as a source |
| Protected-source drift | PASS | Filename and checksum match the parity registry and both parity validators |
| TODO/FIXME/HACK/XXX | PASS | No unresolved marker in production source or shell |
| Swallowed exceptions | PASS with intentional exception | One cryptographic-key import converts a rejected optional key import to `null`; commerce then fails closed and its tests pass. Optional haptics catches are explicitly documented |
| Randomness | PASS | Gameplay probability owners use injected/seeded sources. The only direct `Math.random()` calls are Power Wash wetness/mist presentation; Harbour General exposes an injectable default RNG |
| Listener/timer lifecycle | PASS | Every scene-owned persistent listener is removed at shutdown; Power Wash's two unmatched static counts are `{once:true}` image listeners. App-lifetime controllers are constructed once. The gift poll is one app-lifetime interval, not a scene interval |
| Save field ownership | PASS | Stage 8's complete 36-domain, schema-37 persisted-field map remains authoritative; 37 Phaser schemas and 71 legacy versions pass load/migration/reload |
| Save fields written/read | PASS | No orphaned gameplay domain was found; normalizers, validators, migrations, services and the cross-system journeys exercise every protected top-level owner |
| Item IDs and shop access | PASS | 82 unique catalogue IDs; 67 unique released shop entries; every released entry has exactly one gameplay destination and survives purchase/reload |
| Definitions without shop access | PASS/intentional | Non-retail records are farming yields, fishing-only items, the subscription gift, defaults or development fixtures and are explicitly classified |
| Shop items without definitions | PASS | All Willowmere Shop, Grocer, Fresh Market, Paws and Harbour entries resolve to definitions and validated prices |
| Level references/schema | PASS | 5,850/5,850 campaign records validate; all IDs, references, bounds, mechanics and final-level rules pass the exhaustive validators |
| Missing runtime assets | PASS | All 11 public asset/provenance files exist and are copied to `dist`; no missing-texture or failed-resource error occurred in the clean production run |
| Loaded but unused assets | PASS | No loaded runtime asset was identified as unused. Harbour and Magnet reference images plus provenance manifests are deliberately archived and not loaded, matching the Phase 0 inventory |
| Stale HTML-era code | PASS/intentional | The protected HTML, migration/reconciliation code, archived reference manifests and `LegacyPowerwashRenderer` are active contracts, not abandoned duplicate game owners |
| Player-facing TODO/backend copy | PASS in ordinary UI | Stage 2's production-copy regression passes and the normal UI shows no milestone, vertical-slice, raw-coordinate or legacy-catalogue wording |
| Development/debug separation | **PASS — repaired** | Production exports and detailed publishers are compiled out. The post-build gate rejects 18 forbidden development-only markers across every JavaScript chunk |

## Production diagnostic-surface evidence

`S10-PROD-001` was reproduced and repaired after the audit. Production now compiles out both KindWorks Phaser globals, the Sprite-AI browser audit global, milestone arrays and detailed Town/scene/save/catalogue publishers. The permanent post-build verifier scans every production JavaScript chunk and rejects 18 distinctive development-only markers. A live 844×390 production run exposed none of the three globals and no internal `#game` data attributes. Development Fidelity and Sprite-AI coverage remain available. See `REPAIR_REPORT.md`.

## Assurance observations

- Type checking and linting are not configured in `package.json`; this is an inherited assurance observation, not a reproduced runtime defect.
- Archived reference art is copied with the production static directory but is not requested at runtime. It remains documented provenance for visual recovery.
- The static audit helper is stored at `tools/static-integrity-audit.mjs`. Its asset-reference pass is intentionally supplemented by manual review of dynamic Power Wash paths and archived manifests.
