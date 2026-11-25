# Implementation report — VolleyLive v1.26.0

## Source baseline

Implemented from the complete VolleyLive / Volley_statistics v1.25.0 package after verifying the published archive SHA-256 (`f24b8a6192b051614e193e69f39d6500f6b315d7139a78a0df1265d7eb19cbab`). The attached `Dans la vue spectator.docx` was read with its nine embedded reference captures.

## Implementation

### Shared selected-set state

`spectator.js` keeps one selected set in the normalized spectator model. `spectator.html` exposes one common selector above all four panels and one live-reset control. The selector drives SCORE, TIMELINE, GRAPH, and set-filtered RANKING rendering. Initialization and `setArchive()` resolve the official current set instead of reading a persisted historical selection.

### Score colours

The existing momentum model is unchanged. CSS role variables now map HOME to green and AWAY to red for percentages, counts, sequence cells, and the proportional bar.

### Timeline geometry

The timeline subgrid is retained so all rows share the same columns. Connector tracks are fixed per responsive breakpoint, the action-row minimum height is reduced, and player names wrap inside the HOME card. Delta lanes remain immediately adjacent to the score node. `visibleRows()` exposes both the rendering scale and the actual maximum visible score gap so maximum-gap outlines remain correct even when the minimum visual scale is five.

### Ranking scope

`rankingSource()` accepts the selected set. Unified v2.1 events are matched by `setNumber`, with a rally-to-set fallback; Capture-v1 events use their `set` field. Player and category aggregation semantics are otherwise unchanged.

## Compatibility and accessibility

- Existing document formats, validation, event normalization, score and fault derivation, order/window preferences, service indication, empty states, and archive updates are preserved.
- Set and live-reset controls meet the existing 44 px touch-target rule.
- Live/replay state is exposed through a status element.
- Maximum-gap outlines include an explicit screen-reader label.
- Reduced-motion behavior applies to the live reset scroll.

## Validation

JavaScript syntax checks, focused Spectator regressions, the complete automated suite, responsive screenshot inspection, delta reconstruction, and package hash verification are recorded in `tests/TEST_RESULTS_v1.26.0.txt` and the v1.26.0 SHA-256 manifests.
