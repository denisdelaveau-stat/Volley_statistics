# Volley Live Capture v1.19.1

Offline-first volleyball capture, coach, statistics and spectator application.

## v1.19.1 highlights

- LIVE SCORE now contains the approved v1.19.0 HOME-left/AWAY-right score card with team crests, followed immediately by **MOMENTUM ACTUEL**.
- The old LIVE SCORE summary was removed, so the score is not duplicated.
- LIVE TIMELINE no longer contains the score/momentum section; its filters, timeline board, internal scrolling and behavior are otherwise unchanged.
- Every team name, score, set count, status, service indicator, point sequence, percentage, count and streak is rebuilt from the loaded official JSON.
- Momentum defaults are configurable in `spectator-live-config.js`: last 8 current-set points, minimum 4 points and 70% advantage threshold.
- New-set, insufficient-data, set-finished, match-finished and no-match states use the specified neutral 0/NA treatment.
- Corrections, voided rallies and Undo are handled by complete view-model recomputation; momentum never carries across sets.
- MOMENTUM ACTUEL remains below the score at phone, tablet, landscape and desktop sizes.
- HOME uses cyan and AWAY uses slate in the new section; Timeline BP/SO green, yellow and red are not reused.
- Accessibility includes textual H/A tiles, French ARIA summaries, a polite leader-change region, touch-sized controls, contrast and reduced-motion support.
- Specification tests T1–T12, LIVE SCORE placement checks, responsive/visual checks and the complete regression suite pass: **133 tests**, no failures.

## Retained functionality

- HOME-left/AWAY-right LIVE TIMELINE with compact score-adjacent delta bars and adaptive connectors.
- LIVE GRAPH synchronized Score and Fault Evolution view.
- Official JSON import, archive flow, capture, coach views, accessibility and offline PWA behavior.

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
