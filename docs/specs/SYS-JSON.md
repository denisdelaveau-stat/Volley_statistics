# SYS-JSON — Match document: unified JSON v2.1 and Capture v1 migration

| Field | Value |
|---|---|
| Spec ID | `SYS-JSON` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 (document schema 2.1.0) |
| Last review | 2026-11-27 |
| Source of truth | `docs/volley-live.match.schema.v2.1.json` (normative JSON Schema), `statistics/adapter.js` (`window.VolleyStatsAdapter`), `statistics/data/As_cannes_vs_Frejus_2026-11-15.fixture.v2.json` (canonical fixture) |
| Related specs | SYS-DATA (Capture v1 storage), SYS-SEC (import validation), DOM-LINEUP, DOM-LIBERO, UI-LIBRARY (import), UI-REPORTS (export), UI-COACH, UI-SPECTATOR |

## 1. Purpose

Defines the match documents VolleyLive reads and exchanges: the official unified JSON v2.1 document, the Capture v1
document written by the capture, how a document is validated, and how a Capture v1 document is migrated in memory for
the Coach and Spectator views.

## 2. Scope

- In scope: v2.1 contract, Capture v1 document, format detection, validation, migration, consumer rules.
- Out of scope: the browser storage keys (SYS-DATA); the screens that import and export documents (UI-LIBRARY,
  UI-REPORTS).

## 3. Definitions

- Unified document: `{format: "volley-live", schemaVersion: "2.1.0", documentType: "match", generatedAt, match,
  teams, players, sets, lineups, rallies, events, live, dataQuality}`.
- Capture v1 document: `{format: "volley-live-capture", version: 1, savedAt, match, score, events, chartData}`
  (fields: SYS-DATA).
- Fixture: a reference document for tests and demonstrations (`match.status: "TEST_FIXTURE"`).

## 4. Requirements

### 4.1 Formats

| ID | Requirement | Rule / source |
|---|---|---|
| `SYS-JSON-01` | The application reads two document formats: unified v2.1 and Capture v1; any other document is refused with « Format non reconnu : utilisez un document volley-live v2.1 (ou un export Capture v1 à migrer). ». | Product contract |
| `SYS-JSON-02` | A unified document is accepted for schema version 2.x after validation; another major version is refused. | Compatibility |
| `SYS-JSON-03` | The capture writes Capture v1; unified v2.1 documents enter the application by import (Match Library) or as reference fixtures. The « Exporter le JSON officiel » export writes the stored document unchanged, in its own format. | As built |

### 4.2 Unified v2.1 contract

