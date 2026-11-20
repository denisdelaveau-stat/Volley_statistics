# VolleyLive Statistics Tool
## Detailed Implementation and Log Integration Specification

**Document status:** Implementation baseline  
**Target product:** VolleyLive / VolleyLiveCapture  
**Language:** English  
**Purpose:** Define the data contract, logging requirements, calculations, UI integration, validation rules, and acceptance criteria required to implement Set Timeline, Rally Analysis, Rotation Metrics, Player Statistics, Roster Ranking, and Playing-Time Metrics.

---

# 1. Scope

This specification covers the integration of an advanced volleyball statistics module into VolleyLive. The module must generate:

1. Set Timeline / Rally Analysis.
2. Horizontal and vertical action matrices.
3. Player and team statistics.
4. Position-group comparisons.
5. Rotation Metrics.
6. Roster Ranking: Highlight, Lowlight, and Overall.
7. Playing-Time rankings.
8. Attack, block, service, reception, and defence efficiency charts.
9. Result classifications: lost rally, break point, and successful side-out.
10. Filters by rotation, phase, player, role, action, action result, and rally result.

The statistics engine must compute every metric from structured logs. UI colors must never be the authoritative source of statistical meaning.

---

# 2. Core Design Principles

## 2.1 Event sourcing

Each match action must be recorded as an immutable event. Derived statistics must be recomputable from the event stream.

## 2.2 Explicit rally boundaries

A rally is the minimum unit required for score, phase, side-out, break-point, rotation, and playing-time calculations. Each action must reference exactly one rally.

## 2.3 Stable identifiers

Use UUIDs or collision-resistant string identifiers for matches, sets, rallies, actions, players, teams, lineup slots, substitutions, and correction events. Display names must not be used as database keys.

## 2.4 Source data versus derived data

- **Logged:** player, action, evaluation, timestamp/order, lineup, rotation, phase, score transition.
- **Derived:** efficiency, rankings, side-out percentage, break-point percentage, chart series, colors, streaks.

## 2.5 Corrections

Undo and correction operations must not silently rewrite history. Record a correction event identifying the superseded event, then rebuild affected aggregates.

---

# 3. Required Domain Model

## 3.1 Enumerations

### ActionType

| Code | Meaning |
|---|---|
| `Sv` | Serve |
| `R` | Reception |
| `St` | Set |
| `A` | Attack |
| `B` | Block |
| `D` | Dig / Defence |
| `F` | Free Ball / Relaunch |

### ActionEvaluation

| Value | UI color | Meaning |
|---|---:|---|
| `CONTINUE` | Blue | Ball remains playable; no point awarded by this action |
| `POINT` | Green | Action directly scores the rally |
| `ERROR` | Red | Action error directly awards the rally to the opponent |

### TeamPhase

| Value | Display |
|---|---|
| `SERVE` | `S` |
| `RECEPTION` | `R` |

### RallyOutcome

| Value | Meaning | Timeline color |
|---|---|---|
| `LOST` | Team lost rally | Red, alternating light/dark |
| `BREAK_POINT` | Team won while serving | Green, alternating light/dark |
| `SIDE_OUT` | Team won while receiving | Yellow, alternating light/dark |

### PlayerRole

| Value | Display |
|---|---|
| `OH` | OH / R4 |
| `MB` | MB / Central |
| `OPP` | OPP / Opposite / Pointu |
| `SET` | Setter / Passeur |
| `LIB` | Libero |

### PresenceState

| Value | Matrix display |
|---|---|
| `ON_COURT` | Grey when no action is recorded |
| `ON_BENCH` | White |

---

# 4. Mandatory Log Inputs

## 4.1 MatchStarted event

```json
{
  "schemaVersion": "1.0.0",
  "eventType": "MATCH_STARTED",
  "eventId": "evt-uuid",
  "occurredAt": "2026-11-19T18:00:00.000Z",
  "matchId": "match-uuid",
  "ourTeamId": "team-home",
  "opponentTeamId": "team-away",
  "competitionId": "competition-optional",
  "scheduledSets": 5,
  "scoringSystem": "RALLY_POINT",
  "setsToWin": 3
}
```

**Required fields:** `schemaVersion`, `eventId`, `matchId`, `ourTeamId`, `opponentTeamId`, `occurredAt`.

## 4.2 PlayerRegistered event

```json
{
  "eventType": "PLAYER_REGISTERED",
  "matchId": "match-uuid",
  "teamId": "team-home",
  "playerId": "player-03",
  "shirtNumber": 8,
  "displayName": "Player3",
  "role": "OH",
  "isLibero": false,
  "activeForMatch": true
}
```

