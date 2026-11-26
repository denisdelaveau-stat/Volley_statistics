# Consolidated Season Report: Specification

**Document type:** `consolidated-report`
**Spec version:** 1.0.0
**Input:** Match Summary JSON files, `match-summary` schema **1.x** (see *Match Summary JSON: Generic Format Specification*, v1.2.0)
**Output:** one consolidated report (a JSON file, plus HTML and PDF rendered from it)
**Scope:** own team only: **team overall** and **every player**

---

## 1. Purpose

After each match, the user imports the latest Match Summary into the season library. The app then produces a **consolidated report** that tells the coach, for the team and for each player, which indicators are **improving**, **regressing** or **stable** over the last *N* matches, together with the overall figures of the window.

| Question answered | Where |
|---|---|
| What are our figures over the last N matches? | *Window value* of every metric (§7) |
| Is each indicator improving, regressing or stable? | *Trend* of every metric (§8) |
| What is the overall picture of the team / of a player? | *Overall verdict* (§9) |
| Where does it come from? | *Series* match by match (§7, §10) |

**Terminology.** "Overall" is used in two ways, both provided:
- **Window value**: the pooled figure over the N matches (for example, side-out rate over the last 5 matches).
- **Overall verdict**: one trend verdict for the team or a player, aggregated from its key metrics (§9).

**Out of scope (v1):** comparison with the previous window, opponent-adjusted trends, comparison between players of the same role, forecasts.

---

## 2. Principles

1. **Single source.** The consolidated JSON is the only source of the HTML and PDF report. The renderers do no calculation.
2. **Built only from Match Summaries.** No access to the Match JSON. Every figure derives from the numerators, denominators and counts stored in the summaries.
3. **Sum, then divide.** A pooled value is `Σ numerators / Σ denominators`. Values (`value`) are never averaged.
4. **Deterministic.** Same configuration + same set of summaries ⇒ same report (only `generatedAt` changes).
5. **No invented values.** A figure that cannot be computed is `null`, with a reason. A missing player match is **not** a zero.
6. **Honest about sample size.** Below the minimum sample, the trend is `INSUFFICIENT_DATA`; the window value is still shown.
7. **Own team only.** No opponent indicator. The opponent appears only as a label and as context.
8. **Configurable.** The number of matches and every threshold are parameters, stored in the report.

---

## 3. Import and season library

### 3.1 Storage

```
season/<seasonId>/summaries/<matchId>.summary.json     imported Match Summaries (read-only)
season/<seasonId>/season.json                           library index
season/<seasonId>/reports/consolidated_<date>_last<N>.json | .html | .pdf
```

`season.json` lists every imported summary:

```json
{
  "seasonId": "2026-2027",
  "ourTeamId": "team-own",
  "summaries": [
    {
      "matchId": "2026-11-14_vs_opponent",
      "file": "summaries/2026-11-14_vs_opponent.summary.json",
      "date": "2026-11-14",
      "sourceSha256": "…",
      "summaryGeneratedAt": "2026-11-14T22:10:00+01:00",
      "importedAt": "2026-11-15T08:02:11+01:00",
      "included": true
    }
  ]
}
```

### 3.2 Import flow

The user imports **one summary after each match** (file selection, drag and drop, or direct hand-over from the app when the match is closed). On a successful import the report is regenerated with the saved configuration.

| Step | Rule | On failure |
|---|---|---|
| 1. Type | `documentType = "match-summary"` | Reject. |
| 2. Version | `schemaVersion` has major version 1 | Reject. |
| 3. Team | `match.ourTeamId` equals the library `ourTeamId` (the first import fixes it) | Reject. |
| 4. Status | `match.lifecycleStatus = "COMPLETED"` | Reject. |
| 5. Season | `season.seasonId` equals the library `seasonId` | Warn; the user confirms or rejects. |
| 6. Integrity | `integrity.status = "PASS"` | Import, flag the match `INTEGRITY_WARNING` in the report. |
| 7. Duplicate | `matchId` already present | See §3.3. |

### 3.3 Duplicate `matchId`

| Case | Action |
|---|---|
| Same `source.sha256` | Ignore ("already imported"). |
| Different `source.sha256` and newer `generatedAt` | The match was corrected: ask the user, then **replace** the previous summary. |
| Different `source.sha256` and older `generatedAt` | Reject, keep the current summary. |

### 3.4 Chronological order

Matches are ordered by `match.date`, then `match.startLocalTime`, then import order. Importing an older match is allowed: it is inserted at its date. The **match index** shown in the report (1, 2, 3…) is the position **inside the window**, computed at generation time. It is not stored in the summaries.

---

## 4. Configuration

The configuration is saved with the season and copied into every report (`config`).

