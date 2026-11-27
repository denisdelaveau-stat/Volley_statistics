# DOM-LINEUP — Starting line-up per set

| Field | Value |
|---|---|
| Spec ID | `DOM-LINEUP` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-27 |
| Source of truth | `js/shared-domain.js` (`VolleyDomain.lineup`), `statistics/adapter.js` (`lineupForSetV1`) |
| Related specs | UI-WIZARD (set 1 line-up), UI-SETLINEUP (line-up of later sets), DOM-ROTATION, DOM-LIBERO, DOM-SUBS, SYS-DATA |

## 1. Purpose

Defines the starting line-up of each set: the six starting players, their rotation order and the acting libero. Every
replay of a set (capture, Coach View, Spectator View, reports) starts from the line-up of that set.

## 2. Scope

- In scope: the line-up data, how the line-up of a set is found, how the rotation is derived from the roles.
- Out of scope: the screens that enter a line-up (UI-WIZARD, UI-SETLINEUP); what happens during the set
  (DOM-ROTATION, DOM-LIBERO, DOM-SUBS).

## 3. Definitions

- Roles: `setter`, `oh1`, `mb1`, `opposite`, `oh2`, `mb2` (outside hitters, middle blockers) and `libero`.
- Setter zone: the zone (`p1`…`p6`) where the setter starts the set.
- Rotation: the player number in each zone `p1`…`p6` at the first serve of the set.

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `DOM-LINEUP-01` | A coach hands in a line-up before each set; the starting players and the rotation order may change from one set to the next. | FIVB 7.3.2 |
| `DOM-LINEUP-02` | The line-up of set 1 is `match.startingLineup` (roles) and `match.startingRotation` (zones), written by the New Match wizard. | Product rule |
| `DOM-LINEUP-03` | The line-up of a later set `n` is `match.setLineups[n] = {startingLineup, startingRotation}`. | Product rule |
| `DOM-LINEUP-04` | A set without its own line-up keeps the line-up of the previous set; a match recorded before per-set line-ups therefore replays every set from the set 1 line-up. | Backward compatibility |
| `DOM-LINEUP-05` | The rotation is derived from the roles and the setter zone in this order: setter in the setter zone, then OH1, MB1, opposite, OH2 and MB2 in the following zones (P1 → P2 → … → P6 → P1). | Product rule (wizard order) |
| `DOM-LINEUP-06` | The six starting players are six different players, present in the roster, none of them a libero. | FIVB 7.3.2, 19.1 |
| `DOM-LINEUP-07` | `startingLineup.libero` is the acting libero at the start of the set, or none. | FIVB 19.1.1 |
| `DOM-LINEUP-08` | The rotation engine, the substitution rules (starters of the set), the Coach View (setter and rotation per set) and the Spectator matrix all take the line-up of a set from this rule; `statistics/adapter.js` keeps an identical copy because it also runs without the browser modules. | Single source of truth |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Line-up roles missing (imported capture) | The roles are read from the rotation, starting at the setter (UI-SETLINEUP). |
| Line-up defined for set 3 only | Set 2 uses the set 1 line-up, sets 3 and later use the set 3 line-up (`DOM-LINEUP-04`). |
| Number stored as text | Players are compared as text everywhere. |

## 6. Data

```json
{
  "startingLineup": { "setter": 1, "oh1": 3, "mb1": 4, "opposite": 7, "oh2": 5, "mb2": 6, "libero": 2 },
  "startingRotation": { "p1": 1, "p2": 3, "p3": 4, "p4": 7, "p5": 5, "p6": 6 },
  "setLineups": {
    "2": {
      "startingLineup": { "setter": 1, "oh1": 8, "mb1": 4, "opposite": 7, "oh2": 5, "mb2": 6, "libero": 2 },
      "startingRotation": { "p4": 1, "p5": 8, "p6": 4, "p1": 7, "p2": 5, "p3": 6 }
    }
  }
}
```

Unified JSON v2.1 documents carry one line-up per set in `sets[].startingLineup` and `sets[].liberoPlayerId`
(SYS-JSON).

## 7. Interface

`window.VolleyDomain.lineup`:

| Member | Description |
|---|---|
| `ROTATION_ROLES` | `['setter', 'oh1', 'mb1', 'opposite', 'oh2', 'mb2']` |
| `rotationFromRoles(roles, setterZone)` | Rotation `{p1…p6}` from the roles and the setter zone (`DOM-LINEUP-05`). |
| `forSet(match, set)` | `{startingLineup, startingRotation}` of the set (`DOM-LINEUP-02` to `-04`). |

`window.VolleyDomain.court.zoneOf(rotation, player)` returns the zone of a player, or `null`.

## 8. Accessibility and language

Not applicable (rules only).

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `DOM-LINEUP-01`, `-03` | `tests/capture/test_set_lineup.py::test_next_set_line_up_is_prefilled_changed_and_used_for_that_set` |
| `DOM-LINEUP-02`, `-04` | `tests/unit/set-lineup.test.js` « a set without its own line-up keeps the line-up of the previous set » |
| `DOM-LINEUP-05` | `tests/unit/set-lineup.test.js` « rotationFromRoles follows the New Match wizard… » |
| `DOM-LINEUP-06` | `tests/capture/test_set_lineup.py::test_next_set_line_up_is_prefilled_changed_and_used_for_that_set` (duplicate player and libero refused) |
| `DOM-LINEUP-07` | `tests/capture/test_libero_swap.py::test_set_line_up_chooses_the_acting_libero` |
| `DOM-LINEUP-08` | `tests/unit/set-lineup.test.js` « the engine replays each set from its own line-up… », « substitutions: the starters are those of the set »; `tests/unit/court-consistency.test.js` « they agree when set 2 has its own line-up… » |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version; replaces the section "Starting line-up per set" of `docs/ARCHITECTURE.md`. |
