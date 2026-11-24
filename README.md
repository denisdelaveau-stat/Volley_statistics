# VolleyLive v1.25.0

Offline-first volleyball capture, coach, spectator, library and reporting application.

## v1.25.0 highlights

- Home separates official data writing (**SETUP & CAPTURE**) from read-only use (**INSIGHTS & VIEWING**).
- MATCH CAPTURE contains only NEW MATCH and CONTINUE CAPTURE.
- TEAM MANAGEMENT keeps New Team, Registered Teams, and CSV import (`Numero`, `Nom`, `Poste`).
- MATCH LIBRARY groups ACTIVE, FINISHED, and IMPORTED matches and owns match JSON import.
- Coach View, Spectator View, and Match Reports share the selected match.
- MATCH REPORTS exports HTML, event CSV, and official JSON locally.
- Advanced Statistics and its route are removed; its useful destinations remain in Spectator and Coach views.
- Offline support, accessibility, responsive layouts, pastel role colours, capture history deletion, substitutions, Momentum, Score and Fault Evolution, Timeline, Graph, and Ranking are preserved.

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

- `RELEASE_NOTES_v1.25.0.md`
- `IMPLEMENTATION_REPORT_v1.25.0.md`
- `COPY_INSTRUCTIONS_v1.25.0.md`
- `docs/VISUAL_VALIDATION_v1.25.0.md`