The role must come from application team settings. Role assignment may vary by match and must therefore be snapshotted into the match log.

## 4.3 SetStarted event

```json
{
  "eventType": "SET_STARTED",
  "matchId": "match-uuid",
  "setId": "set-1",
  "setNumber": 1,
  "initialPhase": "SERVE",
  "initialSetterRotation": "P1",
  "ourStartingScore": 0,
  "opponentStartingScore": 0,
  "startingLineup": [
    {"playerId":"player-01","courtPosition":1,"role":"SET"},
    {"playerId":"player-02","courtPosition":2,"role":"OPP"},
    {"playerId":"player-03","courtPosition":3,"role":"OH"},
    {"playerId":"player-04","courtPosition":4,"role":"OH"},
    {"playerId":"player-05","courtPosition":5,"role":"MB"},
    {"playerId":"player-06","courtPosition":6,"role":"MB"}
  ],
  "benchPlayerIds": ["player-07","player-08","player-09"]
}
```

### Mandatory lineup information

For every active player, the system must know:

- player identifier;
- court/bench state;
- court position 1–6 when on court;
- match role;
- whether the player is acting as libero replacement;
- lineup-version identifier.

## 4.4 RallyStarted event

```json
{
  "eventType": "RALLY_STARTED",
  "matchId": "match-uuid",
  "setId": "set-1",
  "rallyId": "set1-rally06",
  "rallyNumber": 6,
  "sequenceStart": 14,
  "scoreBefore": {"our":2,"opponent":3},
  "phaseAtStart": "RECEPTION",
  "setterRotationAtStart": "P2",
  "servingTeamId": "team-away",
  "receivingTeamId": "team-home",
  "lineupVersionId": "lineup-v2",
  "onCourtPlayerIds": [
    "player-01","player-02","player-03",
    "player-04","player-06","player-07"
  ]
}
```

### Critical requirements

- `phaseAtStart` must describe the analysed team, not the team that generated the raw event.
- `setterRotationAtStart` must be `P1` through `P6` and must remain constant for the rally.
- `onCourtPlayerIds` must be a snapshot. Do not infer historical presence from the current lineup.
- `scoreBefore` is required to validate score evolution and corrections.

## 4.5 ActionRecorded event

Every ball touch that must appear in the timeline requires one action event.

```json
{
  "eventType": "ACTION_RECORDED",
  "eventId": "action-uuid",
  "matchId": "match-uuid",
  "setId": "set-1",
  "rallyId": "set1-rally06",
  "rallyNumber": 6,
  "sequenceNumber": 18,
  "actionIndexInRally": 5,
  "teamId": "team-home",
  "playerId": "player-06",
  "actionType": "A",
  "evaluation": "POINT",
  "setterRotation": "P2",
  "phase": "RECEPTION",
  "scoreBefore": {"our":2,"opponent":3},
  "lineupVersionId": "lineup-v2",
  "recordedAt": "2026-11-19T18:12:04.251Z",
  "source": "LIVE_CAPTURE",
  "correlationId": "capture-command-uuid"
}
```

### Mandatory action fields

| Field | Required | Reason |
|---|---:|---|
| `eventId` | Yes | Idempotency and corrections |
| `matchId`, `setId`, `rallyId` | Yes | Aggregation boundaries |
| `rallyNumber` | Yes | Display and validation |
| `sequenceNumber` | Yes | Global chronological order |
| `actionIndexInRally` | Yes | Order inside rally |
| `teamId` | Yes | Separate own/opponent actions |
| `playerId` | Yes for player action | Player metrics |
| `actionType` | Yes | Category calculation |
| `evaluation` | Yes | Point/error/neutral metrics |
| `setterRotation` | Yes | Rotation analysis |
| `phase` | Yes | Serve/reception analysis |
| `lineupVersionId` | Yes | Presence and playing-time audit |
| `recordedAt` | Yes | Traceability; not ordering authority |

`sequenceNumber` is the authoritative ordering field. Timestamps may collide or arrive late.

## 4.6 RallyEnded event

```json
{
  "eventType": "RALLY_ENDED",
  "matchId": "match-uuid",
  "setId": "set-1",
  "rallyId": "set1-rally06",
  "rallyNumber": 6,
  "winningTeamId": "team-home",
  "terminalActionEventId": "action-uuid",
  "scoreAfter": {"our":3,"opponent":3},
  "nextPhase": "SERVE",
  "rotationPerformed": true,
  "nextSetterRotation": "P3",
  "endReason": "ATTACK_KILL"
}
```

