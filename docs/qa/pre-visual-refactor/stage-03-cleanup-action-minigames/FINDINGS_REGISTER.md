# Stage 3 Findings Register

## Finding disposition

### S3-F01 — Reported House Rescue sorting-bin clipping

| Field | Evidence |
| --- | --- |
| Original severity | P3 |
| Final classification | Audit false positive; hidden transition geometry, not a player-facing defect |
| Status | **CANNOT REPRODUCE** |
| Reproduction review | Open House Rescue Level 1 at 1280×720. Before selecting an item, the bin cluster is closed with `opacity: 0` and `transform: translateY(12px)`. In that intentionally invisible state, each rectangle ends at y=721. Select a rubbish item; the cluster gains `is-open`, opacity becomes 1, and the transform becomes `none`. |
| Expected | Every player-visible 44-pixel bin control is wholly inside the safe viewport. |
| Actual visible state | Organic, Recycling, and Garbage each have `y=665`, `height=44`, and `bottom=709` in the 720-pixel viewport. They are eleven pixels inside the viewport. |
| Original measurement | `y=677`, `bottom=721`, `opacity=0`, 12-pixel transition transform; it was incorrectly described as the open state. |
| Corrected live evidence | `viewport=[1280,720]`; `class="house-rescue-bins is-open"`; `opacity=1`; `transform=none`; three controls end at y=709. |
| Root cause | The audit measured all DOM controls without first restricting evidence to visible controls. The CSS intentionally moves the hidden cluster down before its opening transition. |
| Production correction | None. Changing the CSS would alter a valid transition to fix a non-player-visible condition. |
| Regression | `tests/stage-03-repair.test.js` pins the safe HUD inset, eight-pixel visible bottom offset, removal of the transition in `is-open`, and 44-pixel targets. Runtime verification checks the visible rectangles. |

## Observations and bounded gaps

- **S3-O01 — Shared QA completion controls:** `?qa=fidelity` provides deterministic level entry for all campaigns, but certified completion shortcuts are not consistently enabled under that same flag. Power Wash recognizes it; Lawn, River, Waste, House, and Beach use scene-specific flags. This affects audit efficiency only and is not player-facing.
- **S3-O02 — Physical devices:** touch, safe-area, background/foreground, and interruption testing used browser emulation only. Physical iOS/Android remains untested.
- **S3-O03 — Normal world routes:** normal return-to-Town behavior is service-tested and was re-observed from Fishing, Magnet Fishing, and Power Wash. Other ordinary town entrances were not re-operated during this stage's isolated level sampling.
- **S3-O04 — Formal solvers:** River has representative certified solver coverage, not a formal exhaustive proof for all 750 boards. House Rescue and Power Wash are continuous/spatial systems without a useful discrete whole-campaign solver. Their exhaustive validation covers data generation, bounds, references, reachable geometry, rules, and deterministic progression.

## User decisions required

None.

## Remaining confirmed P0–P3 defects

None.

## Pre-existing issues kept separate

- No type-check or lint script is configured. This is an assurance-tooling observation from the baseline, not a Stage 3 gameplay defect.
- External billing and native packaging are outside this stage.
