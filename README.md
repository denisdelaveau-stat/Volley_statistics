# Volley Live Capture v1.18.1

Offline-first volleyball capture, coach, statistics and spectator application.

## v1.18.1 highlights

- LIVE TIMELINE delta bars now touch the score cluster with a constant 6 px separation and share its exact vertical centre.
- HOME is consistently on the left and AWAY on the right across LIVE SCORE, LIVE TIMELINE, the header and LIVE GRAPH.
- The green HOME delta sits immediately left of the score; the red AWAY delta sits immediately right.
- Connector tracks shrink automatically from 112 px to 18 px as available width decreases, without changing HOME card internals.
- Narrow devices use controlled board scrolling so the AWAY marker, delta, score and HOME card remain reachable without document-level overflow.
- Four-viewport geometric and visual coverage is included for 1536×1024, 1024×768, 844×390 and 390×844.

## v1.18.0 retained features

- LIVE GRAPH is now the approved synchronized **Score and Fault Evolution** view.
- A single selected-set rally timeline drives HOME/AWAY score cells, the cyan score-delta curve, cumulative HOME/AWAY fault cells and the amber fault-delta curve.
- Side-out and Break Point colors remain confined to the scoring team’s score cell; fault increments use a distinct orange state.
- Set selection, responsive history, persisted order/window controls and `Retour au direct` are supported.
- Fault classification is shared with the official statistics adapter; all production values come from the loaded official JSON.
- WCAG-oriented names, summaries, focus, contrast, 44 px controls and reduced-motion behavior are included.
- Automated unit, integration, alignment, accessibility, performance and visual-regression tests are provided.

## Run locally

```bash
python3 serve_local.py
```

Then open the local URL shown by the server.

## Validate

```bash
python3 -m pytest -q
node --check spectator.js
node --check statistics/adapter.js
node --check sw.js
```
