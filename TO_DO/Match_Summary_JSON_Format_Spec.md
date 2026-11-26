# Match Summary JSON: Generic Format Specification

**Document type:** `match-summary`
**Spec version:** 1.2.0
**Scope:** one file per match, **own team only** (team overall + every player)
**Goal:** define the format of the summary of **one match**: team-overall and per-player indicators.
**Out of scope:** consolidation over time (season aggregation, rolling averages, trends, display thresholds). It is covered by a separate specification (see §11).

**Changes in 1.2.0** (additive, minor version; 1.1.x files stay readable):

| Added | Section |
|---|---|
| Attack and efficiency **by rotation**, team and per player | §9.1, §8.4 |
| Attack in **side-out** and in **transition**, team and per player | §7.11 |
| **Break-point when a player serves** (serving turns, longest serving run) | §8.5 |
| **Total errors and balance** (points scored minus errors), team and per player | §7.12 |
| **Streaks and key moments** (runs, late-set results, lead profile per set) | §10 |

---

## 1. Purpose

A Match Summary is a **derived, frozen and versioned** JSON file. It holds the indicators of one match for the user's own team. It is generated from the Match JSON (events, rallies) and is never edited by hand.

It serves three consumers, which must all read the same values:

| Consumer | Usage |
|---|---|
| HTML / PDF match report | Display only. No recomputation. |
| Consolidation over time | Reads N summaries. Defined in a separate specification. |
| Coach View / match library | Optional read of pre-computed indicators. |

The summary can always be deleted and rebuilt from the Match JSON.

---

## 2. Principles

1. **Generic.** No team, player, competition or season is hard-coded. `match.ourTeamId` drives the file.
2. **Own team only.** No indicator or player of the opponent. The opponent appears only as identity, in `match.opponent` and in the score.
3. **Numerator and denominator always stored.** Every rate is a `Rate` triple. This allows any later consolidation to recompute rates exactly.
4. **Raw counts stored.** Grade counts (`#`, `+`, `!`, `-`, `/`, `=`) are kept per skill so any future rule can be recomputed without the Match JSON.
5. **Stable player identity.** `playerId` is the **season-level roster id**, identical in every match of the season. A jersey number is an attribute, not an identity.
6. **No invented values.** Anything not computable is `null` with an explanation in `integrity.limitations`.
7. **Deterministic and versioned.** Same source and same `schemaVersion` give the same indicators. Readers ignore unknown fields.

---

## 3. File naming and generation

```
season/<seasonId>/summaries/<matchId>.summary.json
```

Generate or regenerate when: a match is closed, a match is imported, match events are corrected, or the user triggers a manual recompute.
Encoding: UTF-8, `.` as decimal separator.

---

## 4. Top-level structure

```json
{
  "schemaVersion": "1.2.0",
  "documentType": "match-summary",
  "generatedAt": "2026-11-26T12:00:00+01:00",
  "source": {},
  "season": {},
  "match": {},
  "result": {},
  "team": {},
  "bySet": [],
  "rotations": [],
  "players": [],
  "keyMoments": {},
  "calculationRules": {},
  "integrity": {}
}
```

| Key | Req. | Content |
|---|---|---|
| `source` | yes | Provenance: `fileName`, `sha256`, `format`, `schemaVersion`, `eventCount`, `rallyCount`. The hash lets the app detect a stale summary. |
| `season` | yes | `seasonId`, `label`, optional `competition`, `phase`. |
| `match` | yes | Identity, tags and rules (§5). |
| `result` | yes | Outcome and scores from the own team's point of view (§5). |
| `team` | yes | Team-overall indicators for the whole match (§7). |
| `bySet` | yes | Same indicators per set (§7.10). |
| `rotations` | yes | P1 to P6 breakdown, including attack by rotation (§9). |
| `players` | yes | One entry per roster player (§8). |
| `keyMoments` | yes | Streaks, late-set results and lead profile (§10). |
| `calculationRules` | yes | Definitions embedded in the file (§12). |
| `integrity` | yes | Self-check results (§13). |

---

## 5. `match` and `result`

### 5.1 `match`

| Field | Type | Req. | Usage |
|---|---|---|---|
| `matchId` | string | yes | Stable unique id. |
| `date` | `YYYY-MM-DD` | yes | Chronological ordering. |
| `ourTeamId`, `ourTeamName` | string | yes | Own team. |
| `opponent` | `{teamId, name}` | yes | Identity only. |
| `homeAway` | `HOME` \| `AWAY` \| `NEUTRAL` | no | Filter. |
| `opponentLevel` | string \| null | no | Filter; helps relativize a dip caused by a stronger opponent. |
| `tags` | string[] | no | Free filters (competition, phase, etc.). |
| `setsPlayed` | integer | yes | Denominator for per-set values. |
| `rallies` | integer | yes | Total rallies. |
| `rules` | `{setsToWin, setPoints, decidingSetPoints}` | yes | Context. |
| `lifecycleStatus` | enum | yes | Must be `COMPLETED` for a final summary. |

