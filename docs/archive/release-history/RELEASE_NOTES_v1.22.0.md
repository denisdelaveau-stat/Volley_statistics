# Volley Live Capture v1.22.0 — Coach-aligned Advanced Statistics timeline

## User-visible changes

- Advanced Statistics now contains one complete timeline and no separate charts, KPI cards, player-statistics panels, or secondary pages.
- The timeline retains score, setter rotation, service/reception phase, rally, every configured player, every recorded action, and action result colour.
- The interface uses the same navy, cyan, panel, typography, border, and focus language as Coach View.
- Desktop uses the available width for the player/action matrix.
- Phone and short landscape layouts collapse the filters by default so the timeline remains immediately visible.
- Filters, vertical/horizontal orientation, reset, JSON replay, live-match loading, unload, tooltips, empty state, and offline operation remain available.

## Data and interaction

- Official VolleyLive/Capture JSON remains the only source of match values.
- No demonstration values are introduced.
- Every timeline cell exposes player, action, evaluation, score, rally, rotation, phase, and court/bench context through the timeline tooltip and accessible label.

## Compatibility

- This release upgrades v1.21.0 without changing match storage keys or archive schemas.
- Match Hub, Capture, Coach View, Spectator View, Ranking, Score, Graph, and PWA behaviours are unchanged.