### Derived rally outcome

```text
if winningTeamId != ourTeamId:
    LOST
else if phaseAtStart == SERVE:
    BREAK_POINT
else:
    SIDE_OUT
```

Do not derive side-out or break point from the color or final action type.

## 4.7 LineupChanged event

```json
{
  "eventType": "LINEUP_CHANGED",
  "matchId": "match-uuid",
  "setId": "set-1",
  "effectiveFromRallyNumber": 19,
  "previousLineupVersionId": "lineup-v2",
  "newLineupVersionId": "lineup-v3",
  "changeType": "SUBSTITUTION",
  "playerOutId": "player-04",
  "playerInId": "player-08",
  "onCourtPlayerIds": [
    "player-01","player-02","player-03",
    "player-05","player-06","player-08"
  ]
}
```

Allowed `changeType` values should include `SUBSTITUTION`, `LIBERO_REPLACEMENT`, `SERVING_SUBSTITUTION`, and `CORRECTION`.

## 4.8 EventCorrected / EventVoided

```json
{
  "eventType": "EVENT_CORRECTED",
  "eventId": "correction-uuid",
  "targetEventId": "action-old-uuid",
  "replacementEventId": "action-new-uuid",
  "reason": "Wrong player selected",
  "correctedAt": "2026-11-19T18:13:00.000Z"
}
```

A voided action must not be included in aggregates. Recalculation must start at the affected rally and continue through the remainder of the set when score, phase, or rotation changes.

---

# 5. Optional Inputs for Future Advanced Statistics

These inputs are not required for the current UI but should be supported by the schema:

- serve zone and target zone;
- reception quality scale;
- attack zone, tempo, direction, and block opposition;
- set target and set quality;
- block touch versus kill block;
- dig quality;
- opponent player identifier;
- timeout, challenge, sanction, and injury events;
- rally duration in milliseconds;
- possession/team-contact index;
- manual tag and coach note.

---

# 6. Timeline Construction

## 6.1 Horizontal mode

- Rows: Score, Rotation, Position, Rally, then one row per player.
- Columns: one column per action event.
- Repeat neither Score, Rotation, Position, nor Rally text while the value is unchanged.
- Preserve the background color for blank repeated metadata cells.
- Thin divider at each rally start.
- Thick black divider at each rotation change.

## 6.2 Vertical mode

- Columns: Seq, Score, Rotation, Position, Rally, then one narrow column per player number.
- Rows: one row per action event.
- Default orientation at page load.
- Player headers use shirt number or application player number, not display name.
- Full player name appears in tooltip.
- Do not repeat metadata text while unchanged.

## 6.3 Player-cell state

For each action column/row and player:

1. If the player has the action: display action code and evaluation color.
2. Else if player is in the rally's `onCourtPlayerIds`: grey.
3. Else: white.

## 6.4 Rally colors

- Lost rally: alternating light/dark red.
- Break point: alternating light/dark green.
- Side-out: alternating light/dark yellow.
- Alternate shade only between consecutive rallies of the same category.
- Darker shade has no performance meaning.

---

# 7. Metric Definitions

## 7.1 General player metrics

```text
Ball touches = count(valid ActionRecorded events for player)
Points scored = count(evaluation == POINT)
Errors / points conceded = count(evaluation == ERROR)
Net points = points scored - errors
```

## 7.2 Attack

```text
Attack attempts = count(actionType == A)
Attack kills = count(A and POINT)
Attack errors = count(A and ERROR)
Attack neutral = count(A and CONTINUE)
Attack efficiency = (attack kills - attack errors) / attack attempts
```

If attempts equal zero, display `—`, not `0%`.

## 7.3 Service

```text
Service attempts = count(actionType == Sv)
Aces = count(Sv and POINT)
Service errors = count(Sv and ERROR)
Service in play = count(Sv and CONTINUE)
Service efficiency = (aces - service errors) / service attempts
```

## 7.4 Block

```text
Block attempts = count(actionType == B)
Block points = count(B and POINT)
Block errors = count(B and ERROR)
Block neutral = count(B and CONTINUE)
Block efficiency = (block points - block errors) / block attempts
```

## 7.5 Reception

With the current three-level evaluation:

```text
Reception attempts = count(actionType == R)
Positive receptions = count(R and evaluation in [POINT, CONTINUE])
Reception errors = count(R and ERROR)
Positive reception % = positive receptions / reception attempts
```