### 5.2 `result`

```json
{
  "outcome": "WIN",
  "setsFor": 3, "setsAgainst": 1,
  "pointsFor": 95, "pointsAgainst": 75,
  "setScores": [
    { "setNumber": 1, "pointsFor": 25, "pointsAgainst": 14, "outcome": "WIN" }
  ]
}
```

---

## 6. Common types

### 6.1 `Rate`

```json
{ "numerator": 46, "denominator": 76, "value": 0.605263 }
```

- `value = numerator / denominator`, rounded to 6 decimals.
- Denominator 0 gives `value: null`.
- Percentages are never stored.
- Efficiency numerators are signed and can be negative.

### 6.2 `GradeCounts`

Always the six keys, integers ≥ 0:

```json
{ "#": 46, "+": 5, "!": 0, "-": 19, "/": 6, "=": 8 }
```

| Grade | Meaning |
|---|---|
| `#` | Point / perfect |
| `+` | Positive |
| `!` | Neutral-quality |
| `-` | Negative |
| `/` | Blocked attack, or poor grade for the skill |
| `=` | Error |

The sum of the six counts equals the number of actions of the skill.

---

## 7. Team-overall indicators (`team`)

### 7.1 Metric catalogue

"Dir." is the direction considered favourable. 

| Block | Metric key | Definition | Numerator / Denominator | Dir. |
|---|---|---|---|---|
| `rallies` | `winRate` | Rallies won / played | won / total | ↑ |
| `sideOut` | `rate` | Win rate when **receiving** | rallies won on reception / rallies on reception | ↑ |
| `breakPoint` | `rate` | Win rate when **serving** | rallies won on serve / rallies on serve | ↑ |
| `serve` | `aceRate` | Aces per serve | `#` / attempts | ↑ |
| `serve` | `errorRate` | Service errors per serve | `=` / attempts | ↓ |
| `serve` | `pressureRate` | Serves with grade `#` or `+` | (`#`+`+`) / attempts | ↑ |
| `serve` | `inPlayRate` | Serves in play | (attempts − `=`) / attempts | ↑ |
| `serve` | `acesPerSet` | Aces per set | `#` / sets played | ↑ |
| `reception` | `perfectRate` | Perfect receptions | `#` / attempts | ↑ |
| `reception` | `positiveRate` | Positive receptions (**includes perfect**) | (`#`+`+`) / attempts | ↑ |
| `reception` | `errorRate` | Reception errors | `=` / attempts | ↓ |
| `reception` | `efficiency` | Reception efficiency | (positive − errors) / attempts | ↑ |
| `attack` | `killRate` | Kills per attack | `#` / attempts | ↑ |
| `attack` | `errorRateIncludingBlocked` | Errors + blocked per attack | (`=` + `/`) / attempts | ↓ |
| `attack` | `efficiency` | Attack efficiency | (`#` − `=` − `/`) / attempts | ↑ |
| `attack` | `killsPerSet` | Kills per set | `#` / sets played | ↑ |
| `block` | `pointRate` | Block points per block action | `#` / actions | ↑ |
| `block` | `pointsPerSet` | Block points per set | `#` / sets played | ↑ |
| `defense` | `positiveRate` | Positive defense actions | (`#`+`+`) / actions | ↑ |
| `defense` | `errorRate` | Defense errors | `=` / actions | ↓ |
| `setting` | `positiveRate` | Positive set actions | (`#`+`+`) / actions | ↑ |
| `freeball` | `positiveRate` | Positive free-ball actions | (`#`+`+`) / actions | ↑ |
| `attack.byPhase.sideOut` | `killRate`, `efficiency` | Attack after own reception (first attack of a receive rally) | `#` / attempts, (`#` − `=` − `/`) / attempts, for this phase | ↑ |
| `attack.byPhase.transition` | `killRate`, `efficiency` | All other attacks (own serve rallies, after dig, cover or free ball) | same formulas, for this phase | ↑ |
| `balance` | `balancePerSet` | Points from skills minus errors, per set | (points scored − errors) / sets played | ↑ |
| `rotations[].attack` | `killRate`, `efficiency`, `attemptShareOfTeam` | Attack by rotation | see §9.1 | ↑ |
| `scoring` | `scoringSkillPointsPerSet` | Points from attack, serve, block | (kills + aces + block points) / sets played | ↑ |
| `scoring` | `shareOfTeamPointsFromScoringSkills` | Share of points scored through skills | scoring skill points / points scored | context |
| `terminalActions` | `directErrorRateAmongLostRallies` | Lost rallies ending on an own direct error | direct errors / rallies lost | ↓ |
| `score` | `pointsPerSet`, `pointsAgainstPerSet` | Points for / against per set | points / sets played | ↑ / ↓ |

### 7.2 Indicator block shape

Each skill block holds raw counts, the `Rate` metrics above, and `gradeCounts`. Example for `attack`:

```json
"attack": {
  "attempts": 84,
  "kills": 46,
  "unforcedErrors": 8,
  "blocked": 6,
  "errorsIncludingBlocked": 14,
  "killRate":   { "numerator": 46, "denominator": 84, "value": 0.547619 },
  "errorRateIncludingBlocked": { "numerator": 14, "denominator": 84, "value": 0.166667 },
  "efficiency": { "numerator": 32, "denominator": 84, "value": 0.380952 },
  "killsPerSet":{ "numerator": 46, "denominator": 4,  "value": 11.5 },
  "gradeCounts": { "#": 46, "+": 5, "!": 0, "-": 19, "/": 6, "=": 8 }
}
```

### 7.3 `rallies`, `sideOut`, `breakPoint`

```json
"rallies":    { "won": 95, "lost": 75, "total": 170, "winRate": { "numerator": 95, "denominator": 170, "value": 0.558824 } },
"sideOut":    { "won": 46, "total": 76, "rate": { "numerator": 46, "denominator": 76, "value": 0.605263 } },
"breakPoint": { "won": 49, "total": 94, "rate": { "numerator": 49, "denominator": 94, "value": 0.521277 } }
```

`sideOut.total + breakPoint.total = rallies.total`.

### 7.4 `serve`

Fields: `attempts`, `aces`, `errors`, `inPlay`, `pressureServes`, `aceRate`, `errorRate`, `pressureRate`, `inPlayRate`, `acesPerSet`, `gradeCounts`.

### 7.5 `reception`

Fields: `attempts`, `perfect`, `positive`, `errors`, `perfectRate`, `positiveRate`, `errorRate`, `efficiency`, `gradeCounts`.

### 7.6 `attack`

Fields: `attempts`, `kills`, `unforcedErrors`, `blocked`, `errorsIncludingBlocked`, `killRate`, `errorRateIncludingBlocked`, `efficiency`, `killsPerSet`, `byPhase` (§7.11), `gradeCounts`.

### 7.7 `block`

Fields: `actions`, `points`, `positiveTouches`, `errors`, `pointRate`, `pointsPerSet`, `gradeCounts`.

### 7.8 `defense`, `setting`, `freeball`

Same shape: `actions`, `positive`, `errors`, `positiveRate`, `errorRate`, `gradeCounts`.

### 7.9 `scoring`, `terminalActions`, `score`

```json
"scoring": {
  "attackKills": 46, "serviceAces": 8, "blockPoints": 9, "scoringSkillPoints": 63,
  "scoringSkillPointsPerSet": { "numerator": 63, "denominator": 4, "value": 15.75 },
  "shareOfTeamPointsFromScoringSkills": { "numerator": 63, "denominator": 95, "value": 0.663158 }
},
"terminalActions": {
  "directErrors": 47,
  "directErrorRateAmongLostRallies": { "numerator": 47, "denominator": 75, "value": 0.626667 }
},
"score": {
  "setsWon": 3, "setsPlayed": 4, "pointsFor": 95, "pointsAgainst": 75, "pointDifferential": 20,
  "pointsPerSet": { "numerator": 95, "denominator": 4, "value": 23.75 },
  "pointsAgainstPerSet": { "numerator": 75, "denominator": 4, "value": 18.75 }
}
```

A **direct error** is a normalized error action whose event id equals the terminal event id of a rally lost by the own team.

### 7.10 `bySet[]`

```json
{ "setNumber": 1, "indicators": { } }
```

`indicators` has the same structure as `team`, restricted to the set. Per-set denominators equal `1`. Used for set-by-set breakdowns.

### 7.11 `attack.byPhase`: side-out and transition

Splits the attack block in two phases.

| Phase key | Definition |
|---|---|
| `sideOut` | The **first own attack** of a rally in which the own team **received** the serve, made after the own reception (commonly called complex 1 or K1). |
| `transition` | **Every other own attack**: all attacks in rallies where the own team served, attacks after a dig, a block cover or a free ball, and any further attack in a receive rally after the first one (commonly called complex 2 or K2). |

Each phase holds: `attempts`, `kills`, `unforcedErrors`, `blocked`, `errorsIncludingBlocked`, `killRate`, `errorRateIncludingBlocked`, `efficiency`, `attemptShareOfAttacks` and `gradeCounts`.

| Field | Definition |
|---|---|
| `attemptShareOfAttacks` | `Rate`: phase attempts / total attack attempts of the same entity (team or player). |
| `attemptShareOfTeam` | **Player only.** `Rate`: player's phase attempts / team phase attempts. |

