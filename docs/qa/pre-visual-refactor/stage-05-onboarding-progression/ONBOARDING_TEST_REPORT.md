# Stage 5 Onboarding Test Report

## Fresh-save live journey

| Step | Operation | Expected | Actual | Result |
| --- | --- | --- | --- | --- |
| Initial load | Open normal game on empty origin | Mandatory town-name setup | `WELCOME TO KINDWORKS`, town-name step 1 of 2, Day 1 07:00, 100 coins | PASS |
| Invalid name | Submit `!!!` | Reject without mutation | Inline validation: letters, numbers, spaces, apostrophes or hyphens only | PASS |
| Valid name | Save `Stage Five Test` | Persist name, proceed to resident | Step 2 of 2 appears | PASS |
| Early close | Attempt close and Escape after naming | Setup remains mandatory until resident/home exist | Close is hidden; Escape leaves the required setup open; town actions remain behind the modal | **PASS — S5-F01 FIXED** |
| Creator structure | Open Create resident | Separate Appearance, Hobbies, House pages | Three distinct pages appear in correct order | PASS |
| Draft interruption | Enter `Draft Resident`, choose Gardening and Community helper, select appearance/home choices, advance to Your house, reload | Restore same step and draft automatically | Creator reopens automatically at Your house with the exact name, hobbies, hair, wall, roof style, and roof colour | **PASS — S5-F02 FIXED** |
| Complete setup | Create `Mae`, Gardening, default starter home | One resident and Level 1 home saved | Resident/home created; six-step guide begins | PASS |
| Completed reload | Reload normal route | Do not replay setup | Setup stays closed; saved resident remains; guide step remains | PASS |
| Explore | Drag map more than movement threshold | Advance to neighbour step | Guide advances from step 1 to step 2 | PASS |
| Neighbour | Use Meet a neighbour and open thought | Advance to Lawn Care | Freya panel opens; guide advances to step 3 | PASS |
| Lawn entry | Start Lawn Care from guide | Real level and matching instruction | Lawn board opens; prompt says cut at least 50%; threshold is 50% | PASS |

## Protected HTML comparison

The protected HTML treats incomplete resident creation as mandatory and resumable:

- `playerSetupState` persists `creatorStep` and `creatorDraft`;
- `startFirstTimeSetup()` automatically opens the correct incomplete setup surface;
- `persistKindlyCreatorDraft()` saves current choices and step;
- `openKindlyCreator()` restores the draft and step;
- onboarding mode hides creator close/cancel controls;
- `closeKindlyCreator()` refuses to close incomplete onboarding.

The Phaser three-page design is intentional and matches the user's current product direction. S5-F02 concerns persistence/resume behavior, not the number of pages.

## Returning-save and migration coverage

Automated tests covered:

- a current completed setup save;
- a pre-journey-marker save that derives completed first jobs;
- schema-34 onboarding migration without starter/login replay;
- complete protected HTML saves from versions 12–82 through the reconciliation path;
- a dense version-82 fixture reaching current field owners;
- backup recovery and partially missing optional fields;
- save/reload after campaign progression, resident/home creation, and restoration.

The live isolated QA save also entered final Lawn, Café, and Scoops levels. No late-save relock or missing final-level option was observed.

## Tutorial integrity

| Tutorial/guide | Stored marker | Runtime/copy result |
| --- | --- | --- |
| Town movement | `journey.moved` | Drag instruction matches actual camera browsing |
| Meet resident | `journey.metResident` | Normal NPC selection/thought flow advances it |
| Lawn | `tutorialSeen.lawn`, `tried.lawn`, completed job | 50% wording matches one-star threshold |
| Waste | `tutorialSeen.waste`, `tried.waste`, completed job | Reward/shop purpose is short and consistent |
| River | `tutorialSeen.river`, `tried.river`, completed job | Portrait instruction matches the orientation contract |
| Beach | `tutorialSeen.beach`, `tried.beach` | First-entry tracking exists |
| Power Wash | `tutorialSeen.playground`, `tried.playground` | First-entry tracking exists |

No tutorial copy/data mismatch remains. Interrupted resident setup recovery now matches the protected HTML contract while retaining the approved three-page Phaser flow.
