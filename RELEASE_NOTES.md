# Release notes — Volley Live Capture v1.19.0

## Spectator Live header, score and momentum

- Added the VolleyLive wordmark header with no visible replay/archive badge in the new top section.
- Added the score card: HOME left, AWAY right, JSON-derived team names/crests or monograms, current score, sets score, service and French match/set state.
- Added **MOMENTUM ACTUEL** from the current set only: chronological H/A tiles, integer percentages summing to 100, counts, 70% advantage headline and whole-set current streak.
- Defaults are configurable in `spectator-live-config.js`: `windowSize=8`, `minPoints=4`, `advantageThreshold=0.70`.
- Full JSON rebuild occurs after every load/update, correction, Undo or set transition; voided/cancelled/undone records are excluded.
- Added neutral no-match, new-set and insufficient-data states, plus frozen finished-set/match momentum.
- Added optional JSON team logos with shield/monogram fallback and first-rally service fallback.
- Preserved the complete v1.18.1 Timeline, filters, LIVE GRAPH, archive navigation, accessibility and offline behavior.

## Responsive and accessible behavior

- 16 px card padding and 16 px inter-card gap.
- Portrait cards stack and center at a 640 px maximum width; landscape cards use a 50/50 grid.
- The existing Timeline keeps its narrow-screen internal scroller and remains below the cards.
- New-section colors are cyan/slate only; BP/SO green, yellow and red remain confined to the Timeline/graph conventions.
- H/A text, ARIA card summaries, list semantics, polite leader-change announcements and reduced-motion handling are included.

## Quality

- Specification cases T1–T12 implemented.
- Visual validation: 390×844, 768×1024, 844×390 and 1536×1024.
- Complete suite: **132 passed**, no failures.
- Offline cache: `volley-live-capture-v1.19.0`.
