# Release notes — Volley Live Capture v1.18.0

## LIVE GRAPH

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

## Quality

- New automated coverage: derivation formulas, reset, classification, multiple states, Undo, official fixture integration, save/reopen stability, exact alignment, accessibility, responsive behavior and visual regression.
- Offline cache version: `volley-live-capture-v1.18.0`.