```json
"byPhase": {
  "available": true,
  "sideOut": {
    "attempts": 52, "kills": 31, "unforcedErrors": 4, "blocked": 3, "errorsIncludingBlocked": 7,
    "killRate": { "numerator": 31, "denominator": 52, "value": 0.596154 },
    "errorRateIncludingBlocked": { "numerator": 7, "denominator": 52, "value": 0.134615 },
    "efficiency": { "numerator": 24, "denominator": 52, "value": 0.461538 },
    "attemptShareOfAttacks": { "numerator": 52, "denominator": 84, "value": 0.619048 },
    "gradeCounts": { "#": 31, "+": 3, "!": 0, "-": 11, "/": 3, "=": 4 }
  },
  "transition": {
    "attempts": 32, "kills": 15, "unforcedErrors": 4, "blocked": 3, "errorsIncludingBlocked": 7,
    "killRate": { "numerator": 15, "denominator": 32, "value": 0.46875 },
    "errorRateIncludingBlocked": { "numerator": 7, "denominator": 32, "value": 0.21875 },
    "efficiency": { "numerator": 8, "denominator": 32, "value": 0.25 },
    "attemptShareOfAttacks": { "numerator": 32, "denominator": 84, "value": 0.380952 },
    "gradeCounts": { "#": 15, "+": 2, "!": 0, "-": 8, "/": 3, "=": 4 }
  }
}
```

Rules:
- `sideOut` + `transition` equals the `attack` totals for every counter (attempts, kills, unforcedErrors, blocked, each grade count).
- The phase is derived from the event order inside each rally and from which team served. If the source cannot provide it, `byPhase` is `{ "available": false, "reason": "..." }` and `integrity.limitations` explains why.

### 7.12 `balance`: total errors and balance

Same block at team level, set level (`bySet`) and player level.

| Field | Definition |
|---|---|
| `pointsScored` | `scoringSkillPoints` (attack kills + service aces + block points). |
| `errorsBySkill` | Count of grade `=` actions per skill: `attack`, `serve`, `reception`, `block`, `defense`, `setting`, `freeball`. |
| `errorsTotal` | Sum of `errorsBySkill`. |
| `attackBlocked` | Attack grade `/` (attacks blocked). |
| `errorsIncludingBlocked` | `errorsTotal + attackBlocked`. |
| `balance` | `pointsScored − errorsTotal`. |
| `balanceIncludingBlocked` | `pointsScored − errorsIncludingBlocked`. |
| `balancePerSet` | `Rate`: `balance` / sets played (team sets for a player; `1` in `bySet`). |
| `shareOfTeamErrors` | **Player only.** `Rate`: player's `errorsTotal` / team `errorsTotal`. |

```json
"balance": {
  "pointsScored": 63,
  "errorsBySkill": { "attack": 8, "serve": 14, "reception": 6, "block": 3, "defense": 9, "setting": 4, "freeball": 3 },
  "errorsTotal": 47,
  "attackBlocked": 6,
  "errorsIncludingBlocked": 53,
  "balance": 16,
  "balanceIncludingBlocked": 10,
  "balancePerSet": { "numerator": 16, "denominator": 4, "value": 4.0 }
}
```

Notes:
- The balance is **skill-based**. It is not the score differential: points given by opponent errors are not counted.
- `errorsTotal` counts every grade `=` action. It is stored in addition to `terminalActions.directErrors` (lost rallies ending on a direct error). The two are separate counts and no equality is required.

---

## 8. Player indicators (`players[]`)

One entry per roster player, **including players with no action** (`appeared: false`), so that attendance is tracked.

```json
{
  "playerId": "player-0007",
  "number": 7,
  "name": "Firstname LASTNAME",
  "role": "OH",
  "active": true,
  "appeared": true,
  "setsWithRecordedAction": [1, 2, 3, 4],
  "onCourt": {},
  "attackByRotation": {},
  "indicators": {}
}
```

| Field | Description |
|---|---|
| `playerId` | **Season-stable** roster id. Used to chain a player across matches. |
| `number`, `name` | Attributes of the match. |
| `role` | `OH`, `OPP`, `MB`, `SET`, `LIB` or `null`. Used for position-based comparisons. |
| `appeared` | At least one recorded action, or on court at least once. |
| `setsWithRecordedAction` | Sets with at least one action. |
| `onCourt` | Rally results while on court (§8.2). |
| `attackByRotation` | Attack per rotation (§8.4). |
| `indicators` | Skill indicators, including `attack.byPhase`, `serve` break-point (§8.5) and `balance` (§7.12). |

### 8.1 Player metric catalogue

Blocks and formulas are the same as §7.1, computed on the player's own actions. These are the player-level metrics stored in the file.

