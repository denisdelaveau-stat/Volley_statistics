# UI-CAPTURE — Capture screen: score, input modes, history, end of set

| Field | Value |
|---|---|
| Spec ID | `UI-CAPTURE` |
| Status | Current |
| Version | 1.1 |
| Applies to | VolleyLive v1.28.0+ |
| Last review | 2026-11-28 |
| Source of truth | `runtime-input.js`, `runtime-input.css`, `js/index-capture-tools.js`, `js/index-capture-engine.js`, `index.html` (`#capturePanel`), `css/index-*.css` |
| Related specs | DOM-MATCH, DOM-ROTATION, DOM-LIBERO, UI-SUBS, UI-SETLINEUP, UI-HUB (entry), SYS-DATA (events), SYS-I18N |

## 1. Purpose

The capture screen is where the scorer records the match live, one action at a time: who played, which action, which
result. It shows the score and the sets, lets the scorer correct the last action, and closes each set.

## 2. Scope

- In scope: score header, the four input modes, the options sheet, undo, the history and its last-row deletion, the
  end-of-set and end-of-match boxes.
- Out of scope: the substitution and libero sheet (UI-SUBS), the set line-up sheet (UI-SETLINEUP), the rules that
  give points and lock sets (DOM-MATCH).

## 3. Definitions

- Author: one of the six players on court, or « A » for the opponent.
- Step: author, action and result; the event is recorded when the result is chosen. FLOW allows author and action to be
  selected in either order on the same screen.

## 4. Requirements

### 4.1 Score header

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-CAPTURE-01` | The header shows the score of the current set (our team first), the sets won by each team on either side, a line under the serving team, the set number (`S1`, `S2`…), and is green when our team leads, red when it trails, neutral when tied. | Product |

### 4.2 Input

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-CAPTURE-02` | Four input modes share the same event model: FOCUS (one question per screen), SPEED+ (the court stays visible beside the commands), FLOW (single-screen action/status/player layout; player and action can be selected in either order; status is the final tap) and GAMEPAD (dual circular selectors with shared status buttons). In FLOW, Point is enabled only for Serve, Attack and Block; Continue and Error are enabled for every action. Opponent A without an action can record Point or Error only. | `specification_saisie_action`; `TO_DO/VolleyLive_Capture2_Portrait_Spec.md` |
| `UI-CAPTURE-03` | The default mode is FOCUS on screens up to 620 px wide and SPEED+ above; the chosen mode is stored and changing it keeps the match, score, events and the selection in progress. | Product |
| `UI-CAPTURE-04` | The authors offered are the six players on court as rebuilt by the rotation replay (libero included, DOM-ROTATION), placed by zone, plus the opponent « A ». The opponent is never stored as one of our players. | DOM-ROTATION |
| `UI-CAPTURE-05` | The actions are always in the same order: SERVICE, RÉCEPTION, PASSE, ATTAQUE, BLOCK, DÉFENSE, RELANCE; with highlights on, the usual actions of the author's role are highlighted, without reordering or disabling any. | Product |
| `UI-CAPTURE-06` | The results are « ✓ POSITIF » (point), « ○ NEUTRE » and « × ERREUR »; choosing a result records the action immediately as one event, identical whatever the mode. | DOM-MATCH-01 to -03 |
| `UI-CAPTURE-07` | « Changer de joueur » clears the selection in progress without recording anything. | Product |
| `UI-CAPTURE-08` | Duplicate status taps are guarded for 300 ms in FLOW and 500 ms in the other modes; FLOW selection remains available immediately after a recorded event. An event whose identifier already exists is refused. | Robustness |
| `UI-CAPTURE-09` | A message confirms the last recording; the status line shows « Dernière : » and the last action, or « Prêt pour une nouvelle action. ». | Feedback |
| `UI-CAPTURE-10` | « Annuler » removes the last event and its score change in one step. | Product |

### 4.3 Options

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-CAPTURE-11` | The options sheet (☰) sets the input mode, the role highlights and the vibration feedback; it is only available from the capture screen (not in Settings). | Product |

### 4.4 History

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-CAPTURE-12` | « HISTORIQUE » lists the events of the match, newest first; only the newest row has a delete button; a second delete during the guard is ignored. | Product |
| `UI-CAPTURE-13` | Deleting the last row removes the event and its effects (score, rotation, substitution); the result persists after a reload. | DOM-MATCH-10, SYS-DATA-05 |
| `UI-CAPTURE-14` | The history fits a 390 × 844 screen without horizontal scrolling. | SYS-DESIGN-05 |

### 4.5 End of set and match

| ID | Requirement | Rule / source |
|---|---|---|
| `UI-CAPTURE-15` | When a set is won, a box shows « SET N TERMINÉ », the winner and the score, the sets, and « DÉMARRER LE SET N+1 → »; the input is locked (DOM-MATCH-09). | Product |
| `UI-CAPTURE-16` | « DÉMARRER LE SET N+1 » opens the set line-up sheet (UI-SETLINEUP); the new set starts only once the line-up is confirmed. | FIVB 7.3.2 |
| `UI-CAPTURE-17` | When the match is won, the box shows the winner, the sets and the set scores, the button reads « MATCH TERMINÉ » and stays disabled; the match status becomes `completed`. | DOM-MATCH-08 |
| `UI-CAPTURE-18` | « ⇄ Remplacement » opens the substitution and libero sheet (UI-SUBS). | Product |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| No active match | The capture screen is not shown; the Match Hub offers NEW MATCH (UI-HUB). |
| Nothing to undo | Message « Aucun événement à annuler. » |
| Tap during the guard | Ignored. |
| Set won | Input locked until the next set starts or the last action is deleted. |