```json
{
  "window": { "mode": "LAST_N", "size": 5 },
  "filters": { "homeAway": null, "tags": [], "excludeMatchIds": [] },
  "trend": { "recentMatches": 3, "persistenceRatio": 0.6667, "thresholdOverrides": {}, "minSampleOverrides": {} },
  "overall": { "threshold": 0.4, "minKeyMetrics": 2, "keyMetricOverrides": {} },
  "players": { "minMatchesAppeared": 1, "includeNeverAppeared": false }
}
```

| Parameter | Default | Description |
|---|---|---|
| `window.mode` | `LAST_N` | `LAST_N`: the last N matches. `ALL`: every included match of the season. |
| `window.size` | 5 | N, integer ≥ 1. The user picks it in the report header (suggested choices: 3, 5, 8, 10, All, custom). |
| `filters.homeAway` | `null` | `HOME`, `AWAY`, `NEUTRAL` or `null`. Applied **before** the last N are taken. |
| `filters.tags` | `[]` | Keep only matches carrying **all** these tags. Applied before the last N are taken. |
| `filters.excludeMatchIds` | `[]` | Matches left out (for example a match with a shortened lineup). |
| `trend.recentMatches` | 3 | Size K of the *recent* period (§8.1). |
| `trend.persistenceRatio` | 0.6667 | Share of recent matches that must confirm the movement (§8.3). |
| `trend.thresholdOverrides` | `{}` | Map `metricId → threshold`, replaces the default of §6. |
| `trend.minSampleOverrides` | `{}` | Map `metricId → minimum sample`, replaces the default of §6. |
| `overall.threshold` | 0.4 | Net score needed for an overall verdict (§9). |
| `overall.minKeyMetrics` | 2 | Minimum key metrics with a trend for an overall verdict. |
| `overall.keyMetricOverrides` | `{}` | Map `role or "TEAM" → [{metricId, weight}]`. |
| `players.minMatchesAppeared` | 1 | A player is listed if they appeared in at least this many window matches. |
| `players.includeNeverAppeared` | `false` | List players with no appearance in the window. |

---

## 5. Window selection

1. Take all imported summaries with `included = true`, drop those matching `filters.excludeMatchIds`.
2. Apply `filters.homeAway` and `filters.tags`.
3. Order chronologically (§3.4).
4. `LAST_N`: keep the last `size`. `ALL`: keep everything.
5. `effectiveSize` = number of matches kept. If it is lower than the requested `size`, the report shows `WINDOW_SMALLER_THAN_REQUESTED`.

### 5.1 Reference and recent periods

Trends compare two periods **inside** the window.

| Quantity | Formula |
|---|---|
| `recentSize` (K) | `min(trend.recentMatches, floor(effectiveSize / 2))` |
| `referenceSize` | `effectiveSize − K` |
| Reference period | The first `referenceSize` matches of the window |
| Recent period | The last K matches of the window |

`trendsAvailable = effectiveSize ≥ 4` (K ≥ 2 and a reference of at least 2 matches). Otherwise every trend is `INSUFFICIENT_DATA`, and the window values and series are still produced.

| Window size N | K (default settings) | Reference |
|---|---|---|
| 4 | 2 | 2 |
| 5 | 2 | 3 |
| 6 and more | 3 | N − 3 |

---

## 6. Metric catalogue

Every metric reads **numerator and denominator** from the Match Summary, so pooling is exact. Paths are relative to the summary root. "Per player" metrics use `players[]` entries (see Match Summary §8).

- **Dir.** `↑`: higher is better. `↓`: lower is better. `○`: neutral (no value judgement: movement only).
- **Thr.**: stable band, in absolute units of the metric (ratio units: 0.04 = 4 percentage points; per-set units: points per set). A trend requires `|delta| ≥ Thr.`
- **Min**: minimum pooled **denominator** required in **each** period (reference and recent). Below it, the metric is `INSUFFICIENT_DATA`.

Thresholds and minimums are **initial defaults to calibrate on real data**; they are configurable (§4).

### 6.1 Team metrics (`team.*`)

