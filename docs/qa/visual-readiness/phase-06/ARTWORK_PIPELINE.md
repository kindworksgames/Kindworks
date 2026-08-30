# KindWorks Generator-Neutral Artwork Pipeline

Schema version: 2  
Art bible: KindWorks Visual Style Bible v4  
Source manifest: `artwork/specifications/kindworks-artwork-manifest.v1.json`

## Architecture

```text
artwork specification
  semantic identity + output/frame contract + art rules + geometry
                         │
                         ▼
artwork/staging/         generated/imported candidates; never runtime
                         │ validate + human review
                         ▼
artwork/masters/         approved source/master asset
                         │ optimize without smoothing or frame trimming
                         ▼
public/assets/runtime/   runtime export only
                         │
                         ▼
generated runtime pack → semantic visual registry → existing scene
```

The game never uses generator names or filenames as object identity. A semantic ID remains stable when a provider, prompt, source file or approved revision changes.

## Required specification fields

Each asset records:

- semantic ID, category, gameplay purpose and intended scenes;
- output type/format, exact canvas, alpha, pixel-art, smoothing and trim policy;
- sprite-sheet rows, columns, frame size/order, actions and directions when applicable;
- camera, perspective, master scale and logical display footprint;
- anchor, ground contact, sockets and independent visual/collision/navigation/interaction/touch geometry;
- states, directions, layers, canvas alignment and animations;
- art-bible version, palette, outline, lighting, shadow and texture rules;
- exact staging, master and runtime filenames;
- forbidden output and validation requirements;
- production/workflow status;
- provenance, specification version, asset version and source digest;
- dependencies, runtime fallback and scene-pack ownership.

## Workflow

The executable transition graph is:

`specified → generation-ready → generated → review`

Review may go to `revision → generated` as often as required, or continue through:

`approval → runtime-ready → integrated → verified`

Skipping from generated/review directly to integration is rejected. A workflow history must begin at `specified`, use legal transitions and end at its declared current status.

## Safety rules

1. Candidates enter `artwork/staging/`; they cannot point directly at runtime.
2. Runtime files are exported to a new versioned filename. They do not overwrite an approved file in place.
3. Staging, master and runtime paths are distinct and validated.
4. Credentials, secrets, cookies and generator caches are ignored and must remain outside the repository.
5. Pixel-art smoothing must be `false`.
6. Automatic frame trimming must be `false`; transparent canvas padding is part of the anchor contract.
7. Visual dimensions never mutate collision, navigation, interaction or touch geometry.
8. The generated runtime module must exactly match the source manifest or the build fails.
9. Missing files, dependencies or fallbacks fail validation; runtime registry fallbacks remain the Phase 2 safe failure path.

## Repeatable commands

- `npm run artwork:generate-packs` validates the specification, then deterministically regenerates `src/visual/generated/artworkRuntimePacks.js`.
- `npm run artwork:check` validates the approved sample, rejects all deliberate invalid fixtures and checks that generated packs are current.
- `npm run assets:validate` validates all 15 category contracts, all 74 Phase 10 family assignments, the production manifest and Phase 8A package before the build.
- `npm run assets:validate -- --asset <id>`, `--category <id>`, and `npm run assets:validate:changed` provide bounded validation without weakening the full release gate.
- Contract validation runs in `prebuild`; the artwork and generated-pack checks remain part of `postbuild` and the repository verification workflow.

Schema v2 rejects unknown fields. Adding a new technical capability therefore requires a reviewed schema/catalog update rather than an arbitrary JSON property. Errors report the owning semantic ID, field path, expected and actual values, affected scenes, schema version, and remediation where applicable.

The generator itself is deliberately outside this contract. Any artist, ChatGPT image generation, Sprite AI or other tool may produce a candidate as long as its staged file satisfies the same specification and review process.

## Phase 6 proof asset

`scene.fishing.reedbank.background` is an exact byte-identical copy of the existing approved Reedbank artwork:

| Stage | File | SHA-256 |
| --- | --- | --- |
| Staging | `artwork/staging/scene/fishing/reedbank-background/v1/fishing-reedbank-background.v1.webp` | `ade1c03…b8c5bb` |
| Master | `artwork/masters/scene/fishing/reedbank-background/v1/fishing-reedbank-background.v1.webp` | `ade1c03…b8c5bb` |
| Runtime | `public/assets/runtime/scene/fishing/fishing-reedbank-background.v1.webp` | `ade1c03…b8c5bb` |

This is intentionally not claimed as newly generated art. It proves staging, validation, approval, pack generation and manifest-only runtime selection without changing the approved image.