| Block | Metric keys |
|---|---|
| `attack` | `efficiency`, `killRate`, `errorRateIncludingBlocked`, `killsPerSet`, `attemptShare` (solicitation) |
| `reception` | `positiveRate`, `perfectRate`, `errorRate`, `efficiency` |
| `serve` | `aceRate`, `errorRate`, `pressureRate`, `inPlayRate`, `acesPerSet` |
| `block` | `pointsPerSet`, `pointRate` |
| `defense` | `positiveRate`, `errorRate` |
| `setting` | `positiveRate` |
| `freeball` | `positiveRate` |
| `scoring` | `scoringSkillPoints`, `shareOfTeamScoringSkillPoints` |
| `terminalActions` | `directErrors` |
| `attack.byPhase` | per phase (`sideOut`, `transition`): `efficiency`, `killRate`, `attemptShareOfTeam` |
| `attackByRotation` | per rotation: `efficiency`, `killRate`, `attemptShareInRotation` |
| `serve` | `breakPoint`, `pointsPerTurn`, `servingTurns`, `longestServingRun` |
| `balance` | `errorsTotal`, `balance`, `balanceIncludingBlocked`, `balancePerSet`, `shareOfTeamErrors` |

Player-specific additions to the §7 blocks:

| Block | Field | Definition |
|---|---|---|
| `attack` | `attemptShare` | `Rate`: player's attack attempts / team attack attempts. |
| `scoring` | `shareOfTeamScoringSkillPoints` | `Rate`: player's scoring skill points / team scoring skill points. |
| `terminalActions` | `directErrors` | Integer: rallies lost on this player's direct error. |
| `attack.byPhase` | `attemptShareOfTeam` | `Rate`: player's phase attempts / team phase attempts (§7.11). |
| `serve` | `breakPoint`, `servingTurns`, `pointsPerTurn`, `longestServingRun` | Break-point when this player serves (§8.5). |
| `balance` | `shareOfTeamErrors` | `Rate`: player's errors / team errors (§7.12). |

Player per-set values use the **team's** sets played as denominator. To compare a substitute fairly, use `onCourt.sets`.

### 8.2 `onCourt` (rally-level, while the player is on court)

When per-rally lineups exist:

```json
"onCourt": {
  "available": true,
  "sets": [1, 2, 3, 4],
  "rallies":    { "won": 38, "lost": 37, "total": 75, "winRate": { "numerator": 38, "denominator": 75, "value": 0.506667 } },
  "sideOut":    { "won": 24, "total": 39, "rate": { "numerator": 24, "denominator": 39, "value": 0.615385 } },
  "breakPoint": { "won": 14, "total": 36, "rate": { "numerator": 14, "denominator": 36, "value": 0.388889 } }
}
```

Otherwise:

```json
"onCourt": { "available": false, "reason": "No per-rally lineup in the source." }
```

### 8.3 Example `indicators` (illustrative values)

```json
"indicators": {
  "attack":    { "attempts": 20, "kills": 9, "unforcedErrors": 2, "blocked": 2, "errorsIncludingBlocked": 4,
                 "killRate": { "numerator": 9, "denominator": 20, "value": 0.45 },
                 "errorRateIncludingBlocked": { "numerator": 4, "denominator": 20, "value": 0.2 },
                 "efficiency": { "numerator": 5, "denominator": 20, "value": 0.25 },
                 "killsPerSet": { "numerator": 9, "denominator": 4, "value": 2.25 },
                 "attemptShare": { "numerator": 20, "denominator": 84, "value": 0.238095 },
                 "gradeCounts": { "#": 9, "+": 2, "!": 0, "-": 5, "/": 2, "=": 2 } },
  "reception": { "attempts": 23, "perfect": 5, "positive": 10, "errors": 3,
                 "perfectRate": { "numerator": 5, "denominator": 23, "value": 0.217391 },
                 "positiveRate": { "numerator": 10, "denominator": 23, "value": 0.434783 },
                 "errorRate": { "numerator": 3, "denominator": 23, "value": 0.130435 },
                 "efficiency": { "numerator": 7, "denominator": 23, "value": 0.304348 },
                 "gradeCounts": { "#": 5, "+": 5, "!": 8, "-": 2, "/": 0, "=": 3 } },
  "scoring":   { "attackKills": 9, "serviceAces": 1, "blockPoints": 1, "scoringSkillPoints": 11,
                 "shareOfTeamScoringSkillPoints": { "numerator": 11, "denominator": 63, "value": 0.174603 } }
}
```

The other blocks (`serve`, `block`, `defense`, `setting`, `freeball`, `terminalActions`, `balance`) follow §7.

### 8.4 `attackByRotation` (attack share and efficiency by rotation)

Attack of the player in each rotation. The rotation of an attack is the own team's rotation **at the start of the rally** in which it occurs (same rule as §9). All six rotations are always listed; a rotation with no attack has `attempts: 0` and `null` rates.

```json
"attackByRotation": {
  "available": true,
  "rotations": [
    {
      "rotation": "P1",
      "attempts": 4, "kills": 2, "unforcedErrors": 0, "blocked": 1,
      "killRate": { "numerator": 2, "denominator": 4, "value": 0.5 },
      "efficiency": { "numerator": 1, "denominator": 4, "value": 0.25 },
      "attemptShareInRotation": { "numerator": 4, "denominator": 15, "value": 0.266667 }
    }
  ]
}
```

