# DOM-ROTATION — Rotation and service

| Field | Value |
|---|---|
| Spec ID | `DOM-ROTATION` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-27 |
| Source of truth | `js/index-rotation.js` (`window.VolleyRotation`), `js/shared-domain.js` (`court`), `statistics/adapter.js` (Spectator matrix) |
| Related specs | DOM-LINEUP (start of each set), DOM-LIBERO (libero on court), DOM-SUBS (substitutions), DOM-MATCH (first serve) |

## 1. Purpose

Defines where each of our players stands, rally after rally, and which team serves. The capture court, the Coach View
(rotations, LIVE COURT) and the Spectator matrix all use this single replay.

## 2. Scope

- In scope: rotation order, when the team rotates, serving team, replay of a set, the displayed court.
- Out of scope: who replaces whom (DOM-LIBERO, DOM-SUBS); the opponent's rotation (not recorded).

## 3. Definitions

- Rotation (clockwise): the player in P2 moves to P1, P1 to P6, P6 to P5, P5 to P4, P4 to P3, P3 to P2.
- Replay (`trace`): the state of the set before each event, rebuilt from the set line-up and the events.

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `DOM-ROTATION-01` | Our team rotates one position clockwise only when it wins a rally served by the opponent (side-out). | FIVB 7.6.2 |
| `DOM-ROTATION-02` | After a rally, the team that won it serves the next rally. | FIVB 12.1 |
| `DOM-ROTATION-03` | Each set is replayed from its own starting line-up (DOM-LINEUP) and its first serving team (DOM-MATCH-11, -12). | FIVB 7.3.2 |
| `DOM-ROTATION-04` | The replay applies the substitutions and libero changes of the set at their recorded position (`at` = number of events of the set before them), before the next event. | DOM-SUBS, DOM-LIBERO |
| `DOM-ROTATION-05` | The replay gives, for every event, the rotation, the serving team, the acting libero and the player the libero replaces, as they were when the event was recorded. | Single source of truth |
| `DOM-ROTATION-06` | The displayed court is the rotation with the libero in place of the player it replaces (DOM-LIBERO); without rally history (a theoretical rotation), the libero takes the first middle blocker in an allowed zone. | Product rule |
| `DOM-ROTATION-07` | Player numbers stored as text (imported files) and as numbers are the same player. | Robustness |
| `DOM-ROTATION-08` | The capture/Coach engine and the Spectator matrix give the same players on court at every event of a match, for every starting rotation, per-set line-up and libero change. | Consistency |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| No event in the set | The court is the set line-up; the serving team is the first serving team of the set. |
| Neutral action | No rotation, no change of service (the rally goes on). |
| Substitution of a player not on court | Ignored by the replay (the substitution rules refuse it, DOM-SUBS). |

## 6. Data

Reads the set line-up (DOM-LINEUP), `match.subs`, `match.firstRally` and the events of the set (`winningTeam`).
Nothing is stored: the court is always recomputed from the events.

## 7. Interface

`window.VolleyRotation`:

| Function | Returns |
|---|---|
| `trace(match, setEvents, set)` | `{steps: [{rot, serving, lib, liberoFor}], rot, serving, rotations, mbs, lib, liberoFor, subs}` (state before each event, and after the last one) |
| `replay(match, setEvents)` | State after the events of `match.currentSet` |
| `onCourt(match, rot, state)` | Player number by zone, libero included |
| `court(match, rot, state)` | Same, with `{num, libero, forNum}` per zone and the bench player |
| `initialServing(match, set)` | `'A'` (our team) or `'B'` |
| `middleBlockers(match, set)` | Middle blockers followed by the libero (DOM-LIBERO-03) |
| `liberoZones(serving)` | Zones where the libero may replace a player (DOM-LIBERO-04) |

`window.VolleyDomain.court`: `POS`, `NEXT`, `LIBERO_ZONES`, `rotate(rotation)`, `zoneOf(rotation, player)`.

## 8. Accessibility and language

Not applicable (rules only).

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `DOM-ROTATION-01` | `tests/unit/rotation.test.js` « rotate moves every player one zone clockwise… », « the team rotates only on a side-out »; `tests/capture/test_history_delete.py::test_delete_rolls_back_sideout_rotation` |
| `DOM-ROTATION-02`, `-03` | `tests/unit/rotation.test.js` « the first serve alternates from set to set »; `tests/unit/set-lineup.test.js` « the engine replays each set from its own line-up… » |
| `DOM-ROTATION-04`, `-05` | `tests/unit/rotation.test.js` « trace gives the state before each event, after the substitutions made before it » |
| `DOM-ROTATION-06` | `tests/unit/rotation.test.js` « onCourt returns the displayed line-up by zone » |
| `DOM-ROTATION-07` | `tests/unit/rotation.test.js` « substitutions match player numbers stored as text… » |
| `DOM-ROTATION-08` | `tests/unit/court-consistency.test.js` (all five tests) |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version; replaces the rotation part of "Rotation and libero rules" in `docs/ARCHITECTURE.md`. |
