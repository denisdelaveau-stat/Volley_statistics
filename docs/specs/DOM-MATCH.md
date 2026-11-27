# DOM-MATCH — Sets, scoring and end of match

| Field | Value |
|---|---|
| Spec ID | `DOM-MATCH` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-27 |
| Source of truth | `js/index-match-rules.js` (`window.VolleySets`), `js/index-capture-tools.js` (`commit()`, `renderSets()`) |
| Related specs | DOM-ROTATION (serving team), UI-CAPTURE (end-of-set box, lock), UI-SETLINEUP (next set), SYS-DATA (events) |

## 1. Purpose

Defines how a recorded action gives a point, how a set and the match are won, and when the capture stops accepting
actions. These rules feed the score of every screen (capture, Match Hub, Coach View, Spectator View, reports).

## 2. Scope

- In scope: point attribution, set and match scoring, match format, first serve of each set.
- Out of scope: rotation and libero (DOM-ROTATION, DOM-LIBERO), substitutions (DOM-SUBS), the screens that show the
  score (UI-CAPTURE, UI-SPECTATOR-SCORE).

## 3. Definitions

- Our team: `team1`, scored as `scoreA`, shown as HOME in the Spectator View. Opponent: `team2`, `scoreB`, AWAY.
- Author: the player who made the action (`player` = shirt number), `T` for our team without a player, `A` for the
  opponent.
- Result: `point`, `error` or `neutral` (the rally goes on).

## 4. Requirements

### 4.1 Point attribution

| ID | Requirement | Rule / source |
|---|---|---|
| `DOM-MATCH-01` | An action with the result `point` gives the point to the author's team: `team1` for one of our players or `T`, `team2` for `A`. `pointOrigin` is `earned`. | FIVB 6.1.1 |
| `DOM-MATCH-02` | An action with the result `error` gives the point to the other team. `pointOrigin` is `opponent_error`. | FIVB 6.1.1 |
| `DOM-MATCH-03` | An action with the result `neutral` gives no point and does not end the rally (`winningTeam` is `null`). | Product rule |
| `DOM-MATCH-04` | The score of a set is the number of events of that set won by each team. An event without set number belongs to set 1. | Product rule |

### 4.2 Sets and match

| ID | Requirement | Rule / source |
|---|---|---|
| `DOM-MATCH-05` | A match is played best of five (3 sets to win), or best of three when the match format says 2 sets to win (`match.format.setsToWin`, chosen in Settings). | FIVB 6.3 / product option |
| `DOM-MATCH-06` | A set is played to 25 points; the deciding set (5th, or 3rd in best of three) to 15 points. | FIVB 6.2.1, 6.2.2 |
| `DOM-MATCH-07` | A set is won by the team that reaches the target with at least a two-point lead; play continues without limit until the lead is two points (26-24, 27-25 …). | FIVB 6.2.1 |
| `DOM-MATCH-08` | The match is won by the first team to win 3 sets (2 in best of three). The match status becomes `completed`. | FIVB 6.3.1 |
| `DOM-MATCH-09` | Once the current set is won, no action is recorded until the next set is started; once the match is won, no action is recorded at all. | Product rule |
| `DOM-MATCH-10` | Deleting the last action of a finished set reopens it: the score and the lock are recomputed from the remaining events. | Product rule |

### 4.3 First serve

| ID | Requirement | Rule / source |
|---|---|---|
| `DOM-MATCH-11` | In set 1, our team serves first unless the New Match wizard says it starts in reception (`match.firstRally.antibesState`). | FIVB 7.1 (toss) |
| `DOM-MATCH-12` | The first serve alternates from set to set (the team that received first in a set serves first in the next one), including the deciding set. | FIVB 7.1; the deciding-set toss is not modelled |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Score 24-24 | The set goes on; 25-24 does not end it (`DOM-MATCH-07`). |
| Action tapped after the set is won | Ignored; the end-of-set box stays visible (`DOM-MATCH-09`). |
| Imported events without `set` | Counted in set 1 (`DOM-MATCH-04`). |
| Unknown match format | Best of five. |

## 6. Data

Reads `match.format.setsToWin`, `match.currentSet`, `match.firstRally` and the events (`set`, `winningTeam`); writes
the event fields `winningTeam`, `pointOrigin`, `scoreA`, `scoreB`, `scoreBefore`, `scoreAfter` and `match.status`.
Formats: SYS-DATA.

## 7. Interface

`window.VolleySets` (pure functions):

| Function | Returns |
|---|---|
| `setsToWin(match)` | 2 or 3 |
| `decidingSet(match)` | 3 or 5 |
| `target(match, set)` | 15 or 25 |
| `score(events, set)` | `{a, b}` |
| `winner(match, events, set)` | `'team1'`, `'team2'` or `null` |
| `summary(match, events)` | `{sets: [{set, a, b, winner, target}], wonA, wonB, setsToWin, current, matchWinner}` |

## 8. Accessibility and language

Not applicable (rules only). The texts that show the result are specified in UI-CAPTURE.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `DOM-MATCH-01`, `-02`, `-03` | `tests/capture/test_runtime_input.py::test_same_sequence_produces_same_canonical_event_across_modes`, `tests/capture/test_history_delete.py::test_delete_away_point_error_and_neutral` |
| `DOM-MATCH-04` | `tests/unit/match-rules.test.js` « score counts only the rallies of the requested set… » |
| `DOM-MATCH-05` | `tests/unit/match-rules.test.js` « best of five unless the format says two sets to win » |
| `DOM-MATCH-06` | `tests/unit/match-rules.test.js` « sets are played to 25, the deciding set to 15 » |
| `DOM-MATCH-07` | `tests/unit/match-rules.test.js` « a set is won at the target with a two-point lead »; `tests/capture/test_capture_regressions.py::test_set_end_lock_undo_next_set_and_exports` |
| `DOM-MATCH-08` | `tests/unit/match-rules.test.js` « summary counts won sets and declares the match winner » |
| `DOM-MATCH-09`, `-10` | `tests/capture/test_capture_regressions.py::test_set_end_lock_undo_next_set_and_exports` |
| `DOM-MATCH-11`, `-12` | `tests/unit/rotation.test.js` « the first serve alternates from set to set » |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version; replaces the scoring sections of `docs/FUNCTIONAL_SPEC.md` (v1.6.x). |
