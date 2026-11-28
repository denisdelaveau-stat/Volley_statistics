# UI-LIBRARY — Match Library

| Field | Value |
|---|---|
| Spec ID | `UI-LIBRARY` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-28 |
| Source of truth | `match-hub.js` (`window.VolleyMatchLibrary`), `match-hub.css`, `index.html` (`#matchLibraryScreen`, `#matchInfoDialog`, `#matchHubDuplicate`) |
| Related specs | UI-HOME (entries), UI-COACH, UI-SPECTATOR, UI-REPORTS, UI-HUB (saved matches), SYS-JSON, SYS-SEC, SYS-DATA |

## 1. Purpose

The single read-only entry point to choose a match and open it in the Coach View, the Spectator View or Match
Reports. It is also the only place where a match JSON is imported. It never modifies the active match.

## 2. Scope

- In scope: sources, list, filters, selection, details, opening a view, JSON import.
- Out of scope: the views themselves; the exports (UI-REPORTS); team CSV import (UI-TEAMS).

## 3. Definitions

- Live match: the active local match while its status is `live`, `paused` or `in_progress`. Finished: every other
  entry (completed local matches and every import).

## 4. Requirements

### 4.1 Sources and list

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-LIBRARY-01` | The list shows the active local match, the saved and completed local matches, and the imported matches (history, max 100); a completed active match is copied once into the history. | SYS-DATA-07 |
| `UI-LIBRARY-02` | « BIBLIOTHÈQUE DE MATCHS » shows « Choisissez un match, puis ouvrez une vue. », the « Importer » action, the filters « Tous », « En cours », « Terminés » with their counts, the list, a status legend and the action bar « Vue coach » (primary), « Spectateur », « Rapports ». | Product |
| `UI-LIBRARY-03` | Matches are sorted live first, then by match date, then by last update, newest first. | Product |
| `UI-LIBRARY-04` | A row holds a status dot, the HOME and AWAY teams, the set score and either the current set (live) or the date (finished), plus a separate details button; rows stay on one line down to 360 px. | Product |
| `UI-LIBRARY-05` | Empty states: « Aucun match pour l’instant. » with the import hint (Tous), « Aucun match en cours. », « Aucun match terminé. »; no demonstration data is ever added. | Product |

### 4.2 Selection

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-LIBRARY-06` | Exactly one match is selected; the selection and the filter survive a reload; when the selected match is hidden by the filter, the first visible row is selected. | Product |
| `UI-LIBRARY-07` | Click selects; double-click or Enter opens the Coach View; Arrow up / down, Home and End move the selection; the action bar is disabled while nothing is selected. | Accessibility |
| `UI-LIBRARY-08` | The details button opens « DÉTAILS DU MATCH » (teams, date, score, set scores, status, origin, access, file) without changing the selection. | Product |

### 4.3 Opening a view

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-LIBRARY-09` | « Vue coach » keeps the document for the session (`volleyAnalysis.replay.v1`) and opens the Coach View, which comes back to the library on exit. | SYS-DATA-08 |
| `UI-LIBRARY-10` | « Spectateur » stores the document for the Spectator View (`volleySpectator.archive.v1` and its name) and opens `spectator.html#live-score`. | SYS-DATA-08 |
| `UI-LIBRARY-11` | « Rapports » opens the reports dialog for the selected match (UI-REPORTS). | UI-REPORTS |

### 4.4 Import

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-LIBRARY-12` | An imported file is checked in this order, any failure showing its message and storing nothing: `.json` and 10 MB at most, valid JSON, no unsafe key, valid document (SYS-JSON-14, -15), stable match identifier and both team names. | SYS-SEC-04, -09 |
| `UI-LIBRARY-13` | A match whose identifier already exists is selected and « Match déjà présent » offers « Ouvrir l’existant », « Importer comme copie » (new identifier) or « Annuler ». | SYS-SEC-05 |
| `UI-LIBRARY-14` | A successful import says « Match importé en lecture seule. » (or « …comme copie… ») in a polite live region and selects the match. | Product |
| `UI-LIBRARY-15` | Library events are dispatched as `volleylive:telemetry` browser events and never sent over the network. | SYS-DATA-01 |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Offline | « HORS LIGNE » in the top bar; everything works. |
| Imported name with HTML | Shown as text (SYS-SEC-01). |

## 6. Data

Reads the active match and the history; writes the history (imports), the filter and selection keys, and the
selected document for a view (SYS-DATA 6.1).

## 7. Interface

`#matchLibraryScreen`: `#matchLibraryBack`, `#matchLibraryImport` / `#matchLibraryFile`, `[data-library-filter]`,
`#libraryAllCount`, `#libraryLiveCount`, `#libraryFinishedCount`, list `#matchLibraryList` (`role="listbox"`),
`[data-library-info]`, `#libraryLegend`, `#matchLibraryStatus`, `.library-action-bar` (`[data-library-open]`);
dialogs `#matchInfoDialog`, `#matchHubDuplicate` (`#matchHubOpenExisting`, `#matchHubImportCopy`).

## 8. Accessibility and language

Listbox semantics and keyboard navigation; touch targets at least 44 px; the action bar respects the safe areas.
Texts: `library.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-LIBRARY-01`, `-03` | `tests/library/test_match_library.py::test_finished_filter_includes_local_and_imported_matches`, `::test_live_match_is_one_selected_row_with_fixed_action_bar` |
| `UI-LIBRARY-02`, `-05` | `tests/library/test_match_library.py::test_empty_library_has_new_header_filters_and_disabled_actions` |
| `UI-LIBRARY-04` | `tests/library/test_match_library.py::test_rows_stay_single_line_at_narrow_phone_width`; `tests/home/test_navigation_visual.py::test_match_library_rows_and_fixed_actions_fit_phone_and_tablet` |
| `UI-LIBRARY-06`, `-07` | `tests/library/test_match_library.py::test_filter_and_selection_are_persisted_and_keyboard_accessible` |
| `UI-LIBRARY-08`, `-12` to `-14` | `tests/library/test_match_library.py::test_import_validation_duplicate_and_read_only_metadata_remain_available` |
| `UI-LIBRARY-09` to `-11` | `tests/library/test_match_library.py::test_selected_match_actions_keep_coach_spectator_and_reports_routes` |
| `UI-LIBRARY-15` | Manual review: `match-hub.js` `emit()` dispatches a `CustomEvent` only |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-28 | First version; replaces the library part of `docs/VolleyLive_Match_Library_Specification.md` (texts now quoted in French). |
