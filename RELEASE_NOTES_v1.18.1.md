# Release notes — Volley Live Capture v1.18.1

## Compact LIVE TIMELINE

- Adopted the HOME-left / AWAY-right convention in the spectator header, LIVE SCORE, LIVE TIMELINE and LIVE GRAPH.
- Moved proportional HOME/AWAY delta lanes beside the score while preserving the shared score spine.
- Added a fixed, readable `+delta` badge inside each proportional bar.
- Kept a constant 6 px score-to-delta gap and exact shared vertical centre.
- Reordered each rally row as HOME card → adaptive HOME connector → green HOME delta → HOME:AWAY score → red AWAY delta → adaptive AWAY connector → AWAY marker.
- Capped desktop connectors at 112 px and reduced them down to 18 px on narrow screens.
- Preserved Rallye N, single-half SO/BP score coloring on the correct team half, DERNIER POINT, filters and archive/replay.
- Kept LIVE GRAPH rows HOME above AWAY and retained `HOME − AWAY` delta semantics.

## Quality

- Added geometry, no-overlap, badge, card-preservation, accessibility, offline and four-viewport visual tests.
- Offline cache version: `volley-live-capture-v1.18.1`.

## LIVE GRAPH retained from v1.18.0

- Replaced the former two-series score/bar graph with the approved Score and Fault Evolution view.
- Added HOME/AWAY post-rally score rows and a uniform cyan `HOME − AWAY` delta curve.
- Added cumulative HOME/AWAY fault rows and a uniform amber `HOME faults − AWAY faults` curve.
- Added strict shared rally-column geometry across all four rows and both curves.
- Added official-set selection, empty/one-rally states, live-history browse and `Retour au direct`.

## Data integrity

- Every value is recomputed from normalized official JSON records.
- Fault counting uses the shared statistics adapter rule for active ACTION records evaluated as ERROR/FAULT.
- Set boundaries reset score/fault timeline state; voided records are excluded; Undo/corrections rebuild the timeline.
- Missing score classification remains neutral and is never guessed.

## v1.18.0 quality retained

- New automated coverage: derivation formulas, reset, classification, multiple states, Undo, official fixture integration, save/reopen stability, exact alignment, accessibility, responsive behavior and visual regression.
