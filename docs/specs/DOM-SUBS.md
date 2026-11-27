# DOM-SUBS — Substitutions

| Field | Value |
|---|---|
| Spec ID | `DOM-SUBS` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-27 |
| Source of truth | `js/index-substitution-rules.js` (`window.VolleySubstitutions`) |
| Related specs | UI-SUBS (sheet), DOM-LINEUP (starters of a set), DOM-LIBERO (libero changes), DOM-ROTATION (court after a substitution), UI-REPORTS |

## 1. Purpose

Defines when a substitution is allowed, following the FIVB Official Volleyball Rules 2025-2028, Rule 15, and how it is
recorded. The substitution sheet (UI-SUBS) only offers what these rules allow.

## 2. Scope

- In scope: regular and exceptional substitutions, their limits and their record.
- Out of scope: libero changes, which are not substitutions (DOM-LIBERO); the sheet (UI-SUBS).

## 3. Definitions

- Starter: a player of the set line-up (DOM-LINEUP).
- Regular substitution: counted in the six substitutions of the set.
- Exceptional substitution: replaces an injured or ill player when no regular substitution is possible; not counted.

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `DOM-SUBS-01` | A team makes at most six regular substitutions per set; substitutions of other sets are not counted. | FIVB 15.1 |
| `DOM-SUBS-02` | The player leaving is on court; the player entering is not on court. | FIVB 15.5 |
| `DOM-SUBS-03` | A libero is never part of a regular or exceptional substitution. | FIVB 15.5.1 |
| `DOM-SUBS-04` | A starter leaves the game once per set and comes back once, only in the place of the substitute who replaced him or her. | FIVB 15.6.1 |
| `DOM-SUBS-05` | A substitute enters once per set and is only replaced by the starter he or she replaced. | FIVB 15.6.2 |
| `DOM-SUBS-06` | The starters of a set are the players of that set's line-up. | FIVB 7.3.2, 15.6 |
| `DOM-SUBS-07` | An exceptional substitution is offered only when no regular one is possible for the player leaving; any present player not on court, except a libero, may enter; it is not counted in the six. | FIVB 15.7 |
| `DOM-SUBS-08` | A player replaced by an exceptional substitution cannot come back in the match. | FIVB 15.7 |
| `DOM-SUBS-09` | Only registered players present for the match may enter. | FIVB 15.9.1 |
| `DOM-SUBS-10` | No substitution while a rally is in progress (the last event of the set is an action that did not end the rally), and none once the set is over. | FIVB 15.11.1.1 |
| `DOM-SUBS-11` | A substitution is recorded as a `match.subs` entry and a `SUBSTITUTION` event, placed before the next event of the set; undoing it removes both. | Product rule |
| `DOM-SUBS-12` | Every refused candidate comes with its reason (a translation key) so that the sheet can explain it. | Product rule |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Six regular substitutions done | Refused with `subs.refuseLimit`; an exceptional substitution may still be offered for an injured player (`DOM-SUBS-07`). |
| Player stored as text | Compared as text. |
| No allowed substitute | The player leaving is shown as not substitutable. |

## 6. Data

`match.subs[]`: `{set, at, rally, out, in, position, eventId, ts}` and `exceptional: true` for an exceptional
substitution (`at` = number of events of the set before it). The `SUBSTITUTION` event: SYS-DATA.

## 7. Interface

`window.VolleySubstitutions`:

| Function | Returns |
|---|---|
| `REGULAR_LIMIT` | 6 |
| `starters(match, set)` | Starters of the set (`DOM-SUBS-06`) |
| `history(match, set)` | `{regular, exceptional, starterLeft, starterReturned, substituteEntered, barred}` |
| `regularRefusal(match, set, rot, out, in)` | Translation key of the reason, or `null` |
| `options(match, set, rot, out)` | `{regular, exceptional, refused: [{number, reason}], history}` |
| `rallyInProgress(setEvents)` | `true` while a rally is open |
| `build(match, set, setEvents, score, out, in, opts)` | `{sub, event}` to record |

## 8. Accessibility and language

Not applicable (rules only). Reasons: `subs.refuse*` keys (SYS-I18N).

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `DOM-SUBS-01` | `tests/unit/substitution-rules.test.js` « 15.1: at most six… », « 15.1: substitutions of the other sets are not counted » |
| `DOM-SUBS-02` | `tests/unit/substitution-rules.test.js` « the player leaving must be on court… » |
| `DOM-SUBS-03` | `tests/unit/substitution-rules.test.js` « 15.5.1: the libero is never part of a regular substitution » |
| `DOM-SUBS-04` | `tests/unit/substitution-rules.test.js` « 15.6.1: … » |
| `DOM-SUBS-05` | `tests/unit/substitution-rules.test.js` « 15.6.2: … » |
| `DOM-SUBS-06` | `tests/unit/set-lineup.test.js` « substitutions: the starters are those of the set » |
| `DOM-SUBS-07`, `-08` | `tests/unit/substitution-rules.test.js` « 15.7: … » (both tests) |
| `DOM-SUBS-09` | `tests/unit/substitution-rules.test.js` « 15.9.1: … » |
| `DOM-SUBS-10` | `tests/unit/substitution-rules.test.js` « 15.11.1.1: … »; `tests/capture/test_substitutions.py::test_no_substitution_during_a_rally`; set over: manual (win a set, open « ⇄ Remplacement »: « Le set est terminé » is shown and no player is offered) |
| `DOM-SUBS-11` | `tests/unit/substitution-rules.test.js` « build records the substitution… »; `tests/capture/test_substitutions.py::test_substitution_is_recorded_and_the_court_updates`, `::test_undo_removes_the_substitution` |
| `DOM-SUBS-12` | `tests/capture/test_substitutions.py::test_the_sheet_applies_fivb_rule_15` |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version; replaces the section "Substitution rules" of `docs/ARCHITECTURE.md`. |