| ID | Requirement | Rule / source |
|---|---|---|
| `SYS-JSON-04` | The append-only `events[]` journal is the source of truth; `sequenceNumber` gives the order (timestamps are kept for traceability only); a correction keeps the corrected event and changes its `status`. | Event sourcing |
| `SYS-JSON-05` | Identifiers (`matchId`, `teamId`, `playerId`, `setId`, `rallyId`, `lineupVersionId`, `eventId`) are stable and opaque; names are display values, never keys. Unknown values are `null`. | Data integrity |
| `SYS-JSON-06` | `match` has `matchId`, `name`, `status`, `lifecycleStatus` (`SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `ABANDONED`), `ourTeamId`, `opponentTeamId`, `currentSetNumber` and `rules` (`setsToWin`, `setPoints`, `decidingSetPoints`). | Schema |
| `SYS-JSON-07` | `teams[]` items have `teamId`, `side` (`OUR` or `OPPONENT`), `name`; `players[]` items have `playerId`, `teamId`, `number`, `name`, `role` (`SET`, `OPP`, `OH`, `MB`, `LIB`) and `active`. | Schema |
| `SYS-JSON-08` | Each `sets[]` item has `setId`, `setNumber`, `status`, `initialServingTeamId`, `startingLineup` (`p1`…`p6`, player IDs), `setterPlayerId`, `liberoPlayerId`, `lineupVerified` and, when completed, `finalScore`. | FIVB 7.3.2, DOM-LINEUP |
| `SYS-JSON-09` | A lineup snapshot (`lineups[]`) is immutable: `lineupVersionId`, `setId`, `rallyId`, `teamId`, `zones`, `onCourtPlayerIds` (after the libero replacement), `source` (`CAPTURED`, `COACH_CONFIRMED`, `INFERRED`), `verified`. Who was on court during a rally is read from the snapshot of that rally, never from the current line-up. | Data integrity |
| `SYS-JSON-10` | Each closed rally has `rallyId`, `setId`, `setNumber`, `rallyNumber`, `status`, `servingTeamId`, `receivingTeamId`, `phaseAtStart` (`SERVE` or `RECEPTION`, our point of view), `setterRotationAtStart` (`P1`…`P6`), `lineupVersionId`, `onCourtPlayerIds`, `scoreBefore`, `scoreAfter`, `winnerTeamId`, `terminalEventId`. Side-out and break point derive only from `phaseAtStart` and `winnerTeamId`. | DOM-STATS-15 |
| `SYS-JSON-11` | Every event has `eventId`, `eventType`, `matchId`, `sequenceNumber`, `recordedAt`, `status`, `provenance` (`CAPTURED`, `SYNTHETIC`, `IMPORTED`, `CORRECTED`); an `ACTION` also has `rallyId`, `actionOrder`, `teamId`, `playerId` (null for an unknown opponent), `actionType`, `evaluation` (`NEUTRAL`, `POINT`, `ERROR`), `winnerTeamId` (closing action only), `scoreBefore`, `scoreAfter`, `lineupVersionId`; a `SUBSTITUTION` has `playerOutId` and `playerInId` and is not counted as a technical action. | Schema |
| `SYS-JSON-12` | A fixture has `match.status: "TEST_FIXTURE"` and `dataQuality.fixture: true`; its synthetic events are `SYNTHETIC` and `NEUTRAL`, never close a rally nor change the score, and are flagged by a warning. | Data quality |
| `SYS-JSON-13` | `live` may give `state` (`LIVE`, `UPDATING`, `OFFLINE`, `STALE`), `lastSequenceNumber`, `currentSetNumber` and the current score. | Schema (not produced by the capture yet) |

### 4.3 Validation in the application

| ID | Requirement | Rule / source |
|---|---|---|
| `SYS-JSON-14` | Importing a unified document checks: object root, `format`, schema version 2.x, `documentType: "match"`, `match` object, at least two teams, `players`, `sets`, `rallies` and `events` arrays, every event an object with `eventId`, unique `sequenceNumber` and `eventType`, and every `ACTION` with `rallyId`, `actionType` and `evaluation`. Each failure gives a reason. | SYS-SEC |
| `SYS-JSON-15` | Importing a Capture v1 document checks: object root, `format: "volley-live-capture"`, `version: 1`, `match` object with `team.roster`, `events` array, and for every action event its `set`, `action` and `result`. | SYS-SEC |

### 4.4 Capture v1 migration

| ID | Requirement | Rule / source |
|---|---|---|
| `SYS-JSON-16` | A Capture v1 document is migrated in memory for the Coach View, the Spectator View and reports; it is never rewritten in storage. The migrated data is labelled: « Match local v1 migré en mémoire; phase, rotation et présence terrain sont reconstruites… ». | Transparency |
| `SYS-JSON-17` | The migration rebuilds the rally context with the same rules as the capture: line-up of each set (DOM-LINEUP), rotation and service (DOM-ROTATION), libero replacements and changes (DOM-LIBERO), substitutions. | DOM-ROTATION-08 |
| `SYS-JSON-18` | Capture v1 maps to v2.1 as follows: roster → `teams` + `players`; event order → `sequenceNumber`; `winningTeam` → rally end and winner; `neutral` / `point` / `error` → `NEUTRAL` / `POINT` / `ERROR`; lower-case action → upper-case `actionType`; `match.subs` → `SUBSTITUTION` events. | Mapping |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Unknown format | Refused with the reason of `SYS-JSON-01`. |
| Schema 3.x | Refused (`SYS-JSON-02`). |
| Duplicate `sequenceNumber` | Refused: « sequenceNumber dupliqué : N. » |
| Capture v1 with one action per rally only | Accepted; warning « Entrée Capture v1 de migration : une seule action terminale par rally… ». |
| Set after set 1 without explicit phase | Phase inferred by alternation, with a warning. |

## 6. Data

Normative schema: `docs/volley-live.match.schema.v2.1.json`. Canonical fixture: 365 events (94 captured, 271
synthetic neutral contacts), line-ups marked unverified. Capture v1 fields: SYS-DATA 6.2 to 6.5.

## 7. Interface

`window.VolleyStatsAdapter` (browser and Node):

| Function | Returns |
|---|---|
| `detectFormat(document)` | `unified-v2`, `capture-v1` or `unknown` |
| `validate(document)` | `{valid, errors, warnings, format}` |
| `toCoachData(document)` | Coach View data (migrated when Capture v1) |
| `toReportData(document)` | Spectator matrix and report data |
| `fromLocalStorage(storage)` | The active match as a Capture v1 document, or a stored v2 document |
| `isFaultEvaluation`, `isFaultEvent`, `rotateClockwise` | Helpers shared with the Spectator View |

Messages are translated (`adapter.*` keys); outside the browser the key is returned.

## 8. Accessibility and language

Not applicable. Validation messages: `adapter.*` keys (SYS-I18N).

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `SYS-JSON-01`, `-02` | `tests/unit/adapter.test.js` « detects the two supported document formats », « rejects malformed documents with a reason » |
| `SYS-JSON-03` | `tests/capture/test_capture_regressions.py::test_set_end_lock_undo_next_set_and_exports` (Capture v1 file); `tests/library/test_match_library.py::test_import_validation_duplicate_and_read_only_metadata_remain_available` |
| `SYS-JSON-04` to `-11` | `tests/shared/test_unified_json.py::test_fixture_matches_official_v2_1_contract`, `::test_fixture_validates_against_json_schema`, `::test_rally_scores_terminals_and_context_are_consistent`, `::test_role_rotation_and_recorded_server_constraints` |
| `SYS-JSON-12` | `tests/shared/test_unified_json.py::test_event_order_provenance_and_synthetic_safety` |
| `SYS-JSON-13` | `tests/shared/test_unified_json.py::test_fixture_validates_against_json_schema` (schema allows it) |
| `SYS-JSON-14`, `-15` | `tests/unit/adapter.test.js` « accepts both reference documents », « rejects malformed documents with a reason »; `tests/library/test_match_library.py::test_import_validation_duplicate_and_read_only_metadata_remain_available` |
| `SYS-JSON-16` | `tests/coach/test_coach_views.py::test_coach_navigation_live_data_and_player_detail` (migrated live match) |
| `SYS-JSON-17` | `tests/unit/court-consistency.test.js` « rotation engine and adapter give the same players on court at every event » |
| `SYS-JSON-18` | `tests/unit/adapter.test.js` « report data has one column per action of the reference capture », « coach data from a v2 document keeps the explicit context » |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version; replaces `docs/VolleyLive_Unified_JSON_Format_Specification.md` (document version 2.1.0). Corrected to the implementation: the capture writes Capture v1, the in-app validation is listed as built. |
