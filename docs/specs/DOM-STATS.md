# DOM-STATS — Statistics and indicators

| Field | Value |
|---|---|
| Spec ID | `DOM-STATS` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-27 |
| Source of truth | `js/coach-core.js` (`metrics`, `status`, `pct`), `js/coach-live.js` (`livePlayerStats`, `skillEfficiency`), `coach-live-config.js`, `js/spectator-live-score.js` (`computeMomentum`), `spectator-live-config.js`, `js/spectator-ranking.js`, `js/spectator-core.js` (rally model), `js/index-match-rules.js` (`VolleyStats`) |
| Related specs | DOM-MATCH, DOM-ROTATION, UI-COACH, UI-COACH-ROTATIONS, UI-COACH-PLAYERS, UI-COACH-LIVE, UI-SPECTATOR-SCORE, UI-SPECTATOR-GRAPH, UI-SPECTATOR-RANKING, UI-REPORTS |

## 1. Purpose

Defines every indicator shown by the application: its formula, its sample and when it is not available. Screens show
these values; they never compute an indicator of their own.

## 2. Scope

- In scope: team indicators (side-out, break point, attack, reception, serve, block), player indicators and Live
  Court statuses, momentum, rally classification, faults, ranking.
- Out of scope: how and where values are displayed (UI specs).

## 3. Definitions

- Rally phase: `receive` when the opponent served the rally, `serve` when our team served it (DOM-ROTATION).
- Own event: an action by one of our players (not `A` / opponent).
- Outcome of an action: `positive` (point, kill, ace…), `neutral` (continue, playable…) or `negative` (error,
  fault, blocked…), from `coach-live-config.js` `outcome`.
- NA: not available, shown when the sample is empty. A percentage is never computed on zero actions.

## 4. Requirements

### 4.1 Team indicators (Coach View)

| ID | Requirement | Source |
|---|---|---|
| `DOM-STATS-01` | Side-out % = rallies won among rallies in phase `receive` × 100, rounded. | Coach View |
| `DOM-STATS-02` | Break point % = rallies won among rallies in phase `serve` × 100, rounded. | Coach View |
| `DOM-STATS-03` | Attack efficiency % = (attack points − attack errors) / attacks × 100, rounded; it may be negative. | Coach View |
| `DOM-STATS-04` | Positive reception % = receptions not in error / receptions × 100, rounded. | Coach View |
| `DOM-STATS-05` | Serve: aces and serve errors out of serves; block: block points and block touches (not in error) out of blocks. | Coach View |
| `DOM-STATS-06` | A percentage is NA when its sample is empty (`pct(n, 0) = null`). | Product rule |
| `DOM-STATS-07` | Indicator status: neutral below 3 actions; otherwise side-out and reception ≥ 60 strong, ≥ 45 watch, else critical; break point ≥ 40 strong, ≥ 25 watch; attack ≥ 35 strong, ≥ 15 watch. | Coach thresholds |
| `DOM-STATS-08` | The period filter selects the rallies of the current set, of the whole match, or the last 10 rallies. | Coach View |

### 4.2 Player indicators and Live Court status

| ID | Requirement | Source |
|---|---|---|
| `DOM-STATS-09` | A player's main skill is set for a setter, reception (or defense if no reception) for a libero, attack otherwise. | Live Court |
| `DOM-STATS-10` | Skill efficiency: attack and block = (positive − negative) / actions × 100 (block only with intermediate contacts); reception and defense = actions not negative / actions × 100 (shown "≈", derived). | Live Court |
| `DOM-STATS-11` | Player points = positive attacks, blocks and serves; player errors = negative actions. | Live Court |
| `DOM-STATS-12` | Status (from `coach-live-config.js`, with at least 3 main-skill actions): difficulty when 3 errors in a row, efficiency < 15 after 6 attempts, 4 errors with efficiency < 25, or a drop of 30 points over the last 5 actions; watch when 2 errors in a row, efficiency < 30 after 5 attempts, reception ≥ 40 % negative over the last 5, or a drop of 15; otherwise good. Two positive actions in a row with a rolling efficiency ≥ 30 bring the status back to good. | Live Court thresholds |
| `DOM-STATS-13` | Trend: up or down when the efficiency of the last 5 actions differs by at least 10 from the 5 before; stable otherwise. | Live Court |
| `DOM-STATS-14` | Alert text, first match wins: N errors in a row (N ≥ 3), N setting errors, reception unstable, attack efficiency N %, 2 serve errors. | Live Court |

