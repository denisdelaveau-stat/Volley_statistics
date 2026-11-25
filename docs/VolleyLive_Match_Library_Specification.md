# VolleyLive — Match Library and Match Reports Specification

Status: current as of v1.27.0 (unchanged in v1.28.0). Source of truth: `index.html` (`#matchLibraryScreen`, dialogs), `match-hub.js`, `match-hub.css`.
Acceptance tests: `tests/test_match_library_v1_27.py`, `tests/test_spectator_view_v1_26.py`.

## 1. Purpose

MATCH LIBRARY is the single read-only entry point for selecting a match and opening it in **Coach View**, **Spectator View** or **Match Reports**. It is also the only place where a match JSON can be imported. It never modifies the active official match.

## 2. Data sources

| Source | Storage | `sourceType` |
|---|---|---|
| Current local match | `volleyCapture.match.v1`, `volleyCapture.events.v1`, `volleyCapture.chartData.v1` | `active` |
| Completed local match (auto-archived) | `volleyMatchHub.history.v1` | `finished` |
| Imported JSON | `volleyMatchHub.history.v1` | `imported` |

- History is capped at 100 records, newest first.
- A current match whose status is `completed` is copied into history once (`Completed local match`).
- Supported documents: capture v1 (`format: volley-live-capture`) and unified v2.1 (see `VolleyLive_Unified_JSON_Format_Specification.md`).

## 3. Lifecycle model

- **Live**: the current match with status `live`, `paused` or `in_progress`.
- **Finished**: every other entry (completed local matches and all imports).

Sort order: live first, then match date descending, then last update descending.

## 4. Layout

| Zone | Element | Content |
|---|---|---|
| Top bar | `#matchLibraryBack` | `‹ INSIGHTS`, brand, `OFFLINE` badge when offline |
| Heading | `#matchLibraryTitle` | `MATCH LIBRARY` + fixed subtitle `Choose a match, then open a view.` |
| Import | `#matchLibraryImport` | Compact header action; opens `#matchLibraryFile` (`.json`) |
| Filters | `[data-library-filter]` | `All`, `Live`, `Finished` with inline counters `#libraryAllCount`, `#libraryLiveCount`, `#libraryFinishedCount` |
| List | `#matchLibraryList` (`role=listbox`) | One single-line row per match |
| Legend | `#libraryLegend` | Live / Finished status dots |
| Status | `#matchLibraryStatus` | Polite live region for import results |
| Action bar | `.library-action-bar` | Primary `Coach View`; secondary `Spectator`, `Reports` |

Row content: status dot, HOME team, AWAY team, set score, live set context (live) or date (finished), and an independent details button (`[data-library-info]`). Rows show no IMPORTED / READ ONLY badges and no file names.

## 5. Selection and interaction

- Exactly one match is selected; it is persisted in `vl.library.selectedId` (legacy `volleyMatchLibrary.selected.v1` is read for migration). The filter is persisted in `vl.library.filter`.
- If the selected match is not visible under the current filter, the first visible row becomes selected.
- Click selects; double-click or `Enter` opens Coach View; `ArrowUp/ArrowDown/Home/End` move the selection.
- The details button opens `#matchInfoDialog` (teams, date, score, set scores, status, origin, access, source file) without changing the selection behaviour.
- Action-bar buttons are disabled (`aria-disabled="true"`) when nothing is selected.

Empty states: `No matches yet.` (All, with an import shortcut), `No live match.`, `No finished match.`. No demonstration data is ever injected.

## 6. Opening a view

| Action | Behaviour |
|---|---|
| Coach View | Stores the raw document in `sessionStorage['volleyAnalysis.replay.v1']`, sets `#coachScreen[data-return-screen="matchLibraryScreen"]`, calls `VolleyCoach.open()` |
| Spectator | Stores the raw document in `volleySpectator.archive.v1` (+ `archiveName`) and the replay session keys, then navigates to `spectator.html#live-score` |
| Reports | Opens `#matchReportDialog` with `<match> · <state> · READ ONLY · <n> events` |

Entering the library from an INSIGHTS card (`data-library-mode`) only sets the context; the user still chooses the view from the action bar.

## 7. JSON import

Validation order (any failure shows an error status and leaves storage unchanged):
1. File size ≤ 10 MB; file name ends with `.json`.
2. Valid JSON syntax.
3. No `__proto__`, `prototype` or `constructor` keys at any depth.
4. `VolleyStatsAdapter.validate(raw)` succeeds.
5. A stable match ID and both team names are present.

Duplicate ID: the existing row is selected and `#matchHubDuplicate` offers **Open existing**, **Import as a copy** (new ID) or **Cancel**.

Success messages: `Match imported successfully in read-only mode.` / `Match imported as a read-only copy.`

Team CSV import is **not** available here (see Team Management).

## 8. Match Reports

All exports are generated locally and work offline.

| Button | Output |
|---|---|
| `#matchReportHtml` | Standalone HTML report with the event table |
| `#matchReportCsv` | CSV `Sequence,Set,Player,Action,Result,HomeScore,AwayScore` (CRLF, every cell quoted) |
| `#matchReportJson` | The official raw JSON document, unchanged |

## 9. Telemetry

Events are dispatched as `window` `CustomEvent('volleylive:telemetry', {detail:{event, properties}})`. They are never sent over the network.

## 10. Accessibility and responsive behaviour

- Listbox semantics with keyboard navigation; touch targets ≥ 44 px; bottom action bar respects safe areas.
- Rows stay single-line down to 360 px width with narrow-phone fallbacks.

## 11. Acceptance

1. Empty storage shows `No matches yet.` and disabled actions.
2. Live and finished matches are grouped and counted correctly.
3. Filter and selection survive a reload.
4. Invalid, oversized, unsafe or duplicate imports follow §7.
5. Each action-bar button opens the right view for the selected match.