| Metric id | Source path | Dir. | Thr. | Min |
|---|---|---|---|---|
| `rallies.winRate` | `team.rallies.winRate` | ↑ | 0.03 | 40 |
| `sideOut.rate` | `team.sideOut.rate` | ↑ | 0.04 | 30 |
| `breakPoint.rate` | `team.breakPoint.rate` | ↑ | 0.04 | 30 |
| `serve.aceRate` | `team.serve.aceRate` | ↑ | 0.02 | 30 |
| `serve.errorRate` | `team.serve.errorRate` | ↓ | 0.02 | 30 |
| `serve.pressureRate` | `team.serve.pressureRate` | ↑ | 0.05 | 30 |
| `serve.acesPerSet` | `team.serve.acesPerSet` | ↑ | 0.5 | 2 sets |
| `reception.perfectRate` | `team.reception.perfectRate` | ↑ | 0.05 | 30 |
| `reception.positiveRate` | `team.reception.positiveRate` | ↑ | 0.05 | 30 |
| `reception.errorRate` | `team.reception.errorRate` | ↓ | 0.02 | 30 |
| `reception.efficiency` | `team.reception.efficiency` | ↑ | 0.05 | 30 |
| `attack.killRate` | `team.attack.killRate` | ↑ | 0.04 | 30 |
| `attack.errorRate` | `team.attack.errorRateIncludingBlocked` | ↓ | 0.03 | 30 |
| `attack.efficiency` | `team.attack.efficiency` | ↑ | 0.04 | 30 |
| `attack.killsPerSet` | `team.attack.killsPerSet` | ↑ | 1.0 | 2 sets |
| `attack.sideOut.efficiency` | `team.attack.byPhase.sideOut.efficiency` | ↑ | 0.05 | 20 |
| `attack.transition.efficiency` | `team.attack.byPhase.transition.efficiency` | ↑ | 0.05 | 20 |
| `attack.sideOut.share` | `team.attack.byPhase.sideOut.attemptShareOfAttacks` | ○ | 0.05 | 30 |
| `block.pointsPerSet` | `team.block.pointsPerSet` | ↑ | 0.5 | 2 sets |
| `defense.positiveRate` | `team.defense.positiveRate` | ↑ | 0.05 | 20 |
| `defense.errorRate` | `team.defense.errorRate` | ↓ | 0.03 | 20 |
| `setting.positiveRate` | `team.setting.positiveRate` | ↑ | 0.05 | 30 |
| `scoring.skillPointsPerSet` | `team.scoring.scoringSkillPointsPerSet` | ↑ | 1.0 | 2 sets |
| `scoring.skillShare` | `team.scoring.shareOfTeamPointsFromScoringSkills` | ○ | 0.03 | 40 |
| `balance.perSet` | `team.balance.balancePerSet` | ↑ | 1.0 | 2 sets |
| `errors.directRate` | `team.terminalActions.directErrorRateAmongLostRallies` | ↓ | 0.04 | 20 |
| `score.pointsPerSet` | `team.score.pointsPerSet` | ↑ | 1.0 | 2 sets |
| `score.pointsAgainstPerSet` | `team.score.pointsAgainstPerSet` | ↓ | 1.0 | 2 sets |
| `lateSet.winRate` | `keyMoments.lateSet.rallies.winRate` | ↑ | 0.05 | 30 |

For "per set" metrics the denominator is the number of sets, so *Min* is a number of sets pooled in the period.

Metrics that come from Match Summary 1.2.0 blocks (`attack.byPhase`, `balance`, `keyMoments`) are computed only on the window matches that contain the block. See §11.

### 6.2 Rotation metrics (`rotations[]`, P1 to P6)

Computed for **each rotation** with the same algorithm. A rotation holds fewer rallies than the whole match, so thresholds are wider.

| Metric id | Source path (per rotation) | Dir. | Thr. | Min |
|---|---|---|---|---|
| `rotation.winRate` | `rotations[].rallies.winRate` | ↑ | 0.08 | 30 |
| `rotation.sideOut.rate` | `rotations[].sideOut.rate` | ↑ | 0.08 | 20 |
| `rotation.breakPoint.rate` | `rotations[].breakPoint.rate` | ↑ | 0.08 | 20 |
| `rotation.attack.efficiency` | `rotations[].attack.efficiency` | ↑ | 0.08 | 20 |
| `rotation.attack.share` | `rotations[].attack.attemptShareOfTeam` | ○ | 0.04 | 30 |

### 6.3 Player metrics (`players[].indicators.*`)

Computed on each player's own actions. Only matches where the player has `appeared = true` and a non-zero denominator contribute.

| Metric id | Source path | Dir. | Thr. | Min |
|---|---|---|---|---|
| `attack.efficiency` | `attack.efficiency` | ↑ | 0.05 | 15 |
| `attack.killRate` | `attack.killRate` | ↑ | 0.05 | 15 |
| `attack.errorRate` | `attack.errorRateIncludingBlocked` | ↓ | 0.04 | 15 |
| `attack.share` | `attack.attemptShare` | ○ | 0.03 | 30 (team attempts) |
| `attack.sideOut.efficiency` | `attack.byPhase.sideOut.efficiency` | ↑ | 0.08 | 10 |
| `attack.transition.efficiency` | `attack.byPhase.transition.efficiency` | ↑ | 0.08 | 10 |
| `reception.positiveRate` | `reception.positiveRate` | ↑ | 0.06 | 15 |
| `reception.perfectRate` | `reception.perfectRate` | ↑ | 0.06 | 15 |
| `reception.errorRate` | `reception.errorRate` | ↓ | 0.03 | 15 |
| `reception.efficiency` | `reception.efficiency` | ↑ | 0.06 | 15 |
| `serve.aceRate` | `serve.aceRate` | ↑ | 0.03 | 10 |
| `serve.errorRate` | `serve.errorRate` | ↓ | 0.04 | 10 |
| `serve.pressureRate` | `serve.pressureRate` | ↑ | 0.06 | 10 |
| `serve.breakPoint.rate` | `serve.breakPoint.rate` | ↑ | 0.06 | 15 |
| `block.pointsPerSet` | `block.pointsPerSet` | ↑ | 0.3 | 2 sets |
| `defense.positiveRate` | `defense.positiveRate` | ↑ | 0.06 | 10 |
| `defense.errorRate` | `defense.errorRate` | ↓ | 0.04 | 10 |
| `setting.positiveRate` | `setting.positiveRate` | ↑ | 0.06 | 20 |
| `scoring.share` | `scoring.shareOfTeamScoringSkillPoints` | ○ | 0.03 | 30 (team points) |
| `balance.perSet` | `balance.balancePerSet` | ↑ | 0.5 | 2 sets |
| `onCourt.winRate` | `onCourt.rallies.winRate` | ↑ | 0.06 | 40 |

