# UI-SPECTATOR — Spectator View: shell, navigation and set selection

| Field | Value |
|---|---|
| Spec ID | `UI-SPECTATOR` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-28 |
| Source of truth | `spectator.html`, `spectator.js` (`window.VolleySpectator`), `js/spectator-core.js` (state, view models), `js/spectator-graph.js` (`updateSetSelector`), `spectator.css` |
| Related specs | UI-SPECTATOR-SCORE, UI-SPECTATOR-TIMELINE, UI-SPECTATOR-GRAPH, UI-SPECTATOR-RANKING, UI-LIBRARY-10 (entry), SYS-JSON, SYS-I18N-08 |

## 1. Purpose

The Spectator View is the read-only page (`spectator.html`) for the public: score and momentum, timeline, score and
fault evolution, ranking. This spec covers what all four tabs share.

## 2. Scope

- In scope: entry, tabs and address, header, data loading and validation, live refresh, the shared set selector,
  empty and fatal states, HOME / AWAY conventions.
- Out of scope: the content of each tab (its own spec).

## 3. Definitions

- Archive: the match document shown, stored in `volleySpectator.archive.v1`.
- Live set: the current set of the match; replay set: any other set chosen.

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-SPECTATOR-01` | The Spectator View opens from the Match Library (« Spectateur »), which stores the document and opens `spectator.html#live-score`. | UI-LIBRARY-10 |
| `UI-SPECTATOR-02` | Navigation: home link ⌂ (back to `index.html`), then SCORES, TIMELINE, GRAPH, RANKING; the address hash selects the tab (`#live-score`, `#live-graph`, `#ranking`, otherwise TIMELINE) and activating a tab writes its hash. | Product |
| `UI-SPECTATOR-03` | Unified v2.1 and Capture v1 documents are accepted after validation; an invalid archive hides the page and shows « Archive indisponible », the reason and « Retour à la page principale ». | SYS-JSON, SYS-SEC-04 |
| `UI-SPECTATOR-04` | When another tab rewrites the archive (storage event), or through `VolleySpectator.setArchive()` / `refresh()`, the view is rebuilt for the selected set at once, so that a correction appears immediately. | Product |
| `UI-SPECTATOR-05` | Everything shown is derived from the document; nothing is typed, hard-coded or invented. | Data integrity |
| `UI-SPECTATOR-06` | The set bar offers « Set » with every set present plus the live set (disabled without data), defaults to the live set, and shows « DIRECT · SET n » (green) on the live set, « REPLAY · SET n » (amber) on another, « AUCUN MATCH » without archive. | Product |
| `UI-SPECTATOR-07` | « Retour au direct » (visible in replay only) returns to the live set and scrolls the active tab into view; the selected set drives every tab and is not stored, so a reload returns to the live set. | Product |
| `UI-SPECTATOR-08` | HOME (our team) is always on the left or on top and AWAY on the right or below, in every tab; the labels HOME and AWAY are not translated. | SYS-I18N-08 |
| `UI-SPECTATOR-09` | The match state is announced (« LIVE » or « TERMINÉ ») for assistive technologies. | Accessibility |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| No archive | Each tab shows its empty state; the set selector is disabled; « AUCUN MATCH ». |
| Invalid archive | Fatal screen of `UI-SPECTATOR-03`. |
| Offline | Works once loaded (SYS-PWA). |

## 6. Data

Reads `volleySpectator.archive.v1` (and its name); stores the timeline preferences (UI-SPECTATOR-TIMELINE).

## 7. Interface

`spectator.html`: `.spectator-header` (`#archiveBadge`), `.spectator-nav` (`[data-tab]`, `.spectator-home`),
`.spectator-livebar` (`#evolutionSet`, `#liveSetStatus`, `#returnToLive`), panels `[data-panel]`, fatal `#fatal`
(`#fatalText`). API `window.VolleySpectator`: `buildViewModel`, `setArchive(doc)`, `refresh()`, `getModel()`,
`visibleRows()`.

## 8. Accessibility and language

Tabs expose `aria-selected`; touch targets at least 44 px; `#liveSetStatus` is a status region; reduced motion
respected. Texts: `spectator.*` keys; tab names kept in English (SYS-I18N-08).

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-SPECTATOR-01` | `tests/spectator/test_timeline.py::test_match_library_import_opens_valid_v21_in_selected_spectator_view` |
| `UI-SPECTATOR-02`, `-03` | `tests/spectator/test_timeline.py::test_return_home_invalid_archive_tablet_and_accessibility`; `tests/spectator/test_ranking.py::test_archive_tabs_are_renamed_and_ranking_is_available` |
| `UI-SPECTATOR-04` | `tests/spectator/test_timeline.py::test_t11_archive_correction_recomposes_last_point` |
| `UI-SPECTATOR-05` | `tests/spectator/test_live_graph.py::test_live_graph_replaces_stats_and_is_json_driven` |
| `UI-SPECTATOR-06`, `-07` | `tests/spectator/test_set_navigation.py::test_shared_set_selector_defaults_to_live_and_controls_every_tab`, `::test_live_set_is_restored_on_reload_not_stale_replay` |
| `UI-SPECTATOR-08` | `tests/spectator/test_compact_score_delta.py::test_home_left_header_timeline_graph_and_score_semantics_are_preserved` |
| `UI-SPECTATOR-09` | `tests/spectator/test_timeline.py::test_capture_v1_and_basic_score_only_are_supported_without_invention` (TERMINÉ) |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-28 | First version; gathers the shared rules of the former Timeline, Ranking, Live Header and Score / Fault Evolution specs. |
