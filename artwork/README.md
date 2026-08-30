# KindWorks Artwork Production

This directory is the generator-neutral handoff between artwork specification, generation, review and the optimized runtime exports under `public/assets/runtime/`. Contract schema v2 is closed: unrecognised fields fail validation instead of silently becoming undocumented production metadata.

## Safe flow

`specified → generation-ready → generated → review → revision or approval → runtime-ready → integrated → verified`

- `specifications/` is the source of truth for semantic identity, dimensions, frames, anchors, states, geometry, art rules, filenames, validation and provenance.
- `contracts/asset-category-contracts.v2.json` defines the 15 supported category templates and assigns all 74 Phase 10 families to exactly one template.
- `staging/` receives generated or imported candidates. A candidate never overwrites approved runtime artwork.
- `masters/` contains the approved lossless/source master selected in review.
- `public/assets/runtime/` contains optimized game-ready exports only.
- `fixtures/invalid/` contains mutation descriptions that must be rejected by the validator.
- `src/visual/generated/artworkRuntimePacks.js` is generated from the specification. Do not hand-edit it.

Generator credentials, API keys, cookies and local caches must stay outside this repository. The pipeline accepts files from any generator or artist; no provider name is used as a runtime identity.

Pixel-art exports must retain nearest-neighbour pixels, fixed frame canvases and untrimmed frames. Transparent padding is part of the anchor contract and must not be removed automatically.

## Candidate review and approval

Contract validation and candidate validation are deliberately separate. `assets:validate` proves that the specification is coherent; it does **not** approve newly supplied pixels.

1. Put the candidate at the contract's exact `expectedFilenames.staging` path.
2. Run `pnpm run assetlab:prepare -- --asset <semantic-id>`. This inspects the real bytes, dimensions, colour mode, alpha, frame grid and budget, then writes the development-only candidate index.
3. Open `/?qa=asset-lab`, search for the semantic ID, and verify the record says `valid · human-review-required`. Validation is technical acceptance, not visual approval.
4. Preview the candidate in its destination with `/?qa=candidate-preview&asset=<semantic-id>`. The preview has no input or physics body and cannot change gameplay geometry or saves.
5. Assign an approved asset reference with `pnpm run assetlab:reference -- --asset <semantic-id> --file artwork/references/...`, then prepare again. The tool rejects references outside the approved root or with a mismatched canvas.
6. If a presentation-only adjustment is needed, run `pnpm run assetlab:place -- --asset <semantic-id> --x <number> --y <number>`, then prepare again. This changes only the candidate visual offset.
7. After a named human reviewer accepts visual quality, run `pnpm run assetlab:approve -- --asset <semantic-id>` once to obtain the digest token, then rerun with the displayed `--reviewer`, `--token`, and `--confirm APPROVE` values. Promotion is atomic and refuses to overwrite different approved bytes. It regenerates `phase8bApprovedAssetIndex.js`, so the approved semantic assets, prefabs, states, animations, instances, and scene packs enter the ordinary visual manifest without a scene or gameplay edit. With no approvals this index is empty and adds no artwork payload.

Use `pnpm run assetlab:prepare -- --clear` to clear the development candidate index without deleting staged files. Staging candidates are allowed by the build gate; unapproved files in master/runtime locations are not.

Fresh Codex desktop shells may need the bundled workspace Node runtime on `PATH`; load the workspace dependencies first. Ordinary local installations only need the repository's documented Node/pnpm versions.

## Validation commands

- `pnpm run assets:validate -- --asset <semantic-id>` validates one asset and its shared contract surfaces.
- `pnpm run assets:validate -- --category <category-id>` validates one category.
- `pnpm run assets:validate:changed` validates artwork affected by the current Git changes; contract/catalog changes expand safely to all assets.
- `pnpm run assets:validate` validates the complete catalogue, production manifest, and Phase 8A contracts.
- `pnpm run artwork:check` additionally checks real candidate bytes and proves every committed invalid mutation is rejected.

The full contract check is a `prebuild` gate and is also run by `.github/workflows/verify.yml`. Deliberately invalid samples are mutation descriptors under `fixtures/invalid/`; invalid image/audio files must never be placed in `public/` or imported by production code.

See `CONTRACT_AUTHORING.md` before preparing a new generator job. It defines exact required fields, file conventions, atlas and sprite-sheet rules, audio metadata, UI accessibility metadata, and the approval boundary while the Phase 9 art bible remains unlocked.

The Phase 6 valid sample is an exact byte copy of the already-approved Reedbank background. Its provenance says so explicitly; it is not represented as newly generated art. This proves the staging and manifest-only integration path without changing the approved visual.

## Phase 8A premium vertical slice

The bounded Phase 8A package lives in `production/phase-8a/`:

- `vertical-slice-production-package.v1.json` is the complete machine-readable handoff;
- `GENERATOR_PROMPTS.md` contains one generator-neutral prompt package per semantic asset;
- `DEPENDENCY_ORDER.md` is the mandatory six-wave approval order.

These three files are generated from `src/visual/verticalSlice/phase8aVerticalSlicePackage.js`. Run `pnpm run phase8a:export` after an approved contract change, then `pnpm run phase8a:check`. Phase 8A contracts do not grant permission for mass generation. Phase 8B staging candidates may be technically validated and reviewed, but they cannot enter master/runtime locations without explicit human approval.