## 6. Data

Writes events, the match (`currentSet`, `status`, `subs`, `setLineups`) and the chart data (SYS-DATA); reads the input
preferences (`volleyCapture.runtimeInput.preferences.v1`).

## 7. Interface

`#capturePanel`: header `#liveScore` (`.digit-box`, `.set-badge`), input root `#runtimeInputRoot`
(`[data-runtime-author]`, `[data-runtime-action]`, `[data-runtime-result]`, `[data-runtime-undo]`,
`[data-runtime-options]`, `[data-runtime-sub-open]`), options `#runtimePrefs` (`[data-runtime-pref-mode]`,
`[data-runtime-highlight]`, `[data-runtime-haptic]`), history `#historyToggle`, `#historyPanel`,
`[data-delete-last]`, end of set `#setOver`, `#setOverTitle`, `#setOverText`, `#nextSetBtn`. FLOW adds
`.runtime-flow-actions`, `.runtime-flow-status-grid` and `.runtime-flow-players` in one portrait capture view.
Contract with the
capture modules: `window.VolleyCapture` (SYS-ARCH 7.3).

## 8. Accessibility and language

Steps are headings; selected buttons have `aria-pressed`; the options and substitution sheets are dialogs
(`aria-modal`) closed by their button; buttons are at least 44 px (SYS-DESIGN-04). Texts: `runtime.*`, `capture.*`,
`action.*`, `result.*` keys.

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `UI-CAPTURE-01` | `tests/capture/test_capture_regressions.py::test_set_end_lock_undo_next_set_and_exports` (score and set badges); `tests/capture/test_history_delete.py::test_delete_home_point_restores_empty_score_and_history` |
| `UI-CAPTURE-02` | `tests/capture/test_runtime_input.py::test_focus_is_three_distinct_steps_and_commits_immediately`, `::test_speed_keeps_court_visible_through_action_and_result`, `::test_flow_shows_player_action_and_shared_status_sections`, `::test_flow_allows_either_selection_order_and_toggles_selection`, `::test_flow_opponent_can_record_point_or_error_without_an_action` |
| `UI-CAPTURE-03` | `tests/capture/test_runtime_input.py::test_runtime_options_are_available_and_persisted`, `::test_mode_change_preserves_match_score_events_and_pending_selection` |
| `UI-CAPTURE-04` | `tests/capture/test_runtime_input.py::test_opponent_is_not_stored_as_a_local_player`; `tests/capture/test_set_lineup.py::test_next_set_line_up_is_prefilled_changed_and_used_for_that_set` (authors of set 2) |
| `UI-CAPTURE-05` | `tests/capture/test_runtime_input.py::test_action_grid_order_is_identical_in_all_modes`, `::test_role_preferences_highlight_without_reordering_or_disabling` |
| `UI-CAPTURE-06` | `tests/capture/test_runtime_input.py::test_same_sequence_produces_same_canonical_event_across_modes` |
| `UI-CAPTURE-07` | `tests/capture/test_runtime_input.py::test_change_player_clears_intermediate_selection_without_event` |
| `UI-CAPTURE-08` | `tests/capture/test_runtime_input.py::test_rapid_double_result_tap_creates_one_event` |
| `UI-CAPTURE-09` | Manual: record a point; the confirmation and the status line « Dernière : #3 … » appear |
| `UI-CAPTURE-10` | `tests/capture/test_runtime_input.py::test_undo_is_atomic_for_event_and_score` |
| `UI-CAPTURE-11` | `tests/capture/test_runtime_input.py::test_runtime_options_are_available_and_persisted`, `::test_settings_screen_does_not_offer_runtime_mode` |
| `UI-CAPTURE-12` | `tests/capture/test_history_delete.py::test_only_latest_row_is_deletable_and_double_delete_is_guarded` |
| `UI-CAPTURE-13` | `tests/capture/test_history_delete.py::test_delete_away_point_error_and_neutral`, `::test_delete_rolls_back_sideout_rotation`, `::test_deleted_state_persists_after_reload`; `tests/capture/test_substitutions.py::test_undo_removes_the_substitution` |
| `UI-CAPTURE-14` | `tests/capture/test_history_delete.py::test_history_delete_fits_390_by_844_without_horizontal_overflow` |
| `UI-CAPTURE-15`, `-16` | `tests/capture/test_capture_regressions.py::test_set_end_lock_undo_next_set_and_exports` |
| `UI-CAPTURE-17` | Manual: win the deciding set; the box shows the match winner and « MATCH TERMINÉ » (disabled) |
| `UI-CAPTURE-18` | `tests/capture/test_substitutions.py::test_substitution_is_recorded_and_the_court_updates` |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version; replaces `docs/specification_saisie_action.md` (design of the input modes) and the capture sections of `docs/FUNCTIONAL_SPEC.md` and `docs/IMPLEMENTATION_SPEC.md` (v1.6.x). |
| 1.1 | 2026-11-28 | Adds the portrait, same-screen FLOW capture layout and its selection, status, opponent shortcut and debounce rules. |
