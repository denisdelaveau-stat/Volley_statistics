# VolleyLive v1.26.0 — SPECTATOR VIEW live-set navigation and visual alignment

## Common set navigation

- SCORES, TIMELINE, GRAPH, and RANKING now share one set selector.
- The initial view always opens the current/live set and includes its latest point.
- Completed earlier sets can be selected without leaving the active tab.
- A single **Retour au direct** action restores the current set from every tab.
- Reloading SPECTATOR VIEW intentionally returns to the current set instead of restoring a stale replay selection.
- RANKING calculations are scoped to the selected set; score, timeline, and graph already use the same selected-set model.

## SCORES

- HOME momentum cells, percentage text, counters, and bar segment are green.
- AWAY momentum cells, percentage text, counters, and bar segment are red.
- Momentum calculation, thresholds, sequence length, streaks, accessibility labels, and empty states are unchanged.

## TIMELINE

- HOME player names wrap and remain fully visible instead of being truncated with an ellipsis.
- HOME and AWAY connectors use normalized compact lengths (48 px on desktop/tablet and 40 px on compact layouts).
- Vertical action-row spacing is reduced while score, delta lanes, rally captions, and the central score spine retain their alignment.
- Delta bars remain attached to the score block.
- Every visible row reaching the maximum absolute set gap receives a dotted side-coloured outline and an accessible maximum-gap label.

## Compatibility

Capture-v1 and unified v2.1 documents remain supported. Match Library routing, Coach View, reports, capture workflows, offline PWA behavior, SCORE momentum, TIMELINE ordering/window controls, GRAPH score/fault evolution, and RANKING modes/categories remain available.

## Validation

- Added focused v1.26.0 acceptance coverage for common set navigation, live reset, set-scoped ranking, HOME/AWAY colours, complete player names, normalized connectors, compact spacing, and maximum-gap indication.
- Updated deterministic visual baselines for SCORE, TIMELINE, GRAPH, and RANKING on phone, tablet, landscape, and desktop layouts.
- See `tests/TEST_RESULTS_v1.26.0.txt` for the final suite result.
