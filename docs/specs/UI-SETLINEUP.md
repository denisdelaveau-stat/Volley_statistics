# UI-SETLINEUP — Set line-up sheet

| Field | Value |
|---|---|
| Spec ID | `UI-SETLINEUP` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-27 |
| Source of truth | `js/index-set-lineup.js` (`window.VolleySetLineup`), `runtime-input.css` (`.set-lineup-*`), `js/index-capture-tools.js` (« DÉMARRER LE SET N ») |
| Related specs | DOM-LINEUP, DOM-LIBERO, UI-CAPTURE (end of set), UI-WIZARD (set 1 line-up) |

## 1. Purpose

Before each new set, the coach hands in a line-up (FIVB 7.3.2). This sheet lets the scorer confirm the previous line-up
or change it: setter's starting zone, player of each role and acting libero.

## 2. Scope

- In scope: opening, content, checks, confirm and cancel.
- Out of scope: the line-up rules (DOM-LINEUP), the set 1 line-up (UI-WIZARD).

## 3. Definitions

See DOM-LINEUP (roles, setter zone).

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-SETLINEUP-01` | « DÉMARRER LE SET N → » opens the sheet « Composition du set N », with the rule reminder (« Règle FIVB 7.3.2 : la composition peut changer à chaque set… »). | FIVB 7.3.2 |
| `UI-SETLINEUP-02` | The sheet is filled with the previous set's line-up: setter zone (P1…P6), one player per role (Passeur, Réceptionneur-attaquant 1, Central 1, Pointu, Réceptionneur-attaquant 2, Central 2); when the stored line-up does not name the roles, they are read from the rotation starting at the setter. | DOM-LINEUP-04 |
| `UI-SETLINEUP-03` | A court preview (P4 P3 P2 / P5 P6 P1) shows the number and name of the player in each zone and follows every change at once. | Product |
| `UI-SETLINEUP-04` | Each role list offers the present players who are not liberos. | DOM-LINEUP-06 |
| `UI-SETLINEUP-05` | The « Libéro » list offers the designated liberos still able to play, or « Aucun »; it proposes the previous set's libero, or the libero acting at the end of the previous set when that one can no longer play. | DOM-LIBERO-02, -14 |
| `UI-SETLINEUP-06` | A missing role, a player chosen twice or an ineligible player shows the reason (« Choisissez un joueur pour chaque poste. », « Un joueur ne peut occuper qu’un seul poste. »…) and disables the confirmation. | DOM-LINEUP-06 |
| `UI-SETLINEUP-07` | « DÉMARRER LE SET N → » stores the line-up (`match.setLineups[N]`), moves to set N and reopens the capture on it. | DOM-LINEUP-03 |
| `UI-SETLINEUP-08` | « Annuler » or Escape closes the sheet and keeps the finished set as it was, focus back on the button that opened it. | Product |
| `UI-SETLINEUP-09` | The sheet fits a 390 × 844 phone without horizontal scrolling (roles in two columns from 340 px). | SYS-DESIGN-05 |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Previous set's libero declared unable | Not offered; the acting libero is proposed (`UI-SETLINEUP-05`). |
| No designated libero | « Libéro » list shows « Aucun » only. |
| Reload while the sheet is open | The set is unchanged; the end-of-set box shows again. |

## 6. Data

Reads the match and its events (previous line-up, acting libero); writes `match.setLineups[N]` and
`match.currentSet` (SYS-DATA 6.2).

## 7. Interface

`window.VolleySetLineup.open(match, set, onConfirm, events)`; `#setLineupSheet` (dialog `#setLineupTitle`):
`[data-lineup-zone]`, `[data-lineup-slot]`, `[data-lineup-role]`, `[data-lineup-libero]`, `[data-lineup-confirm]`,
`[data-lineup-cancel]`, `.set-lineup-error`.

## 8. Accessibility and language

Modal dialog labelled by its title; setter zone buttons use `aria-pressed`; selects have visible labels; errors use
`role="alert"`. Texts: `lineup.*` keys (and `wizard.setterZoneLabel`, `capture.startSet`).

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-SETLINEUP-01` to `-04`, `-06`, `-07` | `tests/capture/test_set_lineup.py::test_next_set_line_up_is_prefilled_changed_and_used_for_that_set` |
| `UI-SETLINEUP-05` | `tests/capture/test_libero_swap.py::test_set_line_up_chooses_the_acting_libero`; `tests/capture/test_libero_redesignation.py::test_next_set_line_up_does_not_offer_the_unable_libero` |
| `UI-SETLINEUP-08` | `tests/capture/test_set_lineup.py::test_cancelling_the_line_up_sheet_keeps_the_finished_set` |
| `UI-SETLINEUP-09` | Manual: open the sheet at 390 × 844 (checked 2026-11-27) |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version, written with the feature. |
