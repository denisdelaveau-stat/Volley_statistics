# Implementation report — Volley Live Capture v1.18.1

## Baseline

Implementation starts from the verified `Volley_statistics_v1.18.0_complete.zip` with SHA-256 `266b43e64d883123375723ba7c4e16f5bffbe23264a038988baaa131d8606ae2`.

## Implementation

The complete spectator interface now uses the HOME-left / AWAY-right convention. The header, LIVE SCORE summary, LIVE TIMELINE title, score halves, action columns, delta lanes and connectors were updated as one coherent geometry. HOME cards retain their existing internal DOM and styling; AWAY keeps the `A` marker.

The timeline row order is now HOME card, HOME connector, green HOME delta, HOME:AWAY score, red AWAY delta, AWAY connector and AWAY marker. Delta badges use a constant 6 CSS px score gap, exact shared vertical centers and proportional lane widths. Connectors automatically reduce from 112 CSS px to 18 CSS px while preserving non-overlap and equal side lengths.

LIVE GRAPH retains HOME above AWAY and the canonical `HOME − AWAY` sign convention for both score and cumulative-fault deltas. Score accent classes remain attached to the actual scoring team, so SO/BP colors follow the correct left or right score half after the layout inversion.

## Preserved functions

LIVE SCORE, LIVE TIMELINE filters, archive/replay, Rallye N, DERNIER POINT, invalid-data warnings, Score and Fault Evolution, JSON derivation, keyboard support, contrast, reduced motion and offline caching remain available.

## Validation

Static JavaScript validation covers `spectator.js`, `statistics/adapter.js` and `sw.js`. The automated suite covers geometry, semantics, terminal actions, SO/BP mapping, HOME/AWAY graph ordering, delta signs, accessible labels, narrow-screen reachability, offline assets and visual regression at 1536×1024, 1024×768, 844×390 and 390×844.
