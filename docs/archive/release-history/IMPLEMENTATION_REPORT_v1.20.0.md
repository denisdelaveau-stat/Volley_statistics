# Implementation report — v1.20.0

## Scope

Implemented the Advanced Statistics specification and the follow-up Home SPECTATOR VIEW card from the v1.19.1 source.

## Changed runtime files

- `index.html`: SPECTATOR VIEW Home card, eye icon, exact subtitle, accessibility labels, unchanged archive-file behavior, v1.20.0 display version.
- `spectator.html`: SCORES / TIMELINE / GRAPH / RANKING navigation and Ranking panel with two filters.
- `spectator.css`: responsive four-tab navigation, Ranking cards, neutral empty state, phone/tablet/desktop behavior.
- `spectator.js`: official-JSON Ranking extraction, category normalization, Highlight/Lowlight/Delta sorting, Capture v1 and VolleyLive v2.1 support.
- `statistics/index.html`: single complete timeline interface, removed Rotation metrics / Roster ranking / Temps de jeu pages, text details instead of graphs.
- `sw.js`: v1.20.0 offline cache.

## Data rules

- Ranking includes only the configured HOME/our-team roster represented in the official JSON, matching the previous Roster Ranking semantics.
- Opponent, unknown-player, voided, cancelled, and undone actions are excluded.
- Highlight sorts points first; Lowlight sorts errors first; Delta sorts points minus errors.
- Neutral actions count in totals but do not change point/error/delta values.
- Unsupported action kinds are ignored rather than inferred.
- Missing data is shown as neutral gray `0` or `NA`.

## Validation

- `python -m pytest -q`: **139 passed**.
- New functional coverage validates exact labels, both filters, ranking order and values, opponent exclusion, empty states, Advanced Statistics removals, and SPECTATOR VIEW archive flow.
- New visual coverage validates Home, Ranking, and Advanced Statistics at the requested responsive sizes.
- Full legacy score, momentum, timeline, graph, capture, coach, PWA and accessibility suites pass.
