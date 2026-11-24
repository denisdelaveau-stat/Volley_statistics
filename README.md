# VolleyLive v1.26.1

Offline-first volleyball capture, coach, spectator, library and reporting application.

## v1.26.1 highlights

- SPECTATOR VIEW uses one common set selector for SCORES, TIMELINE, GRAPH, and RANKING.
- The current set and its latest point are selected by default; earlier sets remain available with one-click **Retour au direct**.
- HOME SCORE momentum cells and bar are green; AWAY cells and bar are red.
- TIMELINE shows complete player names on one line, fixed 40 px connectors, fixed 38 px delta squares attached to the score, half-width HOME/AWAY header boxes, and dotted maximum-gap outlines.
- RANKING is calculated from the selected set.
- All v1.26.0 set navigation, score, graph, ranking, capture, library, coach, report, offline, accessibility and responsive behavior is preserved.

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

- `RELEASE_NOTES_v1.26.1.md`
- `IMPLEMENTATION_REPORT_v1.26.1.md`
- `COPY_INSTRUCTIONS_v1.26.1.md`
- `docs/VISUAL_VALIDATION_v1.26.1.md`