| Field | Definition |
|---|---|
| `attempts`, `kills`, `unforcedErrors`, `blocked` | Player counts in the rotation. |
| `killRate`, `efficiency` | Same formulas as §7.6, restricted to the rotation. |
| `attemptShareInRotation` | `Rate`: player's attempts in the rotation / **team** attempts in the same rotation (the player's attack share, or solicitation, in that rotation). |

The example shows one of the six rotations. When per-rally lineups are missing: `{ "available": false, "reason": "..." }`.

### 8.5 Break-point when the player serves

Added to the player's `serve` block.

```json
"serve": {
  "breakPoint": { "won": 9, "total": 14, "rate": { "numerator": 9, "denominator": 14, "value": 0.642857 } },
  "servingTurns": 5,
  "pointsPerTurn": { "numerator": 9, "denominator": 5, "value": 1.8 },
  "longestServingRun": { "points": 4, "setNumber": 3 }
}
```

| Field | Definition |
|---|---|
| `breakPoint` | Rallies **served by this player**: won / total. `total` is the number of rallies in which this player served. |
| `servingTurns` | Number of serving turns. A turn is a maximal sequence of consecutive rallies of one set served by this player. It starts when the own team gains the serve (or at the start of the set) and ends with a lost rally or the end of the set. |
| `pointsPerTurn` | `Rate`: `breakPoint.won` / `servingTurns`. |
| `longestServingRun` | Most rallies won in a row within a single turn: `{ "points", "setNumber" }`. |

The server of each rally is the player of its serve event. A rally without a recorded serve is reported in `integrity.limitations`.

**Do not confuse** with `onCourt.breakPoint` (§8.2): that one is the team's break-point while the player is on court, whoever serves. `serve.breakPoint` counts only the rallies this player actually served. The sum of the players' `serve.breakPoint` equals the team `breakPoint`.

---

## 9. Rotations (`rotations[]`)

One entry per rotation `P1` to `P6`, from the own team's rotation at the start of each rally. Used for the rotation × match heatmap.

```json
{
  "rotation": "P1",
  "rallies":    { "won": 15, "lost": 9, "total": 24, "winRate": { "numerator": 15, "denominator": 24, "value": 0.625 } },
  "sideOut":    { "won": 8, "total": 11, "rate": { "numerator": 8, "denominator": 11, "value": 0.727273 } },
  "breakPoint": { "won": 7, "total": 13, "rate": { "numerator": 7, "denominator": 13, "value": 0.538462 } },
  "pointDifferential": 6
}
```

- The six entries sum to the team's `rallies`, `sideOut` and `breakPoint`.
- If the source has no per-rally lineup, `rotations` is `[]` and `integrity.limitations` says why.

### 9.1 `rotations[].attack`

Each rotation entry also holds the team's attack in that rotation (mandatory when rotations are available):

```json
"attack": {
  "attempts": 15, "kills": 8, "unforcedErrors": 1, "blocked": 1, "errorsIncludingBlocked": 2,
  "killRate": { "numerator": 8, "denominator": 15, "value": 0.533333 },
  "errorRateIncludingBlocked": { "numerator": 2, "denominator": 15, "value": 0.133333 },
  "efficiency": { "numerator": 6, "denominator": 15, "value": 0.4 },
  "attemptShareOfTeam": { "numerator": 15, "denominator": 84, "value": 0.178571 },
  "gradeCounts": { "#": 8, "+": 1, "!": 0, "-": 4, "/": 1, "=": 1 }
}
```

- `attemptShareOfTeam` is the share of the team's match attempts played in this rotation.
- The six rotations sum to the team `attack` counters.
- The players' `attackByRotation` entries of one rotation sum to that rotation's `attack` counters.

---

## 10. Streaks and key moments (`keyMoments`)

Match-level and set-level facts about momentum, from the own team's point of view.

### 10.1 Parameters

Stored in the file so the values are reproducible.

| Parameter | Default | Meaning |
|---|---|---|
| `runThreshold` | 4 | Minimum length of a run of consecutive rallies won (or lost) to be counted in `runsFor` / `runsAgainst`. |
| `lateSetOffset` | 5 | The late-set phase of a set starts when either team has reached `setPoints − lateSetOffset` points before the rally (20 in a 25-point set, 10 in a 15-point deciding set). |

### 10.2 Structure