Notes:
- Player per-set metrics use the **team's** sets as denominator (Match Summary §8.1). A substitute with few sets on court may be `INSUFFICIENT_DATA`.
- `onCourt.winRate` depends on the lineup around the player. It is shown for information and is **not** a key metric of the overall verdict.
- `attack.byPhase`, `serve.breakPoint`, `balance` and `onCourt` exist only in Match Summary 1.2.0 (and `onCourt` only if the source had per-rally lineups).
- Attack by rotation per player (`attackByRotation`) is reported as **window values only** (§10.3), with no trend: the sample per player and rotation is too small.

---

## 7. Computation of a metric

For each metric and each entity (team, rotation, player), let `m` be the window matches, in order, and `(nᵢ, dᵢ)` the numerator and denominator read from match `i`.

### 7.1 Series

For each window match, one point: `{ matchIndex, matchId, numerator, denominator, value }`.
- `value = nᵢ / dᵢ` rounded to 6 decimals, or `null` if `dᵢ = 0`.
- A match where the entity did not appear, or where the block does not exist in that summary, gets `numerator: null, denominator: null, value: null`.

### 7.2 Pooled values

| Value | Definition |
|---|---|
| **Window** | `Σ nᵢ / Σ dᵢ` over all window matches |
| **Reference** | `Σ nᵢ / Σ dᵢ` over the reference period |
| **Recent** | `Σ nᵢ / Σ dᵢ` over the recent period |

Each pooled value is stored as `{ numerator, denominator, value, matches }`, where `matches` lists the match indexes that contributed. `value` is `null` if the pooled denominator is 0.

---

## 8. Trend algorithm

### 8.1 Statuses

| Field | Values | Meaning |
|---|---|---|
| `trend` | `IMPROVING`, `REGRESSING`, `STABLE`, `INSUFFICIENT_DATA` | Verdict on the metric. `null` for neutral (`○`) metrics. |
| `movement` | `UP`, `DOWN`, `FLAT`, `null` | Raw direction of the change, independent of whether it is good. `null` when `INSUFFICIENT_DATA`. |
| `flags` | list | `VOLATILE` (§8.3), `PARTIAL_COVERAGE` (§11). |

The trend labels shown to the coach are **Improving**, **Regressing** and **Stable** (constant).

### 8.2 Steps

1. If `trendsAvailable` is false: `INSUFFICIENT_DATA`.
2. Compute the reference and recent pooled values (§7.2).
3. **Minimum sample.** If the pooled denominator of the reference **or** of the recent period is below *Min*, or either value is `null`: `INSUFFICIENT_DATA`.
4. `delta = recent.value − reference.value` (kept to 6 decimals; the comparison below uses the unrounded value).
5. **Stable band.** If `|delta| < Thr.`: `trend = STABLE`, `movement = FLAT`.
6. Otherwise `movement = UP` if `delta > 0`, `DOWN` if `delta < 0`, then run the persistence test (§8.3).
   - **Persistence passed:** for a `↑` metric, `UP` is `IMPROVING` and `DOWN` is `REGRESSING`. For a `↓` metric it is the opposite. For a `○` metric, `trend` stays `null` and only `movement` is reported.
   - **Persistence failed:** `trend = STABLE` with the flag `VOLATILE`; `movement` is kept (`UP` or `DOWN`).

At exactly `|delta| = Thr.` the trend is considered established.

### 8.3 Persistence test

Avoid declaring a trend because one match was exceptional.

- Let `R` = reference pooled value, and take the recent matches that have a non-null series value. Let `v` be their count.
- If `v < 2`: persistence cannot be verified, so it **fails**.
- Required confirmations: `ceil(persistenceRatio × v)` (default ratio 0.6667: 2 of 2, 2 of 3, 3 of 4, 4 of 5).
- A recent match **confirms** the movement when its value is strictly on the same side of `R` as `delta` (above `R` for `UP`, below `R` for `DOWN`).
- The test passes if the number of confirmations reaches the required count.

Result stored in `persistence`: `{ "required": 2, "observed": 2, "of": 2 }`.

### 8.4 Confidence (informational)

