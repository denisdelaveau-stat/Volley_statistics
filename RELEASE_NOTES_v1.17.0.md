# Release notes — Volley Live Capture v1.17.0

## Spectator LIVE TIMELINE
- AWAY and HOME connector tracks now have exactly the same computed length on every row and viewport.
- The compact sequence remains `AWAY delta → A marker → connector → score → connector → HOME card → HOME delta`.
- HOME delta bars sit immediately beside the HOME information card with the same constant grid gap used on the AWAY side.
- The score cell is wider, uses a brighter accessible SO/BP palette, and keeps exactly one coloured half while the other remains black.
- `Rallye N` is rendered in a separate attached cell directly above the score.
- The timeline title always displays generic `AWAY` and `HOME` cells of identical size and style; archive team names are not shown there.
- `Nombre d’actions` and both order buttons share the same control width, height, border, radius, typography and vertical alignment.

## LIVE GRAPH
- The former `STATS` spectator tab is replaced by `LIVE GRAPH`.
- The upper SVG chart draws the AWAY and HOME score series from the selected archive rally scores.
- The lower SVG chart draws `HOME − AWAY`: green above zero, red below zero and neutral grey at zero.
- SO, HOME BP and AWAY BP points use the same contextual yellow, green and red palette as LIVE TIMELINE.
- Order and rally-window preferences are shared with LIVE TIMELINE and remain persistent.
- Basic archives never receive invented actions; score lines and deltas remain available from rally scores.
- Archives with no rally show an explicit empty state.
- Tablet and portrait layouts use chart-owned horizontal scrolling and never create document-level horizontal overflow.

## Compatibility and offline
- SPECTATOR VIEW, LIVE SCORE, LIVE TIMELINE, DERNIER POINT, ARCHIVE/REPLAY, capture, HISTORY Delete, HOME | ERREUR | AWAY, COACH VIEW, LIVE COURT, PLAYER FOCUS, ADVANCED STATISTICS and official JSON adapters remain available.
- Offline cache version: `volley-live-capture-v1.17.0`.
