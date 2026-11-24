# Visual validation — VolleyLive v1.26.0

Validated on Chromium in deterministic phone, tablet, landscape, and desktop viewports.

## SPECTATOR VIEW checks

- Common set selector and DIRECT / REPLAY state remain visible without page-level horizontal overflow.
- SCORE preserves its card order and shows green HOME / red AWAY momentum cells and proportional bar segments.
- TIMELINE keeps the central score spine, delta bars attached to the score block, normalized equal connectors, complete wrapped HOME player names, reduced row spacing, last-point label, and dotted maximum-gap outline.
- GRAPH preserves synchronized score/fault rows, charts, controls, keyboard focus, and internal horizontal scrolling.
- RANKING preserves responsive cards and filters while using the selected set.

## Baselines

Twenty v1.26.0 PNG baselines are stored under `tests/visual_baselines/`:

- 4 SCORE layouts;
- 10 TIMELINE/compact/alignment layouts;
- 3 GRAPH layouts;
- 3 RANKING layouts.

The automated visual checks compare viewport dimensions and bounded mean pixel differences. Functional geometry checks independently assert connector equality/length, non-overlap, full-name CSS, compact row height, score/delta adjacency, maximum-gap styling, touch targets, and page overflow constraints.
