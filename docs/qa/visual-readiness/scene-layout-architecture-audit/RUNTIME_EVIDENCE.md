# Runtime evidence

## Environment

- Development: Vite local server, Codex in-app Chromium, isolated `?qa=reference-overlay` state.
- Production: current `dist/` served by Vite preview.
- Canonical browser report: 1280×720 CSS viewport and 1280×720 Phaser canvas.
- This is browser emulation, not physical-device evidence.

## Fishing layout pilot

The development route reached `FishingScene` with:

- `referenceOverlayValidation=pass`;
- 12 labelled Phaser scene-layout objects;
- one `#kw-reference-overlay` editor root;
- one 1280×720 Phaser canvas plus the existing Power Wash native canvas in the DOM shell;
- the Fishing HUD visible.

Three full page reloads produced exactly:

| Reload | Scene | Layout objects | Overlay roots | Canvas elements | Validation |
| ---: | --- | ---: | ---: | ---: | --- |
| 1 | FishingScene | 12 | 1 | 2 | pass |
| 2 | FishingScene | 12 | 1 | 2 | pass |
| 3 | FishingScene | 12 | 1 | 2 | pass |

This is positive evidence for Fishing reload idempotency. It does not certify other scenes, because they do not expose layout-instance identities.

## Production exclusion

The production preview was opened with `?qa=reference-overlay`. Because QA tooling is development-only, it correctly remained in `TownScene` and reported:

- zero `#kw-reference-overlay` roots;
- no `referenceOverlayReady` marker;
- no console warnings or errors.

## Console

No layout exception, missing layout reference or production error was observed. Development showed only pre-existing isolated QA warnings about multiple preserved interrupted activities; those warnings are unrelated to scene-layout rendering and did not affect the user's production save.

## Responsive limitation

The browser viewport control accepted requested profile changes but the page continued to report 1280×720 for each attempt. These attempts were classified BLOCKED, not passed. The build did independently verify the stored Phase 1 baselines covering 568×320, 844×390, 1024×768, 1280×720 and 1366×768.
