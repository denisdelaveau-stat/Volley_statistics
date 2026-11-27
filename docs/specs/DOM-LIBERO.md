# DOM-LIBERO — Liberos: replacement, second libero, re-designation

| Field | Value |
|---|---|
| Spec ID | `DOM-LIBERO` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-27 |
| Source of truth | `js/index-rotation.js` (replay), `js/index-substitution-rules.js` (`liberos`, `liberoSwap`, `liberoUnable`, `unableLiberos`), `statistics/adapter.js` (Spectator matrix) |
| Related specs | DOM-ROTATION, DOM-LINEUP (acting libero per set), DOM-SUBS, UI-SUBS (sheet), UI-SETLINEUP |

## 1. Purpose

Defines the libero rules of the FIVB Official Volleyball Rules 2025-2028, Rule 19, as the application applies them:
who the liberos are, when the libero is on court and in place of whom, how the second libero takes over, and what
happens when the acting libero can no longer play.

## 2. Scope

- In scope: designation, automatic libero replacement, libero swap, inability and re-designation.
- Out of scope: libero actions in the capture (the libero cannot serve: the action grid is not restricted, see
  UI-CAPTURE); the screens (UI-SUBS, UI-SETLINEUP).

## 3. Definitions

- Designated liberos: the liberos a team may use in the match.
- Acting libero: the designated libero who may currently play.
- Libero replacement: the libero coming in for, or going out for, a back-row player. It is not a substitution.

## 4. Requirements

### 4.1 Designation

| ID | Requirement | Rule / source |
|---|---|---|
| `DOM-LIBERO-01` | The designated liberos are the libero of every set line-up, the roster players registered with the position libero, and the players re-designated as libero. | FIVB 19.1.1 |
| `DOM-LIBERO-02` | Each set line-up names its acting libero, or none; there is at most one acting libero, and one libero on court. | FIVB 19.1.3 |

### 4.2 Automatic replacement

| ID | Requirement | Rule / source |
|---|---|---|
| `DOM-LIBERO-03` | The libero replaces a middle blocker: those of the set line-up (`mb1`, `mb2`), followed through substitutions; without them in the line-up, the roster players with position MB. A middle blocker playing another slot after a substitution is not replaced. | FIVB 19.3.1.1 (tactical choice: middle blocker) |
| `DOM-LIBERO-04` | The libero plays only in the back row: P6 or P5, and P1 only while our team receives (the libero cannot serve). | FIVB 19.3.1.2, 19.3.1.3 |
| `DOM-LIBERO-05` | The libero stays with the player it replaced while that player is in an allowed zone, and can only be replaced by that player. | FIVB 19.3.2.2 |
| `DOM-LIBERO-06` | Libero replacements happen only at the start of a set and between rallies, at most one per completed rally. | FIVB 19.3.2.1, 19.3.2.4 |

### 4.3 Second libero

| ID | Requirement | Rule / source |
|---|---|---|
| `DOM-LIBERO-07` | The acting libero may be replaced by the other designated libero, present in the match, between two rallies. | FIVB 19.3.2 |
| `DOM-LIBERO-08` | This replacement is refused during a rally, and when a libero replacement (the libero coming in or going out, or another swap) already took place since the last completed rally. | FIVB 19.3.2.1 |
| `DOM-LIBERO-09` | After the swap the new libero is the acting libero and, if the libero was on court, plays in the same place. | FIVB 19.3.2 |
| `DOM-LIBERO-10` | A libero swap is not a substitution: it is not counted in the six substitutions of the set. | FIVB 19.3.2, 15.1 |

### 4.4 Inability and re-designation

| ID | Requirement | Rule / source |
|---|---|---|
| `DOM-LIBERO-11` | Between two rallies, the acting libero may be declared unable to play (injury, illness, expulsion). | FIVB 19.4.1 |
| `DOM-LIBERO-12` | If another designated libero can play, that libero becomes the acting libero. | FIVB 19.4.2 |
| `DOM-LIBERO-13` | Otherwise the coach re-designates as libero, for the rest of the match, a present player who is not on court, is not the player the libero replaced, is not a libero and was not removed by an exceptional substitution. | FIVB 19.4.2 |
| `DOM-LIBERO-14` | A libero declared unable to play cannot play again in the match: not offered as a swap, nor as the acting libero of a later set. | FIVB 19.4 |
| `DOM-LIBERO-15` | A re-designated player counts as a libero for the rest of the match: excluded from substitutions. | FIVB 19.4, 15.5.1 |

