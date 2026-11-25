# Implementation report — Volley Live Capture v1.17.0

## Baseline
This release starts from the verified complete v1.16.2 archive with SHA-256 `734f15c79631bb10956bf04613b1433575d79ab307c2d3dd97a4bbe225c58a47` and implements all six changes in `docs/update 10.docx`.

## Geometry and score
The rally list is a shared seven-track CSS grid. Every row reuses the same tracks for AWAY delta, AWAY marker, AWAY connector, score, HOME connector, HOME card and HOME delta. The two connector tracks use identical fractional sizing, so their measured widths differ by less than one browser pixel at 1536×1024, 1024×768 and 412×915. CSS subgrid keeps the score spine stable across rows with or without an action card.

The HOME card child order and content remain avatar/number/role then name/action. The grid sizes the shared HOME track to its content cap, stretches the outer card only to that shared row width and leaves its internal padding, gap, typography, colours and elements unchanged. The HOME delta begins after the same constant 12 px desktop or 8 px compact gap as the corresponding AWAY sequence.

The score track is 156 px on desktop and 144 px on compact layouts. Rally labels are bordered attached cells positioned above the score. SO uses vivid yellow, HOME BP vivid green and AWAY BP accessible deep red; only the winning half receives the contextual colour.

## LIVE GRAPH implementation
LIVE GRAPH uses inline SVG and no network dependency. Both charts consume only the normalized `model.rallies` generated from the loaded official archive JSON. The score chart renders separate AWAY and HOME paths, axes, grid, rally labels and contextual point marks. The delta chart calculates `home score − away score` per rally and emits green, red or neutral bars. Both charts use the same persisted order and window controls as LIVE TIMELINE.

Each SVG has an accessible title and aria-label. Scroll wrappers are keyboard focusable. On narrow screens the SVG retains a readable minimum width inside an internal overflow container, while the document width remains bounded.

## Validation
- JavaScript syntax: `spectator.js` and `sw.js` passed `node --check`.
- Complete automated suite: 103 tests passed, 0 failed.
- New update-10 coverage verifies equal connectors, attached rally cell, elongated vivid score, generic equal header cells, compact HOME/AWAY deltas, equal filter controls, LIVE GRAPH replacement, both score series, green/red/neutral delta bars, Basic behavior, empty state, responsive scrolling, contrast and offline cache.
- Visual baselines and control screenshots cover 1536×1024, 1024×768 and 412×915 for both LIVE TIMELINE and LIVE GRAPH.
