# Stage 7 Findings Register

## Confirmed defects

### S7-UI-001 — Compact shop product controls are undersized on the smallest supported phone

- **Severity:** P2
- **Status:** FIXED
- **Systems:** Village Grocer and Fresh Market
- **Reproduction:** Open Village Grocer at 568×320 and inspect/tap the compact product shelf. Garden Goods/animal-food controls can render around 42×31 CSS pixels; other compact items also fall below a reliable 44×44 finger target.
- **Expected:** Stock stays fully visible while every essential selectable product and purchase action remains readable and reliably touchable.
- **Actual:** The screen does not clip, but several essential product targets require precision and are smaller than the project’s mobile touch contract.
- **Repair:** The narrow-landscape shelf composition now reserves at least 44×44 CSS pixels for every selectable product. Decorative Grocer checkout scenery yields space to the three functional shelves; Fresh Market stock reflows by counter instead of shrinking its products. Both purchase buttons retain a 44px minimum height.
- **Verification evidence:** Live 568×320 and 667×375 browser emulation kept all Grocer/Fresh Market products, close controls and purchase actions reachable. Static regression checks pin the 44px contract. The Stage 7 focus suite passed 130/130 and the complete suite passed 632/632.
- **Suspected cause:** The compact-shop grid compresses rows and columns at the narrow breakpoint without a minimum target size or horizontal/vertical shelf paging.
- **Affected files:** `src/scenes/VillageGrocerScene.js`, `src/ui/ShopController.js`, shared compact-shop styles in `index.html`/CSS ownership.
- **Required regression:** At 568×320, 667×375, 1024×768 and 1280×720, enumerate every visible stock/purchase control and require at least 44×44 CSS pixels or an equivalent enlarged hit area; verify no clipping and repeat-purchase protection.
- **Repair constraint:** Presentation/touch geometry only. Do not change products, prices, inventory, transaction rules or scene entry.

### S7-UI-002 — Fixed-canvas Paws and Harbour shops become too small at 568×320

- **Severity:** P2
- **Status:** FIXED
- **Systems:** Paws & Wonders and Harbour General
- **Reproduction:** Open each shop at 568×320. The whole 1280×720 scene is uniformly reduced. Harbour product arrows/actions shrink to roughly 15–26px high and supporting text becomes difficult to read. Paws companion tiles/action copy similarly become too small.
- **Expected:** The full shop remains visible while primary controls retain touch size and essential product/adoption information remains readable.
- **Actual:** No important region is cropped, but uniform downscaling sacrifices touch and text usability.
- **Repair:** Paws & Wonders and Harbour General now expose responsive, scene-bound DOM control panels only on short landscape screens. They occupy the pre-existing right detail column, keep primary/browse controls at least 44×44 CSS pixels, mirror the selected product and status, and invoke the same protected service methods as the canvas controls. Tablet/reference canvas controls were enlarged to 56 virtual pixels so FIT scaling remains at least 44 CSS pixels at 1024×768.
- **Verification evidence:** Live 568×320 and 667×375 operation proved companion browsing and Harbour display selection/restocking through the responsive controls; 1024×768 and 1280×720 confirmed the overlays are absent and the full canvas presentation remains active. Listener cleanup and protected prices were regression-tested. No browser errors or failed game resources were observed.
- **Suspected cause:** Both Phaser scenes author a fixed 1280×720 layout and rely on global fit scaling rather than a narrow-landscape responsive presentation.
- **Affected files:** `src/scenes/PawsWondersScene.js`, `src/scenes/HarbourGeneralScene.js`, responsive scene-layout helpers.
- **Required regression:** At 568×320, 667×375, 1024×768 and 1280×720, require enlarged hit zones for primary/arrow/exit controls, readable essential text, complete stock/habitat visibility, successful adopt/restock/assign/exit flows and no economy changes.
- **Repair constraint:** Responsive layout and hit-area work only. Preserve all coordinates that are gameplay/save-owned; scene-local presentation coordinates may adapt without changing saved state.

## User decision required

### S7-UDR-001 — Companion cap and freeing model conflict

- **Status:** PRESERVED FROM STAGE 6
- **Current behaviour:** Latest protected HTML and current Phaser permit all 11 Paws companions and expose no voluntary freeing flow for permanent shop companions.
- **Conflicting requirement:** Older protection text asks for a maximum of five owned pets and freeing pets.
- **Decision needed:** Preserve unlimited permanent companions, or define a five-companion ownership/freeing policy including refund, follower and save-migration rules.
- **QA action:** No behaviour was changed. The current source-of-truth implementation remains protected.

## External integration boundary

- Real-money checkout and membership management were not available locally.
- This is not classified as a defect: the production web client correctly requires a verified server wallet/receipt and disables local-only purchase actions.
- Native/server checkout must be tested separately with non-production test accounts and signed receipts before release.

## Severity summary

| Severity | Count |
| --- | ---: |
| P0 | 0 |
| P1 | 0 |
| P2 | 0 open / 2 fixed |
| P3 | 0 |
| User decision required | 1 |
