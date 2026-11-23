# Release notes — Volley Live Capture v1.20.0

## SPECTATOR VIEW and archive Ranking

- Renamed the Home action **OPEN ARCHIVES** to **SPECTATOR VIEW** without changing its JSON-file selection and spectator-opening behavior.
- Added the approved large navy card with cyan luminous border, white outline eye, white `SPECTATOR VIEW` title, exact cyan subtitle `SCORE - TIMELINE - GRAPH - RANKING`, and right chevron.
- Renamed spectator tabs to **SCORES**, **TIMELINE**, **GRAPH**, and added **RANKING**.
- Moved Roster Ranking out of Advanced Statistics and into SPECTATOR VIEW.
- RANKING preserves Highlight and Lowlight, renames Overall to **Delta**, and adds the category filter **Attack / Block / Defence / Reception / Service / All**.
- Ranking values are calculated only from the loaded official JSON. Empty categories render neutral gray `0` / `NA` states and never use demonstration data.

## Advanced Statistics

- Removed Rotation metrics, Roster ranking, and Temps de jeu subpages.
- Kept the complete default Set Timeline and all text-based statistical details.
- Removed rendered donut, curve, modal, and other graph components from Advanced Statistics.
- Preserved official JSON import, filtering, vertical/horizontal timeline layouts, empty-state handling, and source provenance.

## Compatibility retained

- Capture entry, HISTORY Delete, HOME | ERREUR | AWAY, COACH VIEW, LIVE COURT, PLAYER FOCUS, crest score card, MOMENTUM ACTUEL, Timeline, Score and Fault Evolution Graph, offline operation, responsive layouts, and role colors remain available.
- The SPECTATOR VIEW archive flow continues to validate supported VolleyLive v2.1 and Capture v1 JSON before opening `spectator.html#live-timeline`.

## Validation

- Automated and visual result: **139 passed**, 0 failed.
- Visual baselines cover renamed spectator navigation, RANKING at 390×844, 768×1024 and 1536×1024, Advanced Statistics at 390×844 and 1536×1024, and the Home SPECTATOR VIEW card at 390×844, 768×1024 and 844×390.
- Mobile page-level overflow, touch targets of at least 44 px, clean subtitle wrapping, accessibility names, offline cache, and previous visual regressions are verified.

## Offline cache

- Cache name: `volley-live-capture-v1.20.0`.
