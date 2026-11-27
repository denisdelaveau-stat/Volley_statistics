# SYS-DATA — Local data model and storage

| Field | Value |
|---|---|
| Spec ID | `SYS-DATA` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-27 |
| Source of truth | `js/shared-domain.js` (`STORAGE`, `readStored`), `js/index-navigation-new-match.js` (match creation, team library, settings), `js/index-capture-tools.js` (events, chart data), `runtime-input.js` (preferences, substitutions), `team-management.js`, `match-hub.js` (history, library state) |
| Related specs | SYS-ARCH, SYS-JSON (exported and imported documents), DOM-MATCH, DOM-LINEUP, DOM-SUBS, DOM-LIBERO, UI-* |

## 1. Purpose

Specifies everything VolleyLive keeps in the browser: the storage keys, who writes and reads them, and the format of
the active match (Capture v1). Nothing is sent to a server.

## 2. Scope

- In scope: localStorage and sessionStorage keys, the Capture v1 match, event, substitution and chart formats, the
  team library, settings and preferences, reading rules.
- Out of scope: the unified JSON v2.1 document and the exported file formats (SYS-JSON, UI-REPORTS).

## 3. Definitions

- Active match: the single editable match (`volleyCapture.match.v1` and its events).
- Capture v1: the local format of the active match; also the format of a saved or exported capture
  (`{format: 'volley-live-capture', version: 1, match, events, chartData}`).

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `SYS-DATA-01` | All data stays on the device, in the browser storage of the application origin; nothing is sent over the network. | Product decision (privacy, offline) |
| `SYS-DATA-02` | Every storage key is defined once in `VolleyDomain.STORAGE` (section 6.1); a key never changes meaning: a new format gets a new versioned key. | SYS-ARCH-11 |
| `SYS-DATA-03` | There is one active match at a time; starting a new match requires saving or discarding the current one (UI-HUB). | Product decision |
| `SYS-DATA-04` | The active match is stored as three keys: the match object, its events and its chart data; they are written together after every change. | Product rule |
| `SYS-DATA-05` | Events are append-only: an action, a substitution or a libero change adds an event; only the last event can be deleted (UI-CAPTURE). | Event sourcing |
| `SYS-DATA-06` | Reading a stored value never stops the application: a missing, empty or unreadable value gives the default, and an unreadable value is reported in the console with its key. | Robustness |
| `SYS-DATA-07` | Finished and imported matches are kept in the Match Library history, most recent first, at most 100. | Product rule |
| `SYS-DATA-08` | The document selected for the Coach View is kept for the browser session only (`sessionStorage`); the document selected for the Spectator View is kept in `localStorage` so that a reload shows it again. | Product rule |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Storage unavailable (private mode, quota) | Reads return the default (`SYS-DATA-06`); writes may fail and are reported by the screen that writes. |
| Corrupted JSON in a key | Default value, console warning naming the key. |
| Match recorded by an older version | Read as is: missing fields take their defaults (for example no `setLineups`: DOM-LINEUP-04). |

## 6. Data

### 6.1 Storage keys

| Key (`VolleyDomain.STORAGE`) | Storage | Written by | Content |
|---|---|---|---|
| `captureMatch` = `volleyCapture.match.v1` | local | wizard, capture | Active match object (6.2) |
| `captureEvents` = `volleyCapture.events.v1` | local | capture | Events of the active match (6.3) |
| `captureChartData` = `volleyCapture.chartData.v1` | local | capture | One point per scoring rally of the current set (6.5) |
| `captureStage` = `volleyCapture.stage` | session | navigation | `capture` to reopen the capture screen after a reload |
| `teamLibrary` = `volleyCapture.library.v1` | local | Team Management, wizard | Reusable teams (6.6) |
| `settings` = `volleyCapture.settings.v1` | local | Settings | `{setsToWin: 2 or 3}` |
| `runtimeInputPreferences` = `volleyCapture.runtimeInput.preferences.v1` | local | capture options | `{runtimeMode: 'FOCUS' or 'SPEED' or 'FLOW', runtimeHighlights, runtimeHaptics}` |
| `matchHistory` = `volleyMatchHub.history.v1` | local | Match Hub, Match Library | Saved and imported matches, max 100 (6.7) |
| `matchLibrarySelected` = `volleyMatchLibrary.selected.v1` | local | Match Library | Last opened match |
| `libraryFilter` = `vl.library.filter`, `librarySelectedId` = `vl.library.selectedId` | local | Match Library | Filter and selected row |
| `analysisReplay` = `volleyAnalysis.replay.v1`, `analysisReplaySource` = `volleyAnalysis.replay.source.v1` | session | Match Library, Coach View | Document opened in the Coach View and its file name |
| `analysisUnloaded` = `volleyAnalysis.unloaded.v1` | session | Coach View | `1` when the coach unloaded the data |
| `spectatorArchive` = `volleySpectator.archive.v1`, `spectatorArchiveName` = `volleySpectator.archiveName.v1` | local | Match Library | Document shown by the Spectator View and its name |
| `spectatorTimelineOrder` = `volleySpectator.timeline.order`, `spectatorTimelineWindow` = `volleySpectator.timeline.window` | local | Spectator View | Timeline order and number of rallies shown |
| `language` = `volleyLive.language.v1` | local | Settings | `fr` or `en` (SYS-I18N) |

