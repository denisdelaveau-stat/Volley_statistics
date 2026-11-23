# Volley Live Capture v1.20.0

Offline-first volleyball capture, coach, statistics and spectator application.

## v1.20.0 highlights

- Home now exposes the archive workflow as **SPECTATOR VIEW**, using the approved navy/cyan eye card and exact subtitle `SCORE - TIMELINE - GRAPH - RANKING`.
- Spectator navigation is now **SCORES**, **TIMELINE**, **GRAPH**, **RANKING**.
- RANKING contains the previous roster information with **Highlight / Lowlight / Delta** and **Attack / Block / Defence / Reception / Service / All** filters.
- Ranking values come only from the loaded official JSON; neutral empty categories use gray `0` / `NA`.
- Advanced Statistics keeps the complete Set Timeline and detailed text metrics while removing Rotation metrics, Roster ranking, Temps de jeu, and rendered graphs.
- Score with crests, MOMENTUM ACTUEL, Timeline, Score and Fault Evolution Graph, capture, coach views, HISTORY Delete, offline operation, responsive layouts, and role colors are retained.
- Full automated and visual regression result: **139 passed**, no failures.

## Run locally

```bash
python3 serve_local.py
```

Then open the local URL shown by the server.

## Validate

```bash
python3 -m pytest -q
node --check spectator.js
node --check spectator-live-config.js
node --check statistics/adapter.js
node --check sw.js
```