### 4.5 Consistency

| ID | Requirement | Rule / source |
|---|---|---|
| `DOM-LIBERO-16` | The capture/Coach engine and the Spectator matrix apply the same libero rules and agree on the players on court at every event. | Single source of truth |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| No libero declared | No replacement; the libero block of UI-SUBS is hidden. |
| Both middle blockers in the back row | The libero keeps the one it already replaces (`DOM-LIBERO-05`). |
| No player can be re-designated | Refused with the reason `subs.refuseNoRedesignation`. |
| Second libero absent | No swap (`subs.refuseNoSecondLibero`). |

## 6. Data

A libero swap, inability or re-designation is a `match.subs` entry with `libero: true` (and `unable: true`,
`redesignated: true`) plus a `SUBSTITUTION` event with the same flags (SYS-DATA). `out` is the acting libero, `in` the
new one. The acting libero of a set is `startingLineup.libero` of the set line-up (DOM-LINEUP).

## 7. Interface

`window.VolleySubstitutions`:

| Function | Returns |
|---|---|
| `liberos(match)` | Designated liberos (`DOM-LIBERO-01`) |
| `unableLiberos(match)` | Liberos declared unable to play |
| `liberoSwap(match, set, setEvents)` | `{current, candidates, refusal}` (`DOM-LIBERO-07`, `-08`) |
| `liberoUnable(match, set, setEvents)` | `{current, liberos, players, refusal}` (`DOM-LIBERO-11` to `-13`) |
| `build(match, set, setEvents, score, out, in, {libero, unable, redesignated, eventId})` | `{sub, event}` to record |

`refusal` is a translation key (`subs.blockedRally`, `subs.refuseLiberoRally`, `subs.refuseNoSecondLibero`,
`subs.refuseNoLibero`, `subs.refuseNoRedesignation`) or `null`.

## 8. Accessibility and language

Not applicable (rules only). Messages: `subs.*` keys (SYS-I18N).

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `DOM-LIBERO-01` | `tests/unit/libero-swap.test.js` « both designated liberos are known… »; `tests/unit/set-lineup.test.js` « every libero of the match is excluded… » |
| `DOM-LIBERO-02` | `tests/capture/test_libero_swap.py::test_set_line_up_chooses_the_acting_libero` |
| `DOM-LIBERO-03` | `tests/unit/rotation.test.js` « a substituted middle blocker is still replaced by the libero », « middle blockers fall back to roster positions… »; `tests/unit/court-consistency.test.js` « a middle blocker who replaces the opposite… »; `tests/capture/test_substitutions.py::test_the_libero_follows_a_substituted_middle_blocker` |
| `DOM-LIBERO-04` | `tests/unit/rotation.test.js` « libero replaces the middle blocker in P6 or P5… », « …in P1 only while the team receives » |
| `DOM-LIBERO-05`, `-06` | `tests/unit/libero-fivb.test.js` (both tests) |
| `DOM-LIBERO-07` to `-10` | `tests/unit/libero-swap.test.js` (all tests); `tests/capture/test_libero_swap.py::test_second_libero_replaces_the_acting_one_between_rallies` |
| `DOM-LIBERO-11` to `-15` | `tests/unit/libero-redesignation.test.js` (all tests); `tests/capture/test_libero_redesignation.py` (all tests) |
| `DOM-LIBERO-16` | `tests/unit/court-consistency.test.js`; `tests/unit/libero-swap.test.js` « the Spectator matrix (adapter) follows the swap… »; `tests/unit/libero-redesignation.test.js` « the Spectator matrix (adapter) follows a re-designation » |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version; replaces the libero part of "Rotation and libero rules" in `docs/ARCHITECTURE.md`. |