### 6.2 Match object (Capture v1)

| Field | Content |
|---|---|
| `id`, `name`, `createdAt`, `status` | `match_<time>`, display name, ISO date, `in_progress` or `completed` |
| `detailLevel` | `advanced` (older matches may say `basic`) |
| `team` | `{name, rosterMax, players: [numbers present], roster: [{number, name, position, present, focus}]}`; `position` is `setter`, `oh`, `mb`, `opp` or `libero` |
| `opponent` | `{name}` |
| `startingLineup`, `startingRotation`, `setLineups` | Line-up of set 1 and of later sets (DOM-LINEUP) |
| `firstRally` | `{antibesState: 'service' or 'reception'}` (DOM-MATCH-11) |
| `format` | `{setsToWin, setPoints: 25, decidingSetPoints: 15}` |
| `currentSet` | Number of the set being played |
| `subs` | Substitutions and libero changes (6.4) |

### 6.3 Event

| Field | Content |
|---|---|
| `id`, `eventId` | Order number; unique identifier (`evt_…`), a duplicate is refused |
| `set`, `setNumber`, `timestamp`, `time` | Set, ISO date, local time |
| `player`, `authorSide`, `playerId`, `playerNumber`, `playerRole` | Author: shirt number, `T` (our team) or `A` (opponent); `HOME` / `AWAY`; role code |
| `action`, `actionCode`, `result`, `status` | `service`, `reception`, `set`, `attack`, `block`, `defense`, `freeball` (and `team`, `adverse`); `point`, `error`, `neutral`; canonical codes |
| `winningTeam`, `pointOrigin` | `team1`, `team2` or `null`; `earned` or `opponent_error` (DOM-MATCH) |
| `scoreA`, `scoreB`, `scoreBefore`, `scoreAfter`, `rotation` | Score after the event, score before and after, number of rotations of the set |
| `inputMode`, `schemaVersion` | `FOCUS`, `SPEED`, `FLOW`; `runtime-input-v1` |
| `type` / `eventType` = `SUBSTITUTION` | Substitution or libero change event: `playerOut`, `playerIn`, `exceptional`, `libero`, `unable`, `redesignated` |

### 6.4 Substitution entry (`match.subs[]`)

`{set, at, rally, out, in, position, eventId, ts}` plus `exceptional`, `libero`, `unable`, `redesignated` when they
apply (DOM-SUBS, DOM-LIBERO). `at` is the number of events of the set recorded before it.

### 6.5 Chart point (`volleyCapture.chartData.v1`)

`{n, a, b, w, c, action, result, winningTeam, pointOrigin, ts}`: rally number in the set, score, winning side
(`A` / `B`), author (0 for the opponent). Rebuilt from the events of the current set.

### 6.6 Team library (`volleyCapture.library.v1`)

`{team: {<name>: {team, maxPlayers: 40, roster: [numbers], info: {<number>: {name, pos}}, savedAt}}, lineup, rot}`.

### 6.7 Match history entry (`volleyMatchHub.history.v1`)

A summary (`id`, `status`, teams, current set and points, sets won, dates, `sourceName`, `sourceType`: `finished` or
`imported`) and the full document in `raw` (Capture v1 or unified v2.1).

## 7. Interface

`VolleyDomain.STORAGE` (frozen) and `VolleyDomain.readStored(key, fallback, storage)` (`SYS-DATA-06`).

## 8. Accessibility and language

Not applicable. The interface language is stored under `volleyLive.language.v1` (SYS-I18N).

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `SYS-DATA-01` | Manual review: the application has no network call (`fetch`, `XMLHttpRequest`) other than the service worker cache (SYS-PWA) |
| `SYS-DATA-02` | `tests/unit/storage.test.js` « returns the stored value »; SYS-ARCH-11 review |
| `SYS-DATA-03` | `tests/library/test_match_hub_save.py::test_save_failure_keeps_the_current_match`, `::test_successful_save_archives_then_clears_the_current_match` |
| `SYS-DATA-04`, `-05` | `tests/capture/test_chart_data.py::test_scoring_rallies_are_stored_reloaded_and_exported_without_a_statistics_panel`; `tests/capture/test_history_delete.py::test_only_latest_row_is_deletable_and_double_delete_is_guarded`; `tests/capture/test_runtime_input.py::test_rapid_double_result_tap_creates_one_event` |
| `SYS-DATA-06` | `tests/unit/storage.test.js` « returns the fallback for corrupted JSON and reports the key », « returns the fallback when the storage itself is unavailable » |
| `SYS-DATA-07` | `tests/library/test_match_library.py::test_finished_filter_includes_local_and_imported_matches` |
| `SYS-DATA-08` | `tests/coach/test_empty_state.py::test_coach_empty_file_replay_and_unload`; `tests/library/test_match_library.py::test_selected_match_actions_keep_coach_spectator_and_reports_routes` |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version; replaces the "Storage" section of `docs/ARCHITECTURE.md` and the storage parts of the former interface specs. |
