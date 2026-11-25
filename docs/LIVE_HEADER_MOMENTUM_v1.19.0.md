# Spectator Live Header & Momentum — v1.19.0

The spectator Live Timeline now starts with:

1. VolleyLive application header.
2. HOME-left/AWAY-right score card.
3. MOMENTUM ACTUEL card.
4. The unchanged Live Timeline.

Momentum is a pure current-set calculation using the final `windowSize` normalized, non-voided rallies. Percentages are enabled at `minPoints`, rounded with AWAY calculated as `100 - HOME`, and the advantage threshold applies to exact shares. The streak scans backward over the whole current set.

Configuration lives in `spectator-live-config.js`. Match values never belong in that file.

Validation screenshots cover phone portrait, tablet portrait, phone landscape and desktop landscape in `docs/screens_v1.19.0/`.
