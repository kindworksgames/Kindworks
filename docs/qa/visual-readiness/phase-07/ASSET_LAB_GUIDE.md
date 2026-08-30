# KindWorks Asset Lab and Scene Visual QA

Both tools are development-only and are loaded lazily. They do not appear in a production build.

## Asset Lab

Start the development server and open:

`/?qa=asset-lab`

The inventory is generated from `KINDWORKS_VISUAL_MANIFEST`. Do not add assets to the lab directly. Add or update the semantic asset, prefab, state, animation or scene-pack definition and the lab will reflect it.

The left inspector supports semantic-ID/filename search; category, scene, tag, status and family filters; asset/state/variant/animation/facing selection; native and intended logical size; seven backgrounds; animation pause, frame step and speed; layer/shadow isolation; visual/gameplay geometry overlays; previous/current comparison; viewport frames; and PNG screenshot/contact-sheet export.

Colour meanings:

- blue: visual bounds;
- white: origin;
- yellow: ground-contact point;
- green: sockets;
- red: collision;
- purple: navigation;
- amber: interaction;
- cyan: mobile touch geometry.

The warning output combines manifest/runtime failures and lab-load failures. A missing runtime asset remains visible through the normal development fallback.

### Reviewing a staged Phase 8B candidate

Run `pnpm run assetlab:prepare -- --asset <semantic-id>` after putting the file at its contracted staging path. The generated candidate index merges candidate pixels with the same contract, prefab, animation, usage, layout and geometry metadata used by the game. A valid candidate appears as `valid · human-review-required`; an invalid candidate remains blocked with exact expected and actual values.

The Lab loads candidates through a development-server-only route. Production builds cannot serve staging bytes. When compatible approved/current artwork exists, comparison shows current and candidate side by side. When no approved reference exists, that absence remains an explicit human-review blocker rather than being treated as approval.

For destination-scene inspection, open `/?qa=candidate-preview&asset=<semantic-id>`. The preview uses the contract's scene placement and logical display size, draws the existing geometry overlays, disables input, creates no physics body, and does not write saves. It is a review overlay, not a hidden gameplay integration path.

After visual review, the two-step approval command records the exact candidate digest and regenerates the approved semantic index consumed by the normal visual manifest. An empty approval registry produces an empty index; unapproved candidates therefore add no production artwork or payload. Do not hand-edit the generated index or interpret technical validity as visual approval.

## Scene visual QA

Open a normal development scene with:

`/?qa=scene-visual`

The floating panel can toggle semantic instance/prefab IDs, depth/Y-sort points, input/touch areas, collision bodies, prefab collision/navigation/interaction geometry, NPC path/station metadata, HUD safe area, camera bounds, missing fallbacks, reference overlay support and the closest responsive profile.

Objects not yet migrated to semantic prefabs cannot show a semantic identity until their later incremental migration. This is intentional and makes remaining legacy coverage visible rather than inventing a second identity system.

## Production safety

`import.meta.env.DEV` guards both routes. Production verification rejects the scene names, panel IDs and readiness markers if any reach built JavaScript.
