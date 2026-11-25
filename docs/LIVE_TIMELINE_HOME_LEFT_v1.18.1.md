# Spectator HOME-left layout — v1.18.1

## Convention

The spectator interface consistently places HOME on the left and AWAY on the right.

- Header and LIVE SCORE: `HOME score : score AWAY`.
- LIVE TIMELINE: `HOME card | HOME connector | HOME delta | HOME : AWAY | AWAY delta | AWAY connector | A marker`.
- LIVE GRAPH: HOME row above AWAY; score and fault deltas remain `HOME − AWAY`.

## Timeline geometry

- HOME delta is green, right-aligned in the lane immediately left of the score.
- AWAY delta is red, left-aligned in the lane immediately right of the score.
- Both bars include a fixed readable `+delta` badge and share the score pill's vertical center.
- The score-to-delta gap is 6 CSS px at all supported widths.
- Connectors use `clamp(18px, calc((100vw - 760px) / 2), 112px)` and remain equal on both sides.
- HOME card markup, avatar, copy, padding, gap, color and action badge are unchanged.
- Narrow screens scroll inside the timeline board; document-level horizontal overflow is prohibited.

## Preserved behavior

- `Rallye N` remains attached above the score.
- Exactly one score half is colored by SO/BP state and the color follows the scoring team after the side inversion.
- `DERNIER POINT`, invalid-data notes, filters, archive/replay, LIVE SCORE and LIVE GRAPH are retained.
- All displayed values remain derived from the official loaded JSON.

## Validation viewports

- 1536×1024
- 1024×768
- 844×390
- 390×844

Acceptance coverage is in `tests/test_compact_score_delta_v1_18_1.py`, with frozen baselines in `tests/visual_baselines/compact_timeline_*_v1_26_1.png` (re-frozen in v1.26.1).