For **proportion-type** metrics (ratios of events, such as side-out rate or ace rate), a confidence level is computed. It never changes the trend.

```
p₁, n₁ = reference value, reference denominator
p₂, n₂ = recent value, recent denominator
se = sqrt( p₁(1−p₁)/n₁ + p₂(1−p₂)/n₂ )
z  = delta / se
```

| `level` | Condition |
|---|---|
| `HIGH` | `|z| ≥ 1.96` |
| `MEDIUM` | `1.28 ≤ |z| < 1.96` |
| `LOW` | `|z| < 1.28` |

Stored as `{ "z": 1.601, "level": "MEDIUM" }`. For efficiency, per-set, balance and neutral metrics, `confidence` is `null` in v1. The report shows the level as an icon or a small tag, never as a probability.

---

## 9. Overall verdict (team, and each player)

One verdict per entity, built from its **key metrics**.

### 9.1 Key metrics

Default key metrics and weights (all configurable through `overall.keyMetricOverrides`):

| Entity | Key metrics (weight) |
|---|---|
| **TEAM** | `rallies.winRate` (2), `sideOut.rate` (2), `breakPoint.rate` (2), `attack.efficiency` (2), `reception.positiveRate` (1), `serve.pressureRate` (1), `serve.errorRate` (1), `block.pointsPerSet` (1), `balance.perSet` (1) |
| **OH** | `attack.efficiency`, `reception.positiveRate`, `serve.errorRate`, `balance.perSet` (1 each) |
| **OPP** | `attack.efficiency`, `serve.pressureRate`, `serve.errorRate`, `balance.perSet` (1 each) |
| **MB** | `attack.efficiency`, `block.pointsPerSet`, `serve.errorRate`, `balance.perSet` (1 each) |
| **SET** | `setting.positiveRate`, `serve.errorRate`, `block.pointsPerSet`, `balance.perSet` (1 each) |
| **LIB** | `reception.positiveRate`, `defense.positiveRate`, `reception.errorRate` (1 each) |
| Unknown role | `attack.efficiency`, `reception.positiveRate`, `serve.errorRate`, `balance.perSet` (1 each) |

The player role is the `role` of the **most recent** window match in which the player appeared. If the role differs between matches, the player gets the flag `ROLE_CHANGED`.

### 9.2 Net score

Take the key metrics whose `trend` is `IMPROVING`, `STABLE` or `REGRESSING` (`INSUFFICIENT_DATA` ones are left out).

```
sᵢ = +1 (IMPROVING), 0 (STABLE), −1 (REGRESSING)
S  = Σ wᵢ · sᵢ        W = Σ wᵢ        R = S / W
```

| Condition | `overall.trend` |
|---|---|
| Fewer than `minKeyMetrics` valid key metrics | `INSUFFICIENT_DATA` |
| `R ≥ +overall.threshold` | `IMPROVING` |
| `R ≤ −overall.threshold` | `REGRESSING` |
| Otherwise | `STABLE` |

`overall.flags` contains `MIXED` when at least one key metric improves **and** at least one regresses.

