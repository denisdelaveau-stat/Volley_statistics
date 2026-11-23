# Implementation report — Volley Live Capture v1.15.0

## Scope
This release builds on v1.14.0. It combines the player-circle visibility adjustment with the archive spectator LIVE TIMELINE described in `docs/Live_Timeline_Spectator_View_Spec.md` and visually guided by `docs/IMG_5695.JPG`.

## Main implementation
- `index.html`: saturated role tokens, smaller action-entry player circles and SPECTATOR VIEW validation/redirect.
- `spectator.html`, `spectator.css`, `spectator.js`: archive replay shell, tabs, scoreboard, filters, timeline view-model, rendering, validation and refresh API.
- `sw.js`: v1.15.0 cache and spectator assets.
- `tests/test_player_court_palette_v1_15.py`: five-color contrast, 390 × 844 geometry, touch sizing, separator clearance and visual regression.
- `tests/test_spectator_timeline_v1_15.py`: T1–T11, SPECTATOR VIEW flow, v2.1, Capture v1, Basic data, invalid input, Home return, tablet, 1536 × 1024 visual regression and contrast.

## Data rules
- v2.1 uses explicit `rallies`, `terminalEventId`, `servingTeamId`, `winnerTeamId`, `scoreAfter`, teams and players.
- Capture v1 groups events into rallies and exposes inferred context as a migration path; it does not create opponent-player identities.
- SO/BP/L, score, delta, scale, last point and cards are recomputed from the archive on every render.
- Basic archives suppress terminal-action cards when action detail is unavailable.

## Accessibility and responsive layout
- Interactive filters and navigation controls are at least 44 px high.
- Role text/background pairs and spectator key labels/tags meet a 4.5:1 contrast target.
- Verified at 390 × 844, tablet 1024 × 768 and landscape 1536 × 1024.