### 4.3 Spectator indicators

| ID | Requirement | Source |
|---|---|---|
| `DOM-STATS-15` | A rally is classified SIDE_OUT when won by the receiving team and BREAK_POINT when won by the serving team. | Spectator |
| `DOM-STATS-16` | Score delta of a rally = HOME score − AWAY score after it. | Spectator graph |
| `DOM-STATS-17` | A fault is an action in error; it counts for the team of the player who made it. Cumulative faults and fault delta (HOME − AWAY) are counted rally after rally. | Spectator graph |
| `DOM-STATS-18` | Momentum over the last 8 points of the set (at least 4): share of points won by each team; a team leads when it won at least 70 % of them, otherwise balanced. The current streak is the number of consecutive points won by the last scorer. | `spectator-live-config.js` |
| `DOM-STATS-19` | Ranking per category (attack, block, defence, reception, service) and per player: points, errors, total and delta = points − errors. Highlight sorts by points, Lowlight by errors, Delta by delta, ties broken by the other counts, then total actions, then first appearance. | Spectator ranking |

### 4.4 Report statistics

| ID | Requirement | Source |
|---|---|---|
| `DOM-STATS-20` | The HTML report counts, per player and per action, points, errors and neutral actions (P / F / N) and the team totals; the attacker cards (OH, MB, OPP) give points, errors, neutral and points − errors per action type. | `VolleyStats` |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| No action for an indicator | NA, never 0 % (`DOM-STATS-06`). |
| Fewer than 3 actions | Status neutral (Coach) or good (Live Court), no colour alarm. |
| Momentum with fewer than 4 points | "Momentum available after 4 points"; percentages NA. |
| Capture v1 without intermediate contacts | Block efficiency and curves NA (Live Court). |

## 6. Data

Reads the events (`action`, `result`, `player`, `winningTeam`) and the rally model rebuilt by DOM-ROTATION (phase,
winner). Thresholds are configuration, not match data: `coach-live-config.js`, `spectator-live-config.js`.

## 7. Interface

| Module | Function |
|---|---|
| `js/coach-core.js` (`VolleyCoachParts`) | `metrics(rallies, events)`, `status(kind, value, sample)`, `pct(n, d)`, `pctText(n, d)` |
| `js/coach-live.js` | `livePlayerStats(player, events, rallies)`, `skillEfficiency(skill, events)` |
| `js/spectator-live-score.js` | `computeMomentum(points, set, config)` |
| `js/spectator-ranking.js` | `rankingRows(source, category, mode)` |
| `js/index-match-rules.js` | `VolleyStats.byAction`, `attackers`, `series`, `cards` |

## 8. Accessibility and language

Not applicable (rules only). Texts: `coach.*`, `spectator.*`, `stats.*` keys (SYS-I18N).

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `DOM-STATS-01` to `-08` | `tests/coach/test_coach_views.py::test_coach_navigation_live_data_and_player_detail`; `tests/coach/test_empty_state.py` (NA states) |
| `DOM-STATS-09` to `-14` | `tests/coach/test_live_court.py::test_good_watch_difficulty_and_alert_strips`, `::test_v2_fixture_derived_pos_good_trend_last_five_and_curves`, `::test_capture_v1_without_intermediate_contacts_uses_na_curves` |
| `DOM-STATS-15` to `-17` | `tests/spectator/test_score_fault_evolution.py::test_unit_deltas_classification_fault_cumulation_and_shared_rally_keys`, `::test_multiple_faults_in_one_rally_follow_shared_official_rule` |
| `DOM-STATS-18` | `tests/spectator/test_live_score_momentum.py` |
| `DOM-STATS-19` | `tests/spectator/test_ranking.py` |
| `DOM-STATS-20` | `tests/capture/test_capture_regressions.py::test_set_end_lock_undo_next_set_and_exports` (report content); attacker cards: manual (Match Reports → Export HTML report, section "Attaquants") |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version; replaces the metric definitions spread over `docs/VolleyLive_Statistics_Implementation_Specification.md`, `docs/Volley_Live_Live_Statistics_UI_Specification_v1.1.md` and the Coach / Spectator specs. |