The overall block also stores `breakdown` (counts of improving, stable, regressing and insufficient key metrics over **all** the entity's metrics, not only the key ones), `netScore` (R, 6 decimals) and `keyMetrics` (ids and statuses used).

---

## 10. Consolidated JSON

**File:** `season/<seasonId>/reports/consolidated_<date>_last<N>.json`

### 10.1 Top-level structure

```json
{
  "schemaVersion": "1.0.0",
  "documentType": "consolidated-report",
  "generatedAt": "2026-11-26T12:30:00+01:00",
  "source": {},
  "config": {},
  "window": {},
  "team": {},
  "rotations": [],
  "players": [],
  "highlights": {},
  "dataQuality": {},
  "calculationRules": {}
}
```

| Key | Content |
|---|---|
| `source` | `seasonId`, `ourTeamId`, `ourTeamName`, `summarySchemaVersions` (versions found in the window), `summariesInLibrary`. |
| `config` | Full configuration used (§4). |
| `window` | Window description and match list (§10.2). |
| `team` | `{ overall, metrics[] }` (§10.4). |
| `rotations` | One entry per rotation: `{ rotation, metrics[] }`. Empty array if rotations are unavailable. |
| `players` | One entry per listed player (§10.3). |
| `highlights` | The strongest movements (§10.5). |
| `dataQuality` | Warnings and integrity flags (§12). |
| `calculationRules` | Embedded definitions: pooling, periods, trend steps, persistence, confidence, overall verdict. |

### 10.2 `window`

```json
"window": {
  "mode": "LAST_N",
  "requestedSize": 5,
  "effectiveSize": 5,
  "recentSize": 2,
  "referenceSize": 3,
  "trendsAvailable": true,
  "from": "2026-10-24",
  "to": "2026-11-14",
  "matches": [
    {
      "matchIndex": 1, "matchId": "2026-10-24_vs_a", "date": "2026-10-24",
      "opponent": "Opponent A", "homeAway": "HOME",
      "outcome": "WIN", "setsFor": 3, "setsAgainst": 0,
      "period": "REFERENCE", "summaryGeneratedAt": "2026-10-24T21:40:00+02:00",
      "integrityStatus": "PASS"
    }
  ]
}
```

`period` is `REFERENCE` or `RECENT`. The result is expressed from the own team's point of view.

### 10.3 `players[]`

```json
{
  "playerId": "player-0007",
  "number": 7,
  "name": "Firstname LASTNAME",
  "role": "OH",
  "flags": [],
  "matchesAppeared": 5,
  "appearedInMatchIndexes": [1, 2, 3, 4, 5],
  "overall": {},
  "metrics": [],
  "attackByRotationWindow": []
}
```

`attackByRotationWindow` has one entry per rotation, with pooled **window** values only:
`{ "rotation": "P1", "attempts", "kills", "efficiency": Rate, "attemptShareInRotation": Rate }`, or `null` rates when there is no attack. It is shown as information; no trend is computed.

### 10.4 `MetricResult` (team, rotation and player metrics)

```json
{
  "metricId": "sideOut.rate",
  "label": "Side-out %",
  "unit": "RATIO",
  "direction": "HIGHER_IS_BETTER",
  "threshold": 0.04,
  "minSample": 30,
  "window":    { "numerator": 229, "denominator": 380, "value": 0.602632, "matches": [1, 2, 3, 4, 5] },
  "reference": { "numerator": 130, "denominator": 228, "value": 0.570175, "matches": [1, 2, 3] },
  "recent":    { "numerator": 99,  "denominator": 152, "value": 0.651316, "matches": [4, 5] },
  "delta": 0.08114,
  "movement": "UP",
  "trend": "IMPROVING",
  "flags": [],
  "persistence": { "required": 2, "observed": 2, "of": 2 },
  "confidence": { "z": 1.601, "level": "MEDIUM" },
  "series": [
    { "matchIndex": 1, "matchId": "2026-10-24_vs_a", "numerator": 44, "denominator": 76, "value": 0.578947 },
    { "matchIndex": 2, "matchId": "2026-10-31_vs_b", "numerator": 41, "denominator": 74, "value": 0.554054 },
    { "matchIndex": 3, "matchId": "2026-11-07_vs_c", "numerator": 45, "denominator": 78, "value": 0.576923 },
    { "matchIndex": 4, "matchId": "2026-11-10_vs_d", "numerator": 50, "denominator": 77, "value": 0.649351 },
    { "matchIndex": 5, "matchId": "2026-11-14_vs_e", "numerator": 49, "denominator": 75, "value": 0.653333 }
  ]
}
```

`unit` is `RATIO` or `PER_SET`. `direction` is `HIGHER_IS_BETTER`, `LOWER_IS_BETTER` or `NEUTRAL`. When the trend is `INSUFFICIENT_DATA`, `delta`, `movement`, `persistence` and `confidence` are `null` and a `reason` is added (`WINDOW_TOO_SMALL`, `REFERENCE_SAMPLE_TOO_SMALL`, `RECENT_SAMPLE_TOO_SMALL`, `NOT_AVAILABLE_IN_SUMMARIES`).

Player example (illustrative values), attack efficiency of one player over the same window. The numerator is signed: kills − errors − blocked.

```json
{
  "metricId": "attack.efficiency",
  "label": "Attack efficiency",
  "unit": "RATIO",
  "direction": "HIGHER_IS_BETTER",
  "threshold": 0.05,
  "minSample": 15,
  "window":    { "numerator": 32, "denominator": 95, "value": 0.336842, "matches": [1, 2, 3, 4, 5] },
  "reference": { "numerator": 15, "denominator": 57, "value": 0.263158, "matches": [1, 2, 3] },
  "recent":    { "numerator": 17, "denominator": 38, "value": 0.447368, "matches": [4, 5] },
  "delta": 0.184211,
  "movement": "UP",
  "trend": "IMPROVING",
  "flags": [],
  "persistence": { "required": 2, "observed": 2, "of": 2 },
  "confidence": null,
  "series": [
    { "matchIndex": 1, "matchId": "2026-10-24_vs_a", "numerator": 6, "denominator": 20, "value": 0.3 },
    { "matchIndex": 2, "matchId": "2026-10-31_vs_b", "numerator": 4, "denominator": 18, "value": 0.222222 },
    { "matchIndex": 3, "matchId": "2026-11-07_vs_c", "numerator": 5, "denominator": 19, "value": 0.263158 },
    { "matchIndex": 4, "matchId": "2026-11-10_vs_d", "numerator": 9, "denominator": 21, "value": 0.428571 },
    { "matchIndex": 5, "matchId": "2026-11-14_vs_e", "numerator": 8, "denominator": 17, "value": 0.470588 }
  ]
}
```

### 10.5 `overall` and `highlights`

```json
"overall": {
  "trend": "IMPROVING",
  "netScore": 0.555556,
  "flags": [],
  "breakdown": { "improving": 7, "stable": 12, "regressing": 1, "insufficient": 5 },
  "keyMetrics": [
    { "metricId": "sideOut.rate", "weight": 2, "trend": "IMPROVING" },
    { "metricId": "breakPoint.rate", "weight": 2, "trend": "STABLE" }
  ]
}
```

(Illustrative values. `keyMetrics` is truncated in this example; a real file lists every key metric used.)

`highlights` lists the largest confirmed movements, so the coach sees them first:

```json
"highlights": {
  "team":    { "improving": ["sideOut.rate"], "regressing": [] },
  "players": { "improving": [{ "playerId": "player-0007", "metricId": "attack.efficiency" }], "regressing": [] }
}
```

- At most **5** items per list. They are ordered by `|delta| / threshold`, descending.
- Only metrics with `trend = IMPROVING` or `REGRESSING` can appear (neutral and `INSUFFICIENT_DATA` metrics are excluded).
- `highlights` is an index of movements; it does not rank players against each other.

---

## 11. Rules for missing data and schema versions

| Situation | Rule |
|---|---|
| Summary in a lower minor version (for example 1.1.x) lacks a block (`attack.byPhase`, `balance`, `keyMoments`, `serve.breakPoint`, `attackByRotation`, `rotations[].attack`) | The match is skipped **for that metric only** (series point `null`). The metric gets the flag `PARTIAL_COVERAGE` if some, but not all, window matches have it. |
| A metric is missing from **every** match of a period | `INSUFFICIENT_DATA`, reason `NOT_AVAILABLE_IN_SUMMARIES`. |
| `onCourt.available = false` or `rotations` empty in a match | Same rule: skipped for that metric. |
| Unknown fields in a summary | Ignored. |
| Player absent from a match (`appeared = false`, or not in the file) | Series point `null`; the match does not count in pooled values. |
| Player who joins the roster mid-season | `appearedInMatchIndexes` records it; the trend needs the minimum sample in **both** periods. |
| Same player with different `playerId` across matches | Treated as different players. The Match Summary spec requires `playerId` to be stable across the season; the import reports duplicate names with different ids in `dataQuality`. |
| Match flagged `INTEGRITY_WARNING` | Used, and listed in `dataQuality`. |

---

## 12. `dataQuality`

```json
"dataQuality": {
  "status": "OK",
  "warnings": [],
  "matches": [ { "matchId": "2026-11-14_vs_e", "integrityStatus": "PASS", "limitations": [] } ]
}
```

| Warning code | Trigger |
|---|---|
| `WINDOW_SMALLER_THAN_REQUESTED` | `effectiveSize < requestedSize` |
| `TRENDS_UNAVAILABLE` | `effectiveSize < 4` |
| `MIXED_SCHEMA_VERSIONS` | The window has several `schemaVersion` values |
| `INTEGRITY_WARNING` | A window summary has `integrity.status ≠ PASS` |
| `ROTATIONS_UNAVAILABLE` | No window match has rotations |
| `PLAYER_ID_CONFLICT` | One name with several `playerId` values |
| `SEASON_MISMATCH` | A window match has a different `seasonId` (accepted after user confirmation) |

`status` is `OK` without warnings, `WARNINGS` otherwise.

---

## 13. Report layout (HTML and PDF)

The HTML report follows the **Coach View** theme. The PDF is rendered from the same JSON with the same content and colours. Every value is read from the consolidated JSON.

### 13.1 Visual encoding

| Status | Symbol | Colour | Label |
|---|---|---|---|
| `IMPROVING` | ▲ | Green | Improving |
| `REGRESSING` | ▼ | Red | Regressing |
| `STABLE` | ► | Neutral grey | Stable |
| `STABLE` + `VOLATILE` | ► with a wave marker | Neutral grey | Stable (volatile) |
| `INSUFFICIENT_DATA` | — | Dim grey | Not enough data |
| Neutral metric, `UP` / `DOWN` | ↗ / ↘ | Blue | Up / Down (no judgement) |

The trend is always shown with **symbol + text** and never by colour alone. The ▲/▼ shows the *verdict* (a drop in an error rate is ▲ Improving), while the arithmetic delta is shown with its own sign.

### 13.2 Number formatting

| Type | Display |
|---|---|
| Ratio (`RATIO`) | Percentage with 1 decimal, for example `60.3%` |
| Efficiency | Percentage with 1 decimal, may be negative |
| `PER_SET` | 2 decimals, for example `11.50` |
| Delta of a ratio | Percentage points with sign, for example `+8.1 pts` |
| Delta of a `PER_SET` | Signed value, for example `+0.75` |
| `null` | `—` |

### 13.3 Header and controls

- Team name, season, window (`from` to `to`), number of matches included.
- **Number of matches (N)** selector: 3, 5, 8, 10, All, custom.
- **Recent period (K)** selector (default 3).
- Filter: All / Home / Away.
- Buttons: **Import latest summary**, **Regenerate**, **Export HTML**, **Export PDF**.
- A banner with `dataQuality` warnings when present.
- A match strip: one chip per window match (index, date, opponent, W/L score), coloured `REFERENCE` or `RECENT`.

### 13.4 Sections

| # | Section | Content |
|---|---|---|
| 1 | **Team overview** | Overall verdict (symbol, label, net score, breakdown counts), then the key metrics as cards: window value, delta, trend, sparkline. |
| 2 | **Team indicators** | Tables by skill: Side-out / Break-point, Serve, Reception, Attack (incl. by phase), Block and Defense, Setting, Errors and balance, Late sets. One row per metric. |
| 3 | **Rotations** | Heatmap rotation × match for win rate, side-out, break-point and attack efficiency; trend column per rotation. |
| 4 | **Players summary** | One row per player: number, name, role, matches played, overall verdict, key metric trends (small symbols). |
| 5 | **Player cards** | One card per player: overall verdict, metric table, sparklines, attack by rotation (window values), serving break-point, flags. |
| 6 | **Highlights** | Top improving and regressing movements, team and players (§10.5). |
| 7 | **Method and data quality** | Window, periods, thresholds in use, warnings. |

**Metric row (all tables):** label · window value · reference value · recent value · delta · trend (symbol + label) · confidence tag · sparkline (x-axis: match index in the window; points without value are gaps, not zeros; hover or tap shows the match, opponent and value).

**Sorting inside the Players summary:** by shirt number by default; the coach can sort by role. No automatic ranking between players.

### 13.5 Empty and partial states

- `INSUFFICIENT_DATA` rows stay visible, show the window value and a short reason ("Reference sample too small: 9 of 15 attacks").
- If `trendsAvailable` is false: the verdicts are replaced by "Not enough matches (4 needed)", and window values and sparklines are still displayed.
- A player with no appearance in the window is hidden unless `players.includeNeverAppeared`.

---

## 14. Generation triggers

The report is regenerated when: a summary is imported or replaced, the configuration changes (N, K, filters, thresholds), a match is excluded or re-included, or the user clicks **Regenerate**. Previous reports are kept (file name carries the date and N).

---

## 15. Integrity checks of the consolidated report

The generator runs these checks and stores them in `dataQuality`.

| Check | Rule |
|---|---|
| `window-matches` | `window.matches` count = `effectiveSize`; periods sizes = `referenceSize` and `recentSize`. |
| `pooling` | `window` numerator and denominator = `reference` + `recent` (for metrics with full coverage). |
| `series-sum` | The sum of series numerators and denominators equals the window pooled values. |
| `rate-recompute` | Every `value = round(numerator / denominator, 6)`, or `null` if the denominator is 0. |
| `trend-consistency` | Each `trend` is reproducible from `delta`, `threshold`, `persistence` and `direction`. |
| `overall-consistency` | `netScore` is reproducible from `keyMetrics`. |
| `no-opponent-data` | The file contains no opponent indicator. |
| `team-consistency` | All window summaries share `ourTeamId`. |

---

## 16. Acceptance criteria

1. Importing one summary after a match updates the report without a manual calculation.
2. Changing N from 5 to 8 regenerates the report with 8 matches (or all available) and adjusts K as defined in §5.1.
3. Every metric of the team, of each rotation and of each listed player has a window value, a series and a status (`IMPROVING`, `REGRESSING`, `STABLE` or `INSUFFICIENT_DATA`; `null` for neutral metrics).
4. Window values equal `Σ numerators / Σ denominators` computed directly from the imported summaries.
5. A player absent from a match shows a gap in the series, never a zero.
6. A metric below its minimum sample is not given a trend.
7. A one-match spike that fails the persistence test yields `STABLE` with the flag `VOLATILE`.
8. The team and each player have an overall verdict, reproducible from the key metrics.
9. The HTML and PDF contain only values read from the consolidated JSON.
10. A window that mixes summaries 1.1.x and 1.2.x produces `PARTIAL_COVERAGE` flags and a `MIXED_SCHEMA_VERSIONS` warning, with no error.
11. Re-importing the same summary leaves the report unchanged; importing a corrected match replaces the previous one.
12. The consolidated JSON contains no opponent indicator.

---

## 17. Open points

| # | Point | Proposal |
|---|---|---|
| 1 | Thresholds and minimum samples are initial values. | Calibrate on one full season of real summaries, then fix the defaults. |
| 2 | Opponent strength can explain a dip. | v1 shows the opponent and `homeAway` in the series. A later version could adjust for opponent level. |
| 3 | Confidence for efficiency metrics. | A later version can compute the variance from the grade counts stored in the summaries. |
| 4 | Comparison with the previous window of N matches. | Candidate for v1.1. |
| 5 | Comparison between players of the same role. | Candidate for a later version; the role is already stored. |