```json
"keyMoments": {
  "parameters": { "runThreshold": 4, "lateSetOffset": 5 },
  "streaks": {
    "longestWinStreak":  { "length": 8, "setNumber": 3, "startScore": "5-6", "endScore": "13-6" },
    "longestLossStreak": { "length": 4, "setNumber": 2, "startScore": "10-8", "endScore": "10-12" },
    "longestServingRun": { "length": 7, "playerId": "player-0003", "setNumber": 1 },
    "runsFor": 7,
    "runsAgainst": 3
  },
  "lateSet": {
    "rallies":    { "won": 33, "lost": 29, "total": 62, "winRate": { "numerator": 33, "denominator": 62, "value": 0.532258 } },
    "sideOut":    { "won": 17, "total": 30, "rate": { "numerator": 17, "denominator": 30, "value": 0.566667 } },
    "breakPoint": { "won": 16, "total": 32, "rate": { "numerator": 16, "denominator": 32, "value": 0.5 } },
    "pointDifferential": 4
  },
  "bySet": [
    {
      "setNumber": 1,
      "longestWinStreak":  { "length": 6, "startScore": "2-1", "endScore": "8-1" },
      "longestLossStreak": { "length": 3, "startScore": "10-3", "endScore": "10-6" },
      "maxLead":    { "value": 11, "score": "20-9" },
      "maxDeficit": { "value": 1, "score": "0-1" },
      "leadChanges": 1,
      "lateSet": {
        "threshold": 20,
        "rallies":    { "won": 5, "lost": 3, "total": 8, "winRate": { "numerator": 5, "denominator": 8, "value": 0.625 } },
        "sideOut":    { "won": 3, "total": 4, "rate": { "numerator": 3, "denominator": 4, "value": 0.75 } },
        "breakPoint": { "won": 2, "total": 4, "rate": { "numerator": 2, "denominator": 4, "value": 0.5 } },
        "pointDifferential": 2
      }
    }
  ]
}
```

The example shows one set; a valid file has one `bySet` entry per played set.

### 10.3 Definitions

| Field | Definition |
|---|---|
| `longestWinStreak` | Longest sequence of consecutive rallies won by the own team within a set. `startScore` is the score **before** the first rally of the streak, `endScore` the score **after** the last. Scores are written `own-opponent`. |
| `longestLossStreak` | Same for rallies lost. |
| Tie rule | If several streaks have the same length, the earliest is kept. |
| Match-level streaks | The best of the per-set values. A streak never spans two sets. |
| `longestServingRun` | Largest `longestServingRun.points` among players (§8.5), with the player id. `length` is the number of rallies won in a row in one serving turn. |
| `runsFor` / `runsAgainst` | Number of runs of at least `runThreshold` consecutive rallies won / lost. |
| `lateSet` | Results of the rallies played in the late-set phase (§10.1). `sideOut.total + breakPoint.total = rallies.total`. The match-level block is the sum of the set blocks. |
| `threshold` | Score from which the late-set phase starts in that set (`setPoints − lateSetOffset`, with the deciding-set value for a deciding set). |
| `maxLead` | Largest lead (own − opponent points) reached in the set, with the score when first reached. `{ "value": 0, "score": null }` if the own team never led. |
| `maxDeficit` | Largest deficit (opponent − own points) reached, same format. |
| `leadChanges` | Number of times the leading team switches from one team to the other. A tie is not a lead. |

---

## 11. Scope boundary: consolidation over time

This specification stops at the single-match file. A separate specification will define consolidation over time. The match summary guarantees what that specification needs:

| Guarantee | Where |
|---|---|
| Every rate carries numerator and denominator | §6.1 |
| Raw grade counts for every skill | §6.2 |
| Season-stable `playerId` | §8 |
| Match date, opponent, `homeAway`, `opponentLevel`, `tags` | §5.1 |
| Per-set and per-rotation breakdowns | §7.10, §9 |
| Attack by phase and by rotation, per-player serving break-point, error balance | §7.11, §8.4, §8.5, §7.12 |
| Streaks and key moments | §10 |
| Schema versioning (readers accept the same major version, ignore unknown fields) | §4 |

The following are **not** defined here: aggregation formulas, rolling windows, trends, minimum-sample thresholds, absent-player handling, charts and filters.

---

## 12. `calculationRules`

Embedded in every file. Minimum keys: `rates`, `dataVolleyGrades`, `sideOut`, `breakPoint`, `attack`, `reception`, `serve`, `block`, `defenseSettingFreeball`, `scoringSkillPoints`, `terminalDirectError`, `playerOnCourt`, `attackPhase`, `attackByRotation`, `playerServeBreakPoint`, `errorBalance`, `keyMoments`. Their text matches the definitions in §6 to §10.

---

## 13. `integrity`

```json
"integrity": {
  "status": "PASS",
  "checks": [ { "id": "rallies-equal-points", "status": "PASS" } ],
  "limitations": []
}
```