This is a simplified percentage. A future quality scale should distinguish perfect, positive, negative, overpass, and error.

## 7.6 Defence

```text
Defence attempts = count(actionType == D)
Positive defences = count(D and evaluation in [POINT, CONTINUE])
Defence errors = count(D and ERROR)
Positive defence % = positive defences / defence attempts
```

## 7.7 Set / Relaunch

```text
Set/Relaunch attempts = count(actionType in [St, F])
Positive = count(St or F with evaluation in [POINT, CONTINUE])
Errors = count(St or F with ERROR)
Positive % = positive / attempts
```

## 7.8 Side-out and break point

```text
Side-out attempts = rallies beginning in RECEPTION
Successful side-outs = those rallies won by our team
Side-out % = successful side-outs / side-out attempts

Break-point attempts = rallies beginning in SERVE
Break points = those rallies won by our team
Break-point % = break points / break-point attempts
```

## 7.9 Playing-time proxies

The current log does not calculate elapsed court time unless timestamps are reliable. The current page therefore presents participation proxies:

```text
Rallies played = distinct rallyIds where player is in onCourtPlayerIds
Action sequences on court = count(action columns whose rally lineup contains player)
Ball touches = count(ActionRecorded for player)
```

If actual time is required:

```text
Court time = sum(rallyEndedAt - rallyStartedAt) for rallies where player was on court
```

Log `startedAt` and `endedAt` with a monotonic match clock to avoid pause and device-clock errors.

---

# 8. Rotation Metrics

Group by:

- setter rotation `P1`–`P6`;
- starting phase `SERVE` or `RECEPTION`;
- optional player;
- optional action type;
- optional action evaluation.

For every group display:

- Rotation;
- Phase;
- Points;
- Errors;
- Attack Efficiency;
- Side-out percentage.

Example query:

```text
rotation = P3
phase = RECEPTION
actionType = A
```

This returns only attacks recorded in rallies where the setter started in P3 and the team began in reception.

---

# 9. Rankings

## 9.1 Role comparison

Role/player mappings are loaded from team settings and snapshotted at match start.

Available ranking metrics:

- Overall;
- Attack;
- Block;
- Attack + Block;
- Reception;
- Defence;
- Service.

For selected actions:

```text
ranking score = POINT count - ERROR count
```

Sort by:

1. score descending;
2. points descending;
3. errors ascending;
4. original roster order.

## 9.2 Roster Ranking views

- **Highlight:** points descending.
- **Lowlight:** errors descending.
- **Overall:** points minus errors descending.

Categories: Attack, Block, Defence, Reception, Service.

## 9.3 Playing-Time ranking

- Rallys played: descending distinct on-court rally count.
- Ball touches: descending action count.
- Tie-breaker: touches descending, then roster order.

---

# 10. Efficiency Trend Curves

Curves are cumulative and calculated after each relevant attempt.

```text
Attack point i = 100 * (cumulative kills - cumulative attack errors) / i
Block point i = 100 * (cumulative block points - cumulative block errors) / i
Service point i = 100 * (cumulative aces - cumulative service errors) / i
Reception point i = 100 * cumulative positive receptions / i
```

Chart domain: `-100%` to `+100%`. If no attempt exists, show an empty state and `—`.

---

# 11. Filtering Semantics

Filters must be composable with logical AND:

- Rotation;
- Phase;
- Player or role;
- Action type;
- Action evaluation: neutral, error, point;
- Rally result: lost, break point, side-out;
- Display mode: all actions or terminal scoring actions.

Filtering statistics must use the same filtered event set displayed in the timeline. A role filter matches any player whose match-role snapshot equals the selected role.

---

# 12. Tooltip Requirements

A hover/focus tooltip for an action cell must show:

- action name and code;
- action evaluation;
- player name and number;
- player role;
- sequence number;
- rally number;
- score after or before as explicitly labelled;
- setter rotation;
- service/reception phase;
- rally outcome;
- on-court/bench state;
- set number.

Tooltips must be keyboard-accessible and must not be the only way to access critical data.

---

# 13. Persistence and API Contract

Recommended endpoints:

```text
POST /api/v1/matches/{matchId}/events
POST /api/v1/matches/{matchId}/events/batch
GET  /api/v1/matches/{matchId}/events?afterSequence={n}
GET  /api/v1/matches/{matchId}/sets/{setId}/timeline
GET  /api/v1/matches/{matchId}/sets/{setId}/statistics
GET  /api/v1/teams/{teamId}/roster
```

