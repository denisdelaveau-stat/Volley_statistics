# VolleyLive v1.25.0 — Setup, Capture, Insights and Viewing

## Navigation

- Home now exposes two visually distinct workspaces: **SETUP & CAPTURE** (`WRITE ACCESS`) and **INSIGHTS & VIEWING** (`READ ONLY`), with **SETTINGS** kept separate.
- SETUP & CAPTURE contains **MATCH CAPTURE** and **TEAM MANAGEMENT**.
- MATCH CAPTURE contains **NEW MATCH** and **CONTINUE CAPTURE** only.
- INSIGHTS & VIEWING contains **MATCH LIBRARY**, **COACH VIEW**, **SPECTATOR VIEW**, and **MATCH REPORTS**.

## Shared Match Library

- Matches are grouped as **ACTIVE**, **FINISHED**, or **IMPORTED**.
- Match JSON import is available only from MATCH LIBRARY.
- Team CSV import remains in TEAM MANAGEMENT with `Numero`, `Nom`, and `Poste` columns.
- One selected-match record is shared by Coach View, Spectator View, and Match Reports.
- The selected match, lifecycle state, and `READ ONLY` mode are visible in the library.
- Empty filters show zero matches and never inject demonstration data.

## Read-only views and reports

- Coach View and Spectator View consume the selected official JSON/event history without exposing capture controls.
- Spectator View preserves SCORES, TIMELINE, GRAPH, RANKING, Score and Fault Evolution, and Momentum in SCORES.
- MATCH REPORTS provides local, offline-capable HTML, event CSV, and official JSON exports.

## Advanced Statistics removal

- The Advanced Statistics Home entry, direct route, offline-cache entry, implementation document, screenshots, visual baselines, and dedicated tests were removed.
- The shared `statistics/adapter.js` and shared fixture data remain because Coach View, Spectator View, Match Library validation, and existing tests use them.
- Detailed action/player history remains available in **SPECTATOR VIEW → TIMELINE**; team/player analysis remains in Coach View; graph/ranking remain in Spectator View.

## Compatibility

Capture entry, HISTORY Delete, HOME | ERREUR | AWAY, role-aware substitutions, Team Management, Coach View, Live Court, Player Focus, Spectator SCORES/TIMELINE/GRAPH/RANKING, offline PWA behavior, and the pastel role palette remain available.

## Validation

- 152 tests passed with no failures.
- JavaScript syntax and offline asset checks passed.
- Phone, tablet, and landscape navigation screenshots were generated and inspected.
