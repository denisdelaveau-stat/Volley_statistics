# VolleyLive v1.26.0

Offline-first volleyball capture, coach, spectator, library and reporting application.

## v1.26.0 highlights

- SPECTATOR VIEW uses one common set selector for SCORES, TIMELINE, GRAPH, and RANKING.
- The current set and its latest point are selected by default; earlier sets remain available with one-click **Retour au direct**.
- HOME SCORE momentum cells and bar are green; AWAY cells and bar are red.
- TIMELINE shows complete player names, normalized compact connectors, reduced action-row spacing, attached delta bars, and dotted maximum-gap outlines.
- RANKING is calculated from the selected set.
- All v1.25.0 workspaces, capture flows, Match Library, Coach View, reports, offline support, accessibility, and responsive behavior are preserved.

## Run locally

```bash
python3 serve_local.py
```

## Validate

```bash
python3 -m pytest -q
node --check match-hub.js
node --check spectator.js
node --check statistics/adapter.js
node --check coach.js
node --check sw.js
```

## Current release documents

- `RELEASE_NOTES_v1.26.0.md`
- `IMPLEMENTATION_REPORT_v1.26.0.md`
- `COPY_INSTRUCTIONS_v1.26.0.md`
- `docs/VISUAL_VALIDATION_v1.26.0.md`
