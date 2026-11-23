# Implementation report — v1.21.0

## Scope

Implemented the approved VolleyLive Match Hub visual and `VolleyLive_Match_Hub_Implementation_Specification.md` from the v1.20.0 source.

## Runtime changes

- `index.html`: Match Hub semantic markup, action hierarchy, active summary, recent list, import control, dialogs, retained analysis/tools navigation, and v1.21.0 display version.
- `match-hub.css`: approved navy/orange visual system, responsive phone/tablet layouts, stable disabled/loading/empty/error states, focus treatment, 44 px targets, reduced motion, and WCAG-aware contrast.
- `match-hub.js`: official-model adapter, active-status selection, score/set/date derivation, repository/history, read-only selector, protected New Match transition, safe JSON import, duplicate-ID handling, and safe telemetry events.
- `sw.js`: v1.21.0 cache and Match Hub runtime assets.
- `tests/test_match_hub_v1_21.py`: functional, import, duplicate, data, empty-state, sorting, navigation, and accessibility coverage.
- `tests/test_v1_7_home.py`: Home shell and three-viewport Match Hub regression coverage.

## Data decisions

- The existing `volleyCapture.match.v1`, events, and chart data remain the only editable local-match source.
- Match Hub history uses `volleyMatchHub.history.v1` as a repository of complete, validated source archives; presentation summaries are derived on read rather than persisted as a second match model.
- Active state is accepted only from `live`, `paused`, or `in_progress`.
- Missing scores, dates, sets, or save timestamps are displayed as unavailable and are never replaced with demonstration values.
- Completed result pills show sets won, not rally points.

## Validation

- JavaScript syntax: all runtime scripts passed `node --check`.
- Targeted Match Hub suite: 8 passed.
- Full suite: 146 passed, 0 failed.
- Visual/manual render verification: 320 × 568, 390 × 844, and 768 × 1024; zero horizontal overflow and no page errors.
