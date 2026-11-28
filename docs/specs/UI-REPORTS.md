# UI-REPORTS — Match reports and exports

| Field | Value |
|---|---|
| Spec ID | `UI-REPORTS` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-28 |
| Source of truth | `match-hub.js` (`reportHtml`, `reportCsv`, `download`), `index.html` (`#matchReportDialog`), `js/index-report.js` (`window.VolleyReport`), `js/index-match-rules.js` (`VolleyStats`), `js/index-navigation-new-match.js` (`saveMatchJson`) |
| Related specs | UI-LIBRARY (entry), UI-HUB (save before a new match), DOM-STATS-20, SYS-JSON-03, SYS-SEC-08 |

## 1. Purpose

Gives the match data back as files: a readable HTML report, the events as CSV, and the official JSON document, all
generated on the device and available offline.

## 2. Scope

- In scope: the Match Reports dialog and its three exports, the JSON file saved from the Match Hub, the detailed match
  report builder.
- Out of scope: choosing the match (UI-LIBRARY).

## 3. Definitions

- Simple report: the HTML report of Match Reports (event table). Detailed report: the report built by
  `VolleyReport.build()` (sets, players, attackers, substitutions, action log).

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-REPORTS-01` | « RAPPORTS DE MATCH » shows the selected match (name, state, « LECTURE SEULE », event count) or « Sélectionnez un match pour préparer ses rapports. », with « Exporter le rapport HTML », « Exporter les événements CSV », « Exporter le JSON officiel » and « Les exports sont générés localement et restent disponibles hors ligne. ». | Product |
| `UI-REPORTS-02` | The HTML report is one standalone file in the interface language: « LECTURE SEULE » and state, match name, date, result, event count, then one row per event (number, set, player, action, result, score) and « Généré localement par VolleyLive version. ». | Product |
| `UI-REPORTS-03` | The CSV has the header `Sequence,Set,Player,Action,Result,HomeScore,AwayScore` (kept in English for spreadsheets), one line per event, every cell quoted, CRLF line endings. | Interoperability |
| `UI-REPORTS-04` | « Exporter le JSON officiel » writes the stored document unchanged (Capture v1 or unified v2.1). | SYS-JSON-03 |
| `UI-REPORTS-05` | Saving from the Match Hub downloads the active match as a Capture v1 file (`{format, version, savedAt, match, score, events, chartData}`), the score being the last chart point (SYS-DATA 6.5). | UI-HUB-05 |
| `UI-REPORTS-06` | File names are built from the match name with safe characters only (`<name>.html`, `<name>_events.csv`, `<name>.json`). | SYS-SEC-08 |
| `UI-REPORTS-07` | The detailed report (`VolleyReport.build`) gives the result, the sets table (score, winner, substitution count without libero changes), per-player points / faults / neutral by action, team totals, opponent points, the attacker cards, the substitutions (libero changes labelled) and the action log. | DOM-STATS-20 |

Known gap: the detailed report of `UI-REPORTS-07` has no button in the interface (it is only reached through
`VolleyCapture.buildReport()`); Match Reports exports the simple report of `UI-REPORTS-02`.

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| No match selected | Buttons disabled, `UI-REPORTS-01` message. |
| Event without set or player | « NA » in the HTML and CSV. |

## 6. Data

Reads the selected document (`raw` of the history entry) or the active match (SYS-DATA). Writes nothing in storage.

## 7. Interface

`#matchReportDialog`: `#matchReportTitle`, `#matchReportText`, `#matchReportHtml`, `#matchReportCsv`,
`#matchReportJson`. `window.VolleyReport.build(match, events)`; `VolleyShell.saveMatchJson()`.

## 8. Accessibility and language

Native `<dialog>`; the report HTML declares its language (`<html lang>`). Texts: `reports.*`, `report.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-REPORTS-01`, `-04` | `tests/library/test_match_library.py::test_selected_match_actions_keep_coach_spectator_and_reports_routes` |
| `UI-REPORTS-02`, `-03`, `-06` | Manual: Match Reports → each export; open the HTML, open the CSV in a spreadsheet |
| `UI-REPORTS-05` | `tests/capture/test_capture_regressions.py::test_set_end_lock_undo_next_set_and_exports`; `tests/library/test_match_hub_save.py::test_successful_save_archives_then_clears_the_current_match` |
| `UI-REPORTS-07` | `tests/capture/test_capture_regressions.py::test_set_end_lock_undo_next_set_and_exports`; `tests/capture/test_libero_swap.py::test_second_libero_replaces_the_acting_one_between_rallies` |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-28 | First version; replaces the reports part of `docs/VolleyLive_Match_Library_Specification.md`; documents the detailed report and its missing entry. |
