# Implementation report — VolleyLive v1.27.0

## Baseline

Implemented from the complete VolleyLive v1.26.1 package. The change is scoped to MATCH LIBRARY markup, styling, interaction, tests, release metadata, and the service-worker version.

## Implementation

- `index.html`: new Match Library header, Import action, lifecycle filters, listbox, legend, details sheet, and fixed selected-match action bar.
- `match-hub.css`: responsive single-line grid, selected/live/finished states, fixed action bar, bottom sheet, safe-area handling, and narrow-phone fallbacks.
- `match-hub.js`: All / Live / Finished lifecycle model; sort and default-selection rules; persisted `vl.library.filter` and `vl.library.selectedId`; listbox keyboard behavior; row/info separation; details binding; and selected-match actions.
- `tests/test_match_library_v1_27.py`: browser acceptance for empty states, live/finished grouping, imported metadata, persistence, keyboard selection, imports, duplicate handling, routes, and 360 px layout.

## Preserved behavior

JSON schema validation, 10 MB/type checks, unsafe-key rejection, duplicate import dialog and import-as-copy, local current-match synchronization, Coach replay routing, Spectator archive routing, report generation/export, telemetry, offline status, and match-capture conflict handling are retained.