### Ingestion requirements

- Reject duplicate `eventId` without duplicating data.
- Reject missing rally references.
- Reject action order duplicates within a rally unless the earlier event is voided.
- Accept offline batches and sort by `sequenceNumber`.
- Return validation errors with field path and machine-readable code.

---

# 14. Validation Rules

1. Exactly one rally winner.
2. `scoreAfter` increases exactly one side by one.
3. Terminal action should normally be `POINT` or `ERROR`; allow explicit administrative end reasons.
4. A player action requires the player to be on court, except an explicit correction workflow.
5. Position must be `S` or `R` from the analysed team's perspective.
6. Setter rotation must be `P1`–`P6`.
7. A side-out win must start in reception.
8. A break point must start at service.
9. Rotation increments only after winning a rally that started in reception.
10. Set completion must follow configured scoring rules, including two-point margin.
11. A libero replacement must preserve six on-court players.
12. Every aggregate excludes voided/superseded events.

---

# 15. Performance and Caching

For one set, expect approximately:

- 35–65 rallies;
- 80–250 logged actions;
- 7–14 roster players.

Recompute one set locally in under 100 ms on a mid-range tablet. Cache aggregates by:

```text
matchId + setId + eventStreamRevision + filterHash
```

Invalidate only the affected set after ordinary corrections. Invalidate the remainder of the set when score, phase, rotation, or lineup history changes.

---

# 16. Security and Privacy

- Use internal player IDs rather than personal data in action logs.
- Keep display names in roster/profile storage.
- Enforce team/match authorization on APIs.
- Audit corrections and exports.
- Do not include authentication tokens in exported HTML or logs.
- Escape all user-provided names and notes before HTML rendering.

---

# 17. Test Strategy

## 17.1 Unit tests

- Every metric formula, including zero denominator.
- Rally outcome classification.
- Rotation transition rules.
- Ranking tie-breakers.
- Alternating color selection.
- Filter composition.
- Correction exclusion.

## 17.2 Integration tests

Use a deterministic 25–22 set with 47 rallies and at least:

- all rotations P1–P6;
- service and reception phases;
- substitutions and libero replacement;
- each action type;
- point, error, and continue evaluations;
- consecutive lost rallies, break points, and side-outs;
- one corrected action;
- one player with no attacks to verify `—`.

## 17.3 Acceptance checks

1. Rally 6 with five actions displays five separate action entries.
2. Horizontal and vertical views represent identical events.
3. Player presence matches lineup snapshots.
4. P3 + Reception + Attack returns only appropriate attack events.
5. Side-out and break-point results match rally start phase.
6. Team totals equal the sum of valid player actions.
7. Overall ranking equals points minus errors.
8. Role ranking displays one aligned column per configured player.
9. Playing-time rally count uses distinct rally IDs, not action count.
10. Undo/correction rebuilds all affected metrics.

---

# 18. Minimum Complete Event Example

A five-action rally must produce five `ACTION_RECORDED` events, not one aggregated object:

```json
[
  {"rallyId":"r6","sequenceNumber":14,"actionIndexInRally":1,"playerId":"p1","actionType":"St","evaluation":"CONTINUE"},
  {"rallyId":"r6","sequenceNumber":15,"actionIndexInRally":2,"playerId":"p1","actionType":"St","evaluation":"CONTINUE"},
  {"rallyId":"r6","sequenceNumber":16,"actionIndexInRally":3,"playerId":"p3","actionType":"R","evaluation":"CONTINUE"},
  {"rallyId":"r6","sequenceNumber":17,"actionIndexInRally":4,"playerId":"p4","actionType":"F","evaluation":"CONTINUE"},
  {"rallyId":"r6","sequenceNumber":18,"actionIndexInRally":5,"playerId":"p6","actionType":"A","evaluation":"POINT"}
]
```

Every event must additionally contain the mandatory fields defined in section 4.5.

---

# 19. Definition of Done

Implementation is complete when:

- the event contract is versioned and validated;
- offline and live ingestion are idempotent;
- every page is computed from logs, not hard-coded demo data;
- calculations pass unit and integration tests;
- timeline views, filters, rankings, rotation metrics, and playing-time metrics agree quantitatively;
- corrections rebuild affected statistics;
- tooltips and charts are keyboard-accessible;
- exports contain no credentials or executable user content;
- the deterministic reference set produces the expected 25–22 final score and 47 rally records.
