# Impact Projects and KindWorks Cinema — Milestone 38

Milestone 38 migrates the original Impact screen into the Phaser application and
connects it to the KindWorks Cinema already drawn in Willowmere. This milestone
does not add real sponsorship claims: the preserved three-card preview dataset is
used until a validated project feed is supplied.

## Trust and data rules

- Project schema version is `2` and every record requires an id, title, category,
  creator, location and description.
- Categories are River cleaning, Free lawn care and Rubbish cleaning.
- Duplicate or missing ids are skipped. Invalid records can be shown only as
  excluded cards; they never count as verified impact.
- A contribution counts only when the record is valid, non-demo, verified,
  completed, dated and has a non-negative funded GBP amount.
- The built-in previews therefore report exactly £0 and 0 supported projects.
- A remote feed must use HTTPS and pass the full validator. Network, timeout,
  response or validation failures retain the complete embedded preview dataset so
  the screen never becomes empty offline.

## Video privacy and link safety

Only canonical YouTube, mobile YouTube and `youtu.be` links are accepted. Watch,
embed, Shorts and Live URL shapes are supported. Lookalike hosts and unsupported
paths are rejected.

Cards do not create an iframe during rendering. A player is created only after the
player presses **Load privacy-enhanced player**, and it uses
`youtube-nocookie.com`. The separate external watch action uses a canonical
YouTube URL with `noopener,noreferrer`. Preview projects have no film URL and make
no network request.

## Town and restoration integration

The cinema door is at the original High Street cinema building. Before the
Station milestone, its interaction reads **KindWorks Cinema · closed** and explains
the restoration requirement. Once `restorationMilestones.unlocked.station` is
true, the door opens the Cinema presentation of the Impact screen and the existing
marquee and resident crowd remain permanently visible.

The global **Impact** button remains available independently so players can read
the transparency promise and preview the project model before the physical cinema
reopens.

## Persistence

No new save field is necessary. Impact projects are published content rather than
player progress, while cinema access reuses the already-persisted Station
restoration unlock. Game-state schema 33 remains unchanged.

## QA contract

Use `?qa=impact` in development to unlock through Station, spawn at the cinema
door and verify the open presentation. Use `?qa=impact-locked` on a fresh origin
to verify the closed-door restoration message. Runtime diagnostics are available through:

- `getImpactDiagnostics()`
- `getImpactState(category)`
- `openImpact()`
- `qaOpenCinema()` (development only)
