# Implementation report — Volley Live Capture v1.16.2

## Baseline and scope
This release is built from the verified complete v1.16.1 package (archive SHA-256 `08d6065454c84a2df1ccd5c58a09f31b9fde90ee4757f5c08f0f4ce100e85331`). It changes only LIVE TIMELINE presentation, release metadata, tests and validation assets.

## Implemented geometry
1. The five timeline tracks retain the delta / AWAY / score / HOME / HOME-delta structure, but desktop flexible proportions change from 1.35:0.65 to 0.8:1.0 around the score.
2. The score-spine center moves from the v1.16.1 acceptance band of 61-64% to 44-48% of the board width.
3. The AWAY delta lane is right-aligned. A maximum bar fills the lane from the 12 px safety inset; smaller bars keep their right edge fixed.
4. Every A marker starts after a constant grid gap (12 px desktop, 8 px compact), so all markers share one X coordinate and each bar remains completely to its left.
5. CSS grid alignment gives the red bar and A marker the same center Y. The marker-to-connector gap is 8 px and the connector ends at the score-pill edge.
6. At <=1100 px, 100 px is transferred from the AWAY flexible minimum to the HOME minimum. This keeps the internal board width unchanged while shifting score/HOME left and preserving HOME card space.

## HOME preservation
No HOME card rule, child markup or rendering code changed. A frozen v1.16.1 baseline records the card, avatar, number, role, copy, name and action bounding boxes plus computed colors, padding, gap, display and child order at 1536x1024, 1024x768 and 412x915. Tests require identical internal measurements and require the card X shift to equal the score-spine X shift.

## Verification assets
- `tests/test_timeline_alignment_v1_16_2.py`: compact AWAY sequence, left shift, overlap safety, connector geometry, responsive visibility, HOME frozen-geometry comparison and three visual baselines.
- `tests/baselines/home_layout_v1_16_1.json`: authorized v1.16.1 HOME geometry/style reference.
- `tests/visual_baselines/away_alignment_*_v1_16_2.png`: desktop, tablet and mobile alignment baselines.
- `docs/spectator_live_timeline_*_v1.16.2.png`: final control screenshots.

## Preserved behavior
Filters, DERNIER POINT, ARCHIVE/REPLAY, proportional delta values, archive normalization, score accents, HOME card content and colors, navigation, PWA/offline behavior and responsive board scrolling are unchanged.
