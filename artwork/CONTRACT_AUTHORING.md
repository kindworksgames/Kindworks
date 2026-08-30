# KindWorks Asset Contract Authoring Guide

Contract schema: **2**  
Category catalogue: `artwork/contracts/asset-category-contracts.v2.json`

This guide is the generator-facing technical source of truth. It defines the file that an artist or image generator must deliver; it does not grant approval to generate the whole game and it never changes gameplay geometry.

## Before generation

1. Choose the existing semantic ID and category contract. Never use a provider name, prompt name, or filename as runtime identity.
2. Confirm the asset belongs to one of the 74 registered Phase 10 families. A family assignment is a category template, not permission to invent leaf states or dimensions.
3. Create or review the leaf contract in the production manifest. The contract must use schema v2 and contain no unrecognised fields.
4. Keep collision, navigation, interaction, and touch geometry unchanged. Their protected digest/signature is checked independently from visible pixels.
5. Keep `generationBlockedUntilArtBibleLocked` true until Phase 8B produces an approved slice and Phase 9 locks measured palette, outline, material, shadow, lighting, and texture rules.

## Required visual contract

Every image, tileset, sprite sheet, atlas, layer set, nine-slice, or effect sheet declares:

- semantic ID, category, category contract, purpose, intended scenes, dependencies, scene pack, version, workflow, and provenance;
- exact PNG/WebP format, RGB/RGBA mode, 8-bit depth, alpha policy, canvas width/height, pixel-art flag, nearest filtering, smoothing false, and trim false;
- native pixels per logical unit, intended logical display size, scale policy, camera/perspective, normalized origin, ground-contact point, and sockets;
- separate visual, collision, navigation, interaction, and touch geometry;
- unique kebab-case states, variants, directions, layers, and animation IDs;
- maximum visible bounds, maximum transparent padding on every edge, runtime byte budget, fallback ID, and protected gameplay-geometry digest;
- versioned staging, master, runtime, and optional atlas filenames beginning with the declared filename stem.

UI contracts additionally require a semantic label key, minimum rendered size, contrast target, safe content insets, and localization expansion allowance.

## Sprite sheets and atlases

Sprite sheets declare positive integer frame width/height, rows, columns, padding, spacing, exact frame order, actions, and directions. The grid must exactly fill the canvas. Frame names, animation IDs, states, variants, and directions must be unique. Animation rates must be within 1–60 fps; repeat is `-1` or a non-negative integer.

Atlases declare their JSON filename, exact frame count/names, and `allowTrim:false` / `allowRotation:false`. Intake parses the atlas JSON and rejects missing frames, out-of-bounds rectangles, trimming, rotation, or disagreement with animation definitions.

## Audio contracts

Audio uses MP3, OGG, or WAV and declares channels (1 or 2), sample rate (8,000–192,000 Hz), positive duration in milliseconds, loop policy (`once`, `loop`, or `seamless-loop`), loudness target in LUFS, byte budget, versioned filenames, workflow/provenance, and fallback. Visual-only canvas, alpha, filtering, geometry, and animation fields are forbidden.

## Intake workflow

`specified → generation-ready → generated → review → revision or approval → runtime-ready → integrated → verified`

Generated files enter `artwork/staging/`. They never overwrite `artwork/masters/` or `public/assets/runtime/`. Pixel art must not be resized with smoothing or automatically trimmed.

The executable intake path is:

```text
pnpm run assetlab:prepare -- --asset <semantic-id>
pnpm run assetlab:reference -- --asset <semantic-id> --file artwork/references/...
# inspect /?qa=asset-lab and /?qa=candidate-preview&asset=<semantic-id>
pnpm run assetlab:approve -- --asset <semantic-id>
# only after human approval, rerun with the printed reviewer/token/confirmation arguments
```

The first command validates actual candidate bytes. The approval command is intentionally two-step: technical validity never implies visual approval. Visual offsets, when needed, live in `artwork/candidates/scene-layout-overrides.v1.json` and are managed by `assetlab:place`; they cannot alter collision, navigation, interaction, touch geometry, or save data.

Run, in order:

```text
pnpm run assets:validate -- --asset <semantic-id>
pnpm run artwork:check
pnpm test
pnpm run build
```

Use `pnpm run assets:validate:changed` while iterating and `pnpm run assets:validate` before review. A validator failure must be corrected in the candidate or contract. Do not alter gameplay rules, add arbitrary offsets, or weaken a constraint to force invalid artwork through.

## Rejected output

Reject files with wrong case, filenames, format, dimensions, colour mode, alpha, frame grid/count/order, states, variants, directions, origin, scale metadata, visible bounds, transparent padding, byte budget, atlas membership, filtering, or gameplay-geometry digest. Reject mockups, static scene screenshots, watermarks, captions, baked UI, trimmed frames, and credentials or generator metadata that expose secrets.

Invalid-test content is represented only by JSON mutation descriptors under `artwork/fixtures/invalid/`. No deliberately invalid binary belongs in production asset directories.
