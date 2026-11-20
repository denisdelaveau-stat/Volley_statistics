# VolleyLive Unified JSON Format Specification

**Version:** 2.1.0  
**Status:** official application contract for Volley Live Capture, Coach View, Advanced Statistics, live score and multi-match analysis  
**Canonical fixture:** `statistics/data/As_cannes_vs_Frejus_2026-11-15.fixture.v2.json`

## 1. Authority and design rules

1. A match document has `format: "volley-live"`, `schemaVersion: "2.1.0"` and `documentType: "match"`.
2. The append-only `events[]` journal is the source of truth. Scores, rallies, lineups and provenance are explicit; UI colors, charts, rankings and percentages are derived.
3. `sequenceNumber` is the authoritative event order. Timestamps are retained for traceability, not ordering.
4. Corrections never silently delete history. A corrected event is retained and its `status` changes; a new correction event records the replacement.
5. Every identifier is stable and opaque. Names are display values, never relational keys.
6. Unknown values are JSON `null`, not invented values or empty strings.
7. The canonical action evaluation is `NEUTRAL`, `POINT` or `ERROR`. The former term `CONTINUE` is not emitted by v2.1 readers or writers.

## 2. Root document

```json
{
  "format": "volley-live",
  "schemaVersion": "2.1.0",
  "documentType": "match",
  "generatedAt": "2026-11-20T13:00:00.000Z",
  "match": {},
  "teams": [],
  "players": [],
  "sets": [],
  "lineups": [],
  "rallies": [],
  "events": [],
  "live": {},
  "dataQuality": {}
}
```

The major version is compatibility-significant. A reader that supports 2.1 may accept compatible 2.x documents only after validation. It must reject unknown major versions.

## 3. Match, teams and players

### 3.1 `match`

Required fields:

- `matchId`: stable match identifier;
- `name`: display name;
- `status`: business status; `TEST_FIXTURE` prevents reference data from entering production aggregates;
- `lifecycleStatus`: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED` or `ABANDONED`;
- `ourTeamId`, `opponentTeamId`;
- `currentSetNumber`;
- `rules.setsToWin`, `rules.setPoints`, `rules.decidingSetPoints`.

Optional metadata such as competition, venue and logos is `null` when unknown.

### 3.2 `teams[]`

Each team contains `teamId`, `side` (`OUR` or `OPPONENT`) and `name`. Colors and logos are optional.

### 3.3 `players[]`

Each player contains `playerId`, `teamId`, `number`, `name`, `role` and `active`. Official roles are `SET`, `OPP`, `OH`, `MB` and `LIB`.

## 4. Sets and standard court positions

`p1` through `p6` use standard volleyball numbering. Rotation is clockwise:

```text
p2 → p1 → p6 → p5 → p4 → p3 → p2
```

Each `sets[]` item contains:

- `setId`, `setNumber`, `status`;
- `initialServingTeamId`;
- `startingLineup.p1` … `startingLineup.p6` with player IDs;
- `setterPlayerId`, `liberoPlayerId`;
- `lineupVerified`;
- `finalScore.our`, `finalScore.opponent` when completed.

The libero follows the confirmed project rule: it replaces an eligible back-row middle blocker and never serves. When an inferred fixture temporarily has several back-row middle blockers, replacement priority is `p6`, then `p5`, then `p1`. This priority must be surfaced as inferred data, not presented as a coach-confirmed lineup.

## 5. Lineup snapshots

A lineup snapshot is immutable and contains:

- `lineupVersionId`, `setId`, `rallyId`, `teamId`;
- `zones.p1` … `zones.p6`;
- `onCourtPlayerIds` after legal libero replacement;
- `source`: `CAPTURED`, `COACH_CONFIRMED` or `INFERRED`;
- `verified`.

Historical presence must use the snapshot referenced by the rally. It must never be inferred from the current lineup.

## 6. Rallies

Each closed rally contains:

- `rallyId`, `setId`, `setNumber`, `rallyNumber`, `status`;
- `startedAt`, `endedAt`;
- `servingTeamId`, `receivingTeamId`;
- `phaseAtStart`: `SERVE` or `RECEPTION`, always from our team's perspective;
- `setterRotationAtStart`: `P1` through `P6`;
- `lineupVersionId`, `onCourtPlayerIds`;
- `scoreBefore`, `scoreAfter`;
- `winnerTeamId`, `terminalEventId`.

Side-out and break-point are derived only from `phaseAtStart` and `winnerTeamId`:

- our win in `RECEPTION` → side-out;
- our win in `SERVE` → break point;
- opponent win → lost rally.

## 7. Events

### 7.1 Common fields

All events require:

- `eventId`, `eventType`, `matchId`;
- `sequenceNumber`;
- `setId`, `setNumber` when applicable;
- `recordedAt`;
- `status`: normally `ACTIVE`;
- `provenance`: `CAPTURED`, `SYNTHETIC`, `IMPORTED` or `CORRECTED`.

### 7.2 Action events

An `ACTION` additionally requires:

- `rallyId`, `actionOrder`;
- `teamId`, nullable `playerId` for an unknown opponent actor;
- `actionType`: `SERVICE`, `RECEPTION`, `SET`, `ATTACK`, `BLOCK`, `DEFENSE`, `FREEBALL` or `OPPONENT_ACTION`;
- `evaluation`: `NEUTRAL`, `POINT` or `ERROR`;
- nullable `winnerTeamId`, set only on a rally-closing action;
- `scoreBefore`, `scoreAfter`;
- `lineupVersionId`;
- nullable `quality` until a grading scale is captured.

### 7.3 Substitution events

A `SUBSTITUTION` contains `playerOutId` and `playerInId`. It remains a source event but is excluded from technical-action denominators.

## 8. Provenance and fixtures

A test fixture must set `match.status: "TEST_FIXTURE"` and `dataQuality.fixture: true`. Synthetic events:

- must use `provenance: "SYNTHETIC"`;
- must use `evaluation: "NEUTRAL"`;
- must not close a rally or change the score;
- must never be mixed into production multi-match aggregates without an explicit test-data filter.

The canonical Cannes–Fréjus fixture contains 365 events: 94 captured events and 271 neutral synthetic contacts. Scores, winners and rally boundaries remain captured data. The inferred set lineups are deliberately marked unverified.

## 9. Live state and deltas

The full match document may include `live` with:

- `state`: `LIVE`, `UPDATING`, `OFFLINE` or `STALE`;
- `lastSequenceNumber`;
- `currentSetNumber`;
- current `score`.

A `live-delta` document uses the same event objects and contains only events whose `sequenceNumber` is greater than the consumer checkpoint. Applying deltas must be idempotent by `eventId`.

## 10. Consumer requirements

### Capture

Capture writes source events and explicit rally context. It never writes derived percentages or chart colors as authoritative values.

### Coach View

Coach View reads players, rally phase, setter rotation, lineup snapshots, actions and scores from v2.1. It may accept a Capture-v1 local store only through a clearly labelled in-memory migration path.

### Advanced Statistics

Advanced Statistics reads the same v2.1 document. Timeline columns represent `ACTION` events; substitutions remain in the source-event count but not in action denominators. Filters and aggregates must use explicit rally and lineup context.

### Multi-match analysis

Production analysis excludes `TEST_FIXTURE` by default and joins players by stable registry ID when available. Display names and shirt numbers are not durable cross-match identities.

## 11. Validation rules

A conforming validator checks at least:

1. root contract and compatible schema version;
2. unique `eventId` and `sequenceNumber`;
3. references to existing match, set, rally, team, player and lineup IDs;
4. strictly increasing rally scores with exactly one point added on a closed rally;
5. terminal event, winner and score consistency;
6. `P1`–`P6` setter rotation and six distinct on-court players;
7. player role constraints, including no libero service, attack or block;
8. front-row origin for block actions;
9. synthetic-event neutrality and no synthetic rally closure;
10. fixture segregation and explicit data-quality warnings.

## 12. Legacy mapping

| Capture v1 | Unified v2.1 |
|---|---|
| `format: volley-live-capture`, `version: 1` | `format: volley-live`, `schemaVersion: 2.1.0` |
| `match.team.roster[]` | `teams[]` + `players[]` |
| implicit sequence in `events[]` | `sequenceNumber` |
| rally ends at `winningTeam` | explicit `rallies[]` + `terminalEventId` |
| `neutral` / `continue` | `NEUTRAL` |
| `point` | `POINT` |
| `error` | `ERROR` |
| lower-case action name | upper-case `actionType` |
| inferred phase and rotation | explicit rally context |
| `match.subs[]` | `SUBSTITUTION` event |

Capture v1 is a migration input, not the reference contract for Coach View or Advanced Statistics from application v1.9.1 onward.