| Check id | Rule |
|---|---|
| `rallies-equal-points` | `team.rallies.total = result.pointsFor + result.pointsAgainst = source.rallyCount` |
| `side-out-break-point-total` | `sideOut.total + breakPoint.total = rallies.total` |
| `sets-sum-to-match` | Sum of `bySet` counts equals `team` counts |
| `players-sum-to-team` | Sum of `players` counts equals `team` counts for each skill |
| `grade-counts-sum` | Sum of `gradeCounts` equals `attempts` or `actions` |
| `scoring-identity` | `scoringSkillPoints = attackKills + serviceAces + blockPoints` |
| `rate-recompute` | Every `value = round(numerator / denominator, 6)`, or `null` if denominator is 0 |
| `rotations-sum` | Six rotations sum to team rally totals (when available) |
| `result-consistency` | Set scores and sets won match `result` |
| `shares-sum` | Player `attemptShare` values sum to 1 (±0.000001) |
| `attack-phase-sum` | `byPhase.sideOut` + `byPhase.transition` equals `attack` for every counter, for the team and for each player |
| `attack-rotation-sum` | Six `rotations[].attack` sum to `team.attack`; players' `attackByRotation` of one rotation sum to that rotation's `attack` (when available) |
| `shares-by-rotation-phase` | For each rotation, players' `attemptShareInRotation` sum to 1; for each phase, players' `attemptShareOfTeam` sum to 1 (±0.000001) |
| `serve-breakpoint-sum` | Sum of players' `serve.breakPoint` (`won` and `total`) equals team `breakPoint` |
| `serving-turns-consistency` | For each player: `breakPoint.total − breakPoint.won ≤ servingTurns ≤ breakPoint.total` |
| `balance-identity` | `errorsTotal` = sum of `errorsBySkill`; each `errorsBySkill` equals the matching skill's grade `=` count; `balance = pointsScored − errorsTotal`; players sum to team |
| `streaks-bounds` | Each streak length ≤ the points won (or lost) in its set; match-level streaks equal the best per-set value; `longestServingRun.length` equals the maximum of the players' values |
| `late-set-consistency` | In every `lateSet`: `sideOut.total + breakPoint.total = rallies.total`; the sum of the sets equals the match-level block; `rallies.total ≤ team.rallies.total` |

---

## 14. JSON Schema (core)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "VolleyLive Match Summary",
  "type": "object",
  "required": ["schemaVersion", "documentType", "generatedAt", "source", "season", "match", "result", "team", "bySet", "rotations", "players", "keyMoments", "calculationRules", "integrity"],
  "properties": {
    "schemaVersion": { "type": "string", "pattern": "^1\\.\\d+\\.\\d+$" },
    "documentType": { "const": "match-summary" },
    "generatedAt": { "type": "string" },
    "match": {
      "type": "object",
      "required": ["matchId", "date", "ourTeamId", "ourTeamName", "opponent", "setsPlayed", "rallies"],
      "properties": {
        "matchId": { "type": "string" },
        "date": { "type": "string" },
        "ourTeamId": { "type": "string" },
        "ourTeamName": { "type": "string" },
        "opponent": { "type": "object", "required": ["teamId", "name"] },
        "setsPlayed": { "type": "integer", "minimum": 1 },
        "rallies": { "type": "integer", "minimum": 1 }
      }
    },
    "team": { "$ref": "#/$defs/indicatorSet" },
    "keyMoments": { "type": "object", "required": ["parameters", "streaks", "lateSet", "bySet"] },
    "bySet": {
      "type": "array",
      "items": { "type": "object", "required": ["setNumber", "indicators"],
                 "properties": { "setNumber": { "type": "integer" }, "indicators": { "$ref": "#/$defs/indicatorSet" } } }
    },
    "players": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["playerId", "number", "name", "role", "appeared", "onCourt", "attackByRotation", "indicators"],
        "properties": {
          "playerId": { "type": "string" },
          "number": { "type": "integer" },
          "name": { "type": "string" },
          "role": { "enum": ["OH", "OPP", "MB", "SET", "LIB", null] },
          "appeared": { "type": "boolean" }
        }
      }
    }
  },
  "$defs": {
    "rate": {
      "type": "object",
      "required": ["numerator", "denominator", "value"],
      "properties": {
        "numerator": { "type": "number" },
        "denominator": { "type": "number", "minimum": 0 },
        "value": { "type": ["number", "null"] }
      }
    },
    "gradeCounts": {
      "type": "object",
      "required": ["#", "+", "!", "-", "/", "="],
      "additionalProperties": { "type": "integer", "minimum": 0 }
    },
    "indicatorSet": {
      "type": "object",
      "required": ["rallies", "sideOut", "breakPoint", "scoring", "serve", "reception", "attack", "block", "defense", "setting", "freeball", "score", "terminalActions", "balance"]
    }
  }
}
```

---

## 15. Acceptance criteria

1. The file contains **no indicator, player or rotation of the opponent**.
2. Every `Rate` has `numerator`, `denominator`, `value` (`null` when the denominator is 0).
3. All `integrity` checks pass, and figures equal those recomputed from the Match JSON.
4. HTML and PDF reports display only values read from this file.
5. `playerId` is identical for the same player across all matches of a season.
6. A file with an older minor `schemaVersion` is read without error.
7. Attack by phase and by rotation sum back to the team attack totals, for the team and for the players.
8. The players' serving break-point sums to the team break-point.
9. `errorsTotal`, `balance` and the streak values equal those recomputed from the Match JSON.
10. `keyMoments.parameters` are stored, so `runsFor`, `runsAgainst` and `lateSet` can be reproduced.
